import { createEmptyFridgeDoorState } from './fridgeDoor'
import {
  ARC_FRIDGE_STORAGE_KEY,
  ARC_LESSONS_STORAGE_KEY,
  ARC_SHIFT_STORAGE_KEY,
  ARC_UNITS_STORAGE_KEY,
  commitLessonDeletePersistence,
  commitLessonUnplacePersistence,
  commitUnitDeletePersistence,
} from './fridgeDoorApplicationCommit'
import type { FridgeDoorPersistenceInput } from './fridgeDoorPersistence'
import type { LessonWorkspaceInput } from './lessonWorkspace'
import type { ShiftPersistenceInput } from './shiftPersistence'
import type { TransactionalStorage } from './storageTransaction'
import type { UnitWorkspaceInput } from './unitWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

class FaultStorage implements TransactionalStorage {
  private data = new Map<string, string>()
  failKey: string | null = null
  private failed = false

  constructor(initial: Record<string, string>) {
    for (const [key, value] of Object.entries(initial)) this.data.set(key, value)
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    if (!this.failed && key === this.failKey) {
      this.failed = true
      throw new Error(`Injected failure for ${key}`)
    }
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }
}

const lessons: LessonWorkspaceInput = { calendarId: 'calendar-a', lessons: [], deliveryStates: [] }
const shift: ShiftPersistenceInput = { calendarId: 'calendar-a', overrides: [], undo: null }
const fridge: FridgeDoorPersistenceInput = { calendarId: 'calendar-a', state: createEmptyFridgeDoorState() }
const units: UnitWorkspaceInput = { calendarId: 'calendar-a', units: [] }

{
  const storage = new FaultStorage({
    [ARC_LESSONS_STORAGE_KEY]: 'lessons-old',
    [ARC_SHIFT_STORAGE_KEY]: 'shift-old',
    [ARC_FRIDGE_STORAGE_KEY]: 'fridge-old',
  })
  storage.failKey = ARC_FRIDGE_STORAGE_KEY
  const result = commitLessonUnplacePersistence(storage, { lessons, shift, fridge })
  assert(!result.ok && result.rollbackComplete, 'Fridge failure during Unplace must fail closed with rollback.')
  assert(storage.getItem(ARC_LESSONS_STORAGE_KEY) === 'lessons-old', 'Failed Fridge write must not leave Lesson Unplace committed.')
  assert(storage.getItem(ARC_SHIFT_STORAGE_KEY) === 'shift-old', 'Failed Fridge write must not leave Shift changes committed.')
  assert(storage.getItem(ARC_FRIDGE_STORAGE_KEY) === 'fridge-old', 'Failed Fridge write must preserve prior Fridge state.')
}

{
  const storage = new FaultStorage({
    [ARC_LESSONS_STORAGE_KEY]: 'lessons-old',
    [ARC_SHIFT_STORAGE_KEY]: 'shift-old',
    [ARC_FRIDGE_STORAGE_KEY]: 'fridge-old',
  })
  storage.failKey = ARC_LESSONS_STORAGE_KEY
  const result = commitLessonUnplacePersistence(storage, { lessons, shift, fridge })
  assert(!result.ok, 'Lesson write failure must reject Unplace.')
  assert(storage.getItem(ARC_SHIFT_STORAGE_KEY) === 'shift-old', 'Failed Lesson write must not mutate Shift state.')
  assert(storage.getItem(ARC_FRIDGE_STORAGE_KEY) === 'fridge-old', 'Failed Lesson write must not mutate Fridge state.')
}

{
  const storage = new FaultStorage({
    [ARC_LESSONS_STORAGE_KEY]: 'lessons-old',
    [ARC_FRIDGE_STORAGE_KEY]: 'fridge-old',
  })
  storage.failKey = ARC_FRIDGE_STORAGE_KEY
  const result = commitLessonDeletePersistence(storage, { lessons, fridge })
  assert(!result.ok && result.rollbackComplete, 'Fridge failure during Lesson Delete must roll Lesson persistence back.')
  assert(storage.getItem(ARC_LESSONS_STORAGE_KEY) === 'lessons-old', 'Failed Lesson Delete Fridge reconciliation must preserve the canonical Lesson record.')
  assert(storage.getItem(ARC_FRIDGE_STORAGE_KEY) === 'fridge-old', 'Failed Lesson Delete must preserve the prior Fridge reference state.')
}

{
  const storage = new FaultStorage({
    [ARC_UNITS_STORAGE_KEY]: 'units-old',
    [ARC_FRIDGE_STORAGE_KEY]: 'fridge-old',
  })
  storage.failKey = ARC_FRIDGE_STORAGE_KEY
  const result = commitUnitDeletePersistence(storage, { units, fridge })
  assert(!result.ok && result.rollbackComplete, 'Fridge failure during Unit Delete must roll Unit persistence back.')
  assert(storage.getItem(ARC_UNITS_STORAGE_KEY) === 'units-old', 'Failed Unit Delete Fridge reconciliation must preserve the canonical Unit record.')
  assert(storage.getItem(ARC_FRIDGE_STORAGE_KEY) === 'fridge-old', 'Failed Unit Delete must preserve the prior Fridge reference state.')
}

{
  const storage = new FaultStorage({
    [ARC_LESSONS_STORAGE_KEY]: 'lessons-old',
    [ARC_SHIFT_STORAGE_KEY]: 'shift-old',
    [ARC_FRIDGE_STORAGE_KEY]: 'fridge-old',
  })
  const result = commitLessonUnplacePersistence(storage, { lessons, shift, fridge })
  assert(result.ok, 'Healthy Lesson Unplace persistence must commit all three records together.')
  assert(storage.getItem(ARC_LESSONS_STORAGE_KEY) !== 'lessons-old', 'Healthy Unplace did not commit Lesson state.')
  assert(storage.getItem(ARC_SHIFT_STORAGE_KEY) !== 'shift-old', 'Healthy Unplace did not commit Shift state.')
  assert(storage.getItem(ARC_FRIDGE_STORAGE_KEY) !== 'fridge-old', 'Healthy Unplace did not commit Fridge state.')
}

console.log('Fridge application atomic persistence contract passed.')
