import moment from 'moment'

import NextMoveController from './NextMoveController.js'
import ActionController from './ActionController.js'

import EntitiesModel from '../models/EntitiesModel.js'
import NodeModel from '../models/NodeModel.js'
import IAModel from '../models/IAModel.js'

export default class IAController {
  constructor(database = {}, logger = {}) {
    this.database = database
    this.logger = logger

    this.iaModel = new IAModel(database, logger)
    this.nodeModel = new NodeModel(database, logger)
    this.entitiesModel = new EntitiesModel(database, logger)

    this.actionController = new ActionController(database, logger)
    this.nmoveController = new NextMoveController(database, logger)

  }

  async get(req, res) {
    try {
      const result = await this.iaModel.get(req.headers.authorization, req.params.id)

      if (req.params.id) {
        const data = result[0]
        const result_entity = await this.entitiesModel.get(data.id)
        data.entities = result_entity
        const result_node = await this.nodeModel.get(data.id)
        const getChildren = (id) => goThroughData(result_node.filter(({ previous_node }) => previous_node === id))
        const goThroughData = (list) => list.map(node => {
          let nodes = getChildren(node.id)
          if (nodes.length > 0) {
            node.nodes = nodes.map((nodeChild) => {
              delete nodeChild.previous_node
              return nodeChild
            })
          }
          return node
        })

        data.nodes = goThroughData(result_node.filter(({ previous_node }) => !previous_node))

        return res.status(200).send(data)
      } else {
        return res.status(200).send(result)
      }
    } catch (err) {
      console.log("err ===>", err)
      return res.status(500).send({ error: 'Houve um erro interno no servidor.' })
    }
  }

  async create(req, res) {
    try {
      // salvar Ben I.A
      let ia_data = {
        description: req.body.description,
        company_id: req.headers.authorization
      }

      const ia_id = await this.iaModel.create(ia_data)
      ia_data.id = ia_id[0].id

      // salvar entidades
      let arrEntities = req.body.entities

      const entities = await Promise.all(arrEntities.map(async (entity) => {
        let entity_data = Object.assign(entity, {
          ia_id: ia_data.id,
          value: JSON.stringify(entity.value)
        })
        const entity_id = await this.entitiesModel.create(entity_data)
        return Object.assign(entity, {
          id: entity_id[0].id,
          value: JSON.parse(entity.value)
        })
      }))

      let arrNodes = req.body.nodes
      let nodes = []
      let updateAfter = []
      if (Array.isArray(arrNodes)) {
        const saveNode = async (node, previous_node = null) => {
          const nextNodes = (Array.isArray(node.nodes) && node.nodes.length > 0) && Object.values(node.nodes)
          const conditions = Array.isArray(node.conditions) && node.conditions.map(indexEntity => entities[indexEntity].id)
          const { next_move, actions } = node
          delete node.nodes

          const node_data = Object.assign({}, node, {
            ia_id: ia_data.id,
            conditions: conditions ? JSON.stringify(conditions) : null,
            next_move: JSON.stringify({ type: next_move.type })
          })

          //transforma action em JSON para salvar no banco
          if (actions) {
            node_data.actions = JSON.stringify(actions)
          }
          if (previous_node) {
            node_data.previous_node = previous_node
          }
          //Cria no banco e adiciona o node_data
          const node_id = await this.nodeModel.create(node_data)
          node_data.id = node_id[0].id

          if (next_move.type === "pular_para") {
            updateAfter.push(Object.assign({}, node_data, { next_move }))
          }

          // retorno
          if (actions) {
            node_data.actions = actions
          }

          Object.assign(node_data, {
            next_move,
            conditions
          })

          if (Array.isArray(nextNodes) && nextNodes.length > 0) {
            const resultNodes = await goThroughData(nextNodes, node_id[0].id)
            return Object.assign(node_data, {
              nodes: resultNodes
            })
          } else {
            return node_data
          }
        }

        const goThroughData = async (list, previous_node = null) => {
          return await Promise.all(list.map(async node => await saveNode(node, previous_node)))
        }

        nodes = await goThroughData(arrNodes)
      }

      const update_next_move = await Promise.all(updateAfter.map(async (node_data) => {
        if (Array.isArray(node_data.next_move.node_id)) {
          const node_ref = node_data.next_move.node_id.reduce((prev, curr, currIndex) => {
            if (currIndex === (node_data.next_move.node_id.length - 1)) {
              return prev[curr]
            } else {
              return prev[curr].nodes
            }
          }, nodes)

          node_data.next_move.node_id = node_ref.id
          node_data.next_move = JSON.stringify(node_data.next_move)

          //update node
          const result = await this.nodeModel.update(node_data)
          return result[0].id
        }
      }))

      delete ia_data.company_id
      return res.status(201).send(Object.assign(ia_data, {
        entities,
        nodes
      }))

    } catch (err) {
      console.error(err)
      return res.status(500).send({ err: 'Não foi possivel adicionar a Skill' })
    }
  }

  async update(req, res) {
    try {
      let ia_data = {
        id: req.body.id,
        description: req.body.description,
        company_id: req.headers.authorization
      }

      await this.iaModel.update(ia_data)

      let arrEntities = req.body.entities

      const entities = await Promise.all(arrEntities.map(async (entity) => {
        let entity_data = Object.assign(entity, {
          ia_id: ia_data.id,
          value: JSON.stringify(entity.value)
        })
        if (entity.id) {
          await this.entitiesModel.update(entity_data)
        } else {
          const entity_id = await this.entitiesModel.create(entity_data)
          entity_data.id = entity_id[0].id
        }

        delete entity_data.ia_id
        return Object.assign(entity_data, {
          value: JSON.parse(entity.value)
        })
      }))

      let arrNodes = req.body.nodes
      let nodes = []
      let updateAfter = []
      if (Array.isArray(arrNodes)) {
        const saveNode = async (node, previous_node = null) => {
          const nextNodes = (Array.isArray(node.nodes) && node.nodes.length > 0) && Object.values(node.nodes)
          const conditions = Array.isArray(node.conditions) && node.conditions.map(entity => entities[entity] ? entities[entity].id : entity)
          const { next_move, actions } = node
          delete node.nodes
          const node_data = Object.assign({}, node, {
            ia_id: ia_data.id,
            conditions: JSON.stringify(conditions),
            next_move: JSON.stringify(next_move)
          })

          //transforma action em JSON para salvar no banco
          if (actions) {
            node_data.actions = JSON.stringify(actions)
          }
          if (previous_node) {
            node_data.previous_node = previous_node
          }
          //Cria ou atualiza no banco e adiciona o node_data
          if (node_data.id) {
            await this.nodeModel.update(node_data)
          } else {
            const node_id = await this.nodeModel.create(node_data)
            node_data.id = node_id[0].id
          }
          if (next_move.type === "pular_para" && Array.isArray(next_move.node_id)) {
            updateAfter.push(Object.assign({}, node_data, { next_move }))
          }

          // retorno
          if (actions) {
            node_data.actions = actions
          }

          Object.assign(node_data, {
            next_move,
            conditions
          })
          if (Array.isArray(nextNodes) && nextNodes.length > 0) {
            const resultNodes = await goThroughData(nextNodes, node_data.id)
            return Object.assign(node_data, {
              nodes: resultNodes
            })
          } else {
            return node_data
          }

        }

        const goThroughData = async (list, previous_node = null) => {
          return await Promise.all(list.map(async node => await saveNode(node, previous_node)))
        }

        nodes = await goThroughData(arrNodes)
      }

      const update_next_move = await Promise.all(updateAfter.map(async (node_data) => {
        if (Array.isArray(node_data.next_move.node_id)) {
          const node_ref = node_data.next_move.node_id.reduce((prev, curr, currIndex) => {
            if (currIndex === (node_data.next_move.node_id.length - 1)) {
              return prev[curr]
            } else {
              return prev[curr].nodes
            }
          }, nodes)

          node_data.next_move.node_id = node_ref.id
          node_data.next_move = JSON.stringify(node_data.next_move)

          //update node
          const result = await this.nodeModel.update(node_data)
          return result[0].id
        }
      }))

      delete ia_data.company_id
      return res.status(201).send(Object.assign(ia_data, {
        entities,
        nodes
      }))
    } catch (err) {
      console.error(err)
      return res.status(500).send({ err: 'Não foi possivel alterar a skill' })
    }
  }
}