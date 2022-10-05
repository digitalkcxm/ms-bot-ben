import moment from 'moment'

async function formatAuditoria(req, res, next) {
  let audit = {}
  
  if (req.headers['browser-ra']) {
    let headersConf = JSON.parse(req.headers['browser-ra'])
    audit = {
      ip: req.headers['x-forwarded-for'],
      device: headersConf.parsedResult.platform.type,
      so: headersConf.parsedResult.os.name,
      browser: headersConf.parsedResult.browser.name,
      browser_version: headersConf.parsedResult.browser.version,
      method: req.method,
      url: req.url,
      created_at: moment().format(),
      updated_at: moment().format()
    }
    if ((req.user) && (req.user.id)) {
      audit.id_user = req.user.id
    }
  }else{
    audit = {
      ip: req.headers['x-forwarded-for'],
      so: req.headers['sec-ch-ua-platform'],
      method: req.method,
      url: req.url,
      created_at: moment().format(),
      updated_at: moment().format()
    }
    if ((req.user) && (req.user.id)) {
      audit.id_user = req.user.id
    }
  }
  if (process.env.COMPANY_TOKEN) {
    audit.company_id = process.env.COMPANY_TOKEN
  }

  req.audit = audit
  return next()
}

export { formatAuditoria }
