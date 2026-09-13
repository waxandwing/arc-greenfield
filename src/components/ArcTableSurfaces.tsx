import { useEffect, useState } from 'react'
import { elapsedLiveMinutes, type ArcTableLiveState, type ArcTableTeachingOutcome } from '../planning'
import '../styles/arctable.css'

type SharedProps = {
  live: ArcTableLiveState
  onOpenPlan: () => void
  onShowTeacher: () => void
  onShowStudent: () => void
  onUpdate: (value: Partial<Omit<ArcTableLiveState, 'version' | 'session' | 'startedAt'>>) => void
  onEnd: (outcome: ArcTableTeachingOutcome) => string | null
}

export function ArcTableTeacherMonitor(props: SharedProps) {
  const { live, onOpenPlan, onShowStudent, onUpdate, onEnd } = props
  const [ending, setEnding] = useState(false)
  const [resumeNote, setResumeNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const now = useClock()
  const elapsed = elapsedLiveMinutes(live, now)

  function finish(outcome: ArcTableTeachingOutcome) {
    const message = onEnd(outcome)
    setError(message)
    if (!message) setEnding(false)
  }

  return (
    <main className="arctable arctable--teacher">
      <header className="arctable-header">
        <img src="/assets/arctable/header-compact.png" alt="ArcTable" />
        <div>
          <p className="arctable-kicker">Teacher Monitor</p>
          <strong>{live.session.courseTitle} · {live.session.sectionName}</strong>
        </div>
        <div className="arctable-header-actions">
          <button type="button" className="quiet-button" onClick={onOpenPlan}>Plan View</button>
          <span className="arctable-live-chip">Live · {elapsed} min</span>
          <button type="button" className="quiet-button" onClick={() => setEnding(true)}>End Class</button>
        </div>
      </header>

      <div className="arctable-teacher-layout">
        <section className="arctable-board" aria-labelledby="arctable-lesson-title">
          <div className="arctable-progress" aria-label={`Phase ${live.phase} of ${live.phaseCount}`}>
            <span style={{ width: `${(live.phase / live.phaseCount) * 100}%` }} />
          </div>
          <p className="arctable-kicker">Phase {live.phase} of {live.phaseCount}</p>
          <h1 id="arctable-lesson-title">{live.session.lessonTitle}</h1>
          <ol className="arctable-directions">
            {live.directions.map((direction, index) => <li key={`${direction}-${index}`}>{direction}</li>)}
          </ol>
          <div className="arctable-media">
            <p className="arctable-kicker">Media / artwork</p>
            <strong>{live.session.unitTitle}</strong>
          </div>
          <div className="arctable-student-facts">
            <span>Voice {live.voiceLevel}</span>
            <span>{live.materials}</span>
            {live.cleanup ? <strong>Cleanup now</strong> : <span>Cleanup later</span>}
          </div>
        </section>

        <aside className="arctable-controls" aria-label="Teacher controls">
          <p className="arctable-kicker">Teacher controls</p>
          <ControlRow label="Timer" value={`${elapsed} min running`} />
          <div className="arctable-control-row">
            <strong>Phase</strong>
            <div className="arctable-stepper">
              <button type="button" aria-label="Previous phase" disabled={live.phase === 1} onClick={() => onUpdate({ phase: live.phase - 1 })}>−</button>
              <span>{live.phase} / {live.phaseCount}</span>
              <button type="button" aria-label="Next phase" disabled={live.phase === live.phaseCount} onClick={() => onUpdate({ phase: live.phase + 1 })}>+</button>
            </div>
          </div>
          <label className="arctable-control-field"><strong>Materials</strong><input value={live.materials} onChange={(event) => onUpdate({ materials: event.target.value })} /></label>
          <label className="arctable-control-field"><strong>Voice expectation</strong><select value={live.voiceLevel} onChange={(event) => onUpdate({ voiceLevel: Number(event.target.value) as 1 | 2 | 3 })}><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option></select></label>
          <button type="button" className="arctable-control-row" onClick={() => onUpdate({ boardLocked: !live.boardLocked })}><strong>Board</strong><span>{live.boardLocked ? 'Locked' : 'Editable'}</span></button>
          <button type="button" className="arctable-control-row" onClick={onShowStudent}><strong>Student preview</strong><span>Open projected view</span></button>
          <div className="arctable-tool-row"><button type="button">Pick someone</button><button type="button">Pass tools</button></div>
          <button type="button" className={live.cleanup ? 'arctable-cleanup is-active' : 'arctable-cleanup'} onClick={() => onUpdate({ cleanup: !live.cleanup })}>{live.cleanup ? 'Stop cleanup' : 'Start cleanup'}</button>
        </aside>
      </div>

      {ending ? (
        <div className="arctable-end-layer" role="dialog" aria-modal="true" aria-labelledby="end-class-title">
          <form className="arctable-end-card" onSubmit={(event) => { event.preventDefault(); if (resumeNote.trim()) finish({ kind: 'stopped', resumeNote }) }}>
            <p className="arctable-kicker">Instructional outcome</p>
            <h2 id="end-class-title">Where did this class land?</h2>
            <p>Ending is different from opening Plan View. This updates only {live.session.sectionName}.</p>
            {error ? <p className="setup-errors" role="alert">{error}</p> : null}
            <button type="button" className="primary-button" onClick={() => finish({ kind: 'completed' })}>Complete lesson</button>
            <label><span>Stop here + required resume note</span><textarea required value={resumeNote} onChange={(event) => setResumeNote(event.target.value)} /></label>
            <button type="submit" className="quiet-button">Save stop point</button>
            {live.session.deliveryStatus === 'not-started' && live.phase === 1 && elapsed === 0 ? <button type="button" className="text-button" onClick={() => finish({ kind: 'skipped' })}>Skip — lesson never started</button> : null}
            <button type="button" className="text-button" onClick={() => setEnding(false)}>Keep class running</button>
          </form>
        </div>
      ) : null}
    </main>
  )
}

export function ArcTableStudentSurface(props: SharedProps) {
  const { live, onShowTeacher } = props
  const now = useClock()
  const elapsed = elapsedLiveMinutes(live, now)
  return (
    <main className={`arctable arctable--student${live.cleanup ? ' is-cleanup' : ''}`}>
      <header className="arctable-student-header">
        <img src="/assets/arctable/header-compact-dark.png" alt="ArcTable" />
        <div><strong>Projected view</strong><span>{live.session.sectionName} · {live.session.courseTitle}</span></div>
        <time>{formatClock(now)}</time>
        <button type="button" className="arctable-teacher-return" onClick={onShowTeacher}>Return to Teacher Monitor</button>
      </header>
      <section className="arctable-student-stage">
        <div className="arctable-student-work">
          <p className="arctable-kicker">{live.session.unitTitle}</p>
          <h1>{live.session.lessonTitle}</h1>
          <ol>{live.directions.map((direction, index) => <li key={`${direction}-${index}`}><strong>{index + 1}</strong><span>{direction}</span></li>)}</ol>
        </div>
        <aside className="arctable-student-now">
          <div className="arctable-timer-ring"><strong>{elapsed}:00</strong></div>
          <span className="arctable-voice">Voice {live.voiceLevel}</span>
          <p><span>Materials</span><strong>{live.materials}</strong></p>
          <p><span>Current phase</span><strong>{live.phase} of {live.phaseCount}</strong></p>
        </aside>
      </section>
      {live.cleanup ? <div className="arctable-student-cleanup"><strong>Cleanup now</strong><span>Save your work · return materials · stay at your table.</span></div> : null}
    </main>
  )
}

function ControlRow({ label, value }: { label: string; value: string }) {
  return <div className="arctable-control-row"><strong>{label}</strong><span>{value}</span></div>
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

function formatClock(now: Date): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(now)
}
