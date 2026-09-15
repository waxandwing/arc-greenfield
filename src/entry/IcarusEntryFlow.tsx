import { useEffect, useRef, useState, type FormEvent } from 'react'
import { markEntryComplete } from './entryAccess'
import {
  ENTRY_PATTERN_ASSET,
  ENTRY_SPLASH_POSTER,
  ENTRY_SPLASH_VIDEO,
  submitInterestSignup,
  verifyBetaPassword,
} from './entryAccessApi'
import { applyEntryFlowAssetCssUrls } from './entryFlowAssets'
import styles from './IcarusEntryFlow.module.css'

type AccessMode = 'beta' | 'interest'
type InterestState = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error'

type Props = {
  onComplete: () => void
}

export function IcarusEntryFlow({ onComplete }: Props) {
  const [mode, setMode] = useState<AccessMode>('beta')
  const [error, setError] = useState('')
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [interestState, setInterestState] = useState<InterestState>('idle')

  useEffect(() => {
    applyEntryFlowAssetCssUrls()
  }, [])

  const submitBeta = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const password = String(new FormData(event.currentTarget).get('password') || '')
    setCheckingAccess(true)
    setError('')
    const result = await verifyBetaPassword(password)
    setCheckingAccess(false)
    if (!result.ok) {
      setError(result.error ?? 'That password did not open Arc.')
      return
    }
    markEntryComplete()
    onComplete()
  }

  const submitInterest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = await submitInterestSignup({
      email: String(data.get('email') || ''),
      name: String(data.get('name') || ''),
      role: String(data.get('role') || ''),
      website: String(data.get('website') || ''),
    })
    if (result.ok && result.duplicate) {
      setInterestState('duplicate')
      event.currentTarget.reset()
      setError('')
      return
    }
    if (result.ok) {
      setInterestState('success')
      event.currentTarget.reset()
      setError('')
      return
    }
    setInterestState('error')
    setError(result.error)
  }

  return (
    <OpeningGate
      mode={mode}
      onChooseMode={(next) => {
        setMode(next)
        setError('')
        setInterestState('idle')
      }}
      error={error}
      checkingAccess={checkingAccess}
      interestState={interestState}
      onBetaSubmit={submitBeta}
      onInterestSubmit={submitInterest}
    />
  )
}

type OpeningGateProps = {
  mode: AccessMode
  onChooseMode: (mode: AccessMode) => void
  error: string
  checkingAccess: boolean
  interestState: InterestState
  onBetaSubmit: (event: FormEvent<HTMLFormElement>) => void
  onInterestSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function OpeningGate({
  mode,
  onChooseMode,
  error,
  checkingAccess,
  interestState,
  onBetaSubmit,
  onInterestSubmit,
}: OpeningGateProps) {
  const video = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [mediaFallback, setMediaFallback] = useState(false)

  useEffect(() => {
    const element = video.current
    if (!element) return

    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.documentElement.getAttribute('data-reduced-motion') === 'true'
    const finishOpen = () => setReady(true)
    const failOpen = () => {
      setMediaFallback(true)
      setReady(true)
    }

    element.addEventListener('ended', finishOpen)
    element.addEventListener('error', failOpen)

    if (reduced) {
      element.pause()
      setMediaFallback(true)
      setReady(true)
    } else {
      element.play().catch(failOpen)
    }

    return () => {
      element.removeEventListener('ended', finishOpen)
      element.removeEventListener('error', failOpen)
    }
  }, [])

  return (
    <main className={styles.entryStage} aria-labelledby="entry-title">
      <section className={styles.entryContent}>
        <div className={styles.reelWrap} role="img" aria-label="Arc opening motion">
          {!mediaFallback ? (
            <video ref={video} className={styles.reel} muted playsInline preload="auto" poster={ENTRY_SPLASH_POSTER} aria-hidden="true">
              <source src={ENTRY_SPLASH_VIDEO} type="video/webm" />
            </video>
          ) : null}
          {mediaFallback ? <img className={styles.reelFallback} src={ENTRY_SPLASH_POSTER} alt="" /> : null}
        </div>

        {ready ? (
          <section className={styles.gateShelf} aria-label="Arc entry options">
            <img className={styles.gateAsset} src={ENTRY_PATTERN_ASSET} alt="" aria-hidden="true" />
            <div className={styles.gateHeading}>
              <span className={styles.gateKicker}>ARC</span>
              <h1 id="entry-title">Come on in.</h1>
            </div>

            <div className={styles.choiceTabs} role="tablist" aria-label="Choose Arc access">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'beta'}
                className={mode === 'beta' ? styles.choiceActive : styles.choiceTab}
                onClick={() => onChooseMode('beta')}
              >
                Beta tester
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'interest'}
                className={mode === 'interest' ? styles.choiceActive : styles.choiceTab}
                onClick={() => onChooseMode('interest')}
              >
                Interested in Arc
              </button>
            </div>

            {mode === 'beta' ? (
              <form onSubmit={onBetaSubmit} className={styles.gateForm} aria-label="Beta tester login">
                <div className={styles.branchIntro}>
                  <strong>Beta access</strong>
                  <span>Use the shared tester password to open Arc.</span>
                </div>
                <label htmlFor="beta-password">Beta password</label>
                <div className={styles.gateControlRow}>
                  <input
                    id="beta-password"
                    name="password"
                    type="password"
                    maxLength={256}
                    autoComplete="current-password"
                    autoFocus
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'access-error' : 'access-note'}
                  />
                  <button className={styles.gateSubmit} type="submit" disabled={checkingAccess}>
                    {checkingAccess ? 'Checking…' : 'Open Arc'}
                  </button>
                </div>
                <div className={styles.gateMeta} aria-live="polite">
                  {error
                    ? <p id="access-error" className={styles.error} role="alert">{error}</p>
                    : <p id="access-note">Private beta. Planning stays teacher-first.</p>}
                </div>
              </form>
            ) : (
              <form onSubmit={onInterestSubmit} className={styles.gateForm} aria-label="Arc interest form" noValidate>
                <div className={styles.branchIntro}>
                  <strong>Keep me posted.</strong>
                  <span>Leave your email and we will let you know when Arc opens more widely.</span>
                </div>
                <label htmlFor="interest-email">Email</label>
                <input id="interest-email" name="email" type="email" autoComplete="email" maxLength={254} required aria-invalid={interestState === 'error'} />
                <div className={styles.interestDetails}>
                  <label htmlFor="interest-name">Name <span>(optional)</span></label>
                  <input id="interest-name" name="name" type="text" autoComplete="name" maxLength={120} />
                  <label htmlFor="interest-role">What best describes you? <span>(optional)</span></label>
                  <select id="interest-role" name="role" defaultValue="">
                    <option value="">Choose one</option>
                    <option>Classroom teacher</option>
                    <option>Department chair / instructional lead</option>
                    <option>School or district leader</option>
                    <option>Education creator / consultant</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className={styles.honeypot} aria-hidden="true">
                  <label htmlFor="interest-website">Website</label>
                  <input id="interest-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                <button className={styles.gateSubmitWide} type="submit" disabled={interestState === 'submitting'}>
                  {interestState === 'submitting' ? 'Adding you…' : 'Join the interest list'}
                </button>
                <div className={styles.gateMeta} aria-live="polite">
                  {interestState === 'success' && <p className={styles.success}>You are on the list. Thank you.</p>}
                  {interestState === 'duplicate' && <p className={styles.success}>You are already on the list.</p>}
                  {interestState === 'error' && <p className={styles.error} role="alert">{error}</p>}
                  {interestState === 'idle' && <p>This does not create an Arc account or open the beta.</p>}
                </div>
              </form>
            )}
          </section>
        ) : null}
      </section>
    </main>
  )
}
