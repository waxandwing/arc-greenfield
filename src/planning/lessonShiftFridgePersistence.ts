import type { FridgeDoorState } from './fridgeDoor'
import { FRIDGE_DOOR_STORAGE_KEY, serializeFridgeDoorState } from './fridgeDoorPersistence'
import type { LessonWorkspaceInput } from './lessonWorkspace'
import { LESSON_STORAGE_KEY, serializeLessons } from './lessonPersistence'
import type { ShiftPersistenceInput } from './shiftPersistence'
import { SHIFT_STORAGE_KEY, serializeShiftState } from './shiftPersistence'

export type LessonShiftFridgeSaveResult = {
  saved: boolean
  rollbackSucceeded: boolean
  failedAt: 'snapshot' | 'lesson' | 'shift' | 'fridge' | null
}

export function saveLessonShiftAndFridgeStateToBrowser(
  lessonInput: LessonWorkspaceInput,
  shiftInput: ShiftPersistenceInput,
  fridgeState: FridgeDoorState,
): LessonShiftFridgeSaveResult {
  let previousLessons: string | null
  let previousShift: string | null

  try {
    previousLessons = window.localStorage.getItem(LESSON_STORAGE_KEY)
    previousShift = window.localStorage.getItem(SHIFT_STORAGE_KEY)
    window.localStorage.getItem(FRIDGE_DOOR_STORAGE_KEY)
  } catch {
    return { saved: false, rollbackSucceeded: true, failedAt: 'snapshot' }
  }

  try {
    window.localStorage.setItem(LESSON_STORAGE_KEY, serializeLessons(lessonInput))
  } catch {
    return { saved: false, rollbackSucceeded: true, failedAt: 'lesson' }
  }

  try {
    window.localStorage.setItem(SHIFT_STORAGE_KEY, serializeShiftState(shiftInput))
  } catch {
    const rollbackSucceeded = restoreStorageValue(LESSON_STORAGE_KEY, previousLessons)
    return { saved: false, rollbackSucceeded, failedAt: 'shift' }
  }

  try {
    window.localStorage.setItem(FRIDGE_DOOR_STORAGE_KEY, serializeFridgeDoorState(fridgeState))
    return { saved: true, rollbackSucceeded: true, failedAt: null }
  } catch {
    // The Fridge write did not complete, so only the two completed writes need rollback.
    // Attempt both restorations independently so one rollback failure cannot prevent the other.
    const shiftRollback = restoreStorageValue(SHIFT_STORAGE_KEY, previousShift)
    const lessonRollback = restoreStorageValue(LESSON_STORAGE_KEY, previousLessons)
    return {
      saved: false,
      rollbackSucceeded: lessonRollback && shiftRollback,
      failedAt: 'fridge',
    }
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
