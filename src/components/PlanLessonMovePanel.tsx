import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ISODate, SchoolCalendar } from '../calendar'
import {
  createLessonMovePreview,
  type LessonMovePreview,
  type LessonWorkspace,
  type PlanningWorkspace,
  type ShiftPersistenceInput,
  type UnitWorkspace,
} from '../planning'
import { formatLongDate, formatShortDate } from './dateLabels'

type Props = {
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  shiftState: ShiftPersistenceInput
  lessonId: string
  sectionId: string | null
  defaultDestination?: ISODate | null
  onConfirm: (destination: ISODate, preview: LessonMovePreview) => void
  onCancel: () => void
}

export function PlanLessonMovePanel({
  calendar,
  planning,
  units,
  lessons,
  shiftState,
  lessonId,
  sectionId,
  defaultDestination,
  onConfirm,
  onCancel,
}: Props) {
  const lesson = lessons.lessons.find((candidate) => candidate.id === lessonId)
  const [destination, setDestination] = useState(defaultDestination ?? lesson?.plannedDate ?? '')
  const [preview, setPreview] = useState<LessonMovePreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'input, button:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    })
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onCancel])

  function runPreview() {
    setError(null)
    if (!destination) {
      setError('Choose a destination date before previewing this move.')
      setPreview(null)
      return
    }
    try {
      const next = createLessonMovePreview({
        calendar,
        units,
        lessons,
        overrides: shiftState.overrides,
        planning,
        lessonId,
        plannedDate: destination as ISODate,
      })
      setPreview(next)
    } catch (cause) {
      setPreview(null)
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  function confirm() {
    if (!preview || preview.blockedReason) return
    onConfirm(preview.toDate, preview)
  }

  const sectionName = sectionId ? planning.sections.find((row) => row.id === sectionId)?.name ?? null : null

  const body = !lesson ? (
    <div
      ref={panelRef}
      className="plan-move-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Move Lesson"
      data-testid="plan-move-panel"
    >
      <p className="recovery-blocked" role="status">That Lesson is no longer available.</p>
      <button type="button" className="quiet-button" onClick={onCancel}>Cancel</button>
    </div>
  ) : (
    <div
      ref={panelRef}
      className="plan-move-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-plan-move-lesson={lessonId}
      data-testid="plan-move-panel"
    >
      <header className="plan-move-panel-heading">
        <p className="section-label">Move Lesson</p>
        <h2 id={titleId}>{lesson.title}</h2>
        {sectionName ? <p className="plan-move-panel-context">{sectionName} · shared Course plan date</p> : <p className="plan-move-panel-context">Shared Course plan date</p>}
      </header>

      <label className="plan-move-destination">
        <span>Destination date</span>
        <input type="date" value={destination} onChange={(event) => { setDestination(event.target.value); setPreview(null) }} />
      </label>

      <div className="plan-move-actions">
        <button type="button" className="text-button" onClick={runPreview}>Preview move</button>
        <button type="button" className="quiet-button" onClick={onCancel}>Cancel</button>
      </div>

      {error ? <p className="recovery-blocked" role="alert">{error}</p> : null}

      {preview ? (
        <section className="plan-move-consequence" aria-label="Move consequences">
          <h3>Consequence preview</h3>
          <div className="plan-move-grid">
            <section>
              <h4>Current</h4>
              <p><strong>{preview.title}</strong></p>
              <p>{preview.fromDate ? formatLongDate(preview.fromDate) : 'Unscheduled'}</p>
              {preview.datePolicy === 'fixed' ? <p className="plan-move-fixed">Fixed date policy</p> : null}
            </section>
            <section>
              <h4>Proposed</h4>
              <p><strong>{preview.title}</strong></p>
              <p>{formatLongDate(preview.toDate)}</p>
            </section>
            <section>
              <h4>Consequence</h4>
              {preview.blockedReason ? (
                <p className="recovery-blocked" role="status">{preview.blockedReason}</p>
              ) : (
                <>
                  <p>Identity, content, and teaching history stay on this Lesson.</p>
                  {preview.sectionOverridesOnLesson.length > 0 ? (
                    <ul>
                      {preview.sectionOverridesOnLesson.map((row) => (
                        <li key={row.sectionId}>{row.sectionName} still has its own Section date ({formatShortDate(row.plannedDate)}).</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No Section-specific overrides reference this Lesson.</p>
                  )}
                </>
              )}
            </section>
          </div>
          <div className="plan-move-confirm">
            <button type="button" className="primary-button" disabled={Boolean(preview.blockedReason)} onClick={confirm}>Confirm move</button>
          </div>
        </section>
      ) : null}
    </div>
  )

  if (typeof document === 'undefined') return body

  return createPortal(
    <div
      className="plan-move-panel-layer"
      data-testid="plan-move-panel-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      {body}
    </div>,
    document.body,
  )
}
