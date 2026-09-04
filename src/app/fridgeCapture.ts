import type { SchoolCalendar } from '../calendar'
import {
  createLesson,
  createUnit,
  hydrateLessonWorkspace,
  hydrateUnitWorkspace,
  lessonsForUnit,
  type Lesson,
  type LessonWorkspace,
  type LessonWorkspaceInput,
  type PlanningWorkspace,
  type Unit,
  type UnitWorkspace,
  type UnitWorkspaceInput,
} from '../planning'

export function buildFridgeUnitCapture(input: {
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  courseId: string
  title: string
}): { unit: Unit; workspace: UnitWorkspace; persistence: UnitWorkspaceInput } {
  const course = input.planning.courses.find((candidate) => candidate.id === input.courseId)
  if (!course) throw new Error('Choose a current Course for this Unit.')
  const unit = createUnit({ calendarId: input.calendar.id, courseId: course.id, title: input.title })
  const persistence: UnitWorkspaceInput = {
    calendarId: input.units.calendarId,
    units: [...input.units.units, unit],
  }
  return {
    unit,
    persistence,
    workspace: hydrateUnitWorkspace(persistence, input.calendar, input.planning),
  }
}

export function buildFridgeLessonCapture(input: {
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  unitId: string
  title: string
}): { lesson: Lesson; workspace: LessonWorkspace; persistence: LessonWorkspaceInput } {
  const unit = input.units.units.find((candidate) => candidate.id === input.unitId)
  if (!unit) throw new Error('Choose a current Unit for this Lesson.')
  const siblings = lessonsForUnit(input.lessons.lessons, unit.id)
  const lesson = createLesson({
    calendarId: input.calendar.id,
    courseId: unit.courseId,
    unitId: unit.id,
    title: input.title,
    sequence: siblings.reduce((max, sibling) => Math.max(max, sibling.sequence), 0) + 1,
  })
  const persistence: LessonWorkspaceInput = {
    calendarId: input.lessons.calendarId,
    lessons: [...input.lessons.lessons, lesson],
    deliveryStates: input.lessons.deliveryStates,
  }
  return {
    lesson,
    persistence,
    workspace: hydrateLessonWorkspace(persistence, input.calendar, input.planning, input.units),
  }
}
