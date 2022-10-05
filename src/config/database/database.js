import knex from 'knex'
import dotenv from 'dotenv'

import knexfile from '../../../knexfile.js'

dotenv.config()
const environment = (process.env.NODE_ENV || process.env.STATE_ENV);
const conf = knex(knexfile[environment])

export default conf
