import NodeModel from '../models/NodeModel.js'
import EntitiesModel from '../models/EntitiesModel.js'
import slugfy from '../helpers/slugfy.js'

export default class ConversationController {
  constructor(database = {}, logger = {}, redis = {}) {
    this.database = database
    this.logger = logger
    this.redis = redis
    this.nodeModel = new NodeModel(database, logger)
    this.entityModel = new EntitiesModel(database, logger)
  }

  // retorna session com base na company_id e protocol_id
  async getSession({ company_id, ia_id, protocol_id }) {
    const session = await this.redis.get(`msBotBen:${ia_id}:${company_id}:${protocol_id}`)
    return JSON.parse(session) ?? { previous_node: null }
  }

  // altera sessao
  async setSession({ company_id, ia_id, protocol_id, data }) {
    const redistest = await this.redis.set(`msBotBen:${ia_id}:${company_id}:${protocol_id}`, JSON.stringify(data))
  }

  async sendMessage(req, res) {
    const message = req.body.message.body
    const getEntity = await this.entityModel.get(req.body.ia_id, null, true)
    const getNodes = await this.nodeModel.get(req.body.ia_id, null, true)
    const session = await this.getSession({ company_id: req.headers.authorization, ia_id: req.body.ia_id, protocol_id: req.body.protocol.id })
    if (getNodes.length === 0) {
      res.status(400).send({
        error: "ID da skill não encontrada"
      })
      return
    }

    console.log("sendMessage: ", message)

    //obj para passar nas actions
    const paramsAction = {
      protocol: req.body.protocol,
      department: req.body.department,
      phone: req.body.phone,
      channel: req.body.channel,
      ia_id: req.body.ia_id,
      company_id: req.headers.authorization,
      url_base: req.body.url_base,
      message: req.body.message.body
    }

    const regexAvailable = {
      'regex-cpf_cnpj': (word) => word.match(/([0-9]{3}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9]{2}|[0-9]{2}\.?[0-9]{3}\.?[0-9]{3}\/?[0-9]{4}\-?[0-9]{2})/g),
      'regex-email': (word) => word.match(/([a-z]){1,}([a-z0-9._-]){1,}([@]){1}([a-z]){2,}([.]){1}([a-z]){2,}([.]?){1}([a-z]?){2,}/g),
      'regex-number': (word, number) => {
        const rgxp = new RegExp(`(^|\\D)${number}(\\D|$)`, "g")
        return word.match(rgxp)
      },
    }

    //Função para encontrar a entidade da frase enviada pelo cliente
    const findEntity = ({ entities, message }) => {
      //Primeiro pesquisa pela frase inteira nos valores
      const matchFullPhrase = Array.isArray(entities) && entities.find(({ value }) => Array.isArray(value) && value.includes(slugfy(message)))
      console.log("findEntity matchFullPhrase: ", matchFullPhrase)
      //Se achar, retorna valor
      if (matchFullPhrase) {
        return { [matchFullPhrase.id]: 100 }
      }

      //Se não achar nada, pesquisa por palavra
      let arrWords = slugfy(message).split('-')

      const matchWords = arrWords.reduce((prev, curr) => {
        //TODO: criar uma solução melhor para tratar os emojis.
        if(!curr) return  prev
        let wordCompare = slugfy(curr)
        wordCompare = wordCompare ?  wordCompare.replace(/[^a-z0-9]/gi, '').toLocaleLowerCase() : curr
        
        Array.isArray(entities) && entities.filter(({ value, type }) => {
          if (type === 'text') {
            return value.map(word => slugfy(word).toLocaleLowerCase()).filter(word => word.match(new RegExp(`\\b${wordCompare}\\b`, "g")) || wordCompare.includes(word)).length > 0
          } else {

            if (regexAvailable[type]) {
              const currValue = (Array.isArray(value) && value.length > 0) ? value[0] : null
              return !!regexAvailable[type](message, currValue)
            }
          }
        }).map(({ id }) => {
          prev[id] = prev[id] ? prev[id] + 1 : 1
          prev.total = prev.total + 1
        })
        return prev
      }, { total: 0 })

      if (matchWords.total == 0) {
        return { "anything_else": 100 }
      }

      console.log("findEntity matchWords: ", matchWords)

      const total = Number(matchWords.total)
      delete matchWords.total

      console.log("findEntity total: ", total)

      const resultMatch = Object.keys(matchWords).reduce((prev, key) => {
        prev[key] = Number(matchWords[key] * 100 / total).toFixed(2)
        return prev
      }, {})

      console.log("findEntity resultMatch: ", resultMatch)

      return resultMatch
    }

    //Função para definir a confiança da(s) entidades encontradas
    const entityConfidence = (match) => {
      const matchKeys = Object.keys(match)

      if (matchKeys.length === 1) {
        return [matchKeys[0]]
      }

      const { entity } = Object.entries(match).reduce((prev, curr) => {
        if (prev.quantity < curr[1]) {
          return { quantity: curr[1], entity: [curr[0]] }

        } else if (prev.quantity === curr[1]) {
          prev.entity.push(curr[0])
        }
        return prev
      }, { quantity: 0 })
      return entity
    }

    //Função para localizar o nó de acordo com a entidade de maior confiança encontrada
    const findNode = ({ nodes, match }) => {
      const data = {
        match
      }
      if (match[0] === 'anything_else') {
        Object.assign(data, nodes.find(({ conditions }) => !conditions))
      } else {
        Object.assign(data, nodes.find(({ conditions }) => Array.isArray(conditions) && match.find((entity) => conditions.includes(entity))))
      }
      return data
    }

    /**
     * Função que localiza o nó que deve retornar a resposta
     * 1. Valida qual nó tem como pai o nó atual da conversa
     * 2. Procura as intençoes de maior confiança dentro das que existem nos nós filhos
     * 3. Retorna o nó de resposta de acordo com a intenção de maior confiança encontrada no passo 2
     */
    const getCurrNode = ({ previous = null, message }) => {
      const nodes = Array.isArray(getNodes) && getNodes.filter(({ previous_node }) => {
        return previous_node === previous
      })

      if (!nodes.includes(({ conditions }) => !conditions)) {
        const parentNode = Object.assign({}, getNodes.find(({ id }) => id === previous), { conditions: null })
        nodes.push(parentNode)
      }

      const entitiesAvailable = Array.isArray(getEntity) && getEntity.filter(({ id }) => nodes.find(({ conditions }) => Array.isArray(conditions) && conditions.includes(id)))
      const match = entityConfidence(findEntity({ entities: entitiesAvailable, message }))

      const actualNode = findNode({ nodes, match })

      const childNodes = Array.isArray(getNodes) && getNodes.filter(({ previous_node }) => {
        return previous_node === actualNode.id
      })

      return Object.assign(actualNode, { nodes: childNodes.length > 0 })
    }

    /*
    * Verifica primeiro o next move desse nó
    * Se for "Esperar Resposta": 
    *     Verifica se tem action, se tiver executa e depois dispara a resposta
    * Se for "Pular para":
    *     Guarda a resposta e verifica nó setado e valida o next move
    *         Se for "Esperar Resposta": 
    *             Verifica se tem action, se tiver executa e depois dispara a resposta do nó anterior + nó atual
    *         Se for "Pular para":
    *             Guarda a resposta e verifica nó setado e verifica o next move
    */

    const reqNode = getCurrNode({ previous: session.previous_node, message })
    const { response, match } = reqNode
    const responses = []

    /**
     * Variaveis de contexto
     * 
     */

    const setContext = (context = {}, listContext = [], params) => {
      console.log("linha 191: ",{
        contexto: context, 
        lista: listContext, 
        parametro: params
      })
      if(!Array.isArray(listContext)) {
        return context
      }
       return listContext.reduce((prev, curr) => {
        if(!curr.type){
        prev[curr.key] = curr.value
      }else {
        if(curr.type === 'get_response'){
          prev[curr.key] = params.message
        }else if(curr.type === 'increment'){
          const add = curr.value ?? 1
          prev[curr.key] = Number(prev[curr.key]) ? prev[curr.key] + add : add
        }
      }
        
        return prev
      }, context )

    }

    const nextMove = {
      "esperar_resposta": (currNode) => {
        // changed 'context' key to 'list_context', return 'context' with current session context plus list_context
        currNode.list_context = currNode.context
        console.log("linha 220: ", session)
        const context = setContext(session.context, currNode.list_context, paramsAction)
        console.log("linha 216: ", context)
        // set again context, but now is setContext
        currNode.context = context

        if (currNode.match && currNode.match[0] !== 'anything_else') {
          const currEntity = getEntity.find(({ id }) => currNode.match[0] === id)
          if (currEntity && regexAvailable[currEntity.type]) {
            currNode.regex_match = regexAvailable[currEntity.type](message)
          }
        }
        if (!currNode.match || (Array.isArray(currNode.match) && (currNode.match[0] !== 'anything_else') || currNode.nodes)) {
          this.setSession({ ia_id: paramsAction.ia_id, company_id: paramsAction.company_id, protocol_id: paramsAction.protocol.id, data: { previous_node: currNode.id, protocol: paramsAction.protocol, context } })
        }

        if (responses.length > 0) {
          responses.push(currNode)
          res.status(201).send(responses)
        } else {
          // resposta simples 
          res.status(201).send([currNode])
        }
      },
      "pular_para": (currNode) => {
        const jumpTo = (node) => {
          runNode(node)
        }
        responses.push(currNode)
        const nodeJump = getNodes.find(({ id }) => currNode.next_move.node_id === id)
        jumpTo(nodeJump)
      },
    }

    const runNode = (currNode) => {
      if (!currNode.next_move) {
        return res.status(400).send({ error: "Ocorreu um erro ao executar a Skill: nenhum nó foi encontrado", node: currNode })
      }
      nextMove[currNode.next_move?.type](currNode)
    }

    runNode(reqNode)
  }
}