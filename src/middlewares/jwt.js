import moment from 'moment'
import jwt from 'jsonwebtoken'
import Redis from '../config/redis.js'

const redis = Redis.newConnection()

function createToken(user, last_request, current_status) {
  const obj = {}

  user.id ? (obj.id = user.id) : (obj.id = '')
  user.name ? (obj.name = user.name) : (obj.name = '')
  user.login ? (obj.login = user.login) : (obj.login = '')
  user.email ? (obj.email = user.email) : (obj.email = '')
  user.photo ? (obj.photo = user.photo) : (obj.photo = '')
  user.department ? (obj.department = user.department) : (obj.department = [])
  user.role ? (obj.role = user.role) : (obj.role = '')
  user.activated ? (obj.activated = user.activated) : (obj.activated = '')
  user.theme ? (obj.theme = user.theme) : (obj.theme = '')
  user.language ? (obj.language = user.language) : (obj.language = '')
  last_request ? (obj.last_request = last_request) : ''
  current_status ? (obj.status = current_status) : ''

  return jwt.sign(obj, process.env.SECRET, { expiresIn: 86400 })
}

function tokenVerify(req, res, next, redis) {
  try {
    const token = req.headers.authorization

    if (!token) return res.status(401).send({ tokenError: 'É necessário realizar o login' })

    const parts = token.split(' ')

    if (!parts.length === 2) return res.status(401).send({ tokenError: 'Token inválido', code: 'C6Y5T4R' })

    const [scheme, hash] = parts

    if (!/^Bearer$/i.test(scheme)) return res.status(401).send({ tokenError: 'Token inválido', code: 'B6Y8T4R' })

    jwt.verify(hash, process.env.SECRET, async (err, result) => {
      if (err) return res.status(401).send({ tokenError: 'Token inválido', code: 'A6Y5T4R' })

      const token = await redis.hget(`${process.env.PROJECT_NAME}:user:${result.id}`, 'token')

      if (!token || token === null || token === undefined) return res.status(401).send({ tokenError: 'Token inválido', code: 'A655A4R' })

      if (token === hash) {
        await redis.hset(`${process.env.PROJECT_NAME}:user:${result.id}`, 'last_request', moment().format())
        req.user = result
        return next()
      } else {
        return res.status(401).send({ tokenError: 'Token inválido', code: 'A655C4R' })
      }
    })
  } catch (err) {
    console.log(err)
    return res.status(500).send({ error: 'Ocorreu algum erro ao tentar verificar o token' })
  }
}

export { createToken, tokenVerify }
