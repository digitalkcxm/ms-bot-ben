export default class IAModel {

  constructor(database = {}, logger = {}) {
    this.database = database
    this.logger = logger
  }

  async get(company_id, id = null) {
    try {
      const whereIn = { company_id }

      if (id) {
        whereIn.id = id
      }

      return await this.database('ia')
        .select('id', 'description', 'active', 'created_at', 'updated_at')
        .where(whereIn)

    } catch (err) {
      console.log(err)
      this.logger.error(err, `Não foi possivel retornar a IA`)
      return err
    }
  }

  async create(obj) {
    try {
      const result = await this.database('ia').returning(['ia.id']).insert(obj)
      console.log(result)
      return result

    } catch (err) {
      return { error: 'Linha 10: Não foi possivel criar a IA', message: err }
    }
  }

  async update(obj) {
    try {

      const { id, company_id } = obj

      const result = await this.database('ia')
        .returning(['ia.id'])
        .update(obj)
        .where({ id, company_id })

      return result.rows

    } catch (err) {
      return { error: 'Linha 10: Não foi possivel atualizar a IA', message: err }
    }
  }


}