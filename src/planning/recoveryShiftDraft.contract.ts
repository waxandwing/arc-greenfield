import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { createRecoveryPreview } from './recoveryPreview'
import { createRecoveryShiftDraft, finalizeRecoveryShiftDraft } from './recoveryShiftDraft'
import { createUnit, placeUnit } from './units'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-2026-27',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})
const course = createCourse({ id: 'course-apah', title: 'AP Art History' })
const section = createSection({ id: 'section-p5', courseId: course.id, calendarId: calendar.id, name: 'Period 5' })
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const lesson17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const lesson18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 18', sequence: 18, plannedDate: '2026-09-17' })
const test = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Egypt test', sequence: 19, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const interrupted = updateLessonDeliveryState(
  createLessonDeliveryState({ lesson: lesson17, section }),
  lesson17,
  section,
  { status: 'in-progress', taughtDate: '2026-09-16', resumeNote: 'Stopped after demo.' },
)

const preview = createRecoveryPreview({
  calendar,
  section,
  lesson: lesson17,
  state: interrupted,
  lessons: [lesson17, lesson18, test],
  deliveryStates: [interrupted],
})
assert(preview.interruptedEffectiveDate === '2026-09-16', 'Recovery preview must carry the interrupted Lesson effective date reviewed by the teacher.')
const draft = createRecoveryShiftDraft(preview)
assert(draft !== null, 'A real recovery collision should produce an explicit Shift draft.')
assert(draft.changes[0]?.lessonId === lesson17.id && draft.changes[0]?.fromDate === '2026-09-16' && draft.changes[0]?.toDate === '2026-09-17', 'Interrupted Lesson change must bind to the exact reviewed from/to dates.')
assert(draft.changes.some((change) => change.lessonId === lesson18.id && change.fromDate === '2026-09-17' && change.toDate === null), 'Affected flexible work must require an explicit teacher destination.')

let incompleteRejected = false
try {
  finalizeRecoveryShiftDraft(draft, {})
} catch {
  incompleteRejected = true
}
assert(incompleteRejected, 'A recovery Shift may not finalize while an affected Lesson lacks a teacher-chosen destination.')

let backwardRejected = false
try {
  finalizeRecoveryShiftDraft(draft, { [lesson18.id]: '2026-09-15' })
} catch {
  backwardRejected = true
}
assert(backwardRejected, 'Recovery Shift must reject a displaced Lesson destination on or before the class resume date.')

const operation = finalizeRecoveryShiftDraft(draft, { [lesson18.id]: '2026-09-21' })
assert(operation.sectionId === section.id, 'Finalized Shift must stay scoped to the reviewed Section.')
assert(operation.changes.length === 2, 'Finalized Shift must contain every explicit consequence and no hidden movement.')

const alreadyAdjusted = createRecoveryPreview({
  calendar,
  section,
  lesson: lesson17,
  state: interrupted,
  lessons: [lesson17, lesson18, test],
  deliveryStates: [interrupted],
  overrides: [
    { sectionId: section.id, lessonId: lesson17.id, plannedDate: '2026-09-17' },
    { sectionId: section.id, lessonId: lesson18.id, plannedDate: '2026-09-21' },
  ],
})
assert(createRecoveryShiftDraft(alreadyAdjusted) === null, 'Reloaded recovery must not offer the same Shift again after the Section schedule already makes room.')

console.log('recovery Shift draft contract passed')
