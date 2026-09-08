import { createHash, createHmac } from 'node:crypto'
import handler from '../api/beta-access.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function request(method, { cookie = '', body } = {}) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  return {
    method,
    headers: { cookie },
    async *[Symbol.asyncIterator]() { for (const chunk of chunks) yield chunk },
  }
}

function response() {
  const headers = new Map()
  return {
    statusCode: 0,
    body: '',
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value) },
    end(value = '') { this.body = String(value) },
    getHeader(name) { return headers.get(String(name).toLowerCase()) },
  }
}

async function call(method, options) {
  const res = response()
  await handler(request(method, options), res)
  return { status: res.statusCode, body: JSON.parse(res.body), cookie: res.getHeader('set-cookie') ?? '' }
}

const originalSecret = process.env.ARC_BETA_COOKIE_SECRET
const originalNodeEnv = process.env.NODE_ENV
try {
  process.env.NODE_ENV = 'test'
  delete process.env.ARC_BETA_COOKIE_SECRET
  const missing = await call('GET')
  assert(missing.status === 503 && missing.body.unlocked === false, 'missing beta cookie secret must fail closed')

  process.env.ARC_BETA_COOKIE_SECRET = 'short'
  const weak = await call('POST', { body: { password: 'icarus' } })
  assert(weak.status === 503 && !weak.cookie, 'weak beta cookie secret must not issue a cookie')

  const secret = 'arc-beta-contract-secret-32-bytes-minimum-2026'
  process.env.ARC_BETA_COOKIE_SECRET = secret
  const wrong = await call('POST', { body: { password: 'wrong' } })
  assert(wrong.status === 401 && wrong.body.unlocked === false, 'wrong beta password must remain rejected')

  const unlocked = await call('POST', { body: { password: 'icarus' } })
  assert(unlocked.status === 200 && unlocked.body.unlocked === true, 'correct beta password must unlock with configured secret')
  assert(unlocked.cookie.includes('arc_beta_access='), 'unlock must issue beta access cookie')

  const token = unlocked.cookie.match(/arc_beta_access=([^;]+)/)?.[1] ?? ''
  const verified = await call('GET', { cookie: `arc_beta_access=${token}` })
  assert(verified.status === 200 && verified.body.unlocked === true, 'issued cookie must validate')

  const passwordHash = createHash('sha256').update('icarus').digest('hex')
  const forged = createHmac('sha256', passwordHash).update('arc-beta-access-v1').digest('hex')
  const forgedResult = await call('GET', { cookie: `arc_beta_access=${forged}` })
  assert(forgedResult.body.unlocked === false, 'cookie derived from source-visible password hash must be rejected')

  const tampered = await call('GET', { cookie: `arc_beta_access=${token.slice(0, -1)}0` })
  assert(tampered.body.unlocked === false, 'tampered beta cookie must be rejected')

  const cleared = await call('DELETE')
  assert(cleared.status === 200 && cleared.cookie.includes('Max-Age=0'), 'locking beta access must clear cookie')

  console.log('B08 beta access security contract passed')
} finally {
  if (originalSecret === undefined) delete process.env.ARC_BETA_COOKIE_SECRET
  else process.env.ARC_BETA_COOKIE_SECRET = originalSecret
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = originalNodeEnv
}
