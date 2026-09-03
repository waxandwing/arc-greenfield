import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { projectPlanningLessonSignals } from './planningLessonSignals'
import { projectPlanningRange } from './planningProjection'
import { createUnit, placeUnit } from './units'

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
const p2 = createSection({ id: 'section-p2', courseId: course.id, calendarId: calendar.id, name: 'Period 2' })
const p5 = createSection({ id: 'section-p5', courseId: course.id, calendarId: calendar.id, name: 'Period 2' })
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const lesson = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Mortuary architecture', sequence: 17, plannedDate: '2026-09-16' })
let p2Done = createLessonDeliveryState({ lesson, section: p2 })
p2Done = updateLessonDeliveryState(p2Done, lesson, p2, { status: 'completed', taughtDate: '2026-09-15' })
const range = projectPlanningRange({
  dates: ['2026-09-16', '2026-09-17'],
  planning: { calendarId: calendar.id, courses: [course], sections: [p2, p5] },
  units: { calendarId: calendar.id, units: [unit] },
  lessons: { calendarId: calendar.id, lessons: [lesson], deliveryStates: [p2Done] },
  overrides: [{ sectionId: p5.id, lessonId: lesson.id, plannedDate: '2026-09-17' }],
})

const shared = projectPlanningLessonSignals(range, '2026-09-16')
assert(shared.length === 1 && shared[0].sections.length === 1, 'Shared date must contain only the Section still on the shared Lesson date.')
assert(shared[0].sections[0].sectionId === p2.id && shared[0].sections[0].deliveryStatus === 'completed', 'Section identity and delivery status must stay attached.')
const shifted = projectPlanningLessonSignals(range, '2026-09-17')
assert(shifted.length === 1 && shifted[0].sections[0].sectionId === p5.id && shifted[0].sections[0].isSectionOverride, 'Shift ownership must stay attached to the shifted Section.')
assert(shared[0].sections[0].sectionName === shifted[0].sections[0].sectionName, 'Distinct Sections may share a display name without collapsing identity.')

let outsideRangeRejected = false
try {
  projectPlanningLessonSignals(range, '2026-09-18')
} catch {
  outsideRangeRejected = true
}
assert(outsideRangeRejected, 'Lesson signal projection must reject dates outside the canonical visible range.')

console.log('planning Lesson signal contract passed')
