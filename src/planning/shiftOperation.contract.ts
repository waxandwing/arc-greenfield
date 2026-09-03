import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { effectiveLessonDate, type SectionLessonDateOverride } from './sectionSchedule'
import { applyShiftOperation, createShiftOperation, undoShiftOperation, validateShiftOperation, type ShiftOperation } from './shiftOperation'
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
const p2 = createSection({ id: 'section-p2', courseId: course.id, calendarId: calendar.id, name: 'Period 2' })
const p5 = createSection({ id: 'section-p5', courseId: course.id, calendarId: calendar.id, name: 'Period 5' })
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const lesson17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const lesson18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 18', sequence: 18, plannedDate: '2026-09-17' })
const test = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Egypt test', sequence: 19, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const lessons = [lesson17, lesson18, test]
const units = [unit]
const overrides: SectionLessonDateOverride[] = []
const approvals = []
const deliveryStates: LessonDeliveryState[] = []

function validate(operation: ShiftOperation, nextOverrides = overrides, states = deliveryStates) {
  return validateShiftOperation({ operation, section: p5, lessons, deliveryStates: states, units, calendar, overrides: nextOverrides, sameDayApprovals: approvals })
}

const incomplete = createShiftOperation({
  id: 'shift-incomplete',
  sectionId: p5.id,
  changes: [{ lessonId: lesson17.id, fromDate: '2026-09-16', toDate: '2026-09-17' }],
})
assert(validate(incomplete).some((error) => error.includes('multiple Lessons')), 'Shift must refuse a continuation that silently collides with Lesson 18.')

const operation = createShiftOperation({
  id: 'shift-p5-recovery',
  sectionId: p5.id,
  changes: [
    { lessonId: lesson17.id, fromDate: '2026-09-16', toDate: '2026-09-17' },
    { lessonId: lesson18.id, fromDate: '2026-09-17', toDate: '2026-09-21' },
  ],
})
assert(validate(operation).length === 0, 'Explicit collision-resolving Shift should validate.')

const sharedBefore = JSON.stringify(lessons)
const applied = applyShiftOperation({ operation, section: p5, lessons, deliveryStates, units, calendar, overrides, sameDayApprovals: approvals })
assert(applied.overrides.length === 2, 'Atomic Shift should create exactly the two explicit P5 overrides.')
assert(applied.sameDayApprovals.length === 0, 'Ordinary Shift must not invent same-day approval state.')
assert(effectiveLessonDate(lesson17, p5.id, applied.overrides) === '2026-09-17', 'P5 Lesson 17 should resume Thursday after Shift.')
assert(effectiveLessonDate(lesson18, p5.id, applied.overrides) === '2026-09-21', 'P5 Lesson 18 should use the teacher-chosen Monday date.')
assert(effectiveLessonDate(test, p5.id, applied.overrides) === '2026-09-18', 'Friday fixed test must remain fixed for P5.')
assert(effectiveLessonDate(lesson17, p2.id, applied.overrides) === '2026-09-16', 'P2 must retain the shared Lesson 17 plan because P5 Shift is Section-specific.')
assert(effectiveLessonDate(lesson18, p2.id, applied.overrides) === '2026-09-17', 'P2 must retain the shared Lesson 18 plan.')
assert(JSON.stringify(lessons) === sharedBefore, 'Applying a Section Shift must not mutate shared Lesson objects.')

const undone = undoShiftOperation(applied.overrides, applied.sameDayApprovals, applied.undo)
assert(undone.overrides.length === 0, 'Whole-operation Undo must restore the exact prior P5 override state.')
assert(undone.sameDayApprovals.length === 0, 'Whole-operation Undo must restore the exact prior P5 approval state.')

const unrelatedP2Change: SectionLessonDateOverride = { sectionId: p2.id, lessonId: lesson17.id, plannedDate: '2026-09-15' }
const p5UndoneWithoutClobberingP2 = undoShiftOperation([...applied.overrides, unrelatedP2Change], applied.sameDayApprovals, applied.undo)
assert(effectiveLessonDate(lesson17, p2.id, p5UndoneWithoutClobberingP2.overrides) === '2026-09-15', 'P5 Undo must preserve newer P2 schedule work.')
assert(effectiveLessonDate(lesson17, p5.id, p5UndoneWithoutClobberingP2.overrides) === '2026-09-16', 'P5 Undo must still restore P5 when another Section changed later.')

const fixedMove = createShiftOperation({ id: 'shift-fixed', sectionId: p5.id, changes: [{ lessonId: test.id, fromDate: '2026-09-18', toDate: '2026-09-21' }] })
assert(validate(fixedMove).some((error) => error.includes('fixed')), 'Shift must reject moving a fixed Lesson.')

const stale = createShiftOperation({ id: 'shift-stale', sectionId: p5.id, changes: [{ lessonId: lesson17.id, fromDate: '2026-09-15', toDate: '2026-09-17' }] })
assert(validate(stale).some((error) => error.includes('changed since')), 'Shift must reject stale from-date assumptions and require a fresh review.')

const weekend = createShiftOperation({ id: 'shift-weekend', sectionId: p5.id, changes: [{ lessonId: lesson17.id, fromDate: '2026-09-16', toDate: '2026-09-19' }] })
assert(validate(weekend).some((error) => error.includes('confirmed instructional day')), 'Shift must reject non-instructional target dates.')

const noOp = createShiftOperation({ id: 'shift-no-op', sectionId: p5.id, changes: [{ lessonId: lesson17.id, fromDate: '2026-09-16', toDate: '2026-09-16' }] })
assert(validate(noOp).some((error) => error.includes('does not move')), 'Shift must reject no-op changes that would create misleading operation history.')

const completed18 = updateLessonDeliveryState(createLessonDeliveryState({ lesson: lesson18, section: p5 }), lesson18, p5, { status: 'completed', taughtDate: '2026-09-17' })
assert(validate(operation, overrides, [completed18]).some((error) => error.includes('already completed')), 'Recovery Shift must refuse to move work the Section already completed.')

const skipped18 = updateLessonDeliveryState(createLessonDeliveryState({ lesson: lesson18, section: p5 }), lesson18, p5, { status: 'skipped' })
assert(validate(operation, overrides, [skipped18]).some((error) => error.includes('already skipped')), 'Recovery Shift must refuse to move work the Section already skipped.')

const newerP5Overrides = [...applied.overrides, { sectionId: p5.id, lessonId: 'some-newer-lesson', plannedDate: '2026-09-22' as const }]
let staleUndoBlocked = false
try {
  undoShiftOperation(newerP5Overrides, applied.sameDayApprovals, applied.undo)
} catch {
  staleUndoBlocked = true
}
assert(staleUndoBlocked, 'Old Undo token must not overwrite newer work inside the same Section schedule.')

console.log('shift operation contract passed')
