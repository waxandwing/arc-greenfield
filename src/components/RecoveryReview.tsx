import type { SchoolCalendar } from '../calendar'
import {
  createRecoveryPreview,
  type LessonWorkspace,
  type PlanningWorkspace,
  type RecoveryPreview,
} from '../planning'

type Props = {
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  lessons: LessonWorkspace
  onClose: () => void
}

type ReviewItem = {
  sectionName: string
  lessonTitle: string
  preview: RecoveryPreview
}

export function RecoveryReview({ calendar, planning, lessons, onClose }: Props) {
  const items: ReviewItem[] = lessons.deliveryStates
    .filter((state) => state.status === 'in-progress')
    .map((state) => {
      const lesson = lessons.lessons.find((candidate) => candidate.id === state.lessonId)
      const section = planning.sections.find((candidate) => candidate.id === state.sectionId)
      if (!lesson || !section) return null
      return {
        sectionName: section.name,
        lessonTitle: lesson.title,
        preview: createRecoveryPreview({
          calendar,
          section,
          lesson,
          state,
          lessons: lessons.lessons,
        }),
      }
    })
    .filter((item): item is ReviewItem => item !== null)

  return (
    <div className="recovery-review">
      <div className="calendar-setup-intro recovery-review-intro">
        <p className="section-label">Recovery review</p>
        <h2>Arc held the stopping point.</h2>
        <p>Nothing below has changed the calendar. This is a consequence preview only.</p>
      </div>

      {items.length === 0 ? (
        <p className="projection-empty-state">No classes are currently marked in progress.</p>
      ) : (
        <div className="recovery-review-list">
          {items.map(({ sectionName, lessonTitle, preview }) => (
            <article className="recovery-card" key={`${preview.interruptedLessonId}:${preview.sectionId}`}>
              <header className="recovery-card-heading">
                <div>
                  <p className="section-label">{sectionName}</p>
                  <h3>{lessonTitle}</h3>
                </div>
                <span className="recovery-preview-badge">Preview only</span>
              </header>

              {preview.blockedReason ? (
                <p className="recovery-blocked" role="status">{preview.blockedReason}</p>
              ) : (
                <>
                  <div className="recovery-resume">
                    <span>Pick up</span>
                    <strong>{preview.resumeDate ? formatDate(preview.resumeDate) : 'No available day'}</strong>
                  </div>

                  <div className="recovery-note">
                    <span>Where you stopped</span>
                    <p>{preview.resumeNote}</p>
                  </div>

                  <div className="recovery-impact-grid">
                    <section>
                      <h4>Flexible plan affected</h4>
                      {preview.affectedFlexibleLessons.length === 0 ? (
                        <p>Nothing flexible is currently in the way.</p>
                      ) : (
                        <ul>
                          {preview.affectedFlexibleLessons.map((lesson) => (
                            <li key={lesson.lessonId}>
                              <strong>{lesson.title}</strong>
                              <span>{formatDate(lesson.plannedDate)} · {lesson.reason === 'resume-date-collision' ? 'same day as the proposed continuation' : 'before the next fixed anchor'}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section className="recovery-fixed-anchor">
                      <h4>Fixed anchor</h4>
                      {preview.fixedAnchor ? (
                        <p><strong>{preview.fixedAnchor.title}</strong><span>{formatDate(preview.fixedAnchor.plannedDate)} · stays fixed</span></p>
                      ) : (
                        <p>No fixed Lesson appears before the end of this Unit sequence.</p>
                      )}
                    </section>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="setup-actions recovery-review-actions">
        <p>Recovery changes are not implemented in this pass. Closing this review leaves every Lesson, date, and class-progress record exactly as it was.</p>
        <button type="button" className="primary-button" onClick={onClose}>Back to calendar</button>
      </div>
    </div>
  )
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
