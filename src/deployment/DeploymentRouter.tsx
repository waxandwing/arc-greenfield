import { FormEvent, useEffect, useMemo, useState } from 'react'
import App from '../App'
import {
  beginGoogleSignIn,
  captureOAuthCallback,
  checkBetaGate,
  clearAuthSession,
  hydrateCloudWorkspace,
  joinInterestList,
  loadAuthSession,
  loadRuntimeConfig,
  startCloudWorkspaceMirror,
  type ArcAuthSession,
  type ArcRuntimeConfig,
  type BetaGateResult,
} from './arcCloud'
import './deployment.css'

type ShellState = 'loading' | 'ready' | 'unauthorized' | 'error'

export function DeploymentRouter() {
  const path = normalizePath(window.location.pathname)
  if (path === '/') return <LandingPage />
  if (path === '/interest') return <InterestPage />
  if (path === '/beta') return <BetaPage />
  if (path === '/auth/callback') return <AuthCallbackPage />
  if (path === '/core') return <CoreGate />
  return <NotFound />
}

function LandingPage() {
  return (
    <main className="entry-page">
      <section className="entry-stage" aria-labelledby="entry-title">
        <div className="entry-media" role="img" aria-label="Planning fragments gather and resolve into the Arc mark.">
          <video className="entry-video" autoPlay muted playsInline preload="metadata" poster="/assets/arc-entry-poster.png" aria-hidden="true">
            <source src="/assets/arc-entry-alpha.webm" type="video/webm" />
          </video>
          <div className="entry-static-mark" aria-hidden="true">arc</div>
        </div>
        <div className="entry-copy">
          <p className="entry-eyebrow">A teacher planner that understands turbulence.</p>
          <h1 id="entry-title">Plan the way you actually think.</h1>
          <p>Arc keeps the paper-planner feeling while letting the week move when school does.</p>
          <div className="entry-actions">
            <a className="entry-action entry-action--primary" href="/interest">Join the interest list</a>
            <a className="entry-action" href="/beta">Beta access</a>
          </div>
        </div>
      </section>
    </main>
  )
}

function InterestPage() {
  const [config, setConfig] = useState<ArcRuntimeConfig | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  useEffect(() => { void loadRuntimeConfig().then(setConfig).catch(() => setStatus('error')) }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!config) return
    const data = new FormData(event.currentTarget)
    setStatus('saving')
    try {
      await joinInterestList(config, {
        email: String(data.get('email') ?? '').trim(),
        name: String(data.get('name') ?? '').trim() || undefined,
        role: String(data.get('role') ?? '').trim() || undefined,
      })
      setStatus('saved')
      event.currentTarget.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <ShellCard title="Stay close to Arc" intro="We’ll send beta and launch updates. No classroom-spam avalanche.">
      <form className="entry-form" onSubmit={submit}>
        <label>Name<input name="name" autoComplete="name" /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Role<input name="role" placeholder="Teacher, coach, department chair…" /></label>
        <button className="entry-action entry-action--primary" disabled={!config || status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Join the list'}</button>
        {status === 'saved' && <p role="status">You’re on the list.</p>}
        {status === 'error' && <p role="alert">That didn’t save. Please try again.</p>}
      </form>
    </ShellCard>
  )
}

function BetaPage() {
  const [config, setConfig] = useState<ArcRuntimeConfig | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => { void loadRuntimeConfig().then(setConfig).catch(() => setError(true)) }, [])
  const session = useMemo(loadAuthSession, [])

  return (
    <ShellCard title="Arc beta" intro="Beta access is tied to the Google account on the Arc allowlist.">
      {session ? (
        <div className="entry-actions entry-actions--stacked"><a className="entry-action entry-action--primary" href="/core">Continue to Arc</a><button className="entry-action" onClick={() => { clearAuthSession(); window.location.reload() }}>Use another account</button></div>
      ) : (
        <button className="entry-action entry-action--primary" disabled={!config} onClick={() => config && beginGoogleSignIn(config)}>Continue with Google</button>
      )}
      {error && <p role="alert">Arc beta configuration is unavailable.</p>}
    </ShellCard>
  )
}

function AuthCallbackPage() {
  const [state, setState] = useState<ShellState>('loading')
  useEffect(() => {
    const session = captureOAuthCallback() ?? loadAuthSession()
    if (!session) { setState('error'); return }
    void checkBetaGate(session).then((gate) => {
      if (gate.allowed) window.location.replace('/core')
      else setState('unauthorized')
    }).catch(() => setState('error'))
  }, [])

  if (state === 'unauthorized') return <Unauthorized />
  if (state === 'error') return <ShellCard title="We couldn’t finish sign-in" intro="The Google sign-in returned, but Arc could not verify this beta account."><a className="entry-action" href="/beta">Try again</a></ShellCard>
  return <ShellCard title="Opening Arc…" intro="Verifying beta access." />
}

function CoreGate() {
  const [state, setState] = useState<ShellState>('loading')
  const [config, setConfig] = useState<ArcRuntimeConfig | null>(null)
  const [session, setSession] = useState<ArcAuthSession | null>(null)
  const [gate, setGate] = useState<BetaGateResult | null>(null)

  useEffect(() => {
    let stopMirror: (() => void) | undefined
    const auth = loadAuthSession()
    if (!auth) { window.location.replace('/beta'); return }
    setSession(auth)
    void (async () => {
      try {
        const runtime = await loadRuntimeConfig()
        const result = await checkBetaGate(auth)
        if (!result.allowed || !result.user) { setGate(result); setState('unauthorized'); return }
        await hydrateCloudWorkspace(runtime, auth, result.user.id)
        setConfig(runtime)
        setGate(result)
        stopMirror = startCloudWorkspaceMirror(runtime, auth, result.user.id)
        setState('ready')
      } catch {
        setState('error')
      }
    })()
    return () => stopMirror?.()
  }, [])

  if (state === 'unauthorized') return <Unauthorized />
  if (state === 'error') return <ShellCard title="Arc couldn’t open this workspace" intro="Your planner was not mounted because the beta gate or cloud workspace restore failed."><a className="entry-action" href="/beta">Return to beta access</a></ShellCard>
  if (state !== 'ready' || !config || !session || !gate?.user) return <ShellCard title="Opening Arc…" intro="Restoring your workspace." />
  return <App />
}

function Unauthorized() {
  return <ShellCard title="This account isn’t in the Arc beta yet" intro="Your Google sign-in worked. This account does not currently have planner access."><div className="entry-actions"><a className="entry-action entry-action--primary" href="/interest">Join the interest list</a><button className="entry-action" onClick={() => { clearAuthSession(); window.location.assign('/beta') }}>Try another Google account</button></div></ShellCard>
}

function ShellCard({ title, intro, children }: { title: string; intro: string; children?: React.ReactNode }) {
  return <main className="entry-page entry-page--simple"><section className="entry-card"><a className="entry-wordmark" href="/">arc</a><h1>{title}</h1><p>{intro}</p>{children}</section></main>
}

function NotFound() {
  return <ShellCard title="That Arc page doesn’t exist" intro="Return to the beginning."><a className="entry-action" href="/">Go home</a></ShellCard>
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path
}
