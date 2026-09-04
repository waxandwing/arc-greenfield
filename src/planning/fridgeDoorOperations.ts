import type { SchoolCalendar } from '../calendar'
import { deleteLesson, deleteUnit, unplaceLessonFromCalendar } from './objectActions'
import {
  reconcileFridgeDoor,
  removeEntityReference,
  validateFridgeDoorState,
  type FridgeCapacity,
  type FridgeDoorState,
  type FridgeSurface,
} from './fridgeDoor'
import type { LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import type { UnitWorkspace } from './unitWorkspace'

export type PreparedLessonUnplace = {
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
  fridge: FridgeDoorState
  removedOverrides: SectionLessonDateOverride[]
  destination: FridgeSurface
}

export function prepareLessonUnplaceWithFridge(input: {
  calendar: SchoolCalendar
  units: UnitWorkspace
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
  fridge: FridgeDoorState
  capacity: FridgeCapacity
  lessonId: string
}): PreparedLessonUnplace {
  const result = unplaceLessonFromCalendar({
    calendar: input.calendar,
    units: input.units,
    lessons: input.lessons,
    overrides: input.overrides,
    lessonId: input.lessonId,
  })

  const fridge = reconcileFridgeDoor(
    input.fridge,
    input.units.units,
    result.lessons.lessons,
    result.overrides,
    input.capacity,
  )
  assertValidFridge(fridge, input.units, result.lessons)

  const placement = fridge.placements.find((item) => item.entityRef === `lesson:${input.lessonId}`)
  if (!placement) throw new Error('Arc could not reserve a discoverable Fridge destination for this Lesson. Nothing changed.')

  return {
    lessons: result.lessons,
    overrides: result.overrides,
    fridge,
    removedOverrides: result.removedOverrides,
    destination: placement.surface,
  }
}

export function prepareLessonDeleteWithFridge(input: {
  calendar: SchoolCalendar
  units: UnitWorkspace
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
  fridge: FridgeDoorState
  lessonId: string
}): { lessons: LessonWorkspace; fridge: FridgeDoorState } {
  const lessons = deleteLesson({
    calendar: input.calendar,
    units: input.units,
    lessons: input.lessons,
    overrides: input.overrides,
    lessonId: input.lessonId,
  })
  const fridge = removeEntityReference(input.fridge, `lesson:${input.lessonId}`)
  assertValidFridge(fridge, input.units, lessons)
  return { lessons, fridge }
}

export function prepareUnitDeleteWithFridge(input: {
  calendar: SchoolCalendar
  units: UnitWorkspace
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
  fridge: FridgeDoorState
  unitId: string
}): { units: UnitWorkspace; fridge: FridgeDoorState } {
  const units = deleteUnit({
    calendar: input.calendar,
    units: input.units,
    lessons: input.lessons,
    overrides: input.overrides,
    unitId: input.unitId,
  })
  const fridge = removeEntityReference(input.fridge, `unit:${input.unitId}`)
  assertValidFridge(fridge, units, input.lessons)
  return { units, fridge }
}

function assertValidFridge(fridge: FridgeDoorState, units: UnitWorkspace, lessons: LessonWorkspace): void {
  const errors = validateFridgeDoorState(fridge, units.units, lessons.lessons)
  if (errors.length > 0) throw new Error(`Arc could not reconcile Fridge Door state. ${errors.join(' ')}`)
}
