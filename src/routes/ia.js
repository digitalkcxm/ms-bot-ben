import express from 'express'
import { checkCompany } from '../middlewares/company.js'

import IAController from '../controllers/IAController.js'
import ConversationController from '../controllers/ConversationController.js'

const router = express.Router()

export default (database, logger, redis) => {
  const iaController = new IAController(database, logger, redis)
  const chatController = new ConversationController(database, logger, redis)

  //router.use(formatAuditoria)
  router.use((req, res, next) => checkCompany(req, res, next))
  
  router.post('/skill', (req, res) => iaController.create(req, res))
  router.put('/skill', (req, res) => iaController.update(req, res))
  router.get('/skill/:id?', (req, res) => iaController.get(req, res))
  router.post('/chat', (req, res) => chatController.sendMessage(req, res))
  router.post('/delete_session', (req, res) => chatController.remSession(req, res))

  return router
}
