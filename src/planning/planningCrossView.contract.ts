import { hydrateSchoolCalendar } from '../calendar/hydration'
import { projectMonth } from '../calendar/projections'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import { createLesson } from './lessons'
import { projectMonthPlanning, type MonthLessonSignal } from './monthPlanningProjection'
import { projectPlanningRange, type PlanningRangeProjection } from './planningProjection'
import type { SectionLessonDateOverride } from './sectionSchedule'
import { createUnit, placeUnit, type Unit } from './units'
import type { LessonWorkspace } from './lessonWorkspace'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-cross-view',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [{ date: '2026-09-07', kind: 'holiday', label: 'Labor Day', source: 'manual', confidence: 'confirmed' }],
  quarters: [],
  semesters: [],
})

const apah = createCourse({ id: 'course-apah', title: 'AP Art History' })
const art2d = createCourse({ id: 'course-2d', title: '2D Art 1' })
const p2 = createSection({ id: 'section-p2', courseId: apah.id, calendarId: calendar.id, name: 'Period 2' })
const p5 = createSection({ id: 'section-p5', courseId: apah.id, calendarId: calendar.id, name: 'Period 5' })
const p7 = createSection({ id: 'section-p7', courseId: apah.id, calendarId: calendar.id, name: 'Period 2' })
const p3 = createSection({ id: 'section-p3', courseId: art2d.id, calendarId: calendar.id, name: 'Period 3' })
const planning: PlanningWorkspace = { calendarId: calendar.id, courses: [apah, art2d], sections: [p2, p5, p7, p3] }

const prehistory = placeUnit(createUnit({ id: 'unit-prehistory', calendarId: calendar.id, courseId: apah.id, title: 'Prehistory' }), calendar, { startDate: '2026-08-24', endDate: '2026-09-09' })
const egypt = placeUnit(createUnit({ id: 'unit-egypt', calendarId: calendar.id, courseId: apah.id, title: 'Egypt' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const aegean = placeUnit(createUnit({ id: 'unit-aegean', calendarId: calendar.id, courseId: apah.id, title: 'Aegean' }), calendar, { startDate: '2026-09-21', endDate: '2026-10-02' })
const line = placeUnit(createUnit({ id: 'unit-line', calendarId: calendar.id, courseId: art2d.id, title: 'Line' }), calendar, { startDate: '2026-09-14', endDate: '2026-09-25' })
const unitList = [prehistory, egypt, aegean, line]
const units: UnitWorkspace = { calendarId: calendar.id, units: unitList }

const cave = createLesson({ id: 'lesson-cave', calendarId: calendar.id, courseId: apah.id, unitId: prehistory.id, title: 'Cave painting', sequence: 1, plannedDate: '2026-08-31' })
const l17 = createLesson({ id: 'lesson-17', calendarId: calendar.id, courseId: apah.id, unitId: egypt.id, title: 'Mortuary architecture', sequence: 17, plannedDate: '2026-09-16' })
const l18 = createLesson({ id: 'lesson-18', calendarId: calendar.id, courseId: apah.id, unitId: egypt.id, title: 'Temple complexes', sequence: 18, plannedDate: '2026-09-17' })
const test = createLesson({ id: 'lesson-test', calendarId: calendar.id, courseId: apah.id, unitId: egypt.id, title: 'Egypt test', sequence: 19, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const contour = createLesson({ id: 'lesson-contour', calendarId: calendar.id, courseId: art2d.id, unitId: line.id, title: 'Contour drawing', sequence: 1, plannedDate: '2026-09-16' })

let p2Done = createLessonDeliveryState({ lesson: l17, section: p2 })
p2Done = updateLessonDeliveryState(p2Done, l17, p2, { status: 'completed', taughtDate: '2026-09-15' })
let p5Progress = createLessonDeliveryState({ lesson: l17, section: p5 })
p5Progress = updateLessonDeliveryState(p5Progress, l17, p5, { status: 'in-progress', taughtDate: '2026-09-16', resumeNote: 'Stopped after demo.' })
const deliveryStates: LessonDeliveryState[] = [p2Done, p5Progress]
const lessons: LessonWorkspace = { calendarId: calendar.id, lessons: [cave, l17, l18, test, contour], deliveryStates }
const overrides: SectionLessonDateOverride[] = [
  { sectionId: p5.id, lessonId: cave.id, plannedDate: '2026-09-01' },
  { sectionId: p5.id, lessonId: l17.id, plannedDate: '2026-09-17' },
  { sectionId: p5.id, lessonId: l18.id, plannedDate: '2026-09-21' },
]

const month = projectMonth(calendar, '2026-09-16')
const visibleDates = month.weeks.flatMap((week) => week.days.map((day) => day.date))
const range = projectPlanningRange({ dates: visibleDates, planning, units, lessons, overrides })
const monthPlanning = projectMonthPlanning({ month, planning, units, lessons, overrides })

const monthSignalsByDate = new Map(monthPlanning.weeks.flatMap((week) => week.days.map((day) => [day.date, day.lessonSignals] as const)))
for (const date of visibleDates) {
  const expected = expectedSignals(range, date)
  const actual = monthSignalsByDate.get(date) ?? []
  assert(actual.length === expected.length, `Month signal count must match Week/Day Section placements on ${date}.`)
  for (const expectedSignal of expected) {
    const actualSignal = actual.find((signal) => signal.courseId === expectedSignal.courseId && signal.lessonId === expectedSignal.lessonId)
    assert(actualSignal, `Month must include ${expectedSignal.lessonId} on ${date} when Week/Day does.`)
    assert(actualSignal.datePolicy === expectedSignal.datePolicy, `Month fixed/flexible identity must match Week/Day for ${expectedSignal.lessonId}.`)
    assert(equalSectionScopes(actualSignal, expectedSignal), `Month Section scope must exactly reconstruct Week/Day for ${expectedSignal.lessonId} on ${date}.`)
  }
}

const daySep17 = projectPlanningRange({ dates: ['2026-09-17'], planning, units, lessons, overrides })
const monthSep17 = monthSignalsByDate.get('2026-09-17') ?? []
assert(expectedSignals(daySep17, '2026-09-17').length === monthSep17.length, 'Direct Day projection and Month aggregation must agree on September 17 signal count.')

const weekDates = ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18'] as const
const weekRange = projectPlanningRange({ dates: [...weekDates], planning, units, lessons, overrides })
for (const date of weekDates) {
  const weekSignals = expectedSignals(weekRange, date)
  const monthSignals = monthSignalsByDate.get(date) ?? []
  assert(weekSignals.length === monthSignals.length, `Week and Month must agree on signal count for ${date}.`)
  for (const signal of weekSignals) {
    const monthSignal = monthSignals.find((candidate) => candidate.lessonId === signal.lessonId && candidate.courseId === signal.courseId)
    assert(monthSignal && equalSectionScopes(monthSignal, signal), `Week and Month must agree on exact Section scope for ${signal.lessonId} on ${date}.`)
  }
}

const caveAug31 = (monthSignalsByDate.get('2026-08-31') ?? []).find((signal) => signal.lessonId === cave.id)!
const caveSep1 = (monthSignalsByDate.get('2026-09-01') ?? []).find((signal) => signal.lessonId === cave.id)!
assert(caveAug31.sections.length === 2 && !caveAug31.sections.some((scope) => scope.sectionId === p5.id), 'Adjacent-month shared date must exclude the Section shifted into September.')
assert(caveSep1.sections.length === 1 && caveSep1.sections[0].sectionId === p5.id && caveSep1.sections[0].isSectionOverride, 'Adjacent-month Shift must appear only on the Section effective date.')
assert(!(monthSignalsByDate.get('2026-09-07') ?? []).length, 'Holiday must remain free of planned Lesson signals.')

for (const unit of unitList) assertUnitSegmentsReconstructVisibleCoverage(unit)

function assertUnitSegmentsReconstructVisibleCoverage(unit: Unit) {
  if (!unit.placement) return
  const expectedDates = visibleDates.filter((date) => date >= unit.placement!.startDate && date <= unit.placement!.endDate)
  const actualDates: string[] = []
  for (const week of monthPlanning.weeks) {
    for (const segment of week.unitSegments.filter((candidate) => candidate.unitId === unit.id)) {
      actualDates.push(...week.dates.slice(segment.startColumn, segment.endColumn + 1))
    }
  }
  assert(equalSet(actualDates, expectedDates), `Month Unit segments must reconstruct exact visible coverage for ${unit.title}.`)
}

function expectedSignals(rangeProjection: PlanningRangeProjection, date: string): MonthLessonSignal[] {
  const byLesson = new Map<string, MonthLessonSignal>()
  for (const courseGroup of rangeProjection.courses) {
    for (const row of courseGroup.sections) {
      const day = row.days.find((candidate) => candidate.date === date)
      if (!day) continue
      for (const lesson of day.lessons) {
        const key = `${lesson.courseId}:${lesson.lessonId}`
        const signal = byLesson.get(key) ?? {
          lessonId: lesson.lessonId,
          courseId: lesson.courseId,
          courseTitle: courseGroup.course.title,
          title: lesson.title,
          datePolicy: lesson.datePolicy,
          sections: [],
        }
        assert(!signal.sections.some((scope) => scope.sectionId === row.section.id), `Week/Day projection must not duplicate ${row.section.id} for ${lesson.lessonId} on ${date}.`)
        signal.sections.push({
          sectionId: row.section.id,
          sectionName: row.section.name,
          isSectionOverride: lesson.isSectionOverride,
          deliveryStatus: lesson.deliveryStatus,
        })
        byLesson.set(key, signal)
      }
    }
  }
  return [...byLesson.values()]
}

function equalSectionScopes(left: MonthLessonSignal, right: MonthLessonSignal): boolean {
  const normalize = (signal: MonthLessonSignal) => signal.sections
    .map((scope) => `${scope.sectionId}|${scope.sectionName}|${scope.isSectionOverride ? 'shifted' : 'shared'}|${scope.deliveryStatus}`)
    .sort()
  const leftScopes = normalize(left)
  const rightScopes = normalize(right)
  return leftScopes.length === rightScopes.length && leftScopes.every((value, index) => value === rightScopes[index])
}

function equalSet(left: string[], right: string[]): boolean {
  return left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index])
}

console.log('planning cross-view contract passed')
