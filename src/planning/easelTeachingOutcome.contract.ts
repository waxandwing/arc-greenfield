import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { projectDayContinuity } from './dayContinuityProjection'
import { projectEaselSession } from './easelSessionProjection'
import { applyEaselTeachingOutcome } from './easelTeachingOutcome'
import { createLesson } from './lessons'
import type { LessonWorkspace } from './lessonWorkspace'
import { createUnit, placeUnit } from './units'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-easel-outcome',
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
const course = createCourse({ id: 'course-2d', title: '2D Art 1' })
const p1 = createSection({ id: 'section-p1', courseId: course.id, calendarId: calendar.id, name: 'Period 1' })
const p4 = createSection({ id: 'section-p4', courseId: course.id, calendarId: calendar.id, name: 'Period 4' })
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [course], sections: [p1, p4] }
const unit = placeUnit(
  createUnit({ id: 'unit-collage', calendarId: calendar.id, courseId: course.id, title: 'Collage' }),
  calendar,
  { startDate: '2026-09-14', endDate: '2026-09-25' },
)
const units: UnitWorkspace = { calendarId: calendar.id, units: [unit] }
const lesson = createLesson({
  id: 'lesson-box-collage',
  calendarId: calendar.id,
  courseId: course.id,
  unitId: unit.id,
  title: 'Storage box collage',
  sequence: 1,
  plannedDate: '2026-09-17',
})

const liveDate = '2026-09-17' as const
const freshLessons: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson], deliveryStates: [] }
const freshDay = projectDayContinuity({ date: liveDate, planning, units, lessons: freshLessons, overrides: [] })
const freshSession = projectEaselSession({ day: freshDay, sectionId: p1.id, lessonId: lesson.id, calendar, liveDate })

const stopped = applyEaselTeachingOutcome({
  session: freshSession,
  liveDate,
  calendar,
  planning,
  units,
  lessons: freshLessons,
  overrides: [],
  outcome: { kind: 'stopped', resumeNote: '  Add Sharpie details after the collage dries.  ' },
})
assert(stopped.status === 'in-progress', 'Stopping in Easel must become ordinary Arc in-progress Section delivery state.')
assert(stopped.taughtDate === liveDate, 'Stopping in Easel must record the exact live teaching date.')
assert(stopped.resumeNote === 'Add Sharpie details after the collage dries.', 'Easel must use Arc’s existing resume-note normalization.')
assert(lesson.plannedDate === liveDate, 'Easel outcomes must not mutate shared Lesson planning truth.')

const nextDate = '2026-09-18' as const
const stoppedWorkspace: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson], deliveryStates: [stopped] }
const stoppedDay = projectDayContinuity({ date: nextDate, planning, units, lessons: stoppedWorkspace, overrides: [] })
const continuation = projectEaselSession({ day: stoppedDay, sectionId: p1.id, lessonId: lesson.id, calendar, liveDate: nextDate })
const completed = applyEaselTeachingOutcome({
  session: continuation,
  liveDate: nextDate,
  calendar,
  planning,
  units,
  lessons: stoppedWorkspace,
  overrides: [],
  outcome: { kind: 'completed' },
})
assert(completed.status === 'completed', 'Completing an in-progress Easel session must become ordinary completed Arc delivery state.')
assert(completed.taughtDate === nextDate, 'Completion must record the day the class actually finished.')
assert(completed.resumeNote === null, 'Completion must clear the stopping point through Arc’s existing delivery-state rules.')

const p4Day = projectDayContinuity({ date: liveDate, planning, units, lessons: freshLessons, overrides: [] })
const p4Session = projectEaselSession({ day: p4Day, sectionId: p4.id, lessonId: lesson.id, calendar, liveDate })
const skipped = applyEaselTeachingOutcome({
  session: p4Session,
  liveDate,
  calendar,
  planning,
  units,
  lessons: freshLessons,
  overrides: [],
  outcome: { kind: 'skipped' },
})
assert(skipped.status === 'skipped' && skipped.taughtDate === null && skipped.resumeNote === null, 'Skipping not-started work must preserve Arc’s existing skipped-state semantics.')

let blankStopRejected = false
try {
  applyEaselTeachingOutcome({ session: freshSession, liveDate, calendar, planning, units, lessons: freshLessons, overrides: [], outcome: { kind: 'stopped', resumeNote: '   ' } })
} catch {
  blankStopRejected = true
}
assert(blankStopRejected, 'Easel must not create an in-progress state without a concrete stopping point.')

let staleSessionRejected = false
try {
  applyEaselTeachingOutcome({ session: freshSession, liveDate, calendar, planning, units, lessons: stoppedWorkspace, overrides: [], outcome: { kind: 'completed' } })
} catch {
  staleSessionRejected = true
}
assert(staleSessionRejected, 'An Easel session opened against older Arc state must refuse to overwrite newer teaching state.')

let startedSkipRejected = false
try {
  applyEaselTeachingOutcome({ session: continuation, liveDate: nextDate, calendar, planning, units, lessons: stoppedWorkspace, overrides: [], outcome: { kind: 'skipped' } })
} catch {
  startedSkipRejected = true
}
assert(startedSkipRejected, 'Teaching that already began cannot be relabeled skipped from Easel.')

const completedWorkspace: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson], deliveryStates: [completed] }
const completedDay = projectDayContinuity({ date: liveDate, planning, units, lessons: completedWorkspace, overrides: [] })
let terminalLaunchRejected = false
try {
  projectEaselSession({ day: completedDay, sectionId: p1.id, lessonId: lesson.id, calendar, liveDate })
} catch {
  terminalLaunchRejected = true
}
assert(terminalLaunchRejected, 'Completed teaching history must remain visible in Arc without becoming a reopenable Easel live session.')

let terminalReplayRejected = false
try {
  applyEaselTeachingOutcome({ session: continuation, liveDate: nextDate, calendar, planning, units, lessons: completedWorkspace, overrides: [], outcome: { kind: 'completed' } })
} catch {
  terminalReplayRejected = true
}
assert(terminalReplayRejected, 'An older Easel session must not replay over completed teaching history.')

assert(freshLessons.deliveryStates.length === 0, 'Easel outcome projection must not mutate the source workspace in place.')
assert(stoppedWorkspace.deliveryStates[0].resumeNote === 'Add Sharpie details after the collage dries.', 'Applying a later outcome must not mutate an earlier Arc delivery-state object.')

console.log('Easel teaching outcome contract passed')
