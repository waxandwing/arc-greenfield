import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { projectDayContinuity } from './dayContinuityProjection'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { easelLaunchOptions, projectEaselSession } from './easelSessionProjection'
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
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [course], sections: [p2, p5] }

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
const loose = createLesson({
  id: 'lesson-loose',
  calendarId: calendar.id,
  courseId: course.id,
  unitId: unit.id,
  title: 'Loose continuation',
  sequence: 16,
  plannedDate: null,
})

let p2Interrupted = createLessonDeliveryState({ lesson: lesson17, section: p2 })
p2Interrupted = updateLessonDeliveryState(p2Interrupted, lesson17, p2, {
  status: 'in-progress',
  taughtDate: '2026-09-16',
  resumeNote: 'Period 2 stopped at the comparison.',
})
let p5Interrupted = createLessonDeliveryState({ lesson: lesson17, section: p5 })
p5Interrupted = updateLessonDeliveryState(p5Interrupted, lesson17, p5, {
  status: 'in-progress',
  taughtDate: '2026-09-16',
  resumeNote: 'Stopped after demo.',
})
let p5Loose = createLessonDeliveryState({ lesson: loose, section: p5 })
p5Loose = updateLessonDeliveryState(p5Loose, loose, p5, {
  status: 'in-progress',
  taughtDate: '2026-09-15',
  resumeNote: 'Finish the comparison.',
})

const lessons: LessonWorkspace = {
  calendarId: calendar.id,
  lessons: [lesson17, lesson18, loose],
  deliveryStates: [p2Interrupted, p5Interrupted, p5Loose],
}
const liveDate = '2026-09-17' as const

const unresolvedDay = projectDayContinuity({ date: liveDate, planning, units, lessons, overrides: [] })
const unresolvedOptions = easelLaunchOptions({ day: unresolvedDay, sectionId: p5.id, calendar, liveDate })
assert(unresolvedOptions.length === 3, 'Easel must expose every valid P5 teaching candidate without silently choosing between carryover and today’s plan.')
assert(unresolvedOptions.some((option) => option.lessonId === loose.id && option.source === 'carryover'), 'Unscheduled unfinished teaching should remain a carryover launch candidate without relying on presentation order.')
assert(unresolvedOptions.some((option) => option.lessonId === lesson17.id && option.source === 'carryover'), 'Interrupted Lesson 17 must remain an explicit carryover candidate before Shift.')
assert(unresolvedOptions.some((option) => option.lessonId === lesson18.id && option.source === 'scheduled'), 'Today’s planned Lesson 18 must remain a separate scheduled candidate.')

const interruptedSession = projectEaselSession({ day: unresolvedDay, sectionId: p5.id, lessonId: lesson17.id, calendar, liveDate })
assert(interruptedSession.courseId === course.id && interruptedSession.sectionId === p5.id, 'Easel must preserve exact Course and Section identity from Arc Day.')
assert(interruptedSession.lessonId === lesson17.id && interruptedSession.unitId === unit.id, 'Easel must preserve exact shared Lesson and Unit identity.')
assert(interruptedSession.source === 'carryover', 'Unresolved interrupted work must enter Easel as carryover, not be rewritten as today’s schedule.')
assert(interruptedSession.resumeNote === 'Stopped after demo.' && interruptedSession.deliveryStatus === 'in-progress', 'Easel must receive the exact P5 stopping point.')
assert(interruptedSession.effectiveDate === '2026-09-16', 'Easel must preserve the current effective schedule date before recovery Shift.')

const p2SameLesson = projectEaselSession({ day: unresolvedDay, sectionId: p2.id, lessonId: lesson17.id, calendar, liveDate })
assert(p2SameLesson.lessonId === interruptedSession.lessonId, 'Two Sections may launch the same shared Lesson identity.')
assert(p2SameLesson.sectionId === p2.id && interruptedSession.sectionId === p5.id, 'Easel must keep the selected Section identity even when both Sections share the same Lesson.')
assert(p2SameLesson.resumeNote === 'Period 2 stopped at the comparison.', 'Easel must read the selected Section’s delivery state rather than another Section’s state.')

const looseSession = projectEaselSession({ day: unresolvedDay, sectionId: p5.id, lessonId: loose.id, calendar, liveDate })
assert(looseSession.effectiveDate === null && looseSession.source === 'carryover', 'Easel must preserve genuinely unscheduled in-progress teaching without inventing a date.')

const overrides: SectionLessonDateOverride[] = [
  { sectionId: p5.id, lessonId: lesson17.id, plannedDate: liveDate },
  { sectionId: p5.id, lessonId: lesson18.id, plannedDate: '2026-09-21' },
]
const resolvedDay = projectDayContinuity({ date: liveDate, planning, units, lessons, overrides })
const resolvedOptions = easelLaunchOptions({ day: resolvedDay, sectionId: p5.id, calendar, liveDate })
assert(resolvedOptions.filter((option) => option.lessonId === lesson17.id).length === 1, 'After Shift, Easel must expose Lesson 17 exactly once.')
assert(resolvedOptions.find((option) => option.lessonId === lesson17.id)?.source === 'scheduled', 'After Shift, the continuing Lesson must enter Easel from today’s effective schedule.')
assert(!resolvedOptions.some((option) => option.lessonId === lesson18.id), 'A displaced P5 Lesson must not remain a launch candidate for the old date.')

const resolvedSession = projectEaselSession({ day: resolvedDay, sectionId: p5.id, lessonId: lesson17.id, calendar, liveDate })
assert(resolvedSession.isSectionOverride && resolvedSession.effectiveDate === liveDate, 'Easel must preserve the exact Section-specific Shift result.')
assert(resolvedSession.resumeNote === 'Stopped after demo.', 'Shift must not erase the teaching stopping point passed into Easel.')

let missingLessonRejected = false
try {
  projectEaselSession({ day: unresolvedDay, sectionId: p5.id, lessonId: 'not-a-real-lesson', calendar, liveDate })
} catch {
  missingLessonRejected = true
}
assert(missingLessonRejected, 'Easel must fail closed rather than opening a Lesson outside the selected Section Day continuity.')

let missingSectionRejected = false
try {
  easelLaunchOptions({ day: unresolvedDay, sectionId: 'not-a-real-section', calendar, liveDate })
} catch {
  missingSectionRejected = true
}
assert(missingSectionRejected, 'Easel must fail closed for a Section outside the selected Day.')

const futureDay = projectDayContinuity({ date: '2026-09-18', planning, units, lessons, overrides: [] })
let futureLaunchRejected = false
try {
  easelLaunchOptions({ day: futureDay, sectionId: p5.id, calendar, liveDate })
} catch {
  futureLaunchRejected = true
}
assert(futureLaunchRejected, 'Navigating Arc to a future Day must not turn future planning into a live Easel teaching session.')

const weekendDay = projectDayContinuity({ date: '2026-09-19', planning, units, lessons, overrides: [] })
let noSchoolLaunchRejected = false
try {
  projectEaselSession({ day: weekendDay, sectionId: p5.id, lessonId: lesson17.id, calendar, liveDate: '2026-09-19' })
} catch {
  noSchoolLaunchRejected = true
}
assert(noSchoolLaunchRejected, 'Visible no-school Day continuity must not become permission to launch live teaching.')

assert(lessons.deliveryStates.find((state) => state.sectionId === p5.id && state.lessonId === lesson17.id)?.resumeNote === 'Stopped after demo.', 'Projecting an Easel session must not mutate Arc delivery state.')
assert(lesson17.plannedDate === '2026-09-16', 'Projecting an Easel session must not mutate shared Lesson planning truth.')

console.log('Arc to Easel session projection contract passed')
