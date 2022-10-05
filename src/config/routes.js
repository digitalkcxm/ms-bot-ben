import health from '../routes/health.js'
import ia from '../routes/ia.js'
import aux from '../routes/aux.js'

export default (app, database, logger, redis) => {
  app.use('/api/v1/health', health)
  app.use('/api/v1/ia', ia(database, logger, redis))
  app.use('/api/v1/aux', aux(database, logger, redis))
}

