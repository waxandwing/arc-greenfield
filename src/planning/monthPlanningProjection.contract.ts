import { hydrateSchoolCalendar } from '../calendar/hydration'
import { projectMonth } from '../calendar/projections'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { projectMonthPlanning } from './monthPlanningProjection'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { createUnit, placeUnit } from './units'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'
import type { LessonWorkspace } from './lessonWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-month',
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
const p7 = createSection({ id: 'section-p7', courseId: course.id, calendarId: calendar.id, name: 'Period 2' })
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [course], sections: [p2, p5, p7] }

const egypt = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: course.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const units: UnitWorkspace = { calendarId: calendar.id, units: [egypt] }
const l17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: egypt.id, title: 'Mortuary architecture', sequence: 17, plannedDate: '2026-09-16' })
const l18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: egypt.id, title: 'Temple complexes', sequence: 18, plannedDate: '2026-09-17' })
const test = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: course.id, unitId: egypt.id, title: 'Egypt test', sequence: 19, plannedDate: '2026-09-18', datePolicy: 'fixed' })
let p2Done = createLessonDeliveryState({ lesson: l17, section: p2 })
p2Done = updateLessonDeliveryState(p2Done, l17, p2, { status: 'completed', taughtDate: '2026-09-16' })
let p5Progress = createLessonDeliveryState({ lesson: l17, section: p5 })
p5Progress = updateLessonDeliveryState(p5Progress, l17, p5, { status: 'in-progress', taughtDate: '2026-09-16', resumeNote: 'Stopped after demo.' })
const lessons: LessonWorkspace = { calendarId: calendar.id, lessons: [l17, l18, test], deliveryStates: [p2Done, p5Progress] as LessonDeliveryState[] }
const overrides: SectionLessonDateOverride[] = [
  { sectionId: p5.id, lessonId: l17.id, plannedDate: '2026-09-17' },
  { sectionId: p5.id, lessonId: l18.id, plannedDate: '2026-09-21' },
]

const month = projectMonth(calendar, '2026-09-17')
const projection = projectMonthPlanning({ month, planning, units, lessons, overrides })
assert(projection.weeks.length === month.weeks.length, 'Month planning must preserve canonical calendar week geometry.')

const unitSegments = projection.weeks.flatMap((week) => week.unitSegments).filter((segment) => segment.unitId === egypt.id)
assert(unitSegments.length === 2, 'A Unit crossing a Sunday boundary must split into two Month visual segments.')
assert(unitSegments.every((segment) => segment.unitId === egypt.id), 'Split Month Unit segments must preserve one stable Unit identity.')
assert(unitSegments[0].continuesAfter, 'First Unit segment must identify continuation into the next week.')
assert(unitSegments[1].continuesBefore, 'Second Unit segment must identify continuation from the prior week.')

const sep16 = projection.weeks.flatMap((week) => week.days).find((day) => day.date === '2026-09-16')!
const l17Sep16 = sep16.lessonSignals.find((signal) => signal.lessonId === l17.id)!
assert(l17Sep16.sections.length === 2, 'Shared Lesson signal should group P2 and P7 rather than render duplicate Lesson cards.')
assert(l17Sep16.sections.some((scope) => scope.sectionId === p2.id) && l17Sep16.sections.some((scope) => scope.sectionId === p7.id), 'Shared Lesson signal must retain the exact Sections scheduled that day.')
assert(!l17Sep16.sections.some((scope) => scope.sectionId === p5.id), 'P5 Shift must remove P5 from the shared Wednesday signal.')
assert(l17Sep16.sections.filter((scope) => scope.sectionName === 'Period 2').length === 2, 'Distinct Sections with the same display name must remain distinct Section scopes.')
assert(l17Sep16.sections.filter((scope) => scope.deliveryStatus === 'completed').length === 1 && l17Sep16.sections.filter((scope) => scope.deliveryStatus === 'not-started').length === 1, 'Month signal must preserve each Section status without a duplicate aggregate state.')

const sep17 = projection.weeks.flatMap((week) => week.days).find((day) => day.date === '2026-09-17')!
const l17Sep17 = sep17.lessonSignals.find((signal) => signal.lessonId === l17.id)!
assert(l17Sep17.sections.length === 1 && l17Sep17.sections[0].sectionId === p5.id, 'P5 continuation must appear as its own effective Thursday signal.')
assert(l17Sep17.sections[0].isSectionOverride, 'Month must expose that P5 placement is Section-specific on the Section scope itself.')
const l18Sep17 = sep17.lessonSignals.find((signal) => signal.lessonId === l18.id)!
assert(l18Sep17.sections.length === 2 && !l18Sep17.sections.some((scope) => scope.sectionId === p5.id), 'P5 Lesson 18 Shift must not move P2/P7 from Thursday.')

const sep18 = projection.weeks.flatMap((week) => week.days).find((day) => day.date === '2026-09-18')!
const fixedSignal = sep18.lessonSignals.find((signal) => signal.lessonId === test.id)!
assert(fixedSignal.datePolicy === 'fixed' && fixedSignal.sections.length === 3, 'Fixed shared assessment must remain one signal covering all Sections.')

const sep21 = projection.weeks.flatMap((week) => week.days).find((day) => day.date === '2026-09-21')!
const l18Sep21 = sep21.lessonSignals.find((signal) => signal.lessonId === l18.id)!
assert(l18Sep21.sections.length === 1 && l18Sep21.sections[0].sectionId === p5.id && l18Sep21.sections[0].isSectionOverride, 'Cross-week P5 Shift must surface in the correct Month day.')

const emptyPlanning = projectMonthPlanning({ month, planning, units: null, lessons: null, overrides: [] })
assert(emptyPlanning.weeks.every((week) => week.unitSegments.length === 0), 'Classes-only Month must not fabricate Unit segments.')
assert(emptyPlanning.weeks.every((week) => week.days.every((day) => day.lessonSignals.length === 0)), 'Classes-only Month must not fabricate Lesson signals.')

console.log('month planning projection contract passed')
