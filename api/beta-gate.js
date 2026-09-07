export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ allowed: false, reason: 'method' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  const authorization = req.headers.authorization
  if (!supabaseUrl || !publishableKey) {
    res.status(503).json({ allowed: false, reason: 'config' })
    return
  }
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ allowed: false, reason: 'session' })
    return
  }

  const headers = {
    apikey: publishableKey,
    Authorization: authorization,
    Accept: 'application/json',
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers })
  if (!userResponse.ok) {
    res.status(401).json({ allowed: false, reason: 'session' })
    return
  }
  const user = await userResponse.json()

  const gateResponse = await fetch(`${supabaseUrl}/rest/v1/beta_allowlist?select=email&limit=1`, { headers })
  if (!gateResponse.ok) {
    res.status(502).json({ allowed: false, reason: 'gate' })
    return
  }
  const rows = await gateResponse.json()
  const allowed = Array.isArray(rows) && rows.length === 1

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    allowed,
    user: allowed ? { id: user.id, email: user.email ?? null } : undefined,
    reason: allowed ? undefined : 'allowlist',
  })
}
