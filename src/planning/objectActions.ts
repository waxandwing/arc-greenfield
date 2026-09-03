import type { ISODate, SchoolCalendar } from '../calendar/types'
import { validateLessonAgainstUnit, type Lesson } from './lessons'
import type { LessonWorkspace } from './lessonWorkspace'
import { placeUnit, unplaceUnit, type UnitPlacement } from './units'
import type { UnitWorkspace } from './unitWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'

export type UnitActionContext = {
  calendar: SchoolCalendar
  units: UnitWorkspace
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
}

export type LessonActionContext = UnitActionContext

export type LessonUnplaceResult = {
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
  removedOverrides: SectionLessonDateOverride[]
}

export function moveUnit(input: UnitActionContext & { unitId: string; placement: UnitPlacement }): UnitWorkspace {
  const { calendar, units, lessons, overrides, unitId, placement } = input
  const unit = requireUnit(units, unitId)
  const nextUnit = placeUnit(unit, calendar, placement)
  const dependentLessons = lessons.lessons.filter((lesson) => lesson.unitId === unitId)

  for (const lesson of dependentLessons) {
    const errors = validateLessonAgainstUnit(lesson, nextUnit, calendar)
    if (errors.length > 0) {
      throw new Error(`Cannot move Unit. ${lesson.title} would become invalid. ${errors.join(' ')}`)
    }
  }

  for (const override of overrides.filter((candidate) => dependentLessons.some((lesson) => lesson.id === candidate.lessonId))) {
    if (override.plannedDate < placement.startDate || override.plannedDate > placement.endDate) {
      throw new Error('Cannot move Unit. A Section-specific Lesson placement would fall outside the new Unit span. Resolve that Section placement first.')
    }
  }

  return {
    ...units,
    units: units.units.map((candidate) => candidate.id === unitId ? nextUnit : candidate),
  }
}

export function unplaceUnitFromCalendar(input: UnitActionContext & { unitId: string }): UnitWorkspace {
  const { units, lessons, overrides, unitId } = input
  const unit = requireUnit(units, unitId)
  const dependentLessons = lessons.lessons.filter((lesson) => lesson.unitId === unitId)
  if (dependentLessons.some((lesson) => lesson.plannedDate !== null)) {
    throw new Error('Cannot unplace Unit. Unplace its scheduled Lessons first so Arc does not silently remove their dates.')
  }
  if (overrides.some((override) => dependentLessons.some((lesson) => lesson.id === override.lessonId))) {
    throw new Error('Cannot unplace Unit. Resolve Section-specific Lesson placements first so Arc does not silently remove them.')
  }

  return {
    ...units,
    units: units.units.map((candidate) => candidate.id === unitId ? unplaceUnit(unit) : candidate),
  }
}

export function deleteUnit(input: UnitActionContext & { unitId: string }): UnitWorkspace {
  const { units, lessons, unitId } = input
  requireUnit(units, unitId)
  if (lessons.lessons.some((lesson) => lesson.unitId === unitId)) {
    throw new Error('Cannot delete Unit. Move or delete its Lessons first.')
  }
  return { ...units, units: units.units.filter((unit) => unit.id !== unitId) }
}

export function moveLesson(input: LessonActionContext & { lessonId: string; plannedDate: ISODate }): LessonWorkspace {
  const { calendar, units, lessons, lessonId, plannedDate } = input
  const lesson = requireLesson(lessons, lessonId)
  const unit = requireUnit(units, lesson.unitId)
  const next: Lesson = { ...lesson, plannedDate }
  const errors = validateLessonAgainstUnit(next, unit, calendar)
  if (errors.length > 0) throw new Error(`Cannot move Lesson. ${errors.join(' ')}`)

  return {
    ...lessons,
    lessons: lessons.lessons.map((candidate) => candidate.id === lessonId ? next : candidate),
  }
}

export function unplaceLessonFromCalendar(input: LessonActionContext & { lessonId: string }): LessonUnplaceResult {
  const { lessons, overrides, lessonId } = input
  const lesson = requireLesson(lessons, lessonId)
  const next: Lesson = { ...lesson, plannedDate: null, datePolicy: 'flexible' }
  const removedOverrides = overrides.filter((override) => override.lessonId === lessonId).map((override) => ({ ...override }))
  return {
    lessons: {
      ...lessons,
      lessons: lessons.lessons.map((candidate) => candidate.id === lessonId ? next : candidate),
    },
    overrides: overrides.filter((override) => override.lessonId !== lessonId),
    removedOverrides,
  }
}

export function deleteLesson(input: LessonActionContext & { lessonId: string }): LessonWorkspace {
  const { lessons, overrides, lessonId } = input
  requireLesson(lessons, lessonId)
  if (lessons.deliveryStates.some((state) => state.lessonId === lessonId)) {
    throw new Error('Cannot delete Lesson. Arc has teaching history for this Lesson. Resolve or preserve that history first.')
  }
  if (overrides.some((override) => override.lessonId === lessonId)) {
    throw new Error('Cannot delete Lesson. Section-specific schedule placements still reference this Lesson. Unplace them first.')
  }
  return { ...lessons, lessons: lessons.lessons.filter((lesson) => lesson.id !== lessonId) }
}

function requireUnit(units: UnitWorkspace, unitId: string) {
  const unit = units.units.find((candidate) => candidate.id === unitId)
  if (!unit) throw new Error(`Unit does not exist: ${unitId}.`)
  return unit
}

function requireLesson(lessons: LessonWorkspace, lessonId: string) {
  const lesson = lessons.lessons.find((candidate) => candidate.id === lessonId)
  if (!lesson) throw new Error(`Lesson does not exist: ${lessonId}.`)
  return lesson
}
