import type { QuarterProjection } from '../calendar/projections'
import type { ISODate } from '../calendar/types'
import type { LessonWorkspace } from './lessonWorkspace'
import { projectPlanningLessonSignals, type PlanningLessonSectionScope } from './planningLessonSignals'
import { projectPlanningRange } from './planningProjection'
import type { SectionLessonDateOverride } from './sectionSchedule'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'

export type QuarterUnitTrack = {
  unitId: string
  courseId: string
  title: string
  startDate: ISODate
  endDate: ISODate
  startIndex: number
  endIndex: number
  continuesBefore: boolean
  continuesAfter: boolean
}

export type QuarterFixedMilestone = {
  lessonId: string
  courseId: string
  title: string
  date: ISODate
  dateIndex: number
  sections: PlanningLessonSectionScope[]
}

export type QuarterCoursePlanning = {
  courseId: string
  courseTitle: string
  unitTracks: QuarterUnitTrack[]
  fixedMilestones: QuarterFixedMilestone[]
  shiftedPlacementCount: number
}

export type QuarterPlanningProjection = {
  dates: ISODate[]
  courses: QuarterCoursePlanning[]
}

export function projectQuarterPlanning(input: {
  quarter: QuarterProjection
  planning: PlanningWorkspace
  units: UnitWorkspace | null
  lessons: LessonWorkspace | null
  overrides: SectionLessonDateOverride[]
}): QuarterPlanningProjection {
  const { quarter, planning, units, lessons, overrides } = input
  const dates = quarter.days.map((day) => day.date)
  const range = projectPlanningRange({ dates, planning, units, lessons, overrides })
  const milestonesByCourse = new Map<string, QuarterFixedMilestone[]>()
  const shiftedCountByCourse = new Map<string, number>()

  for (const date of dates) {
    const dateIndex = range.dates.indexOf(date)
    for (const signal of projectPlanningLessonSignals(range, date)) {
      const shiftedCount = signal.sections.filter((section) => section.isSectionOverride).length
      if (shiftedCount) shiftedCountByCourse.set(signal.courseId, (shiftedCountByCourse.get(signal.courseId) ?? 0) + shiftedCount)
      if (signal.datePolicy !== 'fixed') continue
      const milestones = milestonesByCourse.get(signal.courseId) ?? []
      milestones.push({
        lessonId: signal.lessonId,
        courseId: signal.courseId,
        title: signal.title,
        date,
        dateIndex,
        sections: signal.sections,
      })
      milestonesByCourse.set(signal.courseId, milestones)
    }
  }

  return {
    dates: [...dates],
    courses: range.courses.map((courseGroup) => ({
      courseId: courseGroup.course.id,
      courseTitle: courseGroup.course.title,
      unitTracks: courseGroup.unitSpans.map((unit) => ({
        unitId: unit.unitId,
        courseId: unit.courseId,
        title: unit.title,
        startDate: unit.startDate,
        endDate: unit.endDate,
        startIndex: unit.startIndex,
        endIndex: unit.endIndex,
        continuesBefore: unit.startDate < quarter.startDate,
        continuesAfter: unit.endDate > quarter.endDate,
      })),
      fixedMilestones: (milestonesByCourse.get(courseGroup.course.id) ?? []).sort((a, b) => a.dateIndex - b.dateIndex || a.title.localeCompare(b.title)),
      shiftedPlacementCount: shiftedCountByCourse.get(courseGroup.course.id) ?? 0,
    })),
  }
}
