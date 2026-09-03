import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import { projectDayContinuity } from './dayContinuityProjection'
import { createLesson } from './lessons'
import type { LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { createUnit, placeUnit } from './units'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'

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
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [course], sections: [p2, p5, p7] }

const unit = placeUnit(
  createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }),
  calendar,
  { startDate: '2026-09-14', endDate: '2026-09-25' },
)
const units: UnitWorkspace = { calendarId: calendar.id, units: [unit] }

const lesson17 = createLesson({
  id: 'lesson-17',
  calendarId: calendar.id,
  courseId: course.id,
  unitId: unit.id,
  title: 'Lesson 17',
  sequence: 17,
  plannedDate: '2026-09-16',
})
const lesson18 = createLesson({
  id: 'lesson-18',
  calendarId: calendar.id,
  courseId: course.id,
  unitId: unit.id,
  title: 'Lesson 18',
  sequence: 18,
  plannedDate: '2026-09-17',
})
const looseInProgress = createLesson({
  id: 'lesson-unscheduled',
  calendarId: calendar.id,
  courseId: course.id,
  unitId: unit.id,
  title: 'Unscheduled studio continuation',
  sequence: 16,
  plannedDate: null,
})

let p2Completed = createLessonDeliveryState({ lesson: lesson17, section: p2 })
p2Completed = updateLessonDeliveryState(p2Completed, lesson17, p2, { status: 'completed', taughtDate: '2026-09-16' })
let p5InProgress = createLessonDeliveryState({ lesson: lesson17, section: p5 })
p5InProgress = updateLessonDeliveryState(p5InProgress, lesson17, p5, {
  status: 'in-progress',
  taughtDate: '2026-09-16',
  resumeNote: 'Stopped after demo.',
})
let p7Skipped = createLessonDeliveryState({ lesson: lesson17, section: p7 })
p7Skipped = updateLessonDeliveryState(p7Skipped, lesson17, p7, { status: 'skipped' })
let p5Loose = createLessonDeliveryState({ lesson: looseInProgress, section: p5 })
p5Loose = updateLessonDeliveryState(p5Loose, looseInProgress, p5, {
  status: 'in-progress',
  taughtDate: '2026-09-15',
  resumeNote: 'Still needs the final comparison.',
})

const deliveryStates: LessonDeliveryState[] = [p2Completed, p5InProgress, p7Skipped, p5Loose]
const lessons: LessonWorkspace = {
  calendarId: calendar.id,
  lessons: [lesson17, lesson18, looseInProgress],
  deliveryStates,
}

const unresolved = projectDayContinuity({ date: '2026-09-17', planning, units, lessons, overrides: [] })
const unresolvedP5 = unresolved.courses[0].sections.find((section) => section.sectionId === p5.id)!
assert(unresolved.courses[0].activeUnits.some((active) => active.unitId === unit.id), 'Day must preserve active Unit context.')
assert(unresolvedP5.scheduledLessons.some((lesson) => lesson.lessonId === lesson18.id), 'Day must show the Lesson actually scheduled for P5 today.')
assert(unresolvedP5.carryovers.some((lesson) => lesson.lessonId === lesson17.id && lesson.resumeNote === 'Stopped after demo.'), 'Day must surface unresolved in-progress work from an earlier teaching day.')
assert(unresolvedP5.carryovers.some((lesson) => lesson.lessonId === looseInProgress.id && lesson.effectiveDate === null), 'Day must preserve genuinely unscheduled in-progress work instead of dropping it.')

const resolvedOverrides: SectionLessonDateOverride[] = [
  { sectionId: p5.id, lessonId: lesson17.id, plannedDate: '2026-09-17' },
  { sectionId: p5.id, lessonId: lesson18.id, plannedDate: '2026-09-21' },
]
const resolved = projectDayContinuity({ date: '2026-09-17', planning, units, lessons, overrides: resolvedOverrides })
const resolvedP5 = resolved.courses[0].sections.find((section) => section.sectionId === p5.id)!
assert(resolvedP5.scheduledLessons.some((lesson) => lesson.lessonId === lesson17.id && lesson.deliveryStatus === 'in-progress'), 'After Shift, Day must show the continuing Lesson in today’s effective schedule.')
assert(!resolvedP5.carryovers.some((lesson) => lesson.lessonId === lesson17.id), 'A Lesson already scheduled today must not also appear as duplicate carryover.')
assert(!resolvedP5.scheduledLessons.some((lesson) => lesson.lessonId === lesson18.id), 'A displaced Lesson must leave today when its Section-specific effective date moves.')

const p2Today = unresolved.courses[0].sections.find((section) => section.sectionId === p2.id)!
const p7Today = unresolved.courses[0].sections.find((section) => section.sectionId === p7.id)!
assert(!p2Today.carryovers.some((lesson) => lesson.lessonId === lesson17.id), 'Completed work must never surface as unfinished Day continuity.')
assert(!p7Today.carryovers.some((lesson) => lesson.lessonId === lesson17.id), 'Skipped work must never surface as unfinished Day continuity.')

const beforeInterruption = projectDayContinuity({ date: '2026-09-15', planning, units, lessons, overrides: [] })
const beforeP5 = beforeInterruption.courses[0].sections.find((section) => section.sectionId === p5.id)!
assert(!beforeP5.carryovers.some((lesson) => lesson.lessonId === lesson17.id), 'Day must not surface an in-progress record before its actual taught/interruption date.')

console.log('day teaching continuity projection contract passed')
