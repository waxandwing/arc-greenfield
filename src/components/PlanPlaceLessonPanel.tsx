import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ISODate } from '../calendar'
import {
  isOffDayPlaceSlot,
  unscheduledLessonsForCourse,
  type PlanPlaceLessonIntent,
} from '../planning/planPlaceLesson'
import type { Lesson, PlanningWorkspace } from '../planning'
import { formatLongDate } from './dateLabels'

type Props = {
  intent: PlanPlaceLessonIntent
  planning: PlanningWorkspace
  lessons: Lesson[]
  courseTitle: string
  onCreateNew: (acknowledgedOffDay: boolean) => void
  onPlaceUnscheduled: (lessonId: string) => void
  onCancel: () => void
}

export function PlanPlaceLessonPanel({
  intent,
  planning,
  lessons,
  courseTitle,
  onCreateNew,
  onPlaceUnscheduled,
  onCancel,
}: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const offDay = isOffDayPlaceSlot(intent.dayKind)
  const [acknowledgedOffDay, setAcknowledgedOffDay] = useState(!offDay)
  const section = planning.sections.find((row) => row.id === intent.sectionId)
  const sectionName = section?.name ?? 'Class'
  const fridge = unscheduledLessonsForCourse(lessons, intent.courseId)
  const dayLabel = intent.dayLabel?.trim() || (offDay ? 'No school' : null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

  const body = (
    <div
      ref={panelRef}
      className="plan-move-panel plan-place-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="plan-place-panel"
      data-plan-place-date={intent.date}
      data-plan-place-section={intent.sectionId}
      data-plan-place-off={offDay ? 'true' : 'false'}
    >
      <header className="plan-move-panel-heading">
        <p className="section-label">Add lesson</p>
        <h2 id={titleId}>{courseTitle}</h2>
        <p className="plan-move-panel-context">
          {sectionName} · {formatLongDate(intent.date as ISODate)}
        </p>
      </header>

      {offDay ? (
        <div className="plan-place-off-notice" role="status" data-testid="plan-place-off-notice">
          <p>
            <strong>{dayLabel}</strong>
            {' — '}
            Arc will not schedule teaching on this date. You can still add a Lesson for this class; it stays Unscheduled in IDEAS until you place it on an instructional day.
          </p>
          {!acknowledgedOffDay ? (
            <button
              type="button"
              className="primary-button"
              data-testid="plan-place-add-anyway"
              onClick={() => setAcknowledgedOffDay(true)}
            >
              Add anyway
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="plan-move-actions plan-place-actions">
        <button
          type="button"
          className="primary-button"
          data-testid="plan-place-create"
          disabled={offDay && !acknowledgedOffDay}
          onClick={() => onCreateNew(acknowledgedOffDay)}
        >
          {offDay ? 'Create lesson for this class' : 'Create new lesson'}
        </button>
        <button type="button" className="quiet-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {!offDay ? (
        <section className="plan-place-library" aria-label="Place from IDEAS">
          <h3>Place from IDEAS</h3>
          {fridge.length === 0 ? (
            <p className="plan-place-library-empty">No unscheduled Lessons for this Course yet.</p>
          ) : (
            <ul className="plan-place-library-list">
              {fridge.map((lesson) => (
                <li key={lesson.id}>
                  <span>{lesson.title || 'Untitled Lesson'}</span>
                  <button
                    type="button"
                    className="quiet-button"
                    data-testid={`plan-place-unscheduled-${lesson.id}`}
                    onClick={() => onPlaceUnscheduled(lesson.id)}
                  >
                    Place on {formatLongDate(intent.date)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : acknowledgedOffDay ? (
        <p className="plan-place-library-empty" role="note">
          Place-on-date stays unavailable for off days. Create the Lesson, then schedule it on an instructional day from IDEAS.
        </p>
      ) : null}
    </div>
  )

  if (typeof document === 'undefined') return body

  return createPortal(
    <div
      className="plan-move-panel-layer"
      data-testid="plan-place-panel-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      {body}
    </div>,
    document.body,
  )
}
