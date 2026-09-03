import { getCalendarDay } from '../calendar/schoolCalendar'
import type { SchoolCalendar } from '../calendar/types'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'
import { createLesson, validateLessonAgainstUnit, type Lesson } from './lessons'
import { validateLessonDeliveryState, type LessonDeliveryState } from './deliveryState'

export type LessonWorkspace = {
  calendarId: string
  lessons: Lesson[]
  deliveryStates: LessonDeliveryState[]
}

export type LessonWorkspaceInput = LessonWorkspace

export function hydrateLessonWorkspace(
  input: LessonWorkspaceInput,
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
  units: UnitWorkspace,
): LessonWorkspace {
  const workspace: LessonWorkspace = {
    calendarId: input.calendarId.trim(),
    lessons: input.lessons.map((lesson) => createLesson({ ...lesson })),
    deliveryStates: input.deliveryStates.map((state) => ({ ...state })),
  }

  const errors = validateLessonWorkspace(workspace, calendar, planning, units)
  if (errors.length > 0) throw new Error(`Cannot use Lessons. ${errors.join(' ')}`)
  return workspace
}

export function validateLessonWorkspace(
  workspace: LessonWorkspace,
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
  units: UnitWorkspace,
): string[] {
  const errors: string[] = []
  if (workspace.calendarId !== calendar.id) errors.push('Lesson workspace belongs to a different school calendar.')
  if (planning.calendarId !== calendar.id) errors.push('Class workspace belongs to a different school calendar.')
  if (units.calendarId !== calendar.id) errors.push('Unit workspace belongs to a different school calendar.')

  const lessonIds = new Set<string>()
  for (const lesson of workspace.lessons) {
    if (lessonIds.has(lesson.id)) errors.push(`Duplicate Lesson ID: ${lesson.id}.`)
    lessonIds.add(lesson.id)

    const unit = units.units.find((candidate) => candidate.id === lesson.unitId)
    if (!unit) {
      errors.push(`${lesson.title || lesson.id} references a Unit that does not exist.`)
      continue
    }
    errors.push(...validateLessonAgainstUnit(lesson, unit, calendar))
  }

  const deliveryKeys = new Set<string>()
  for (const state of workspace.deliveryStates) {
    const key = `${state.lessonId}:${state.sectionId}`
    if (deliveryKeys.has(key)) errors.push(`Duplicate delivery state for ${state.lessonId} and ${state.sectionId}.`)
    deliveryKeys.add(key)

    const lesson = workspace.lessons.find((candidate) => candidate.id === state.lessonId)
    const section = planning.sections.find((candidate) => candidate.id === state.sectionId)
    if (!lesson) {
      errors.push(`Delivery state references a Lesson that does not exist: ${state.lessonId}.`)
      continue
    }
    if (!section) {
      errors.push(`Delivery state references a Section that does not exist: ${state.sectionId}.`)
      continue
    }

    errors.push(...validateLessonDeliveryState(state, lesson, section))
    if (state.taughtDate) {
      const day = getCalendarDay(calendar, state.taughtDate)
      if (!day || day.kind !== 'instructional' || day.confidence !== 'confirmed') {
        errors.push(`${section.name} has Lesson progress recorded on a date that is not a confirmed instructional day.`)
      }
    }
  }

  return [...new Set(errors)]
}

export function unitIdsProtectedByLessons(workspace: LessonWorkspace | null): Set<string> {
  return new Set(workspace?.lessons.map((lesson) => lesson.unitId) ?? [])
}

export function sectionIdsProtectedByDelivery(workspace: LessonWorkspace | null): Set<string> {
  return new Set(workspace?.deliveryStates.map((state) => state.sectionId) ?? [])
}
