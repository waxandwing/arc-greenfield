import { createCourse, createSection } from './courses'
import { createLesson, type Lesson } from './lessons'
import { createLessonDeliveryState, updateLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import { projectPlanningRange } from './planningProjection'
import { createUnit, placeUnit } from './units'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'
import type { LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { hydrateSchoolCalendar } from '../calendar/hydration'

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

const lesson17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 17', sequence: 17, plannedDate: '2026-09-16' })
const lesson18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Lesson 18', sequence: 18, plannedDate: '2026-09-17' })
const test = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Egypt test', sequence: 19, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const lessonList: Lesson[] = [lesson17, lesson18, test]

let p2State = createLessonDeliveryState({ lesson: lesson17, section: p2 })
p2State = updateLessonDeliveryState(p2State, lesson17, p2, { status: 'completed', taughtDate: '2026-09-16' })
let p5State = createLessonDeliveryState({ lesson: lesson17, section: p5 })
p5State = updateLessonDeliveryState(p5State, lesson17, p5, { status: 'in-progress', taughtDate: '2026-09-16', resumeNote: 'Stopped after demo.' })
const deliveryStates: LessonDeliveryState[] = [p2State, p5State]
const lessons: LessonWorkspace = { calendarId: calendar.id, lessons: lessonList, deliveryStates }
const overrides: SectionLessonDateOverride[] = [
  { sectionId: p5.id, lessonId: lesson17.id, plannedDate: '2026-09-17' },
  { sectionId: p5.id, lessonId: lesson18.id, plannedDate: '2026-09-21' },
]

const weekDates = ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'] as const
const week = projectPlanningRange({ dates: [...weekDates], planning, units, lessons, overrides })
assert(week.courses.length === 1, 'Projection should group the shared Course once.')
assert(week.courses[0].unitSpans.length === 1, 'A shared Unit should render once per Course, not once per Section.')
assert(week.courses[0].unitSpans[0].startIndex === 0 && week.courses[0].unitSpans[0].endIndex === 6, 'Unit span should clip to the visible week range.')
assert(week.courses[0].sections.length === 3, 'All three Sections should receive their own effective schedule row.')

const p2Row = week.courses[0].sections.find((row) => row.section.id === p2.id)!
const p5Row = week.courses[0].sections.find((row) => row.section.id === p5.id)!
const p7Row = week.courses[0].sections.find((row) => row.section.id === p7.id)!

assert(p2Row.days[2].lessons[0]?.lessonId === lesson17.id, 'P2 should keep Lesson 17 on the shared Wednesday plan.')
assert(p2Row.days[2].lessons[0]?.deliveryStatus === 'completed', 'P2 should project completed teaching state.')
assert(p5Row.days[2].lessons.length === 0, 'P5 should no longer show Lesson 17 on Wednesday after its Section-specific Shift.')
assert(p5Row.days[3].lessons.some((lesson) => lesson.lessonId === lesson17.id && lesson.isSectionOverride), 'P5 should show the effective Thursday continuation and mark it as Section-specific.')
assert(p5Row.days[3].lessons.find((lesson) => lesson.lessonId === lesson17.id)?.deliveryStatus === 'in-progress', 'P5 should preserve in-progress state in the calendar projection.')
assert(p7Row.days[2].lessons[0]?.deliveryStatus === 'not-started', 'Missing delivery state should project as not-started without storing a redundant row.')
assert(p2Row.days[4].lessons[0]?.datePolicy === 'fixed', 'Fixed Lesson policy must survive projection.')
assert(!p5Row.days.some((day) => day.lessons.some((lesson) => lesson.lessonId === lesson18.id)), 'P5 Lesson 18 shifted to next week should not appear in the current week.')

const day = projectPlanningRange({ dates: ['2026-09-17'], planning, units, lessons, overrides })
assert(day.courses[0].unitSpans.length === 1, 'Day projection should preserve the active shared Unit context.')
assert(day.courses[0].sections.find((row) => row.section.id === p5.id)!.days[0].lessons.some((lesson) => lesson.lessonId === lesson17.id), 'Day and Week projections must expose the same effective P5 Lesson truth.')
assert(day.courses[0].sections.find((row) => row.section.id === p2.id)!.days[0].lessons.some((lesson) => lesson.lessonId === lesson18.id), 'Day projection should show P2 Lesson 18 on its shared Thursday plan.')

let mismatchRejected = false
try {
  projectPlanningRange({ dates: ['2026-09-17'], planning: { ...planning, calendarId: 'other-calendar' }, units, lessons, overrides })
} catch {
  mismatchRejected = true
}
assert(mismatchRejected, 'Projection must fail closed when workspace calendar ownership does not match.')

console.log('planning projection contract passed')
