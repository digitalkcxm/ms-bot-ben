import axios from 'axios'

async function checkCompany(req, res, next) {
  try {
    const instance = _instance()
    const result = await instance.get(`/api/v1/company/token/${req.headers.authorization}`)

    if (!result.data.activated) return res.status(400).send({ error: 'A company se encontra desativada.' })
    if (!result.data.url_api) return res.status(400).send({ error: 'Houve um erro ao tentar criar a company.' })

    next()
  } catch (err) {
    console.log(err)
    //logger.error(err, 'ERROR MIDDLEWARE CHECK COMPANY')
    if (err.response?.status === 403) return res.status(403).send({ error: 'Acesso negado a company informada.' })
    if (err.response?.data) return res.status(500).send(err.response.data)

    return res.status(500).send('Não foi possível concluir a busca da company informada')
  }
}
function _instance() {
  return axios.create({
    baseURL: process.env.MSCOMPANY_URL,
    timeout: 180000,
    headers: {
      Accept: 'application/json'
    }
  })
}
export { checkCompany }
