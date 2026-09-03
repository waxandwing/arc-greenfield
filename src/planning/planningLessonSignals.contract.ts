import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { projectPlanningLessonSignals } from './planningLessonSignals'
import { projectPlanningRange } from './planningProjection'
import { createUnit, placeUnit } from './units'
import type { LessonWorkspace } from './lessonWorkspace'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-signals',
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
const p2a = createSection({ id: 'section-p2-a', courseId: course.id, calendarId: calendar.id, name: 'Period 2' })
const p2b = createSection({ id: 'section-p2-b', courseId: course.id, calendarId: calendar.id, name: 'Period 2' })
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [course], sections: [p2a, p2b] }
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const units: UnitWorkspace = { calendarId: calendar.id, units: [unit] }
const lesson = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Mortuary architecture', sequence: 17, plannedDate: '2026-09-16' })
let completed = createLessonDeliveryState({ lesson, section: p2a })
completed = updateLessonDeliveryState(completed, lesson, p2a, { status: 'completed', taughtDate: '2026-09-16' })
const lessons: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson], deliveryStates: [completed] }
const range = projectPlanningRange({ dates: ['2026-09-16'], planning, units, lessons, overrides: [] })
const signals = projectPlanningLessonSignals(range, '2026-09-16')
assert(signals.length === 1, 'Shared Lesson placements must aggregate to one Lesson signal.')
assert(signals[0].sections.length === 2, 'Distinct Sections with the same display name must remain distinct by stable ID.')
assert(signals[0].sections[0].sectionId !== signals[0].sections[1].sectionId, 'Section signal identity must never collapse to display name.')
assert(signals[0].sections.some((scope) => scope.sectionId === p2a.id && scope.deliveryStatus === 'completed'), 'Delivery state must remain attached to the correct Section identity.')
assert(signals[0].sections.some((scope) => scope.sectionId === p2b.id && scope.deliveryStatus === 'not-started'), 'Sparse delivery state must remain attached to the other Section identity.')

console.log('planning Lesson signal contract passed')
