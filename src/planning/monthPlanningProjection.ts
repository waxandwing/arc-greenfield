import type { ISODate } from '../calendar/types'
import type { MonthProjection } from '../calendar/projections'
import { projectPlanningLessonSignals, type PlanningLessonSignal } from './planningLessonSignals'
import { projectPlanningRange } from './planningProjection'
import type { LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import type { UnitWorkspace } from './unitWorkspace'
import type { Course } from './courses'
import type { PlanningWorkspace } from './workspace'

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

export type MonthLessonSignal = PlanningLessonSignal

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

  return {
    weeks: month.weeks.map((week, weekIndex) => {
      const dates = week.days.map((day) => day.date)
      return {
        weekIndex,
        dates,
        unitSegments: projectUnitSegments(range, courseById, dates, weekIndex),
        days: dates.map((date) => ({
          date,
          lessonSignals: projectPlanningLessonSignals(range, date),
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
