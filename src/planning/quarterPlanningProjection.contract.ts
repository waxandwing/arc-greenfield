import { hydrateSchoolCalendar } from '../calendar/hydration'
import { projectQuarter } from '../calendar/projections'
import { createCourse, createSection } from './courses'
import { createLesson } from './lessons'
import { projectQuarterPlanning } from './quarterPlanningProjection'
import { createUnit, placeUnit } from './units'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-quarter',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [{ date: '2026-09-07', kind: 'holiday', label: 'Labor Day', source: 'manual', confidence: 'confirmed' }],
  quarters: [{ id: 'q1', label: 'Quarter 1', startDate: '2026-08-10', endDate: '2026-10-09' }],
  semesters: [],
})
const quarter = projectQuarter(calendar, '2026-09-16')!
assert(quarter.id === 'q1', 'Quarter test fixture must resolve the configured quarter.')

const apah = createCourse({ id: 'course-apah', title: 'AP Art History' })
const art2d = createCourse({ id: 'course-2d', title: '2D Art 1' })
const p2 = createSection({ id: 'section-p2', courseId: apah.id, calendarId: calendar.id, name: 'Period 2' })
const p5 = createSection({ id: 'section-p5', courseId: apah.id, calendarId: calendar.id, name: 'Period 5' })
const p3 = createSection({ id: 'section-p3', courseId: art2d.id, calendarId: calendar.id, name: 'Period 3' })
const planning = { calendarId: calendar.id, courses: [apah, art2d], sections: [p2, p5, p3] }

const prehistory = placeUnit(createUnit({ id: 'unit-prehistory', calendarId: calendar.id, courseId: apah.id, title: 'Prehistory' }), calendar, { startDate: '2026-08-10', endDate: '2026-09-04' })
const egypt = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: apah.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-10-02' })
const greece = placeUnit(createUnit({ id: 'unit-greece', calendarId: calendar.id, courseId: apah.id, title: 'Greece' }), calendar, { startDate: '2026-09-28', endDate: '2026-10-16' })
const line = placeUnit(createUnit({ id: 'unit-line', calendarId: calendar.id, courseId: art2d.id, title: 'Line' }), calendar, { startDate: '2026-08-24', endDate: '2026-09-18' })
const units = { calendarId: calendar.id, units: [prehistory, egypt, greece, line] }

const lesson17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: apah.id, unitId: egypt.id, title: 'Mortuary architecture', sequence: 17, plannedDate: '2026-09-16' })
const test = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: apah.id, unitId: egypt.id, title: 'Egypt test', sequence: 18, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const contour = createLesson({ id: 'lesson-contour', calendarId: calendar.id, courseId: art2d.id, unitId: line.id, title: 'Contour drawing', sequence: 1, plannedDate: '2026-09-16' })
const lessons = { calendarId: calendar.id, lessons: [lesson17, test, contour], deliveryStates: [] }
const overrides = [{ sectionId: p5.id, lessonId: lesson17.id, plannedDate: '2026-09-17' }]

const projection = projectQuarterPlanning({ quarter, planning, units, lessons, overrides })
assert(projection.dates[0] === quarter.startDate && projection.dates.at(-1) === quarter.endDate, 'Quarter planning must use the exact configured quarter date span.')
assert(projection.courses.length === 2, 'Quarter planning must preserve separate Courses.')

const apahQuarter = projection.courses.find((course) => course.courseId === apah.id)!
assert(apahQuarter.unitTracks.length === 3, 'Quarter must retain all visible AP Art History Units, including overlaps.')
const greeceTrack = apahQuarter.unitTracks.find((unit) => unit.unitId === greece.id)!
assert(greeceTrack.continuesAfter, 'Unit extending beyond the quarter must remain one stable Unit and expose continuation.')
assert(greeceTrack.endIndex === projection.dates.length - 1, 'Quarter visual geometry must clip a continuing Unit at the quarter boundary.')
const egyptTrack = apahQuarter.unitTracks.find((unit) => unit.unitId === egypt.id)!
assert(egyptTrack.startIndex < egyptTrack.endIndex, 'Quarter Unit track must preserve visible trajectory rather than collapse to a marker.')

assert(apahQuarter.fixedMilestones.length === 1, 'Quarter should surface fixed anchors without turning every Lesson into a milestone.')
assert(apahQuarter.fixedMilestones[0].lessonId === test.id && apahQuarter.fixedMilestones[0].sections.length === 2, 'Fixed milestone must preserve shared Lesson identity and exact Section scope.')
assert(apahQuarter.shiftedPlacementCount === 1, 'Quarter should summarize real Section-specific schedule divergence without cloning Section rows.')
const artQuarter = projection.courses.find((course) => course.courseId === art2d.id)!
assert(artQuarter.shiftedPlacementCount === 0 && artQuarter.fixedMilestones.length === 0, 'Unshifted Course must not inherit another Course’s pressure or anchors.')

const classesOnly = projectQuarterPlanning({ quarter, planning, units: null, lessons: null, overrides: [] })
assert(classesOnly.courses.every((course) => course.unitTracks.length === 0 && course.fixedMilestones.length === 0 && course.shiftedPlacementCount === 0), 'Classes-only Quarter must not fabricate planning objects.')

console.log('quarter planning projection contract passed')
