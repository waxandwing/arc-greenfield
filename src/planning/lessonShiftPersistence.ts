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

  try {
    previousLessons = window.localStorage.getItem(LESSON_STORAGE_KEY)
  } catch {
    return { saved: false, rollbackSucceeded: true }
  }

  let lessonWritten = false
  try {
    window.localStorage.setItem(LESSON_STORAGE_KEY, serializeLessons(lessonInput))
    lessonWritten = true
    window.localStorage.setItem(SHIFT_STORAGE_KEY, serializeShiftState(shiftInput))
    return { saved: true, rollbackSucceeded: true }
  } catch {
    if (!lessonWritten) return { saved: false, rollbackSucceeded: true }
    return { saved: false, rollbackSucceeded: restoreStorageValue(LESSON_STORAGE_KEY, previousLessons) }
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
