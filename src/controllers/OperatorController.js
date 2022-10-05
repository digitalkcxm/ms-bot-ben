import OperatorModel from '../models/OperatorModel.js'

export default class OperatorController {
  constructor(database = {}, logger = {}) {
    this.database = database
    this.logger = logger
    this.operator = new OperatorModel(database, logger)
  }

  async get(req, res) {
    try {
      const result = await this.operator.get()
      return res.status(200).send(result)
    } catch (err) {
      console.log("err ===>", err)
      return res.status(500).send({ error: 'Houve um erro interno no servidor.' })
    }
  }
}