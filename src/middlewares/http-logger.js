import pinoHttp from 'pino-http'

import logger from '../config/logger.js'

const httpLogger = pinoHttp({
  logger,
  useLevel: 'http'
})

export default httpLogger
