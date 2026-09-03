import type { ISODate } from '../calendar/types'
import type { MonthProjection } from '../calendar/projections'
import { projectPlanningRange, type PlanningLessonPlacement } from './planningProjection'
import type { LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import type { UnitWorkspace } from './unitWorkspace'
import type { Course, Section } from './courses'
import type { PlanningWorkspace } from './workspace'
import type { LessonDatePolicy } from './lessons'

export type MonthUnitSegment = {
  unitId: string
  courseId: string
  courseTitle: string
  title: string
  weekIndex: number
  startColumn: number
  endColumn: number
  continuesBefore: boolean
  continuesAfter: boolean
}

export type MonthLessonSignal = {
  lessonId: string
  courseId: string
  courseTitle: string
  title: string
  datePolicy: LessonDatePolicy
  sectionIds: string[]
  sectionNames: string[]
  shiftedSectionIds: string[]
  statusCounts: Record<PlanningLessonPlacement['deliveryStatus'], number>
}

export type MonthDayPlanning = {
  date: ISODate
  lessonSignals: MonthLessonSignal[]
}

export type MonthPlanningWeek = {
  weekIndex: number
  dates: ISODate[]
  unitSegments: MonthUnitSegment[]
  days: MonthDayPlanning[]
}

export type MonthPlanningProjection = {
  weeks: MonthPlanningWeek[]
}

export function projectMonthPlanning(input: {
  month: MonthProjection
  planning: PlanningWorkspace
  units: UnitWorkspace | null
  lessons: LessonWorkspace | null
  overrides: SectionLessonDateOverride[]
}): MonthPlanningProjection {
  const { month, planning, units, lessons, overrides } = input
  const allDates = month.weeks.flatMap((week) => week.days.map((day) => day.date))
  const range = projectPlanningRange({ dates: allDates, planning, units, lessons, overrides })
  const courseById = new Map(planning.courses.map((course) => [course.id, course]))
  const sectionById = new Map(planning.sections.map((section) => [section.id, section]))

  return {
    weeks: month.weeks.map((week, weekIndex) => {
      const dates = week.days.map((day) => day.date)
      const dateSet = new Set(dates)
      return {
        weekIndex,
        dates,
        unitSegments: projectUnitSegments(range, courseById, dates, weekIndex),
        days: dates.map((date) => ({
          date,
          lessonSignals: projectLessonSignals(range, courseById, sectionById, dateSet, date),
        })),
      }
    }),
  }
}

function projectUnitSegments(
  range: ReturnType<typeof projectPlanningRange>,
  courseById: Map<string, Course>,
  weekDates: ISODate[],
  weekIndex: number,
): MonthUnitSegment[] {
  const first = weekDates[0]
  const last = weekDates[weekDates.length - 1]
  const indexByDate = new Map(weekDates.map((date, index) => [date, index]))
  const segments: MonthUnitSegment[] = []

  for (const group of range.courses) {
    const course = courseById.get(group.course.id) ?? group.course
    for (const unit of group.unitSpans) {
      if (unit.endDate < first || unit.startDate > last) continue
      const visibleStart = unit.startDate < first ? first : unit.startDate
      const visibleEnd = unit.endDate > last ? last : unit.endDate
      segments.push({
        unitId: unit.unitId,
        courseId: unit.courseId,
        courseTitle: course.title,
        title: unit.title,
        weekIndex,
        startColumn: indexByDate.get(visibleStart) ?? 0,
        endColumn: indexByDate.get(visibleEnd) ?? weekDates.length - 1,
        continuesBefore: unit.startDate < first,
        continuesAfter: unit.endDate > last,
      })
    }
  }

  return segments.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle) || a.startColumn - b.startColumn || a.endColumn - b.endColumn || a.title.localeCompare(b.title))
}

function projectLessonSignals(
  range: ReturnType<typeof projectPlanningRange>,
  courseById: Map<string, Course>,
  sectionById: Map<string, Section>,
  weekDateSet: Set<ISODate>,
  date: ISODate,
): MonthLessonSignal[] {
  if (!weekDateSet.has(date)) return []
  const grouped = new Map<string, MonthLessonSignal>()

  for (const courseGroup of range.courses) {
    const course = courseById.get(courseGroup.course.id) ?? courseGroup.course
    for (const sectionRow of courseGroup.sections) {
      const day = sectionRow.days.find((candidate) => candidate.date === date)
      if (!day) continue
      for (const lesson of day.lessons) {
        const key = `${lesson.courseId}:${lesson.lessonId}`
        const existing = grouped.get(key) ?? {
          lessonId: lesson.lessonId,
          courseId: lesson.courseId,
          courseTitle: course.title,
          title: lesson.title,
          datePolicy: lesson.datePolicy,
          sectionIds: [],
          sectionNames: [],
          shiftedSectionIds: [],
          statusCounts: { 'not-started': 0, 'in-progress': 0, completed: 0, skipped: 0 },
        }
        const section = sectionById.get(sectionRow.section.id) ?? sectionRow.section
        existing.sectionIds.push(section.id)
        existing.sectionNames.push(section.name)
        if (lesson.isSectionOverride) existing.shiftedSectionIds.push(section.id)
        existing.statusCounts[lesson.deliveryStatus] += 1
        grouped.set(key, existing)
      }
    }
  }

  return [...grouped.values()]
    .map((signal) => ({
      ...signal,
      sectionIds: unique(signal.sectionIds),
      sectionNames: unique(signal.sectionNames),
      shiftedSectionIds: unique(signal.shiftedSectionIds),
    }))
    .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle) || a.title.localeCompare(b.title))
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
