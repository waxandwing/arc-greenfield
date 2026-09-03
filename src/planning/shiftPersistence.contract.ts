import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLesson } from './lessons'
import { applyShiftOperation, createShiftOperation } from './shiftOperation'
import {
  deserializeShiftState,
  loadShiftStateFromBrowser,
  serializeShiftState,
  validateShiftPersistenceInput,
  type ShiftPersistenceInput,
} from './shiftPersistence'
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
const p5 = createSection({ id: 'section-p5', courseId: course.id, calendarId: calendar.id, name: 'Period 5' })
const planning = { calendarId: calendar.id, courses: [course], sections: [p5] }
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const units = { calendarId: calendar.id, units: [unit] }
const lesson17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const lesson18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 18', sequence: 18, plannedDate: '2026-09-17' })
const test = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Egypt test', sequence: 19, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const lessons = { calendarId: calendar.id, lessons: [lesson17, lesson18, test], deliveryStates: [] }

const operation = createShiftOperation({
  id: 'shift-p5-recovery',
  sectionId: p5.id,
  changes: [
    { lessonId: lesson17.id, fromDate: '2026-09-16', toDate: '2026-09-17' },
    { lessonId: lesson18.id, fromDate: '2026-09-17', toDate: '2026-09-21' },
  ],
})
const applied = applyShiftOperation({ operation, section: p5, lessons: lessons.lessons, deliveryStates: lessons.deliveryStates, units: units.units, calendar, overrides: [] })
const input: ShiftPersistenceInput = { calendarId: calendar.id, overrides: applied.overrides, undo: applied.undo }

const roundTrip = deserializeShiftState(serializeShiftState(input))
assert(roundTrip !== null, 'A valid Shift payload must deserialize.')
assert(JSON.stringify(roundTrip.overrides) === JSON.stringify(input.overrides), 'Shift overrides must survive serialization exactly.')
assert(roundTrip.undo?.operationId === applied.undo.operationId, 'Undo identity must survive serialization.')

const valid = validateShiftPersistenceInput(roundTrip, calendar, planning, units, lessons)
assert(valid.scheduleErrors.length === 0, 'Restored canonical Shift schedule must validate.')
assert(valid.undoValid, 'Undo should restore while the affected Section still matches the applied snapshot.')

assert(deserializeShiftState('{broken') === null, 'Malformed JSON must fail closed.')
assert(deserializeShiftState(JSON.stringify({ schemaVersion: 2, input })) === null, 'Unknown persistence schema versions must fail closed.')
assert(deserializeShiftState(JSON.stringify({ schemaVersion: 1, input: { ...input, overrides: [{ sectionId: p5.id, lessonId: lesson17.id, plannedDate: '2026-02-30' }] } })) === null, 'Malformed calendar dates must be rejected during parse.')

const malformedUndo = deserializeShiftState(JSON.stringify({
  schemaVersion: 1,
  input: { ...input, undo: { operationId: 42 } },
}))
assert(malformedUndo !== null, 'Malformed Undo must not destroy an otherwise parseable schedule payload.')
assert(malformedUndo.undo === null, 'Malformed Undo must be discarded.')

const staleSchedule: ShiftPersistenceInput = {
  ...input,
  overrides: input.overrides.map((override) => override.lessonId === lesson18.id ? { ...override, plannedDate: '2026-09-22' } : override),
}
const staleValidation = validateShiftPersistenceInput(staleSchedule, calendar, planning, units, lessons)
assert(staleValidation.scheduleErrors.length === 0, 'A later valid Section schedule change must remain valid durable state.')
assert(!staleValidation.undoValid, 'A later change in the affected Section must invalidate the old Undo capability.')

const badSchedule: ShiftPersistenceInput = {
  calendarId: calendar.id,
  overrides: [{ sectionId: p5.id, lessonId: lesson17.id, plannedDate: '2026-09-18' }],
  undo: null,
}
assert(validateShiftPersistenceInput(badSchedule, calendar, planning, units, lessons).scheduleErrors.length > 0, 'A saved schedule that collides with a fixed Lesson must be rejected.')

const priorSnapshotBecomesIllegal: ShiftPersistenceInput = {
  ...input,
  undo: {
    ...applied.undo,
    previousSectionOverrides: [{ sectionId: p5.id, lessonId: lesson18.id, plannedDate: '2026-09-22' }],
  },
}
const calendarAfterClosure = hydrateSchoolCalendar({
  id: calendar.id,
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [{ date: '2026-09-22', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' }],
  quarters: [],
  semesters: [],
})
const changedTruth = validateShiftPersistenceInput(priorSnapshotBecomesIllegal, calendarAfterClosure, planning, units, lessons)
assert(changedTruth.scheduleErrors.length === 0, 'Current applied schedule should remain valid when an unrelated prior Undo date becomes unavailable.')
assert(!changedTruth.undoValid, 'Undo must be discarded if its previous snapshot is no longer legal under current calendar truth.')

const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage } })
storage.setItem('arc.shift.v1', serializeShiftState(staleSchedule))
const restoredStale = loadShiftStateFromBrowser(calendar, planning, units, lessons)
assert(restoredStale.status === 'restored', 'A valid changed schedule must restore even when its Undo token is stale.')
assert(restoredStale.status === 'restored' && restoredStale.input.undo === null, 'Reload must preserve the valid schedule and discard stale Undo.')

storage.setItem('arc.shift.v1', serializeShiftState(badSchedule))
assert(loadShiftStateFromBrowser(calendar, planning, units, lessons).status === 'invalid', 'Invalid durable schedule state must fail closed on reload.')

console.log('shift persistence contract passed')
