const SUPABASE_URL = process.env.ARC_SUPABASE_URL || 'https://jnbppgjkzzuquhenaqtq.supabase.co'
const SUPABASE_KEY = process.env.ARC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_0wnc_Y6ccYUsA78VGjmOKw_d0zTig_V'

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export default async function handler(
  req: { method?: string; body?: Record<string, unknown> },
  res: {
    setHeader: (name: string, value: string) => void
    status: (code: number) => { json: (body: unknown) => void }
  },
) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false })
  }

  const email = clean(req.body?.email, 254).toLowerCase()
  const name = clean(req.body?.name, 120)
  const role = clean(req.body?.role, 120)
  const website = clean(req.body?.website, 200)

  if (website) return res.status(200).json({ ok: true })

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Enter a valid email address.' })
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/arc_interest_signups`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        email,
        name: name || null,
        role: role || null,
        source: 'arc-greenfield-entry',
      }),
    })

    if (response.ok || response.status === 201) {
      return res.status(201).json({ ok: true })
    }

    if (response.status === 409) {
      return res.status(409).json({ ok: true, duplicate: true })
    }

    console.error('Arc interest signup failed', response.status, await response.text())
    return res.status(502).json({ ok: false, error: 'Interest signup is temporarily unavailable.' })
  } catch (error) {
    console.error('Arc interest signup error', error)
    return res.status(502).json({ ok: false, error: 'Interest signup is temporarily unavailable.' })
  }
}
