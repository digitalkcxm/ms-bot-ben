import ActionsModel from '../models/ActionsModel.js'

export default class ActionController {
  constructor(database = {}, logger = {}) {
    this.database = database
    this.logger = logger
    this.actions = new ActionsModel(database, logger)
  }

  async get(req, res) {
    try {
      const result = await this.actions.get()
      return res.status(200).send(result)
    } catch (err) {
      console.log("err ===>", err)
      return res.status(500).send({ error: 'Houve um erro interno no servidor.' })
    }
  }
}