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
const nextUnit = placeUnit(createUnit({ id: 'unit-greece', calendarId: calendar.id, courseId: course.id, title: 'Greece' }), calendar, { startDate: '2026-09-28', endDate: '2026-10-09' })

const lesson17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const lesson18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 18', sequence: 18, plannedDate: '2026-09-17' })
const fridayTest = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Egypt test', sequence: 19, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const laterFixed = createLesson({ id: 'lesson-next-fixed', calendarId: calendar.id, courseId: course.id, unitId: nextUnit.id, title: 'Greece checkpoint', sequence: 1, plannedDate: '2026-09-29', datePolicy: 'fixed' })
const completedFuture = createLesson({ id: 'lesson-done', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Already taught', sequence: 20, plannedDate: '2026-09-17' })

const interrupted = updateLessonDeliveryState(
  createLessonDeliveryState({ lesson: lesson17, section: p5 }),
  lesson17,
  p5,
  { status: 'in-progress', taughtDate: '2026-09-16', resumeNote: 'Stopped after the demo. Start with guided comparison.' },
)
const completedState = updateLessonDeliveryState(
  createLessonDeliveryState({ lesson: completedFuture, section: p5 }),
  completedFuture,
  p5,
  { status: 'completed', taughtDate: '2026-09-15' },
)

const lessons = [lesson17, lesson18, fridayTest, laterFixed, completedFuture]
const before = JSON.stringify([lessons, interrupted, completedState])
const preview = createRecoveryPreview({
  calendar,
  section: p5,
  lesson: lesson17,
  state: interrupted,
  lessons,
  deliveryStates: [interrupted, completedState],
})

assert(preview.resumeDate === '2026-09-17', 'Interrupted Period 5 should resume on Thursday, the next confirmed instructional day.')
assert(preview.resumeNote === 'Stopped after the demo. Start with guided comparison.', 'Recovery preview must preserve the exact stop note.')
assert(preview.affectedFlexibleLessons.length === 1 && preview.affectedFlexibleLessons[0]?.lessonId === lesson18.id, 'Only still-live flexible work should be surfaced as affected.')
assert(preview.affectedFlexibleLessons[0]?.effectiveDate === '2026-09-17', 'Recovery consequences must expose the Section effective date, not stale shared-plan wording.')
assert(preview.affectedFlexibleLessons.every((entry) => entry.lessonId !== completedFuture.id), 'Completed Section work must never be proposed for recovery movement.')
assert(preview.fixedAnchor?.lessonId === fridayTest.id && preview.fixedAnchor.effectiveDate === '2026-09-18', 'The earliest fixed anchor must remain the Friday test.')
assert(preview.mutationApplied === false, 'Creating a recovery preview must never mutate the schedule.')
assert(JSON.stringify([lessons, interrupted, completedState]) === before, 'Recovery preview must remain a pure read of planning state.')

const shiftedPreview = createRecoveryPreview({
  calendar,
  section: p5,
  lesson: lesson17,
  state: interrupted,
  lessons: [lesson17, lesson18, laterFixed],
  deliveryStates: [interrupted],
  overrides: [{ sectionId: p5.id, lessonId: lesson18.id, plannedDate: '2026-09-21' }],
})
assert(shiftedPreview.affectedFlexibleLessons[0]?.effectiveDate === '2026-09-21', 'Recovery must read an existing Section-specific date override instead of the shared Lesson date.')
assert(shiftedPreview.fixedAnchor?.lessonId === laterFixed.id, 'Recovery must see a fixed anchor in a later Unit across the same Course.')

let fixedWithoutDateRejected = false
try {
  createLesson({ id: 'bad-fixed', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Fixed without a day', sequence: 21, datePolicy: 'fixed' })
} catch {
  fixedWithoutDateRejected = true
}
assert(fixedWithoutDateRejected, 'A fixed Lesson without a real planned date must be rejected.')

const legacyPayload = JSON.stringify({
  schemaVersion: 1,
  input: {
    calendarId: calendar.id,
    lessons: [{ id: 'legacy-lesson', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Legacy Lesson', sequence: 1, plannedDate: '2026-09-16' }],
    deliveryStates: [],
  },
})
assert(deserializeLessons(legacyPayload)?.lessons[0]?.datePolicy === 'flexible', 'Legacy saved Lessons must migrate to flexible, never fixed.')

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
const blocked = createRecoveryPreview({ calendar: noResumeCalendar, section: shortSection, lesson: shortLesson, state: shortState, lessons: [shortLesson], deliveryStates: [shortState] })
assert(blocked.resumeDate === null && Boolean(blocked.blockedReason), 'Recovery must block clearly when no future instructional day exists.')

console.log('recovery preview contract passed')
