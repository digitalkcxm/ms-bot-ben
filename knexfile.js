import dotenv from 'dotenv'
dotenv.config()

export default {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD
    },
    migrations: {
      directory: './src/config/database/migrations'
    },
    seeds: {
      directory: './src/config/database/seeds'
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD
    },
    migrations: {
      directory: './src/config/database/migrations'
    },
    seeds: {
      directory: './src/config/database/seeds'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD
    },
    migrations: {
      directory: './src/config/database/migrations'
    },
    seeds: {
      directory: './src/config/database/seeds'
    }
  },

  testing: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST_TEST,
      user: process.env.DB_USERNAME_TEST,
      password: process.env.DB_PASSWORD_TEST,
      database: process.env.DB_DATABASE_TEST,
      charset: 'utf8'
    },
    migrations: {
      directory: './src/config/database/migrations'
    },
    seeds: {
      directory: './src/config/database/seeds'
    }
  }
}
