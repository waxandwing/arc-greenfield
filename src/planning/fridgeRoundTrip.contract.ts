import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse } from './courses'
import { createLesson } from './lessons'
import { moveLessonFromFridge, moveLessonToFridge, undoFridgeRoundTrip } from './fridgeRoundTrip'
import type { LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { createUnit, placeUnit } from './units'
import type { UnitWorkspace } from './unitWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-b01-fridge', schoolYearLabel: '2026–27', firstDay: '2026-08-10', lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [],
})
const course = createCourse({ id: 'course-art', title: '2D Art' })
const unit = placeUnit(createUnit({ id: 'unit-one', calendarId: calendar.id, courseId: course.id, title: 'Unit One' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const lesson = createLesson({ id: 'lesson-one', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Contour line', sequence: 1, plannedDate: '2026-09-16', datePolicy: 'flexible' })
const units: UnitWorkspace = { calendarId: calendar.id, units: [unit] }
const lessons: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson], deliveryStates: [] }
const override: SectionLessonDateOverride = { sectionId: 'section-p1', lessonId: lesson.id, plannedDate: '2026-09-17' }

const toFridge = moveLessonToFridge({ calendar, units, lessons, overrides: [override], lessonId: lesson.id })
assert(toFridge.lessons.lessons[0].plannedDate === null, 'Fridge move must remove the shared calendar date.')
assert(toFridge.lessons.lessons[0].datePolicy === 'flexible', 'Fridge move must leave an unscheduled Lesson flexible.')
assert(toFridge.overrides.length === 0, 'Fridge move must clear Section-specific scheduled placements.')
assert(toFridge.undo.lessonId === lesson.id, 'Fridge move must produce an Undo receipt for the moved Lesson.')
assert(lessons.lessons[0].plannedDate === '2026-09-16', 'Fridge move must not mutate the source workspace.')

const restoredCalendar = undoFridgeRoundTrip(toFridge.undo)
assert(restoredCalendar.lessons.lessons[0].plannedDate === '2026-09-16', 'Undo must restore the exact pre-Fridge Lesson date.')
assert(restoredCalendar.overrides.length === 1 && restoredCalendar.overrides[0].plannedDate === '2026-09-17', 'Undo must restore Section-specific placement state.')

const fromFridge = moveLessonFromFridge({ calendar, units, lessons: toFridge.lessons, overrides: toFridge.overrides, lessonId: lesson.id, plannedDate: '2026-09-21' })
assert(fromFridge.lessons.lessons[0].plannedDate === '2026-09-21', 'Scheduling from Fridge must place the Lesson on the requested instructional date.')
assert(fromFridge.overrides.length === 0, 'Scheduling a shared Fridge Lesson must not invent Section overrides.')

const restoredFridge = undoFridgeRoundTrip(fromFridge.undo)
assert(restoredFridge.lessons.lessons[0].plannedDate === null, 'Undo after scheduling from Fridge must return the Lesson to unscheduled state.')
assert(restoredFridge.overrides.length === 0, 'Undo after scheduling from Fridge must preserve the prior override state exactly.')

let rejectedWeekend = false
try { moveLessonFromFridge({ calendar, units, lessons: toFridge.lessons, overrides: [], lessonId: lesson.id, plannedDate: '2026-09-19' }) } catch { rejectedWeekend = true }
assert(rejectedWeekend, 'Fridge scheduling must reject a non-instructional weekend date.')

console.log('B01 Fridge round-trip contract passed')
