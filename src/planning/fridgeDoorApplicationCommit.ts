import { serializeFridgeDoor, type FridgeDoorPersistenceInput } from './fridgeDoorPersistence'
import { serializeLessons } from './lessonPersistence'
import type { LessonWorkspaceInput } from './lessonWorkspace'
import { serializeShiftState, type ShiftPersistenceInput } from './shiftPersistence'
import { commitStorageTransaction, type StorageTransactionResult, type TransactionalStorage } from './storageTransaction'
import { serializeUnits } from './unitPersistence'
import type { UnitWorkspaceInput } from './unitWorkspace'

export const ARC_UNITS_STORAGE_KEY = 'arc.units.v1'
export const ARC_LESSONS_STORAGE_KEY = 'arc.lessons.v1'
export const ARC_SHIFT_STORAGE_KEY = 'arc.shift.v1'
export const ARC_FRIDGE_STORAGE_KEY = 'arc.fridgeDoor.v1'

export function commitLessonUnplacePersistence(
  storage: TransactionalStorage,
  input: {
    lessons: LessonWorkspaceInput
    shift: ShiftPersistenceInput
    fridge: FridgeDoorPersistenceInput
  },
): StorageTransactionResult {
  return commitStorageTransaction(storage, [
    { key: ARC_LESSONS_STORAGE_KEY, value: serializeLessons(input.lessons) },
    { key: ARC_SHIFT_STORAGE_KEY, value: serializeShiftState(input.shift) },
    { key: ARC_FRIDGE_STORAGE_KEY, value: serializeFridgeDoor(input.fridge) },
  ])
}

export function commitLessonDeletePersistence(
  storage: TransactionalStorage,
  input: {
    lessons: LessonWorkspaceInput
    fridge: FridgeDoorPersistenceInput
  },
): StorageTransactionResult {
  return commitStorageTransaction(storage, [
    { key: ARC_LESSONS_STORAGE_KEY, value: serializeLessons(input.lessons) },
    { key: ARC_FRIDGE_STORAGE_KEY, value: serializeFridgeDoor(input.fridge) },
  ])
}

export function commitUnitDeletePersistence(
  storage: TransactionalStorage,
  input: {
    units: UnitWorkspaceInput
    fridge: FridgeDoorPersistenceInput
  },
): StorageTransactionResult {
  return commitStorageTransaction(storage, [
    { key: ARC_UNITS_STORAGE_KEY, value: serializeUnits(input.units) },
    { key: ARC_FRIDGE_STORAGE_KEY, value: serializeFridgeDoor(input.fridge) },
  ])
}
