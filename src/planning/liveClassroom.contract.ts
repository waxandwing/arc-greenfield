import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { projectDayContinuity } from './dayContinuityProjection'
import { projectLiveClassroomSession } from './liveSessionProjection'
import { applyLiveTeachingOutcome } from './liveTeachingOutcome'
import { createLesson } from './lessons'
import type { LessonWorkspace } from './lessonWorkspace'
import { createUnit, placeUnit } from './units'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-live',
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
const p1 = createSection({ id: 'section-p1', courseId: course.id, calendarId: calendar.id, name: 'Period 1' })
const p5 = createSection({ id: 'section-p5', courseId: course.id, calendarId: calendar.id, name: 'Period 5' })
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [course], sections: [p1, p5] }
const unit = placeUnit(createUnit({ id: 'unit-meso', calendarId: calendar.id, courseId: course.id, title: 'Mesopotamia' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const units: UnitWorkspace = { calendarId: calendar.id, units: [unit] }
const lesson = createLesson({ id: 'lesson-temple', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'White Temple evidence', sequence: 1, plannedDate: '2026-09-17' })
const liveDate = '2026-09-17' as const
const lessons: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson], deliveryStates: [] }
const day = projectDayContinuity({ date: liveDate, planning, units, lessons, overrides: [] })

const p1Session = projectLiveClassroomSession({ day, sectionId: p1.id, lessonId: lesson.id, calendar, liveDate })
assert(p1Session.sectionId === p1.id && p1Session.lessonId === lesson.id, 'Live must bind exact Section + Lesson.')

const stopped = applyLiveTeachingOutcome({ session: p1Session, liveDate, calendar, planning, units, lessons, overrides: [], outcome: { kind: 'stopped', resumeNote: 'Start with comparison slide.' } })
assert(stopped.status === 'in-progress', 'Stop here must write in-progress Section state.')
assert(stopped.resumeNote === 'Start with comparison slide.', 'Stop here must preserve concrete resume note.')
assert(stopped.taughtDate === liveDate, 'Stop here must record actual teaching date.')

let blankStopRejected = false
try {
  applyLiveTeachingOutcome({ session: p1Session, liveDate, calendar, planning, units, lessons, overrides: [], outcome: { kind: 'stopped', resumeNote: '  ' } })
} catch { blankStopRejected = true }
assert(blankStopRejected, 'Stop here without a resume note must fail closed.')

const p5Session = projectLiveClassroomSession({ day, sectionId: p5.id, lessonId: lesson.id, calendar, liveDate })
const skipped = applyLiveTeachingOutcome({ session: p5Session, liveDate, calendar, planning, units, lessons, overrides: [], outcome: { kind: 'skipped' } })
assert(skipped.sectionId === p5.id && skipped.status === 'skipped', 'Skip must affect only the exact Section.')

const p1Workspace: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson], deliveryStates: [stopped] }
const staleDay = projectDayContinuity({ date: liveDate, planning, units, lessons: p1Workspace, overrides: [] })
let staleRejected = false
try {
  const staleCurrent = projectLiveClassroomSession({ day: staleDay, sectionId: p1.id, lessonId: lesson.id, calendar, liveDate })
  applyLiveTeachingOutcome({ session: p1Session, liveDate, calendar, planning, units, lessons: p1Workspace, overrides: [], outcome: { kind: 'completed' } })
  void staleCurrent
} catch { staleRejected = true }
assert(staleRejected, 'An older Live session must refuse to overwrite newer Arc state.')

const nextDate = '2026-09-18' as const
const nextDay = projectDayContinuity({ date: nextDate, planning, units, lessons: p1Workspace, overrides: [] })
const continuation = projectLiveClassroomSession({ day: nextDay, sectionId: p1.id, lessonId: lesson.id, calendar, liveDate: nextDate })
const completed = applyLiveTeachingOutcome({ session: continuation, liveDate: nextDate, calendar, planning, units, lessons: p1Workspace, overrides: [], outcome: { kind: 'completed' } })
assert(completed.status === 'completed' && completed.taughtDate === nextDate, 'Completion must record the exact finishing date.')

const completedWorkspace: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson], deliveryStates: [completed] }
const completedDay = projectDayContinuity({ date: nextDate, planning, units, lessons: completedWorkspace, overrides: [] })
let completedRelaunchRejected = false
try { projectLiveClassroomSession({ day: completedDay, sectionId: p1.id, lessonId: lesson.id, calendar, liveDate: nextDate }) } catch { completedRelaunchRejected = true }
assert(completedRelaunchRejected, 'Completed teaching must remain history, not relaunchable Live work.')

console.log('Live Classroom contract passed')
