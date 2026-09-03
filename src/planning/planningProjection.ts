import type { ISODate } from '../calendar/types'
import type { Course, Section } from './courses'
import { effectiveLessonDeliveryState, type DeliveryStatus, type LessonDeliveryState } from './deliveryState'
import type { Lesson, LessonDatePolicy } from './lessons'
import { effectiveLessonDate, type SectionLessonDateOverride } from './sectionSchedule'
import type { PlanningWorkspace } from './workspace'
import type { Unit, UnitWorkspace } from './unitWorkspace'
import type { LessonWorkspace } from './lessonWorkspace'

export type PlanningUnitSpan = {
  unitId: string
  title: string
  courseId: string
  startDate: ISODate
  endDate: ISODate
  startIndex: number
  endIndex: number
}

export type PlanningLessonPlacement = {
  lessonId: string
  unitId: string
  courseId: string
  title: string
  sequence: number
  datePolicy: LessonDatePolicy
  sharedPlannedDate: ISODate | null
  effectiveDate: ISODate
  isSectionOverride: boolean
  deliveryStatus: DeliveryStatus
  taughtDate: ISODate | null
  resumeNote: string | null
}

export type PlanningDaySlot = {
  date: ISODate
  lessons: PlanningLessonPlacement[]
}

export type PlanningSectionRow = {
  section: Section
  days: PlanningDaySlot[]
}

export type PlanningCourseGroup = {
  course: Course
  unitSpans: PlanningUnitSpan[]
  sections: PlanningSectionRow[]
}

export type PlanningRangeProjection = {
  dates: ISODate[]
  courses: PlanningCourseGroup[]
}

export function projectPlanningRange(input: {
  dates: ISODate[]
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
}): PlanningRangeProjection {
  const { dates, planning, units, lessons, overrides } = input
  if (dates.length === 0) return { dates: [], courses: [] }

  validateProjectionOwnership(planning, units, lessons)

  const dateIndexes = new Map(dates.map((date, index) => [date, index]))
  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]

  return {
    dates: [...dates],
    courses: planning.courses.map((course) => ({
      course,
      unitSpans: projectUnitSpans(units.units, course.id, firstDate, lastDate, dateIndexes),
      sections: planning.sections
        .filter((section) => section.courseId === course.id)
        .map((section) => projectSectionRow(section, course.id, dates, lessons.lessons, lessons.deliveryStates, overrides)),
    })),
  }
}

function projectUnitSpans(
  units: Unit[],
  courseId: string,
  firstDate: ISODate,
  lastDate: ISODate,
  dateIndexes: Map<ISODate, number>,
): PlanningUnitSpan[] {
  return units
    .filter((unit) => unit.courseId === courseId && unit.placement)
    .filter((unit) => unit.placement!.endDate >= firstDate && unit.placement!.startDate <= lastDate)
    .map((unit) => {
      const placement = unit.placement!
      const clippedStart = placement.startDate < firstDate ? firstDate : placement.startDate
      const clippedEnd = placement.endDate > lastDate ? lastDate : placement.endDate
      return {
        unitId: unit.id,
        title: unit.title,
        courseId: unit.courseId,
        startDate: placement.startDate,
        endDate: placement.endDate,
        startIndex: dateIndexes.get(clippedStart) ?? 0,
        endIndex: dateIndexes.get(clippedEnd) ?? dateIndexes.size - 1,
      }
    })
    .sort((a, b) => a.startIndex - b.startIndex || a.endIndex - b.endIndex || a.title.localeCompare(b.title))
}

function projectSectionRow(
  section: Section,
  courseId: string,
  dates: ISODate[],
  lessons: Lesson[],
  deliveryStates: LessonDeliveryState[],
  overrides: SectionLessonDateOverride[],
): PlanningSectionRow {
  const dayMap = new Map<ISODate, PlanningLessonPlacement[]>(dates.map((date) => [date, []]))

  for (const lesson of lessons) {
    if (lesson.courseId !== courseId) continue
    const effectiveDate = effectiveLessonDate(lesson, section.id, overrides)
    if (!effectiveDate || !dayMap.has(effectiveDate)) continue

    const delivery = effectiveLessonDeliveryState(deliveryStates, lesson, section)
    dayMap.get(effectiveDate)!.push({
      lessonId: lesson.id,
      unitId: lesson.unitId,
      courseId: lesson.courseId,
      title: lesson.title,
      sequence: lesson.sequence,
      datePolicy: lesson.datePolicy,
      sharedPlannedDate: lesson.plannedDate,
      effectiveDate,
      isSectionOverride: effectiveDate !== lesson.plannedDate,
      deliveryStatus: delivery.status,
      taughtDate: delivery.taughtDate,
      resumeNote: delivery.resumeNote,
    })
  }

  return {
    section,
    days: dates.map((date) => ({
      date,
      lessons: (dayMap.get(date) ?? []).sort((a, b) => a.sequence - b.sequence || a.title.localeCompare(b.title)),
    })),
  }
}

function validateProjectionOwnership(
  planning: PlanningWorkspace,
  units: UnitWorkspace,
  lessons: LessonWorkspace,
): void {
  const calendarIds = new Set([planning.calendarId, units.calendarId, lessons.calendarId])
  if (calendarIds.size !== 1) {
    throw new Error('Cannot project planning state from different school calendars.')
  }
}
