import { useEffect, useRef, useState } from 'react'
import { AppFrame } from '../components/AppFrame'
import { WorkspaceBridge } from './WorkspaceBridge'
import { loadArcSupabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase'
import { TITLE_POSTER_SRC, TITLE_VIDEO_SRC } from './entryMedia'
import './release.css'

function Landing() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [progress, setProgress] = useState(0)
  const [failed, setFailed] = useState(false)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const video = videoRef.current
    if (!video || reduced || !TITLE_VIDEO_SRC) {
      setProgress(1)
      return
    }
    let frame = 0
    const sync = () => {
      const time = video.currentTime || 0
      const settleStart = 3.28
      const settleEnd = 6.65
      const revealAt = 7.08
      const settle = Math.max(0, Math.min(1, (time - settleStart) / (settleEnd - settleStart)))
      setProgress(time >= revealAt ? 1 : settle * settle * (3 - 2 * settle))
      frame = window.requestAnimationFrame(sync)
    }
    frame = window.requestAnimationFrame(sync)
    void video.play().catch(() => { setFailed(true); setProgress(1) })
    return () => window.cancelAnimationFrame(frame)
  }, [reduced])

  const reveal = reduced || failed ? 1 : progress >= .99 ? 1 : 0
  const scale = 1.10 - (.10 * progress)
  return <main className="arc-entry-page">
    <section className="arc-entry-content" aria-labelledby="arc-entry-title">
      <div className="arc-entry-reel-wrap" role="img" aria-label="Arc: scattered pieces of a teacher's week organize into the Arc mark.">
        {TITLE_VIDEO_SRC && !reduced ? <video ref={videoRef} className="arc-entry-reel" style={{ '--arc-entry-scale': scale } as React.CSSProperties} muted playsInline preload="auto" poster={TITLE_POSTER_SRC} onError={() => { setFailed(true); setProgress(1) }} aria-hidden="true"><source src={TITLE_VIDEO_SRC} type="video/webm" /></video> : <img className="arc-entry-reel" src={TITLE_POSTER_SRC} alt="" aria-hidden="true" />}
      </div>
      <div className="arc-entry-copy" style={{ '--arc-copy-opacity': reveal, '--arc-copy-events': reveal ? 'auto' : 'none' } as React.CSSProperties}>
        <p className="arc-entry-eyebrow">PLAN THE WAY YOU THINK.</p>
        <h1 id="arc-entry-title" className="arc-entry-title">Making it make sense.</h1>
        <p className="arc-entry-intro">A teacher planner built for what actually happens.</p>
        <nav className="arc-entry-actions" aria-label="Arc access options">
          <a className="primary" href="/interest">Join the Arc interest list</a>
          <a className="secondary" href="/core">Beta access</a>
        </nav>
      </div>
    </section>
  </main>
}

function Interest() {
  const [status, setStatus] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (String(data.get('website') || '')) return
    const email = String(data.get('email') || '').trim()
    const name = String(data.get('name') || '').trim()
    const role = String(data.get('role') || '').trim()
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError(true); setStatus('Enter a valid email address.'); return }
    setSubmitting(true); setError(false); setStatus('')
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/arc_interest_signups`, {
        method: 'POST',
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ email, name: name || null, role: role || null, source: 'landing' }),
      })
      if (response.ok) { form.reset(); setStatus('You’re on the list. Thank you.') }
      else if (response.status === 409) setStatus('You’re already on the list.')
      else throw new Error(await response.text())
    } catch (caught) {
      console.error('Arc interest signup failed', caught); setError(true); setStatus('We couldn’t add you right now. Please try again.')
    } finally { setSubmitting(false) }
  }

  return <main className="arc-interest-page"><section className="arc-release-card" aria-labelledby="interest-title">
    <p className="arc-release-eyebrow">ARC</p><h1 id="interest-title">Keep me posted.</h1>
    <p className="lede">Leave your email and we’ll let you know when Arc is ready for a wider release.</p>
    <form className="arc-release-form" onSubmit={submit} noValidate>
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Name <span>(optional)</span><input name="name" type="text" autoComplete="name" /></label>
      <label>What best describes you? <span>(optional)</span><select name="role" defaultValue=""><option value="">Choose one</option><option>Classroom teacher</option><option>Department chair / instructional lead</option><option>School or district leader</option><option>Education creator / consultant</option><option>Other</option></select></label>
      <label style={{ position:'absolute', left:'-9999px' }} aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button type="submit" disabled={submitting}>{submitting ? 'Adding you…' : 'Join the interest list'}</button>
      <p className={`arc-release-status-text ${error ? 'arc-release-error-text' : ''}`} role="status" aria-live="polite">{status}</p>
    </form><a className="arc-release-back" href="/">← Back to Arc</a>
  </section></main>
}

function BetaGate() {
  const [session, setSession] = useState<any | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadArcSupabase().then(async (supabase) => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      setSession(data.session)
      if (data.session) {
        const gate = await fetch('/api/beta-access', { cache:'no-store', credentials:'same-origin' }).then((response) => response.json()).catch(() => ({ unlocked:false }))
        if (gate.unlocked) { window.location.replace('/core/planner'); return }
      }
      setChecking(false)
      const subscription = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession)).data.subscription
      return () => subscription.unsubscribe()
    }).catch((caught) => { console.error(caught); setError('Arc sign-in is temporarily unavailable.'); setChecking(false) })
    return () => { cancelled = true }
  }, [])

  async function google() {
    setError('')
    const supabase = await loadArcSupabase()
    sessionStorage.setItem('arc-auth-return', '/core')
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:`${window.location.origin}/auth/callback` } })
    if (authError) setError(authError.message)
  }

  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    const password = String(new FormData(event.currentTarget).get('password') || '')
    if (!password) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/beta-access', { method:'POST', credentials:'same-origin', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ password }) })
      const body = await response.json()
      if (!response.ok || !body.unlocked) { setError(body.error || 'Beta access could not be verified.'); return }
      event.currentTarget.reset(); window.location.replace('/core/planner')
    } catch { setError('Beta access could not be verified. Please try again.') }
    finally { setSubmitting(false) }
  }

  async function differentAccount() {
    try { await fetch('/api/beta-access', { method:'DELETE', credentials:'same-origin' }) } catch {}
    const supabase = await loadArcSupabase(); await supabase.auth.signOut(); setSession(null)
  }

  return <main className="arc-beta-page"><section className="arc-release-card compact" aria-live="polite">
    <p className="arc-release-eyebrow">ARC PRIVATE BETA</p><h1>{session ? 'Welcome to the beta' : 'Welcome back'}</h1>
    <p className="lede">{session ? 'You’re signed in. Enter the shared beta password to open Arc.' : 'Sign in with Google to continue to the Arc beta.'}</p>
    {checking ? <div className="arc-release-loading">Checking your Arc session…</div> : session ? <form className="arc-release-form" onSubmit={unlock}><p className="arc-release-account">{session.user?.email || ''}</p><label>Beta access password<input name="password" type="password" autoComplete="current-password" required /></label><button disabled={submitting}>{submitting ? 'Checking password…' : 'Enter Arc'}</button><button type="button" className="arc-release-text-button" onClick={differentAccount}>Use a different Google account</button></form> : <button className="arc-release-button" onClick={google}>Continue with Google</button>}
    {error && <p className="arc-release-error-text" role="alert">{error}</p>}
  </section></main>
}

function AuthCallback() {
  const [status, setStatus] = useState('Finishing sign-in…')
  const [error, setError] = useState(false)
  useEffect(() => { void (async () => {
    const url = new URL(window.location.href)
    const providerError = url.searchParams.get('error_description') || url.searchParams.get('error')
    const code = url.searchParams.get('code')
    if (providerError || !code) { setError(true); setStatus(providerError || 'Google did not return a sign-in code.'); return }
    const supabase = await loadArcSupabase(); const result = await supabase.auth.exchangeCodeForSession(code)
    if (result.error) { setError(true); setStatus(result.error.message); return }
    const requested = sessionStorage.getItem('arc-auth-return'); sessionStorage.removeItem('arc-auth-return')
    const safe = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/core'
    window.location.replace(safe)
  })() }, [])
  return <main className="arc-auth-page"><section className="arc-release-card compact"><p className="arc-release-eyebrow">ARC</p><h1>Signing in</h1><p className={error ? 'arc-release-error-text' : 'lede'} role="status">{status}</p></section></main>
}

function SignOut() {
  useEffect(() => { void (async () => {
    try { await fetch('/api/beta-access', { method:'DELETE', credentials:'same-origin' }) } catch {}
    try { const supabase = await loadArcSupabase(); await supabase.auth.signOut() } catch {}
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('arc.') && !key.startsWith('arc.cloud.'))
    keys.forEach((key) => localStorage.removeItem(key))
    window.location.replace('/core')
  })() }, [])
  return <main className="arc-release-status">Signing out of Arc…</main>
}

function Planner() {
  return <WorkspaceBridge><AppFrame /></WorkspaceBridge>
}

export function ReleaseRoutes() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return <Landing />
  if (path === '/interest') return <Interest />
  if (path === '/core') return <BetaGate />
  if (path === '/auth/callback') return <AuthCallback />
  if (path === '/signout') return <SignOut />
  if (path === '/core/planner') return <Planner />
  return <main className="arc-release-status">That Arc page does not exist.<br /><a href="/">Return to Arc</a></main>
}
