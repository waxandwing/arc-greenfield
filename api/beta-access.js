import { COOKIE_NAME, EXPECTED_PASSWORD_HASH, THIRTY_DAYS, accessToken, requestIsUnlocked, safeEqual, sha256 } from '../lib/beta-access.js';

function send(res, status, body, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  for (const [name, value] of Object.entries(extraHeaders)) res.setHeader(name, value);
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '{}');
}

export default async function handler(req, res) {
  if (req.method === 'GET') return send(res, 200, { unlocked: requestIsUnlocked(req) });

  if (req.method === 'POST') {
    let body;
    try { body = await readJson(req); }
    catch { return send(res, 400, { unlocked: false, error: 'Enter the beta password to continue.' }); }
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) return send(res, 400, { unlocked: false, error: 'Enter the beta password to continue.' });
    if (!safeEqual(sha256(password), EXPECTED_PASSWORD_HASH)) {
      return send(res, 401, { unlocked: false, error: 'That beta password is not correct.' });
    }
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    const cookie = `${COOKIE_NAME}=${encodeURIComponent(accessToken())}; Path=/; Max-Age=${THIRTY_DAYS}; HttpOnly; SameSite=Lax${secure}`;
    return send(res, 200, { unlocked: true }, { 'set-cookie': cookie });
  }

  if (req.method === 'DELETE') {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    return send(res, 200, { unlocked: false }, { 'set-cookie': `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}` });
  }

  return send(res, 405, { unlocked: false }, { allow: 'GET, POST, DELETE' });
}
