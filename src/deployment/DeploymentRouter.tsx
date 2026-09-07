import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import App from '../App'
import {
  beginGoogleSignIn,
  captureOAuthCallback,
  checkBetaAccess,
  clearAuthSession,
  getCloudUser,
  hydrateCloudWorkspace,
  joinInterestList,
  loadAuthSession,
  loadRuntimeConfig,
  lockBeta,
  refreshAuthSession,
  startCloudWorkspaceMirror,
  unlockBeta,
  type ArcAuthSession,
  type ArcRuntimeConfig,
  type CloudSaveStatus,
} from './arcCloud'
import './deployment.css'

type ShellState = 'loading' | 'ready' | 'locked' | 'error'

export function DeploymentRouter() {
  const path = normalizePath(window.location.pathname)
  if (path === '/') return <LandingPage />
  if (path === '/interest') return <InterestPage />
  if (path === '/beta') return <BetaPage />
  if (path === '/auth/callback') return <AuthCallbackPage />
  if (path === '/core') return <CoreGate />
  if (path === '/sync') return <SyncPage />
  return <NotFound />
}

function LandingPage() {
  const contentRef = useRef<HTMLElement | null>(null)
  const reelWrapRef = useRef<HTMLDivElement | null>(null)
  const reelRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const content = contentRef.current
    const reelWrap = reelWrapRef.current
    const reel = reelRef.current
    if (!content || !reelWrap || !reel) return

    const copy = content.querySelector<HTMLElement>('.copy')
    if (!copy) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const settleStart = 3.28
    const settleEnd = 6.65
    const revealAt = 7.08
    let animationFrame = 0
    let failed = false

    const sync = () => {
      const t = reel.currentTime || 0
      const p = reduced || failed ? 1 : Math.max(0, Math.min(1, (t - settleStart) / (settleEnd - settleStart)))
      const ease = p * p * p * (p * (p * 6 - 15) + 10)
      reel.style.setProperty('--reel-scale', String(1.10 + (.68 - 1.10) * ease))
      content.style.setProperty('--reel-top-trim', String(-.4010 * ease))
      const ready = reduced || failed || t >= revealAt
      content.classList.toggle('ready', ready)
      copy.inert = !ready
    }
    const stop = () => { cancelAnimationFrame(animationFrame); animationFrame = 0; sync() }
    const tick = () => {
      sync()
      if (!reel.paused && !reel.ended) animationFrame = requestAnimationFrame(tick)
      else animationFrame = 0
    }
    const onPlay = () => { cancelAnimationFrame(animationFrame); tick() }
    const onLoadedMetadata = () => {
      if (reduced && Number.isFinite(reel.duration)) {
        reel.pause()
        reel.currentTime = Math.max(0, reel.duration - .04)
      }
      sync()
    }
    const failOpen = () => {
      failed = true
      reelWrap.classList.add('media-failed')
      stop()
    }

    reel.addEventListener('play', onPlay)
    ;['timeupdate', 'seeking', 'seeked', 'ratechange'].forEach((event) => reel.addEventListener(event, sync))
    ;['pause', 'ended'].forEach((event) => reel.addEventListener(event, stop))
    reel.addEventListener('loadedmetadata', onLoadedMetadata)
    reel.addEventListener('error', failOpen)

    if (reduced) { reel.autoplay = false; reel.pause() }
    sync()
    if (!reel.paused && !reel.ended) tick()
    if (!reduced) void reel.play().catch(failOpen)

    return () => {
      cancelAnimationFrame(animationFrame)
      reel.removeEventListener('play', onPlay)
      ;['timeupdate', 'seeking', 'seeked', 'ratechange'].forEach((event) => reel.removeEventListener(event, sync))
      ;['pause', 'ended'].forEach((event) => reel.removeEventListener(event, stop))
      reel.removeEventListener('loadedmetadata', onLoadedMetadata)
      reel.removeEventListener('error', failOpen)
    }
  }, [])

  return (
    <main className="entry approved-entry" aria-labelledby="page-title">
      <section className="content" ref={contentRef}>
        <div className="reel-wrap" ref={reelWrapRef} role="img" aria-label="Arc logo animation resolving from a busy teacher planning week">
          <video className="reel" ref={reelRef} aria-hidden="true" autoPlay muted playsInline preload="auto" poster="/assets/arc-motion-final-transparent.png">
            <source src="/assets/Arc_Motion_Transparent.webm" type="video/webm" />
          </video>
          <img className="reel-fallback" src="/assets/arc-motion-final-transparent.png" alt="" />
        </div>
        <div className="copy">
          <p className="eyebrow">PLAN THE WAY YOU THINK.</p>
          <h1 id="page-title">Making it make sense.</h1>
          <p className="intro">A teacher planner built for what actually happens.</p>
          <nav className="actions" aria-label="Arc access options">
            <a className="primary" href="/interest">Join the interest list</a>
            <a className="secondary" href="/beta">Enter the beta</a>
          </nav>
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
    <ShellCard title="Stay close to Arc" intro="Beta and launch updates. No classroom-spam avalanche.">
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
  const [state, setState] = useState<'checking' | 'locked' | 'unlocked'>('checking')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void checkBetaAccess()
      .then((result) => setState(result.unlocked ? 'unlocked' : 'locked'))
      .catch(() => { setState('locked'); setError('Arc beta access is unavailable right now.') })
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password') ?? '')
    setSaving(true)
    setError('')
    try {
      const result = await unlockBeta(password)
      if (!result.unlocked) { setError(result.error ?? 'That beta password is not correct.'); return }
      window.location.assign('/core')
    } catch {
      setError('Arc beta access is unavailable right now.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ShellCard title="Enter the Arc beta" intro="Use the shared beta password.">
      {state === 'unlocked' ? (
        <div className="entry-actions entry-actions--stacked">
          <a className="entry-action entry-action--primary" href="/core">Open Arc</a>
          <button className="entry-action" onClick={() => { void lockBeta().then(() => setState('locked')) }}>Lock beta access</button>
        </div>
      ) : (
        <form className="entry-form" onSubmit={submit}>
          <label>Beta password<input name="password" type="password" autoComplete="current-password" required autoFocus /></label>
          <button className="entry-action entry-action--primary" disabled={saving || state === 'checking'}>{saving ? 'Opening…' : 'Enter Arc'}</button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </ShellCard>
  )
}

function AuthCallbackPage() {
  const [state, setState] = useState<ShellState>('loading')
  useEffect(() => {
    const session = captureOAuthCallback() ?? loadAuthSession()
    if (!session) { setState('error'); return }
    void (async () => {
      try {
        const runtime = await loadRuntimeConfig()
        await refreshAuthSession(runtime, session)
        const beta = await checkBetaAccess()
        if (beta.unlocked) window.location.replace('/core')
        else window.location.replace('/beta')
      } catch {
        setState('error')
      }
    })()
  }, [])
  if (state === 'error') return <ShellCard title="Google connection didn’t finish" intro="Arc is still available locally. You can try cloud sync again later."><a className="entry-action" href="/core">Return to Arc</a></ShellCard>
  return <ShellCard title="Connecting Arc…" intro="Finishing optional cloud sync." />
}

function CoreGate() {
  const [state, setState] = useState<ShellState>('loading')
  const [cloudStatus, setCloudStatus] = useState<CloudSaveStatus>('idle')
  const [cloudConnected, setCloudConnected] = useState(false)

  useEffect(() => {
    let stopMirror: (() => void) | undefined
    void (async () => {
      try {
        const beta = await checkBetaAccess()
        if (!beta.unlocked) { setState('locked'); return }

        const auth = loadAuthSession()
        if (auth) {
          try {
            const runtime = await loadRuntimeConfig()
            const active = await refreshAuthSession(runtime, auth)
            const user = await getCloudUser(runtime, active)
            await hydrateCloudWorkspace(runtime, active, user.id)
            stopMirror = startCloudWorkspaceMirror(runtime, active, user.id, setCloudStatus)
            setCloudConnected(true)
          } catch {
            clearAuthSession()
            setCloudConnected(false)
          }
        }
        setState('ready')
      } catch {
        setState('error')
      }
    })()
    return () => stopMirror?.()
  }, [])

  if (state === 'locked') { window.location.replace('/beta'); return null }
  if (state === 'error') return <ShellCard title="Arc couldn’t open" intro="The beta gate could not be verified. Your planner was not mounted."><a className="entry-action" href="/beta">Return to beta access</a></ShellCard>
  if (state !== 'ready') return <ShellCard title="Opening Arc…" intro="Preparing your planner." />
  return <div className="core-cloud-shell"><CloudSaveIndicator status={cloudStatus} connected={cloudConnected} /><App /></div>
}

function SyncPage() {
  const [config, setConfig] = useState<ArcRuntimeConfig | null>(null)
  const session = useMemo(loadAuthSession, [])
  useEffect(() => { void loadRuntimeConfig().then(setConfig).catch(() => undefined) }, [])
  return (
    <ShellCard title="Cloud continuity" intro="Google is optional. Arc works locally without it; connect only if you want this planner to follow you across devices.">
      {session ? (
        <div className="entry-actions entry-actions--stacked">
          <a className="entry-action entry-action--primary" href="/core">Return to Arc</a>
          <button className="entry-action" onClick={() => { clearAuthSession(); window.location.reload() }}>Disconnect Google</button>
        </div>
      ) : (
        <button className="entry-action entry-action--primary" disabled={!config} onClick={() => config && beginGoogleSignIn(config)}>Connect Google for cloud sync</button>
      )}
    </ShellCard>
  )
}

function CloudSaveIndicator({ status, connected }: { status: CloudSaveStatus; connected: boolean }) {
  if (!connected || status === 'idle') return null
  const message = status === 'saving' ? 'Saving to Arc…' : status === 'saved' ? 'Saved to Arc' : 'Cloud save failed — local work is still on this browser.'
  return <div className={`cloud-save-status cloud-save-status--${status}`} role={status === 'error' ? 'alert' : 'status'} aria-live="polite">{message}</div>
}

function ShellCard({ title, intro, children }: { title: string; intro: string; children?: ReactNode }) {
  return <main className="entry-page entry-page--simple"><section className="entry-card"><a className="entry-wordmark" href="/">arc</a><h1>{title}</h1><p>{intro}</p>{children}</section></main>
}

function NotFound() {
  return <ShellCard title="That Arc page doesn’t exist" intro="Return to the beginning."><a className="entry-action" href="/">Go home</a></ShellCard>
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path
}
