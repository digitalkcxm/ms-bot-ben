import tracing from './elastic-apm.js'
import http from 'http'
import helmet from 'helmet'
import express from 'express'
import bodyParser from 'body-parser'
import compression from 'compression'

import cors from './cors.js'
import routes from './routes.js'
import logger from './logger.js'
import database from './database/database.js'
import httpLogger from '../middlewares/http-logger.js'
//import queue from '../config/RabbitMQ.js'

import Redis from './redis.js'
const redis = Redis.newConnection()

const app = express()
const server = http.createServer(app)

app.use(bodyParser.json({ limit: '5mb' }))
cors(app)
app.use(helmet())
app.use(compression())

routes(app, database, logger, redis, tracing)
//queue()
function startServer() {
  app.use(httpLogger)
  server.listen(process.env.PORT, () => logger.info(`Server running in port ${process.env.PORT}`))
}

export { startServer, server, app, database, logger, redis, tracing }
