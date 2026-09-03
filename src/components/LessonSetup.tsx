import { useState } from 'react'
import type { ISODate, SchoolCalendar } from '../calendar'
import {
  createLesson,
  createLessonDeliveryState,
  createLessonId,
  effectiveLessonDeliveryState,
  hydrateLessonWorkspace,
  lessonsForUnit,
  updateLessonDeliveryState,
  type DeliveryStatus,
  type Lesson,
  type LessonDatePolicy,
  type LessonDeliveryState,
  type LessonWorkspace,
  type LessonWorkspaceInput,
  type PlanningWorkspace,
  type UnitWorkspace,
} from '../planning'

type Props = {
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  initialValue: LessonWorkspaceInput | null
  onSave: (input: LessonWorkspaceInput, workspace: LessonWorkspace) => void
  onCancel: () => void
}

export function LessonSetup({ calendar, planning, units, initialValue, onSave, onCancel }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>(() => initialValue?.lessons.map((lesson) => ({ ...lesson })) ?? [])
  const [deliveryStates, setDeliveryStates] = useState<LessonDeliveryState[]>(() => initialValue?.deliveryStates.map((state) => ({ ...state })) ?? [])
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(() => initialValue?.lessons[0]?.id ?? null)
  const [errors, setErrors] = useState<string[]>([])

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null
  const selectedUnit = selectedLesson ? units.units.find((unit) => unit.id === selectedLesson.unitId) ?? null : null
  const selectedSections = selectedLesson ? planning.sections.filter((section) => section.courseId === selectedLesson.courseId) : []

  function addLesson() {
    const unit = units.units[0]
    if (!unit) return
    const siblings = lessonsForUnit(lessons, unit.id)
    const lesson: Lesson = {
      id: createLessonId(),
      calendarId: calendar.id,
      courseId: unit.courseId,
      unitId: unit.id,
      title: '',
      sequence: siblings.length + 1,
      plannedDate: null,
      datePolicy: 'flexible',
    }
    setLessons((current) => [...current, lesson])
    setSelectedLessonId(lesson.id)
  }

  function changeUnit(lessonId: string, unitId: string) {
    const unit = units.units.find((candidate) => candidate.id === unitId)
    const lesson = lessons.find((candidate) => candidate.id === lessonId)
    if (!unit || !lesson) return

    const hasTeachingHistory = deliveryStates.some((state) => state.lessonId === lessonId)
    if (unit.courseId !== lesson.courseId && hasTeachingHistory) {
      setErrors(['This Lesson has saved class progress. Arc will not move it to a different course and erase or detach that history. Resolve the class progress first.'])
      return
    }

    setErrors([])
    setLessons((current) => current.map((item) => item.id === lessonId ? {
      ...item,
      unitId: unit.id,
      courseId: unit.courseId,
      plannedDate: null,
      datePolicy: 'flexible',
    } : item))
  }

  function removeLesson(lessonId: string) {
    if (deliveryStates.some((state) => state.lessonId === lessonId)) {
      setErrors(['Clear the class progress for this Lesson before removing it. Arc will not erase teaching history silently.'])
      return
    }
    setLessons((current) => current.filter((lesson) => lesson.id !== lessonId))
    if (selectedLessonId === lessonId) setSelectedLessonId(null)
  }

  function changeDelivery(
    lesson: Lesson,
    sectionId: string,
    update: Partial<Pick<LessonDeliveryState, 'status' | 'taughtDate' | 'resumeNote'>>,
  ) {
    const section = planning.sections.find((candidate) => candidate.id === sectionId)
    if (!section) return
    const current = effectiveLessonDeliveryState(deliveryStates, lesson, section)
    const next = { ...current, ...update }

    if (next.status === 'not-started') {
      setDeliveryStates((states) => states.filter((state) => !(state.lessonId === lesson.id && state.sectionId === sectionId)))
      return
    }

    setDeliveryStates((states) => [
      ...states.filter((state) => !(state.lessonId === lesson.id && state.sectionId === sectionId)),
      next,
    ])
  }

  function submit() {
    try {
      const normalizedLessons = lessons.map((draft) => createLesson({ ...draft }))
      const normalizedStates = deliveryStates.map((draft) => {
        const lesson = normalizedLessons.find((candidate) => candidate.id === draft.lessonId)
        const section = planning.sections.find((candidate) => candidate.id === draft.sectionId)
        if (!lesson || !section) return draft
        return updateLessonDeliveryState(
          createLessonDeliveryState({ lesson, section }),
          lesson,
          section,
          { status: draft.status, taughtDate: draft.taughtDate, resumeNote: draft.resumeNote },
        )
      })
      const input: LessonWorkspaceInput = { calendarId: calendar.id, lessons: normalizedLessons, deliveryStates: normalizedStates }
      const workspace = hydrateLessonWorkspace(input, calendar, planning, units)
      setErrors([])
      onSave(input, workspace)
    } catch (error) {
      const message = error instanceof Error ? error.message.replace(/^Cannot use Lessons\.\s*/, '') : String(error)
      setErrors(message.split(/(?<=\.)\s+/).filter(Boolean))
    }
  }

  if (units.units.length === 0) return <div className="lesson-setup"><p className="projection-empty-state">Create at least one Unit before adding Lessons.</p></div>

  return (
    <div className="lesson-setup">
      <div className="calendar-setup-intro"><p className="section-label">Lessons</p><h2>One plan. Different places.</h2><p>Build the shared Lesson once. Then record where each class actually is without changing the plan for everyone else.</p></div>
      {errors.length > 0 && <div className="setup-errors" role="alert"><strong>Check the Lessons.</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
      <div className="lesson-workspace-grid">
        <aside className="lesson-list" aria-label="Lessons">
          {lessons.map((lesson) => {
            const unit = units.units.find((candidate) => candidate.id === lesson.unitId)
            return <button key={lesson.id} type="button" className="lesson-list-item" aria-current={lesson.id === selectedLessonId ? 'true' : undefined} onClick={() => setSelectedLessonId(lesson.id)}><strong>{lesson.title || 'Untitled Lesson'}</strong><span>{unit?.title ?? 'Missing Unit'}</span></button>
          })}
          <button type="button" className="quiet-button lesson-add-button" onClick={addLesson}>Add Lesson</button>
        </aside>
        <div className="lesson-detail">
          {!selectedLesson ? <p className="projection-empty-state">Choose a Lesson or add one.</p> : <>
            <section className="lesson-shared-plan">
              <div className="lesson-detail-heading"><div><p className="section-label">Shared plan</p><h3>{selectedLesson.title || 'Untitled Lesson'}</h3></div><button type="button" className="text-button" onClick={() => removeLesson(selectedLesson.id)}>Remove Lesson</button></div>
              <div className="lesson-field-grid lesson-field-grid--schedule">
                <label><span>Lesson title</span><input value={selectedLesson.title} onChange={(event) => setLessons((current) => current.map((lesson) => lesson.id === selectedLesson.id ? { ...lesson, title: event.target.value } : lesson))} /></label>
                <label><span>Unit</span><select value={selectedLesson.unitId} onChange={(event) => changeUnit(selectedLesson.id, event.target.value)}>{units.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.title}</option>)}</select></label>
                <label><span>Order</span><input type="number" min="1" step="1" value={selectedLesson.sequence} onChange={(event) => setLessons((current) => current.map((lesson) => lesson.id === selectedLesson.id ? { ...lesson, sequence: Number(event.target.value) } : lesson))} /></label>
                <label><span>Planned date</span><input type="date" disabled={!selectedUnit?.placement} min={selectedUnit?.placement?.startDate} max={selectedUnit?.placement?.endDate} value={selectedLesson.plannedDate ?? ''} onChange={(event) => setLessons((current) => current.map((lesson) => lesson.id === selectedLesson.id ? { ...lesson, plannedDate: event.target.value ? event.target.value as ISODate : null, datePolicy: event.target.value ? lesson.datePolicy : 'flexible' } : lesson))} /></label>
                <label><span>Date behavior</span><select value={selectedLesson.datePolicy} disabled={!selectedLesson.plannedDate} onChange={(event) => setLessons((current) => current.map((lesson) => lesson.id === selectedLesson.id ? { ...lesson, datePolicy: event.target.value as LessonDatePolicy } : lesson))}><option value="flexible">Flexible</option><option value="fixed">Fixed</option></select></label>
              </div>
              <p className="lesson-date-policy-note">Flexible dates may be surfaced for recovery review. Fixed dates are anchors: Arc may show a collision, but it will not move them automatically.</p>
            </section>
            <section className="lesson-section-progress">
              <div className="lesson-progress-heading"><p className="section-label">Class progress</p><h3>Where did each class stop?</h3></div>
              {selectedSections.length === 0 ? <p className="projection-empty-state">This course does not have any periods or sections yet.</p> : selectedSections.map((section) => {
                const state = effectiveLessonDeliveryState(deliveryStates, selectedLesson, section)
                return <div className="delivery-row" key={section.id}>
                  <strong>{section.name}</strong>
                  <label><span>Status</span><select value={state.status} onChange={(event) => changeDelivery(selectedLesson, section.id, { status: event.target.value as DeliveryStatus })}><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="skipped">Skipped</option></select></label>
                  {(state.status === 'in-progress' || state.status === 'completed') && <label><span>Actual date</span><input type="date" min={calendar.firstDay} max={calendar.lastDay} value={state.taughtDate ?? ''} onChange={(event) => changeDelivery(selectedLesson, section.id, { taughtDate: event.target.value ? event.target.value as ISODate : null })} /></label>}
                  {state.status === 'in-progress' && <label className="delivery-resume-note"><span>Pick up here</span><textarea rows={2} value={state.resumeNote ?? ''} placeholder="Stopped after the demo. Start with guided comparison." onChange={(event) => changeDelivery(selectedLesson, section.id, { resumeNote: event.target.value })} /></label>}
                </div>
              })}
            </section>
          </>}
        </div>
      </div>
      <div className="setup-actions"><p>Arc stores only the classes that diverge. Untouched classes remain “Not started” without creating extra records.</p><div className="setup-action-buttons"><button type="button" className="text-button" onClick={onCancel}>Cancel</button><button type="button" className="primary-button" onClick={submit}>Save Lessons</button></div></div>
    </div>
  )
}
