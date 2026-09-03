import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { createSameDayLessonApproval, sameDayApprovalCovers, validateSameDayLessonApproval } from './sameDayApproval'
import { validateSectionScheduleWorkspace } from './sectionScheduleWorkspace'
import { applyShiftOperation, createShiftOperation, validateShiftOperation } from './shiftOperation'
import { createUnit, placeUnit } from './units'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-2026-27',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-14',
  lastDay: '2026-09-25',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [{ date: '2026-09-22', kind: 'no-school', label: 'Closure', source: 'manual', confidence: 'confirmed' }],
  quarters: [],
  semesters: [],
})
const course = createCourse({ id: 'course-apah', title: 'AP Art History' })
const section = createSection({ id: 'section-p5', courseId: course.id, calendarId: calendar.id, name: 'Period 5' })
const planning = { calendarId: calendar.id, courses: [course], sections: [section] }
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const units = { calendarId: calendar.id, units: [unit] }
const a = createLesson({ id: 'lesson-a', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'A', sequence: 1, plannedDate: '2026-09-16' })
const b = createLesson({ id: 'lesson-b', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'B', sequence: 2, plannedDate: '2026-09-17' })
const c = createLesson({ id: 'lesson-c', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'C', sequence: 3, plannedDate: '2026-09-18' })
const lessons = { calendarId: calendar.id, lessons: [a, b, c], deliveryStates: [] }

const collisionOverrides = [{ sectionId: section.id, lessonId: b.id, plannedDate: '2026-09-16' as const }]
assert(
  validateSectionScheduleWorkspace({ calendarId: calendar.id, overrides: collisionOverrides }, calendar, planning, units, lessons).some((error) => error.includes('multiple live Lessons')),
  'Same-day live Lessons must remain invalid by default.',
)

const approval = createSameDayLessonApproval({ sectionId: section.id, date: '2026-09-16', lessonIds: [b.id, a.id] })
assert(approval.lessonIds.join(',') === [a.id, b.id].sort().join(','), 'Approval Lesson IDs must normalize deterministically.')
assert(validateSameDayLessonApproval({ approval, calendar, section, lessons: lessons.lessons }).length === 0, 'A valid exact same-day approval must validate.')
assert(sameDayApprovalCovers(approval, section.id, '2026-09-16', [a.id, b.id]), 'Exact Section/date/Lesson set must be covered.')
assert(!sameDayApprovalCovers(approval, section.id, '2026-09-17', [a.id, b.id]), 'Approval must not carry to another date.')
assert(!sameDayApprovalCovers(approval, section.id, '2026-09-16', [a.id, b.id, c.id]), 'Approval for two Lessons must not silently cover a third Lesson.')
assert(
  validateSectionScheduleWorkspace({ calendarId: calendar.id, overrides: collisionOverrides, sameDayApprovals: [approval] }, calendar, planning, units, lessons).length === 0,
  'Exact teacher approval must permit only the approved live collision.',
)

const badDay = createSameDayLessonApproval({ sectionId: section.id, date: '2026-09-22', lessonIds: [a.id, b.id] })
assert(validateSameDayLessonApproval({ approval: badDay, calendar, section, lessons: lessons.lessons }).some((error) => error.includes('confirmed instructional')), 'Approval must reject a no-school date.')

let duplicateIdsRejected = false
try {
  createSameDayLessonApproval({ sectionId: section.id, date: '2026-09-16', lessonIds: [a.id, a.id] })
} catch {
  duplicateIdsRejected = true
}
assert(duplicateIdsRejected, 'Approval must reject duplicate Lesson IDs.')

const moveBToA = createShiftOperation({
  id: 'shift-stack',
  sectionId: section.id,
  changes: [{ lessonId: b.id, fromDate: '2026-09-17', toDate: '2026-09-16' }],
})
assert(
  validateShiftOperation({ operation: moveBToA, section, lessons: lessons.lessons, deliveryStates: [], units: units.units, calendar, overrides: [] }).some((error) => error.includes('Explicit same-day approval')),
  'Shift must refuse an unapproved same-day collision.',
)
assert(
  validateShiftOperation({ operation: moveBToA, section, lessons: lessons.lessons, deliveryStates: [], units: units.units, calendar, overrides: [], sameDayApprovals: [approval] }).length === 0,
  'Shift must accept the exact approved same-day collision.',
)
const applied = applyShiftOperation({ operation: moveBToA, section, lessons: lessons.lessons, deliveryStates: [], units: units.units, calendar, overrides: [], sameDayApprovals: [approval] })
assert(applied.overrides.some((override) => override.lessonId === b.id && override.plannedDate === '2026-09-16'), 'Approved Shift must still produce an explicit Section override.')

const completedState = updateLessonDeliveryState(
  createLessonDeliveryState({ lesson: a, section }),
  a,
  section,
  { status: 'completed', taughtDate: '2026-09-15' },
)
assert(
  validateShiftOperation({ operation: moveBToA, section, lessons: lessons.lessons, deliveryStates: [completedState], units: units.units, calendar, overrides: [] }).length === 0,
  'A completed Lesson must not create future collision pressure in Shift validation.',
)

console.log('same-day Lesson approval contract passed')
