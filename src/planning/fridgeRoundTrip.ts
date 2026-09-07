import type { ISODate } from '../calendar/types'
import type { LessonWorkspace } from './lessonWorkspace'
import type { SectionLessonDateOverride } from './sectionSchedule'
import type { LessonActionContext } from './objectActions'
import { scheduleLessonFromFridge, sendLessonToFridge } from './objectActions'

export type FridgeRoundTripReceipt = {
  lessonId: string
  beforeLessons: LessonWorkspace
  beforeOverrides: SectionLessonDateOverride[]
}

export type FridgeRoundTripResult = {
  lessons: LessonWorkspace
  overrides: SectionLessonDateOverride[]
  undo: FridgeRoundTripReceipt
}

function receipt(input: LessonActionContext & { lessonId: string }): FridgeRoundTripReceipt {
  return {
    lessonId: input.lessonId,
    beforeLessons: input.lessons,
    beforeOverrides: input.overrides.map((override) => ({ ...override })),
  }
}

export function moveLessonToFridge(
  input: LessonActionContext & { lessonId: string },
): FridgeRoundTripResult {
  const undo = receipt(input)
  const result = sendLessonToFridge(input)
  return {
    lessons: result.lessons,
    overrides: result.overrides,
    undo,
  }
}

export function moveLessonFromFridge(
  input: LessonActionContext & { lessonId: string; plannedDate: ISODate },
): FridgeRoundTripResult {
  const undo = receipt(input)
  return {
    lessons: scheduleLessonFromFridge(input),
    overrides: input.overrides,
    undo,
  }
}

export function undoFridgeRoundTrip(receipt: FridgeRoundTripReceipt) {
  return {
    lessons: receipt.beforeLessons,
    overrides: receipt.beforeOverrides.map((override) => ({ ...override })),
  }
}
