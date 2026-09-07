import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { projectPlanningRange } from './planningProjection'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { createUnit, placeUnit } from './units'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'
import type { LessonWorkspace } from './lessonWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-hostile',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [
    { date: '2026-10-14', kind: 'holiday', label: 'Holiday', source: 'manual', confidence: 'confirmed' },
  ],
  quarters: [],
  semesters: [],
})

const apah = createCourse({ id: 'course-apah', title: 'AP Art History With A Very Long Course Name That Must Not Break Projection' })
const art2d = createCourse({ id: 'course-2d', title: '2D Art 1' })
const sections = [
  createSection({ id: 'apah-p1', courseId: apah.id, calendarId: calendar.id, name: 'Period 1' }),
  createSection({ id: 'apah-p2', courseId: apah.id, calendarId: calendar.id, name: 'Period 2 With A Long Section Name' }),
  createSection({ id: 'apah-p5', courseId: apah.id, calendarId: calendar.id, name: 'Period 5' }),
  createSection({ id: 'apah-p7', courseId: apah.id, calendarId: calendar.id, name: 'Period 7' }),
  createSection({ id: 'art2d-p3', courseId: art2d.id, calendarId: calendar.id, name: 'Period 3' }),
  createSection({ id: 'art2d-p6', courseId: art2d.id, calendarId: calendar.id, name: 'Period 6' }),
]
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [apah, art2d], sections }

const egypt = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: apah.id, title: 'Egypt' }), calendar, { startDate: '2026-10-12', endDate: '2026-10-23' })
const aegean = placeUnit(createUnit({ id: 'unit-aegean', calendarId: calendar.id, courseId: apah.id, title: 'Aegean' }), calendar, { startDate: '2026-10-19', endDate: '2026-10-30' })
const line = placeUnit(createUnit({ id: 'unit-line', calendarId: calendar.id, courseId: art2d.id, title: 'Line and Mark Making' }), calendar, { startDate: '2026-10-12', endDate: '2026-10-23' })
const units: UnitWorkspace = { calendarId: calendar.id, units: [egypt, aegean, line] }

const l1 = createLesson({ id: 'l1', calendarId: calendar.id, courseId: apah.id, unitId: egypt.id, title: 'Extremely Long Lesson Title About Mortuary Architecture And Political Theology', sequence: 1, plannedDate: '2026-10-13' })
const l2 = createLesson({ id: 'l2', calendarId: calendar.id, courseId: apah.id, unitId: egypt.id, title: 'Temple complexes', sequence: 2, plannedDate: '2026-10-15' })
const fixed = createLesson({ id: 'lfixed', calendarId: calendar.id, courseId: apah.id, unitId: egypt.id, title: 'Egypt assessment', sequence: 3, plannedDate: '2026-10-16', datePolicy: 'fixed' })
const nextWeek = createLesson({ id: 'lnext', calendarId: calendar.id, courseId: apah.id, unitId: egypt.id, title: 'Continuation', sequence: 4, plannedDate: '2026-10-19' })
const drawing = createLesson({ id: 'draw', calendarId: calendar.id, courseId: art2d.id, unitId: line.id, title: 'Contour drawing', sequence: 1, plannedDate: '2026-10-13' })

let completedFuture = createLessonDeliveryState({ lesson: l2, section: sections[0] })
completedFuture = updateLessonDeliveryState(completedFuture, l2, sections[0], { status: 'completed', taughtDate: '2026-10-13' })
let inProgress = createLessonDeliveryState({ lesson: l1, section: sections[2] })
inProgress = updateLessonDeliveryState(inProgress, l1, sections[2], { status: 'in-progress', taughtDate: '2026-10-13', resumeNote: 'Stopped after comparison setup.' })
const lessonWorkspace: LessonWorkspace = {
  calendarId: calendar.id,
  lessons: [l1, l2, fixed, nextWeek, drawing],
  deliveryStates: [completedFuture, inProgress] as LessonDeliveryState[],
}
const overrides: SectionLessonDateOverride[] = [
  { sectionId: sections[2].id, lessonId: l1.id, plannedDate: '2026-10-15' },
  { sectionId: sections[2].id, lessonId: l2.id, plannedDate: '2026-10-19' },
]

const weekDates = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'] as const
const week = projectPlanningRange({ dates: [...weekDates], planning, units, lessons: lessonWorkspace, overrides })
assert(week.courses.length === 2, 'Multiple Courses must project independently.')
assert(week.courses[0].unitSpans.length === 1, 'Only the Unit intersecting this week should be visible for APAH.')
assert(week.courses[1].unitSpans.length === 1, 'Second Course Unit should remain independent.')
assert(week.courses[0].sections.length === 4, 'All APAH Sections should remain visible.')
assert(week.courses[1].sections.length === 2, 'All 2D Art Sections should remain visible.')

const holidayIndex = 2
for (const course of week.courses) {
  for (const row of course.sections) {
    assert(row.days[holidayIndex].lessons.length === 0, 'Holiday date must not acquire planned Lessons from projection.')
  }
}

const p5 = week.courses[0].sections.find((row) => row.section.id === 'apah-p5')!
assert(p5.days[3].lessons.some((lesson) => lesson.lessonId === l1.id && lesson.isSectionOverride), 'Shifted P5 Lesson should appear on Thursday effective date.')
assert(!p5.days.some((day) => day.lessons.some((lesson) => lesson.lessonId === l2.id)), 'Lesson shifted into next week must disappear from current week.')
const p1 = week.courses[0].sections.find((row) => row.section.id === 'apah-p1')!
assert(p1.days[3].lessons.some((lesson) => lesson.lessonId === l2.id && lesson.deliveryStatus === 'completed'), 'Completed work with a future shared date must preserve completed state without moving itself.')
assert(p1.days[4].lessons.some((lesson) => lesson.lessonId === fixed.id && lesson.datePolicy === 'fixed'), 'Fixed anchor must remain visible on its planned date.')

const nextWeekProjection = projectPlanningRange({ dates: ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'], planning, units, lessons: lessonWorkspace, overrides })
const nextP5 = nextWeekProjection.courses[0].sections.find((row) => row.section.id === 'apah-p5')!
assert(nextP5.days[0].lessons.some((lesson) => lesson.lessonId === l2.id && lesson.isSectionOverride), 'Cross-week Shift must appear in the destination week.')
assert(nextWeekProjection.courses[0].unitSpans.length === 2, 'Overlapping Units must both project rather than overwrite each other.')

const blank = projectPlanningRange({ dates: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'], planning, units, lessons: lessonWorkspace, overrides })
assert(blank.courses.length === 2, 'Blank week must preserve Course structure.')
assert(blank.courses.every((course) => course.unitSpans.length === 0), 'Blank week should have no phantom Unit spans.')
assert(blank.courses.every((course) => course.sections.every((row) => row.days.every((day) => day.lessons.length === 0))), 'Blank week should have no phantom Lessons.')

const day = projectPlanningRange({ dates: ['2026-10-15'], planning, units, lessons: lessonWorkspace, overrides })
assert(day.courses[0].sections.find((row) => row.section.id === 'apah-p5')!.days[0].lessons.some((lesson) => lesson.lessonId === l1.id), 'Day and Week must agree on P5 effective Lesson placement.')
assert(day.courses[0].sections.find((row) => row.section.id === 'apah-p1')!.days[0].lessons.some((lesson) => lesson.lessonId === l2.id), 'Day and Week must agree on shared Lesson placement.')

let duplicateDateRejected = false
try {
  projectPlanningRange({ dates: ['2026-10-15', '2026-10-15'], planning, units, lessons: lessonWorkspace, overrides })
} catch {
  duplicateDateRejected = true
}
assert(duplicateDateRejected, 'Projection must reject duplicate visible dates before calculating Unit geometry.')

let unsortedDateRejected = false
try {
  projectPlanningRange({ dates: ['2026-10-16', '2026-10-15'], planning, units, lessons: lessonWorkspace, overrides })
} catch {
  unsortedDateRejected = true
}
assert(unsortedDateRejected, 'Projection must reject unsorted visible dates before calculating Unit geometry.')

console.log('planning projection hostile contract passed')
