import { createHash, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'arc_beta_access'
const EXPECTED_PASSWORD_HASH = '02960e0be166e38c3f854ece834f50973db2f54fb8f3b969a8978ebf722dc280'
const ACCESS_TOKEN = 'f71a2c00d75bf02eb1116c85a124c46f7f209c51cd063be144cfd9121e6574ea'
const THIRTY_DAYS = 60 * 60 * 24 * 30

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function safeEqual(left, right) {
  const a = Buffer.from(left, 'utf8')
  const b = Buffer.from(right, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((value) => value.trim()).filter(Boolean).map((pair) => {
    const index = pair.indexOf('=')
    return index < 0 ? [pair, ''] : [pair.slice(0, index), decodeURIComponent(pair.slice(index + 1))]
  }))
}

function send(res, status, body, extraHeaders = {}) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  for (const [name, value] of Object.entries(extraHeaders)) res.setHeader(name, value)
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return JSON.parse(raw || '{}')
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const stored = parseCookies(req.headers.cookie)[COOKIE_NAME] ?? ''
    return send(res, 200, { unlocked: safeEqual(stored, ACCESS_TOKEN) })
  }

  if (req.method === 'POST') {
    let body
    try { body = await readJson(req) }
    catch { return send(res, 400, { unlocked: false, error: 'Enter the beta password to continue.' }) }

    const password = typeof body.password === 'string' ? body.password : ''
    if (!password) return send(res, 400, { unlocked: false, error: 'Enter the beta password to continue.' })
    if (!safeEqual(sha256(password), EXPECTED_PASSWORD_HASH)) {
      return send(res, 401, { unlocked: false, error: 'That beta password is not correct.' })
    }

    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    const cookie = `${COOKIE_NAME}=${ACCESS_TOKEN}; Path=/; Max-Age=${THIRTY_DAYS}; HttpOnly; SameSite=Lax${secure}`
    return send(res, 200, { unlocked: true }, { 'set-cookie': cookie })
  }

  if (req.method === 'DELETE') {
    return send(res, 200, { unlocked: false }, { 'set-cookie': `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure` })
  }

  return send(res, 405, { unlocked: false }, { allow: 'GET, POST, DELETE' })
}
