import type { LessonWorkspaceInput } from './lessonWorkspace'
import { LESSON_STORAGE_KEY, serializeLessons } from './lessonPersistence'
import type { ShiftPersistenceInput } from './shiftPersistence'
import { SHIFT_STORAGE_KEY, serializeShiftState } from './shiftPersistence'

export type LessonShiftSaveResult = {
  saved: boolean
  rollbackSucceeded: boolean
}

export function saveLessonAndShiftStateToBrowser(
  lessonInput: LessonWorkspaceInput,
  shiftInput: ShiftPersistenceInput,
): LessonShiftSaveResult {
  let previousLessons: string | null
  let previousShift: string | null

  try {
    previousLessons = window.localStorage.getItem(LESSON_STORAGE_KEY)
    previousShift = window.localStorage.getItem(SHIFT_STORAGE_KEY)
  } catch {
    return { saved: false, rollbackSucceeded: true }
  }

  try {
    window.localStorage.setItem(LESSON_STORAGE_KEY, serializeLessons(lessonInput))
    window.localStorage.setItem(SHIFT_STORAGE_KEY, serializeShiftState(shiftInput))
    return { saved: true, rollbackSucceeded: true }
  } catch {
    const lessonRestored = restoreStorageValue(LESSON_STORAGE_KEY, previousLessons)
    const shiftRestored = restoreStorageValue(SHIFT_STORAGE_KEY, previousShift)
    return { saved: false, rollbackSucceeded: lessonRestored && shiftRestored }
  }
}

function restoreStorageValue(key: string, previous: string | null): boolean {
  try {
    if (previous === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, previous)
    return true
  } catch {
    return false
  }
}
