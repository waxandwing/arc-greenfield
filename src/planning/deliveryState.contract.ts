import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLesson } from './lessons'
import { createLessonDeliveryState, updateLessonDeliveryState, validateLessonDeliveryState } from './deliveryState'
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
const p7 = createSection({ id: 'section-p7', courseId: course.id, calendarId: calendar.id, name: 'Period 7' })

const unit = placeUnit(
  createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }),
  calendar,
  { startDate: '2026-09-14', endDate: '2026-09-25' },
)

const lesson = createLesson({
  id: 'lesson-17',
  calendarId: calendar.id,
  courseId: course.id,
  unitId: unit.id,
  title: 'Lesson 17',
  sequence: 17,
  plannedDate: '2026-09-16',
})

const originalLesson = JSON.stringify(lesson)
let p2State = createLessonDeliveryState({ lesson, section: p2 })
let p5State = createLessonDeliveryState({ lesson, section: p5 })
const p7State = createLessonDeliveryState({ lesson, section: p7 })

p2State = updateLessonDeliveryState(p2State, lesson, p2, {
  status: 'completed',
  taughtDate: '2026-09-16',
})

p5State = updateLessonDeliveryState(p5State, lesson, p5, {
  status: 'in-progress',
  taughtDate: '2026-09-16',
  resumeNote: 'Stopped after the demo. Start with guided comparison.',
})

assert(p2State.status === 'completed', 'Period 2 must be able to complete the shared Lesson independently.')
assert(p5State.status === 'in-progress', 'Period 5 must be able to stop partway through the shared Lesson.')
assert(p5State.resumeNote === 'Stopped after the demo. Start with guided comparison.', 'Arc must preserve the resume note for an interrupted Section.')
assert(p7State.status === 'not-started', 'Period 7 must remain untouched when other Sections progress.')
assert(p7State.taughtDate === null, 'An untouched Section must not acquire a teaching date.')
assert(JSON.stringify(lesson) === originalLesson, 'Changing Section delivery state must never mutate the shared Lesson.')

const missingResume = { ...p5State, resumeNote: null }
assert(validateLessonDeliveryState(missingResume, lesson, p5).some((error) => error.includes('resume note')), 'An interrupted Lesson must retain enough information to resume.')

const wrongSectionState = { ...p5State, sectionId: p2.id }
assert(validateLessonDeliveryState(wrongSectionState, lesson, p5).some((error) => error.includes('different Section')), 'Delivery state cannot silently move between Sections.')

console.log('lesson delivery-state contract passed')
