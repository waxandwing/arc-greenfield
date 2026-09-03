import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { deserializeLessons } from './lessonPersistence'
import { createLesson } from './lessons'
import { createRecoveryPreview } from './recoveryPreview'
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
const p5 = createSection({ id: 'section-p5', courseId: course.id, calendarId: calendar.id, name: 'Period 5' })
const unit = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })

const lesson17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const lesson18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 18', sequence: 18, plannedDate: '2026-09-17', datePolicy: 'flexible' })
const fridayTest = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Egypt test', sequence: 19, plannedDate: '2026-09-18', datePolicy: 'fixed' })

const interrupted = updateLessonDeliveryState(
  createLessonDeliveryState({ lesson: lesson17, section: p5 }),
  lesson17,
  p5,
  { status: 'in-progress', taughtDate: '2026-09-16', resumeNote: 'Stopped after the demo. Start with guided comparison.' },
)

const before = JSON.stringify([lesson17, lesson18, fridayTest, interrupted])
const preview = createRecoveryPreview({ calendar, section: p5, lesson: lesson17, state: interrupted, lessons: [lesson17, lesson18, fridayTest] })

assert(preview.resumeDate === '2026-09-17', 'Interrupted Period 5 should resume on Thursday, the next confirmed instructional day.')
assert(preview.resumeNote === 'Stopped after the demo. Start with guided comparison.', 'Recovery preview must preserve the exact stop note.')
assert(preview.affectedFlexibleLessons.length === 1 && preview.affectedFlexibleLessons[0]?.lessonId === lesson18.id, 'Thursday flexible Lesson 18 must be surfaced as affected.')
assert(preview.affectedFlexibleLessons[0]?.reason === 'resume-date-collision', 'Lesson 18 must be identified as colliding with the recovery day.')
assert(preview.fixedAnchor?.lessonId === fridayTest.id, 'Friday test must be surfaced as the next fixed anchor.')
assert(preview.fixedAnchor?.plannedDate === '2026-09-18', 'Fixed Friday test date must remain visible and unchanged.')
assert(preview.mutationApplied === false, 'Creating a recovery preview must never mutate the schedule.')
assert(JSON.stringify([lesson17, lesson18, fridayTest, interrupted]) === before, 'Recovery preview must be a pure read of planning state.')

const alreadyShiftedPreview = createRecoveryPreview({
  calendar,
  section: p5,
  lesson: lesson17,
  state: interrupted,
  lessons: [lesson17, lesson18, fridayTest],
  overrides: [{ sectionId: p5.id, lessonId: lesson18.id, plannedDate: '2026-09-21' }],
})
assert(alreadyShiftedPreview.affectedFlexibleLessons.length === 0, 'Recovery preview must use the Section effective schedule instead of re-reporting a shared-date collision already moved for that Section.')
assert(alreadyShiftedPreview.fixedAnchor?.lessonId === fridayTest.id, 'Existing Section overrides must not hide the next fixed anchor.')

const nextUnit = placeUnit(createUnit({ id: 'unit-next', calendarId: calendar.id, courseId: course.id, title: 'Next Unit' }), calendar, { startDate: '2026-09-21', endDate: '2026-09-30' })
const laterSameUnitFixed = createLesson({ id: 'later-fixed', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Later same-unit anchor', sequence: 20, plannedDate: '2026-09-23', datePolicy: 'fixed' })
const earlierCrossUnitFixed = createLesson({ id: 'cross-unit-fixed', calendarId: calendar.id, courseId: course.id, unitId: nextUnit.id, title: 'Next-unit fixed anchor', sequence: 1, plannedDate: '2026-09-22', datePolicy: 'fixed' })
const crossUnitPreview = createRecoveryPreview({ calendar, section: p5, lesson: lesson17, state: interrupted, lessons: [lesson17, lesson18, laterSameUnitFixed, earlierCrossUnitFixed] })
assert(crossUnitPreview.fixedAnchor?.lessonId === earlierCrossUnitFixed.id, 'Recovery must choose the earliest fixed anchor across the Course, even when it belongs to another Unit.')

let fixedWithoutDateRejected = false
try {
  createLesson({ id: 'bad-fixed', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Fixed without a day', sequence: 20, datePolicy: 'fixed' })
} catch {
  fixedWithoutDateRejected = true
}
assert(fixedWithoutDateRejected, 'A fixed Lesson without a real planned date must be rejected.')

const legacyPayload = JSON.stringify({
  schemaVersion: 1,
  input: {
    calendarId: calendar.id,
    lessons: [{
      id: 'legacy-lesson',
      calendarId: calendar.id,
      courseId: course.id,
      unitId: unit.id,
      title: 'Legacy Lesson',
      sequence: 1,
      plannedDate: '2026-09-16',
    }],
    deliveryStates: [],
  },
})
const legacyRestored = deserializeLessons(legacyPayload)
assert(legacyRestored?.lessons[0]?.datePolicy === 'flexible', 'Saved Lessons created before date-policy support must migrate to flexible, never fixed.')

const noResumeCalendar = hydrateSchoolCalendar({
  id: 'short-calendar',
  schoolYearLabel: 'Short',
  firstDay: '2026-09-16',
  lastDay: '2026-09-16',
  instructionalWeekdays: [3],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})
const shortSection = createSection({ id: 'short-section', courseId: course.id, calendarId: noResumeCalendar.id, name: 'Period 5' })
const shortUnit = placeUnit(createUnit({ id: 'short-unit', calendarId: noResumeCalendar.id, courseId: course.id, title: 'One day' }), noResumeCalendar, { startDate: '2026-09-16', endDate: '2026-09-16' })
const shortLesson = createLesson({ id: 'short-lesson', calendarId: noResumeCalendar.id, courseId: course.id, unitId: shortUnit.id, title: 'Last day lesson', sequence: 1, plannedDate: '2026-09-16' })
const shortState = updateLessonDeliveryState(createLessonDeliveryState({ lesson: shortLesson, section: shortSection }), shortLesson, shortSection, { status: 'in-progress', taughtDate: '2026-09-16', resumeNote: 'Stopped halfway.' })
const blocked = createRecoveryPreview({ calendar: noResumeCalendar, section: shortSection, lesson: shortLesson, state: shortState, lessons: [shortLesson] })
assert(blocked.resumeDate === null && Boolean(blocked.blockedReason), 'Recovery must block clearly when no future instructional day exists.')

console.log('recovery preview contract passed')
