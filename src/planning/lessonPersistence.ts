import type { SchoolCalendar } from '../calendar'
import type { PlanningWorkspace } from './workspace'
import type { UnitWorkspace } from './unitWorkspace'
import { hydrateLessonWorkspace, type LessonWorkspace, type LessonWorkspaceInput } from './lessonWorkspace'

export const LESSON_STORAGE_KEY = 'arc.lessons.v1'

type StoredLessons = {
  schemaVersion: 1
  input: LessonWorkspaceInput
}

export type LessonLoadResult =
  | { status: 'empty' }
  | { status: 'restored'; workspace: LessonWorkspace; input: LessonWorkspaceInput }
  | { status: 'invalid' }
  | { status: 'unavailable' }

export function serializeLessons(input: LessonWorkspaceInput): string {
  return JSON.stringify({ schemaVersion: 1, input } satisfies StoredLessons)
}

export function deserializeLessons(raw: string): LessonWorkspaceInput | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredLessons>
    if (parsed.schemaVersion !== 1 || !parsed.input) return null
    if (typeof parsed.input.calendarId !== 'string') return null
    if (!Array.isArray(parsed.input.lessons) || !Array.isArray(parsed.input.deliveryStates)) return null
    return {
      calendarId: parsed.input.calendarId,
      lessons: parsed.input.lessons.map((lesson) => ({
        ...lesson,
        datePolicy: lesson.datePolicy === 'fixed' ? 'fixed' : 'flexible',
      })),
      deliveryStates: parsed.input.deliveryStates.map((state) => ({ ...state })),
    }
  } catch {
    return null
  }
}

export function saveLessonsToBrowser(input: LessonWorkspaceInput): boolean {
  try {
    window.localStorage.setItem(LESSON_STORAGE_KEY, serializeLessons(input))
    return true
  } catch {
    return false
  }
}

export function loadLessonsFromBrowser(
  calendar: SchoolCalendar,
  planning: PlanningWorkspace,
  units: UnitWorkspace,
): LessonLoadResult {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(LESSON_STORAGE_KEY)
  } catch {
    return { status: 'unavailable' }
  }

  if (!raw) return { status: 'empty' }
  const input = deserializeLessons(raw)
  if (!input || input.calendarId !== calendar.id) return input ? { status: 'empty' } : { status: 'invalid' }

  try {
    return { status: 'restored', workspace: hydrateLessonWorkspace(input, calendar, planning, units), input }
  } catch {
    return { status: 'invalid' }
  }
}
