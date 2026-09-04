import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { createRecoveryPreview } from './recoveryPreview'
import { createRecoveryShiftDraft, finalizeRecoveryShiftDraft } from './recoveryShiftDraft'
import { effectiveLessonDate } from './sectionSchedule'
import { applyShiftOperation, undoShiftOperation } from './shiftOperation'
import { loadShiftStateFromBrowser, saveShiftStateToBrowser, type ShiftPersistenceInput } from './shiftPersistence'
import { createUnit, placeUnit } from './units'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

class MemoryStorage {
  private readonly values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
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
const p7 = createSection({ id: 'section-p7', courseId: course.id, calendarId: calendar.id, name: 'Period 7' })
const planning = { calendarId: calendar.id, courses: [course], sections: [p2, p5, p7] }
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const units = { calendarId: calendar.id, units: [unit] }
const lesson17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const lesson18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 18', sequence: 18, plannedDate: '2026-09-17' })
const test = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Egypt test', sequence: 19, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const p5Interrupted = updateLessonDeliveryState(
  createLessonDeliveryState({ lesson: lesson17, section: p5 }),
  lesson17,
  p5,
  { status: 'in-progress', taughtDate: '2026-09-16', resumeNote: 'Stopped after the demo.' },
)
const lessons = { calendarId: calendar.id, lessons: [lesson17, lesson18, test], deliveryStates: [p5Interrupted] }

const preview = createRecoveryPreview({
  calendar,
  section: p5,
  lesson: lesson17,
  state: p5Interrupted,
  lessons: lessons.lessons,
  deliveryStates: lessons.deliveryStates,
})
const draft = createRecoveryShiftDraft(preview)
assert(draft !== null, 'Canonical interruption must produce an explicit recovery draft.')
const operation = finalizeRecoveryShiftDraft(draft, { [lesson18.id]: '2026-09-21' })
const applied = applyShiftOperation({
  operation,
  section: p5,
  lessons: lessons.lessons,
  deliveryStates: lessons.deliveryStates,
  units: units.units,
  calendar,
  overrides: [],
  sameDayApprovals: [],
})

assert(effectiveLessonDate(lesson17, p5.id, applied.overrides) === '2026-09-17', 'P5 interrupted Lesson must move to Thursday.')
assert(effectiveLessonDate(lesson18, p5.id, applied.overrides) === '2026-09-21', 'P5 displaced flexible Lesson must move only to the teacher-selected Monday.')
assert(effectiveLessonDate(test, p5.id, applied.overrides) === '2026-09-18', 'P5 fixed test must remain Friday.')
assert(effectiveLessonDate(lesson17, p2.id, applied.overrides) === '2026-09-16', 'P2 must remain on the shared Lesson plan.')
assert(effectiveLessonDate(lesson18, p7.id, applied.overrides) === '2026-09-17', 'P7 must remain on the shared Lesson plan.')

const persisted: ShiftPersistenceInput = {
  calendarId: calendar.id,
  overrides: applied.overrides,
  sameDayApprovals: applied.sameDayApprovals,
  undo: applied.undo,
}
const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage } })
assert(saveShiftStateToBrowser(persisted), 'Canonical Shift must persist to browser storage.')
const restored = loadShiftStateFromBrowser(calendar, planning, units, lessons)
assert(restored.status === 'restored' && restored.undoStatus === 'restored', 'Reload must restore both the valid Section schedule and valid Undo.')
if (restored.status !== 'restored') throw new Error('Expected restored Shift state.')

const afterReloadPreview = createRecoveryPreview({
  calendar,
  section: p5,
  lesson: lesson17,
  state: p5Interrupted,
  lessons: lessons.lessons,
  deliveryStates: lessons.deliveryStates,
  overrides: restored.input.overrides,
})
assert(createRecoveryShiftDraft(afterReloadPreview) === null, 'Reloaded adjusted schedule must not reoffer the same recovery Shift.')

assert(restored.input.undo !== null, 'Canonical restored Shift must retain Undo.')
const undone = undoShiftOperation(restored.input.overrides, restored.input.sameDayApprovals, restored.input.undo)
assert(effectiveLessonDate(lesson17, p5.id, undone.overrides) === '2026-09-16', 'Undo must restore P5 interrupted Lesson to the exact prior date.')
assert(effectiveLessonDate(lesson18, p5.id, undone.overrides) === '2026-09-17', 'Undo must restore P5 displaced Lesson to the exact prior date.')
assert(effectiveLessonDate(lesson17, p2.id, undone.overrides) === '2026-09-16', 'Undo must not alter P2.')
assert(effectiveLessonDate(lesson18, p7.id, undone.overrides) === '2026-09-17', 'Undo must not alter P7.')
assert(undone.sameDayApprovals.length === 0, 'Undo must restore the exact prior same-day approval state.')

const fixedInterrupted = updateLessonDeliveryState(
  createLessonDeliveryState({ lesson: test, section: p5 }),
  test,
  p5,
  { status: 'in-progress', taughtDate: '2026-09-18', resumeNote: 'Assessment interrupted.' },
)
const fixedPreview = createRecoveryPreview({ calendar, section: p5, lesson: test, state: fixedInterrupted, lessons: [test], deliveryStates: [fixedInterrupted] })
assert(Boolean(fixedPreview.blockedReason), 'Interrupted fixed Lesson must be blocked before Apply rather than failing only at mutation time.')
assert(createRecoveryShiftDraft(fixedPreview) === null, 'Interrupted fixed Lesson must not produce an Apply draft.')

const unscheduled = createLesson({ id: 'lesson-unscheduled', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Unscheduled studio day', sequence: 20 })
const unscheduledInterrupted = updateLessonDeliveryState(
  createLessonDeliveryState({ lesson: unscheduled, section: p5 }),
  unscheduled,
  p5,
  { status: 'in-progress', taughtDate: '2026-09-22', resumeNote: 'Stopped during cleanup.' },
)
const unscheduledPreview = createRecoveryPreview({ calendar, section: p5, lesson: unscheduled, state: unscheduledInterrupted, lessons: [unscheduled], deliveryStates: [unscheduledInterrupted] })
assert(unscheduledPreview.interruptedEffectiveDate === null, 'Unscheduled shared Lesson must remain explicitly unscheduled before recovery.')
const unscheduledDraft = createRecoveryShiftDraft(unscheduledPreview)
assert(unscheduledDraft !== null && unscheduledDraft.changes[0]?.fromDate === null, 'Recovery must safely represent an unscheduled interrupted Lesson with fromDate null.')

console.log('recovery Apply end-to-end contract passed')
