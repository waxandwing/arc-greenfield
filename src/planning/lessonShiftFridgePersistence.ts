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
  let previousFridge: string | null

  try {
    previousLessons = window.localStorage.getItem(LESSON_STORAGE_KEY)
    previousShift = window.localStorage.getItem(SHIFT_STORAGE_KEY)
    previousFridge = window.localStorage.getItem(FRIDGE_DOOR_STORAGE_KEY)
  } catch {
    return { saved: false, rollbackSucceeded: true, failedAt: 'snapshot' }
  }

  let lessonWritten = false
  let shiftWritten = false

  try {
    window.localStorage.setItem(LESSON_STORAGE_KEY, serializeLessons(lessonInput))
    lessonWritten = true
  } catch {
    return { saved: false, rollbackSucceeded: true, failedAt: 'lesson' }
  }

  try {
    window.localStorage.setItem(SHIFT_STORAGE_KEY, serializeShiftState(shiftInput))
    shiftWritten = true
  } catch {
    const rollbackSucceeded = restoreStorageValue(LESSON_STORAGE_KEY, previousLessons)
    return { saved: false, rollbackSucceeded, failedAt: 'shift' }
  }

  try {
    window.localStorage.setItem(FRIDGE_DOOR_STORAGE_KEY, serializeFridgeDoorState(fridgeState))
    return { saved: true, rollbackSucceeded: true, failedAt: null }
  } catch {
    const shiftRollback = shiftWritten ? restoreStorageValue(SHIFT_STORAGE_KEY, previousShift) : true
    const lessonRollback = lessonWritten ? restoreStorageValue(LESSON_STORAGE_KEY, previousLessons) : true
    const fridgeRollback = restoreStorageValue(FRIDGE_DOOR_STORAGE_KEY, previousFridge)
    return {
      saved: false,
      rollbackSucceeded: lessonRollback && shiftRollback && fridgeRollback,
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
