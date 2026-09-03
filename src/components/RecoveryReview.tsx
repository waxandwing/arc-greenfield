import { useState } from 'react'
import type { ISODate, SchoolCalendar } from '../calendar'
import {
  createRecoveryPreview,
  createRecoveryShiftDraft,
  finalizeRecoveryShiftDraft,
  type LessonWorkspace,
  type PlanningWorkspace,
  type SectionLessonDateOverride,
  type ShiftOperation,
  type UnitWorkspace,
} from '../planning'

type Props = {
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
  onApply: (operation: ShiftOperation) => string | null
  onClose: () => void
}

type ReviewItem = {
  sectionName: string
  lessonTitle: string
  preview: ReturnType<typeof createRecoveryPreview>
  draft: ReturnType<typeof createRecoveryShiftDraft>
}

export function RecoveryReview({ calendar, planning, units, lessons, overrides, onApply, onClose }: Props) {
  const [chosenDates, setChosenDates] = useState<Record<string, ISODate>>({})
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({})

  const items: ReviewItem[] = lessons.deliveryStates
    .filter((state) => state.status === 'in-progress')
    .map((state) => {
      const lesson = lessons.lessons.find((candidate) => candidate.id === state.lessonId)
      const section = planning.sections.find((candidate) => candidate.id === state.sectionId)
      if (!lesson || !section) return null
      const preview = createRecoveryPreview({
        calendar,
        section,
        lesson,
        state,
        lessons: lessons.lessons,
        deliveryStates: lessons.deliveryStates,
        overrides,
      })
      return { sectionName: section.name, lessonTitle: lesson.title, preview, draft: createRecoveryShiftDraft(preview) }
    })
    .filter((item): item is ReviewItem => item !== null)

  function apply(item: ReviewItem) {
    if (!item.draft) return
    const selected: Record<string, ISODate> = {}
    for (const change of item.draft.changes) {
      if (change.lessonId === item.draft.interruptedLessonId) continue
      const value = chosenDates[choiceKey(item.draft.sectionId, change.lessonId)]
      if (value) selected[change.lessonId] = value
    }

    try {
      const operation = finalizeRecoveryShiftDraft(item.draft, selected)
      const error = onApply(operation)
      if (error) {
        setApplyErrors((current) => ({ ...current, [item.draft!.sectionId]: error }))
        return
      }
      setApplyErrors((current) => {
        const next = { ...current }
        delete next[item.draft!.sectionId]
        return next
      })
    } catch (error) {
      setApplyErrors((current) => ({ ...current, [item.draft!.sectionId]: error instanceof Error ? error.message : String(error) }))
    }
  }

  return (
    <div className="recovery-review">
      <div className="calendar-setup-intro recovery-review-intro">
        <p className="section-label">Recovery review</p>
        <h2>Arc held the stopping point.</h2>
        <p>Review the consequences first. Nothing moves until you explicitly apply the Shift for that class.</p>
      </div>

      {items.length === 0 ? (
        <p className="projection-empty-state">No classes are currently marked in progress.</p>
      ) : (
        <div className="recovery-review-list">
          {items.map((item) => {
            const { sectionName, lessonTitle, preview, draft } = item
            const error = applyErrors[preview.sectionId]
            const unresolved = draft?.changes.filter((change) => change.lessonId !== draft.interruptedLessonId) ?? []
            const allResolved = unresolved.every((change) => Boolean(chosenDates[choiceKey(preview.sectionId, change.lessonId)]))

            return (
              <article className="recovery-card" key={`${preview.interruptedLessonId}:${preview.sectionId}`}>
                <header className="recovery-card-heading">
                  <div><p className="section-label">{sectionName}</p><h3>{lessonTitle}</h3></div>
                  <span className="recovery-preview-badge">Review first</span>
                </header>

                {preview.blockedReason ? (
                  <p className="recovery-blocked" role="status">{preview.blockedReason}</p>
                ) : (
                  <>
                    <div className="recovery-resume"><span>Pick up</span><strong>{preview.resumeDate ? formatDate(preview.resumeDate) : 'No available day'}</strong></div>
                    <div className="recovery-note"><span>Where you stopped</span><p>{preview.resumeNote}</p></div>

                    <div className="recovery-impact-grid">
                      <section>
                        <h4>Flexible plan affected</h4>
                        {preview.affectedFlexibleLessons.length === 0 ? <p>Nothing flexible is currently in the way.</p> : (
                          <div className="recovery-resolution-list">
                            {preview.affectedFlexibleLessons.map((affected) => {
                              const lesson = lessons.lessons.find((candidate) => candidate.id === affected.lessonId)
                              const unit = lesson ? units.units.find((candidate) => candidate.id === lesson.unitId) : null
                              const options = unit?.placement
                                ? confirmedInstructionalDates(calendar, unit.placement.startDate, unit.placement.endDate)
                                    .filter((date) => date !== affected.effectiveDate && date !== preview.resumeDate && date !== preview.fixedAnchor?.effectiveDate)
                                : []
                              const key = choiceKey(preview.sectionId, affected.lessonId)
                              return (
                                <div className="recovery-resolution" key={affected.lessonId}>
                                  <div><strong>{affected.title}</strong><span>{formatDate(affected.effectiveDate)} · {affected.reason === 'resume-date-collision' ? 'same day as the continuation' : 'before the next fixed anchor'}</span></div>
                                  {draft && (
                                    <label>
                                      <span>Move to</span>
                                      <select value={chosenDates[key] ?? ''} onChange={(event) => setChosenDates((current) => ({ ...current, [key]: event.target.value as ISODate }))}>
                                        <option value="">Choose an instructional day</option>
                                        {options.map((date) => <option key={date} value={date}>{formatDate(date)}</option>)}
                                      </select>
                                    </label>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </section>

                      <section className="recovery-fixed-anchor">
                        <h4>Fixed anchor</h4>
                        {preview.fixedAnchor ? <p><strong>{preview.fixedAnchor.title}</strong><span>{formatDate(preview.fixedAnchor.effectiveDate)} · stays fixed</span></p> : <p>No fixed Lesson appears later in the current course plan.</p>}
                      </section>
                    </div>

                    {draft ? (
                      <div className="recovery-apply-block">
                        <p>This changes only {sectionName}. Shared Lesson dates and other classes stay where they are.</p>
                        {error && <p className="recovery-blocked" role="alert">{error}</p>}
                        <button type="button" className="primary-button" disabled={!allResolved} onClick={() => apply(item)}>Apply Shift</button>
                      </div>
                    ) : <p className="recovery-adjusted" role="status">This class schedule already makes room for the continuation. There is nothing new to apply.</p>}
                  </>
                )}
              </article>
            )
          })}
        </div>
      )}

      <div className="setup-actions recovery-review-actions">
        <p>Closing the review does not apply any unsubmitted changes.</p>
        <button type="button" className="quiet-button" onClick={onClose}>Back to calendar</button>
      </div>
    </div>
  )
}

function choiceKey(sectionId: string, lessonId: string): string { return `${sectionId}:${lessonId}` }

function confirmedInstructionalDates(calendar: SchoolCalendar, startDate: ISODate, endDate: ISODate): ISODate[] {
  return Object.values(calendar.days)
    .filter((day) => day.date >= startDate && day.date <= endDate && day.kind === 'instructional' && day.confidence === 'confirmed')
    .map((day) => day.date)
    .sort()
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
