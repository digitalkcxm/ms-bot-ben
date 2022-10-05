import express from 'express'
import { checkCompany } from '../middlewares/company.js'

import NextMoveController from '../controllers/NextMoveController.js'
import ActionController from '../controllers/ActionController.js'
import OperatorController from '../controllers/OperatorController.js'

const router = express.Router()

export default (database, logger) => {
  const nmove = new NextMoveController(database, logger)
  const action = new ActionController(database, logger)
  const operator = new OperatorController(database, logger)


  //router.use(formatAuditoria)
  //router.use((req, res, next) => tokenVerify(req, res, next))
  router.use((req, res, next) => checkCompany(req, res, next))

  router.get('/next_move', (req, res) => nmove.get(req, res))
  router.get('/actions', (req, res) => action.get(req, res))
  router.get('/operators', (req, res) => operator.get(req, res))

  return router
}

