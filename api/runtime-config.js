export default function handler(_req, res) {
  const supabaseUrl = process.env.SUPABASE_URL
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !publishableKey) {
    res.status(503).json({ error: 'Arc beta configuration is incomplete.' })
    return
  }
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
  res.status(200).json({ supabaseUrl, publishableKey })
}
