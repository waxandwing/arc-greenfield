import { createEmptyFridgeDoorState, placeEntity } from './fridgeDoor'
import { FRIDGE_DOOR_STORAGE_KEY, serializeFridgeDoorState } from './fridgeDoorPersistence'
import type { LessonWorkspaceInput } from './lessonWorkspace'
import { LESSON_STORAGE_KEY, serializeLessons } from './lessonPersistence'
import { saveLessonShiftAndFridgeStateToBrowser } from './lessonShiftFridgePersistence'
import { SHIFT_STORAGE_KEY, serializeShiftState, type ShiftPersistenceInput } from './shiftPersistence'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

class FaultInjectingStorage {
  private readonly values = new Map<string, string>()
  failGetKey: string | null = null
  failSetKey: string | null = null
  failRemoveKey: string | null = null

  getItem(key: string): string | null {
    if (this.failGetKey === key) throw new Error(`Injected get failure for ${key}`)
    return this.values.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    if (this.failSetKey === key) throw new Error(`Injected set failure for ${key}`)
    this.values.set(key, value)
  }
  removeItem(key: string): void {
    if (this.failRemoveKey === key) throw new Error(`Injected remove failure for ${key}`)
    this.values.delete(key)
  }
  seed(key: string, value: string): void { this.values.set(key, value) }
  clearFailures(): void { this.failGetKey = null; this.failSetKey = null; this.failRemoveKey = null }
}

const lessons: LessonWorkspaceInput = {
  calendarId: 'calendar-test',
  lessons: [],
  deliveryStates: [],
}
const shift: ShiftPersistenceInput = {
  calendarId: 'calendar-test',
  overrides: [],
  undo: null,
}
const fridge = placeEntity(createEmptyFridgeDoorState(), 'lesson:lesson-a', 'door', 0, 0)

const storage = new FaultInjectingStorage()
Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage } })

{
  const result = saveLessonShiftAndFridgeStateToBrowser(lessons, shift, fridge)
  assert(result.saved && result.rollbackSucceeded && result.failedAt === null, 'Healthy storage must save Lesson, Shift, and Fridge together.')
  assert(storage.getItem(LESSON_STORAGE_KEY) === serializeLessons(lessons), 'Healthy save must write Lesson snapshot.')
  assert(storage.getItem(SHIFT_STORAGE_KEY) === serializeShiftState(shift), 'Healthy save must write Shift snapshot.')
  assert(storage.getItem(FRIDGE_DOOR_STORAGE_KEY) === serializeFridgeDoorState(fridge), 'Healthy save must write Fridge snapshot.')
}

const previousLessons = JSON.stringify({ previous: 'lessons' })
const previousShift = JSON.stringify({ previous: 'shift' })
const previousFridge = JSON.stringify({ previous: 'fridge' })

function seedPrevious(): void {
  storage.clearFailures()
  storage.seed(LESSON_STORAGE_KEY, previousLessons)
  storage.seed(SHIFT_STORAGE_KEY, previousShift)
  storage.seed(FRIDGE_DOOR_STORAGE_KEY, previousFridge)
}

{
  seedPrevious()
  storage.failGetKey = SHIFT_STORAGE_KEY
  const result = saveLessonShiftAndFridgeStateToBrowser(lessons, shift, fridge)
  storage.clearFailures()
  assert(!result.saved && result.failedAt === 'snapshot', 'Snapshot failure must fail before any write.')
  assert(storage.getItem(LESSON_STORAGE_KEY) === previousLessons, 'Snapshot failure must preserve Lesson state.')
  assert(storage.getItem(SHIFT_STORAGE_KEY) === previousShift, 'Snapshot failure must preserve Shift state.')
  assert(storage.getItem(FRIDGE_DOOR_STORAGE_KEY) === previousFridge, 'Snapshot failure must preserve Fridge state.')
}

{
  seedPrevious()
  storage.failSetKey = LESSON_STORAGE_KEY
  const result = saveLessonShiftAndFridgeStateToBrowser(lessons, shift, fridge)
  storage.clearFailures()
  assert(!result.saved && result.failedAt === 'lesson' && result.rollbackSucceeded, 'First write failure must fail closed without rollback debt.')
  assert(storage.getItem(LESSON_STORAGE_KEY) === previousLessons, 'Lesson write failure must preserve Lesson state.')
  assert(storage.getItem(SHIFT_STORAGE_KEY) === previousShift, 'Lesson write failure must not touch Shift state.')
  assert(storage.getItem(FRIDGE_DOOR_STORAGE_KEY) === previousFridge, 'Lesson write failure must not touch Fridge state.')
}

{
  seedPrevious()
  storage.failSetKey = SHIFT_STORAGE_KEY
  const result = saveLessonShiftAndFridgeStateToBrowser(lessons, shift, fridge)
  storage.clearFailures()
  assert(!result.saved && result.failedAt === 'shift' && result.rollbackSucceeded, 'Second write failure must roll Lesson back.')
  assert(storage.getItem(LESSON_STORAGE_KEY) === previousLessons, 'Shift write failure must restore exact prior Lesson state.')
  assert(storage.getItem(SHIFT_STORAGE_KEY) === previousShift, 'Shift write failure must preserve exact prior Shift state.')
  assert(storage.getItem(FRIDGE_DOOR_STORAGE_KEY) === previousFridge, 'Shift write failure must not touch Fridge state.')
}

{
  seedPrevious()
  storage.failSetKey = FRIDGE_DOOR_STORAGE_KEY
  const result = saveLessonShiftAndFridgeStateToBrowser(lessons, shift, fridge)
  storage.clearFailures()
  assert(!result.saved && result.failedAt === 'fridge' && result.rollbackSucceeded, 'Third write failure must roll both completed writes back.')
  assert(storage.getItem(LESSON_STORAGE_KEY) === previousLessons, 'Fridge write failure must restore exact prior Lesson state.')
  assert(storage.getItem(SHIFT_STORAGE_KEY) === previousShift, 'Fridge write failure must restore exact prior Shift state.')
  assert(storage.getItem(FRIDGE_DOOR_STORAGE_KEY) === previousFridge, 'Fridge write failure must preserve exact prior Fridge state.')
}

{
  storage.clearFailures()
  storage.removeItem(LESSON_STORAGE_KEY)
  storage.removeItem(SHIFT_STORAGE_KEY)
  storage.removeItem(FRIDGE_DOOR_STORAGE_KEY)
  storage.failSetKey = FRIDGE_DOOR_STORAGE_KEY
  const result = saveLessonShiftAndFridgeStateToBrowser(lessons, shift, fridge)
  storage.clearFailures()
  assert(!result.saved && result.rollbackSucceeded, 'Failure from empty storage must roll all completed writes back to empty.')
  assert(storage.getItem(LESSON_STORAGE_KEY) === null, 'Empty rollback must remove Lesson write.')
  assert(storage.getItem(SHIFT_STORAGE_KEY) === null, 'Empty rollback must remove Shift write.')
  assert(storage.getItem(FRIDGE_DOOR_STORAGE_KEY) === null, 'Empty rollback must leave Fridge empty.')
}

{
  storage.clearFailures()
  storage.removeItem(LESSON_STORAGE_KEY)
  storage.removeItem(SHIFT_STORAGE_KEY)
  storage.removeItem(FRIDGE_DOOR_STORAGE_KEY)
  storage.failSetKey = FRIDGE_DOOR_STORAGE_KEY
  storage.failRemoveKey = SHIFT_STORAGE_KEY
  const result = saveLessonShiftAndFridgeStateToBrowser(lessons, shift, fridge)
  storage.clearFailures()
  assert(!result.saved && result.failedAt === 'fridge', 'Rollback failure must never report a successful save.')
  assert(!result.rollbackSucceeded, 'Arc must explicitly report rollback failure when any completed store cannot be restored.')
}

console.log('lesson + shift + Fridge persistence hostile contract passed')
