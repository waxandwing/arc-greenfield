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

export type MonthLessonSectionScope = {
  sectionId: string
  sectionName: string
  isSectionOverride: boolean
  deliveryStatus: PlanningLessonPlacement['deliveryStatus']
}

export type MonthLessonSignal = {
  lessonId: string
  courseId: string
  courseTitle: string
  title: string
  datePolicy: LessonDatePolicy
  sections: MonthLessonSectionScope[]
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
      return {
        weekIndex,
        dates,
        unitSegments: projectUnitSegments(range, courseById, dates, weekIndex),
        days: dates.map((date) => ({
          date,
          lessonSignals: projectLessonSignals(range, courseById, sectionById, date),
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
  date: ISODate,
): MonthLessonSignal[] {
  const grouped = new Map<string, MonthLessonSignal>()

  for (const courseGroup of range.courses) {
    const course = courseById.get(courseGroup.course.id) ?? courseGroup.course
    for (const sectionRow of courseGroup.sections) {
      const day = sectionRow.days.find((candidate) => candidate.date === date)
      if (!day) continue
      for (const lesson of day.lessons) {
        const key = `${lesson.courseId}:${lesson.lessonId}`
        const signal = grouped.get(key) ?? {
          lessonId: lesson.lessonId,
          courseId: lesson.courseId,
          courseTitle: course.title,
          title: lesson.title,
          datePolicy: lesson.datePolicy,
          sections: [],
        }
        const section = sectionById.get(sectionRow.section.id) ?? sectionRow.section
        if (signal.sections.some((scope) => scope.sectionId === section.id)) {
          throw new Error(`Month planning received duplicate Section placement for ${section.id}, ${lesson.lessonId}, ${date}.`)
        }
        signal.sections.push({
          sectionId: section.id,
          sectionName: section.name,
          isSectionOverride: lesson.isSectionOverride,
          deliveryStatus: lesson.deliveryStatus,
        })
        grouped.set(key, signal)
      }
    }
  }

  return [...grouped.values()]
    .map((signal) => ({
      ...signal,
      sections: [...signal.sections].sort((a, b) => a.sectionName.localeCompare(b.sectionName) || a.sectionId.localeCompare(b.sectionId)),
    }))
    .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle) || a.title.localeCompare(b.title))
}
