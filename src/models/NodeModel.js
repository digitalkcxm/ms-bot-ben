export default class NodeModel {

  constructor(database = {}, logger = {}) {
    this.database = database
    this.logger = logger
  }

  async get(ia_id, id = null, active = null) {
    try {
      const whereIn = { ia_id }

      if (id) {
        whereIn.id = id
      }

      if (active) {
        whereIn.active = active
      }

      return await this.database('nodes')
        .select('id', 'title', 'response', 'conditions', 'actions', 'next_move', 'previous_node', 'active', 'created_at', 'updated_at')
        .where(whereIn)

    } catch (err) {
      //this.logger?.error(err, `Não foi possivel retornar o Nó`)
      return { error: 'Linha 10: Não foi possivel criar o Nó', message: err }
      //return err
    }
  }

  async create(obj) {
    try {
      return await this.database('nodes').returning(['nodes.id']).insert(obj)

    } catch (err) {
      return { error: 'Linha 10: Não foi possivel criar o Nó', message: err }
    }
  }

  async update(obj) {
    try {
      const { id } = obj

      const result = await this.database('nodes')
        .returning(['nodes.id'])
        .update(obj)
        .where({ id })
      return result

    } catch (err) {
      return { error: 'Linha 10: Não foi possivel atualizar o Nó', message: err }
    }
  }


}