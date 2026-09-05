import { useState } from 'react'
import type { LiveClassroomSession, LiveTeachingOutcome } from '../planning'

export function LiveClassroomStage({
  session,
  onOutcome,
  onLeave,
}: {
  session: LiveClassroomSession
  onOutcome: (outcome: LiveTeachingOutcome) => void
  onLeave: () => void
}) {
  const [resumeNote, setResumeNote] = useState(session.resumeNote ?? '')
  const [stopping, setStopping] = useState(false)

  return (
    <section className="live-classroom-stage" aria-label={`Live Classroom: ${session.sectionName}, ${session.lessonTitle}`}>
      <header className="live-classroom-stage__header">
        <div>
          <p className="section-label">Live Classroom</p>
          <h1>{session.lessonTitle}</h1>
          <p>{session.sectionName} · {session.courseTitle}</p>
        </div>
        <button type="button" className="quiet-button" onClick={onLeave}>Back to Day</button>
      </header>

      <div className="live-classroom-stage__body">
        <p className="live-classroom-stage__unit">{session.unitTitle}</p>
        {session.resumeNote ? (
          <div className="live-classroom-stage__resume">
            <span>Continue</span>
            <strong>{session.resumeNote}</strong>
          </div>
        ) : (
          <p className="live-classroom-stage__empty">Arc is holding the exact Section + Lesson context. Teaching controls stay intentionally sparse here.</p>
        )}
      </div>

      <footer className="live-classroom-stage__outcomes" aria-label="Teaching outcome">
        <button type="button" className="primary-button" onClick={() => onOutcome({ kind: 'completed' })}>Complete</button>
        <button type="button" onClick={() => setStopping(true)}>Stop here</button>
        {session.deliveryStatus === 'not-started' && <button type="button" onClick={() => onOutcome({ kind: 'skipped' })}>Skip</button>}
        <button type="button" className="quiet-button" onClick={onLeave}>Leave without outcome</button>
      </footer>

      {stopping && (
        <div className="live-classroom-stage__stop" role="dialog" aria-label="Stop here resume note">
          <label>
            <span>Where should Arc hold your place?</span>
            <textarea autoFocus value={resumeNote} onChange={(event) => setResumeNote(event.target.value)} placeholder="Stopped after… Next time, start with…" />
          </label>
          <div>
            <button type="button" className="quiet-button" onClick={() => setStopping(false)}>Cancel</button>
            <button type="button" className="primary-button" disabled={!resumeNote.trim()} onClick={() => onOutcome({ kind: 'stopped', resumeNote })}>Save stop point</button>
          </div>
        </div>
      )}
    </section>
  )
}
