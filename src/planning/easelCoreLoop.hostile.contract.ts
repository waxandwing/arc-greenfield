import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { projectDayContinuity } from './dayContinuityProjection'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { projectEaselSession } from './easelSessionProjection'
import { applyEaselTeachingOutcome } from './easelTeachingOutcome'
import { createLesson } from './lessons'
import type { LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { createUnit, placeUnit } from './units'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function rejects(action: () => unknown, message: string): void {
  let rejected = false
  try {
    action()
  } catch {
    rejected = true
  }
  assert(rejected, message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-core-loop-hostile',
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
const course = createCourse({ id: 'course-apah-hostile', title: 'AP Art History' })
const p2 = createSection({ id: 'section-p2-hostile', courseId: course.id, calendarId: calendar.id, name: 'Period 2' })
const p5 = createSection({ id: 'section-p5-hostile', courseId: course.id, calendarId: calendar.id, name: 'Period 2' })
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [course], sections: [p2, p5] }
const unit = placeUnit(
  createUnit({ id: 'unit-hostile', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }),
  calendar,
  { startDate: '2026-09-14', endDate: '2026-09-25' },
)
const units: UnitWorkspace = { calendarId: calendar.id, units: [unit] }
const lesson17 = createLesson({
  id: 'lesson-17-hostile',
  calendarId: calendar.id,
  courseId: course.id,
  unitId: unit.id,
  title: 'Lesson 17',
  sequence: 17,
  plannedDate: '2026-09-17',
})
const lesson18 = createLesson({
  id: 'lesson-18-hostile',
  calendarId: calendar.id,
  courseId: course.id,
  unitId: unit.id,
  title: 'Lesson 18',
  sequence: 18,
  plannedDate: '2026-09-18',
})
const liveDate = '2026-09-17' as const
const freshLessons: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson17, lesson18], deliveryStates: [] }
const freshDay = projectDayContinuity({ date: liveDate, planning, units, lessons: freshLessons, overrides: [] })
const p5Session = projectEaselSession({ day: freshDay, sectionId: p5.id, lessonId: lesson17.id, calendar, liveDate })

// Same display name is never identity. The exact Section ID remains binding.
const p2Session = projectEaselSession({ day: freshDay, sectionId: p2.id, lessonId: lesson17.id, calendar, liveDate })
assert(p2Session.sectionName === p5Session.sectionName, 'Hostile fixture requires duplicate Section display names.')
assert(p2Session.sectionId !== p5Session.sectionId, 'Duplicate display names must remain distinct Section identities.')

// A Shift after launch invalidates the old session even when delivery state is unchanged.
const movedOverrides: SectionLessonDateOverride[] = [
  { sectionId: p5.id, lessonId: lesson17.id, plannedDate: '2026-09-18' },
]
rejects(
  () => applyEaselTeachingOutcome({
    session: p5Session,
    liveDate,
    calendar,
    planning,
    units,
    lessons: freshLessons,
    overrides: movedOverrides,
    outcome: { kind: 'completed' },
  }),
  'An Easel session opened before a Section Shift must not write against the stale schedule.',
)

// An unrelated Section Shift must not make P5 sticky when P5 itself is unchanged.
const unrelatedOverrides: SectionLessonDateOverride[] = [
  { sectionId: p2.id, lessonId: lesson18.id, plannedDate: '2026-09-21' },
]
const afterUnrelatedChange = applyEaselTeachingOutcome({
  session: p5Session,
  liveDate,
  calendar,
  planning,
  units,
  lessons: freshLessons,
  overrides: unrelatedOverrides,
  outcome: { kind: 'completed' },
})
assert(afterUnrelatedChange.status === 'completed' && afterUnrelatedChange.sectionId === p5.id, 'Unrelated Section schedule changes must not invalidate the selected Section session.')

// Harmless copy changes should not invalidate structural continuity.
const renamedLesson17 = createLesson({
  ...lesson17,
  title: 'Lesson 17 — revised title only',
})
const renamedLessons: LessonWorkspace = { calendarId: calendar.id, lessons: [renamedLesson17, lesson18], deliveryStates: [] }
const afterRename = applyEaselTeachingOutcome({
  session: p5Session,
  liveDate,
  calendar,
  planning,
  units,
  lessons: renamedLessons,
  overrides: [],
  outcome: { kind: 'completed' },
})
assert(afterRename.status === 'completed', 'A title-only edit must not make a valid live session unnecessarily sticky.')

// Structural Lesson changes do invalidate the old session.
const fixedLesson17 = createLesson({
  ...lesson17,
  datePolicy: 'fixed',
})
const fixedLessons: LessonWorkspace = { calendarId: calendar.id, lessons: [fixedLesson17, lesson18], deliveryStates: [] }
rejects(
  () => applyEaselTeachingOutcome({ session: p5Session, liveDate, calendar, planning, units, lessons: fixedLessons, overrides: [], outcome: { kind: 'completed' } }),
  'Changing fixed/flexible policy after launch must invalidate the old live session.',
)

// Carryover becoming scheduled is a meaningful context change and must require reopen.
const carryoverLesson = createLesson({
  id: 'lesson-carryover-hostile',
  calendarId: calendar.id,
  courseId: course.id,
  unitId: unit.id,
  title: 'Carryover lesson',
  sequence: 16,
  plannedDate: '2026-09-16',
})
let carryoverState = createLessonDeliveryState({ lesson: carryoverLesson, section: p5 })
carryoverState = updateLessonDeliveryState(carryoverState, carryoverLesson, p5, {
  status: 'in-progress',
  taughtDate: '2026-09-16',
  resumeNote: 'Stopped halfway through the comparison.',
})
const carryoverWorkspace: LessonWorkspace = {
  calendarId: calendar.id,
  lessons: [carryoverLesson, lesson17, lesson18],
  deliveryStates: [carryoverState],
}
const carryoverDay = projectDayContinuity({ date: liveDate, planning, units, lessons: carryoverWorkspace, overrides: [] })
const carryoverSession = projectEaselSession({ day: carryoverDay, sectionId: p5.id, lessonId: carryoverLesson.id, calendar, liveDate })
assert(carryoverSession.source === 'carryover', 'Hostile fixture requires unresolved carryover before Shift.')
const carryoverNowScheduled: SectionLessonDateOverride[] = [
  { sectionId: p5.id, lessonId: carryoverLesson.id, plannedDate: liveDate },
]
rejects(
  () => applyEaselTeachingOutcome({ session: carryoverSession, liveDate, calendar, planning, units, lessons: carryoverWorkspace, overrides: carryoverNowScheduled, outcome: { kind: 'completed' } }),
  'A carryover that became today’s scheduled work after launch must require reopening Easel.',
)

// Duplicate submission cannot replay an old session over the first result.
const stopped = applyEaselTeachingOutcome({
  session: p5Session,
  liveDate,
  calendar,
  planning,
  units,
  lessons: freshLessons,
  overrides: [],
  outcome: { kind: 'stopped', resumeNote: 'Stopped after the demo.' },
})
const afterStopWorkspace: LessonWorkspace = { calendarId: calendar.id, lessons: [lesson17, lesson18], deliveryStates: [stopped] }
rejects(
  () => applyEaselTeachingOutcome({ session: p5Session, liveDate, calendar, planning, units, lessons: afterStopWorkspace, overrides: [], outcome: { kind: 'completed' } }),
  'Replaying an already-consumed Easel session must not overwrite the first teaching outcome.',
)

// Wrong workspace/calendar ownership fails closed.
const foreignPlanning: PlanningWorkspace = { ...planning, calendarId: 'other-calendar' }
rejects(
  () => applyEaselTeachingOutcome({ session: p5Session, liveDate, calendar, planning: foreignPlanning, units, lessons: freshLessons, overrides: [], outcome: { kind: 'completed' } }),
  'Easel must fail closed when canonical workspace ownership no longer matches the loaded calendar.',
)

// The domain adapter must remain pure with respect to schedule and shared curriculum.
assert(movedOverrides[0].plannedDate === '2026-09-18', 'Rejected Easel outcomes must not mutate Section Shift overrides.')
assert(lesson17.plannedDate === liveDate && lesson17.datePolicy === 'flexible', 'Easel outcomes must not mutate shared Lesson scheduling truth.')
assert(freshLessons.deliveryStates.length === 0, 'Easel outcomes must return a delivery state rather than mutating the source Lesson workspace in place.')

console.log('High-stakes Easel core-loop hostile contract passed')
