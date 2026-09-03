import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { hasDuplicateRecoveryDestinations, recoveryDestinationDates } from './recoveryResolution'
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
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const interrupted = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const displaced = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 18', sequence: 18, plannedDate: '2026-09-17' })
const occupied = createLesson({ id: 'lesson-19', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 19', sequence: 19, plannedDate: '2026-09-21' })
const fixed = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Test', sequence: 20, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const completed = createLesson({ id: 'lesson-done', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Done', sequence: 21, plannedDate: '2026-09-23' })
const completedState = updateLessonDeliveryState(
  createLessonDeliveryState({ lesson: completed, section }),
  completed,
  section,
  { status: 'completed', taughtDate: '2026-09-15' },
)

const dates = recoveryDestinationDates({
  calendar,
  section,
  lesson: displaced,
  unit,
  resumeDate: '2026-09-17',
  movingLessonIds: [interrupted.id, displaced.id],
  lessons: [interrupted, displaced, occupied, fixed, completed],
  deliveryStates: [completedState],
  overrides: [],
})
assert(!dates.includes('2026-09-18'), 'A fixed occupied date must not be offered as a recovery destination.')
assert(!dates.includes('2026-09-21'), 'A live occupied date must not be offered as a recovery destination.')
assert(!dates.includes('2026-09-22'), 'A no-school date must not be offered as a recovery destination.')
assert(dates.includes('2026-09-23'), 'A date occupied only by completed work may be reused under live-collision rules.')
assert(dates.every((date) => date > '2026-09-17'), 'Recovery destination options must stay after the class resume date.')

assert(
  hasDuplicateRecoveryDestinations(interrupted.id, '2026-09-17', [interrupted.id, displaced.id], { [displaced.id]: '2026-09-17' }),
  'The interrupted Lesson resume date cannot also be selected for displaced work while stacking is disabled.',
)
assert(
  !hasDuplicateRecoveryDestinations(interrupted.id, '2026-09-17', [interrupted.id, displaced.id], { [displaced.id]: '2026-09-23' }),
  'Distinct recovery destinations must pass preflight.',
)

console.log('recovery resolution contract passed')
