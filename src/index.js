import dotenv from 'dotenv'

import { startServer, database, logger } from './config/server.js'
//import BotBen from './controllers/botben.js'

dotenv.config()

//const botBen = new BotBen(database, logger)

//botBen.outMessage()

startServer()
