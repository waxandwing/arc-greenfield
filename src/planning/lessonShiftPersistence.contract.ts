import { LESSON_STORAGE_KEY, serializeLessons } from './lessonPersistence'
import { saveLessonAndShiftStateToBrowser } from './lessonShiftPersistence'
import { SHIFT_STORAGE_KEY, serializeShiftState, type ShiftPersistenceInput } from './shiftPersistence'
import type { LessonWorkspaceInput } from './lessonWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

class FaultInjectingStorage {
  private readonly values = new Map<string, string>()
  failSetKey: string | null = null
  failRemoveKey: string | null = null

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void {
    if (this.failSetKey === key) throw new Error(`Injected set failure for ${key}`)
    this.values.set(key, value)
  }
  removeItem(key: string): void {
    if (this.failRemoveKey === key) throw new Error(`Injected remove failure for ${key}`)
    this.values.delete(key)
  }
  seed(key: string, value: string): void { this.values.set(key, value) }
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

const storage = new FaultInjectingStorage()
Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage } })

const success = saveLessonAndShiftStateToBrowser(lessons, shift)
assert(success.saved && success.rollbackSucceeded, 'A healthy browser store must save both Lesson and Shift state.')
assert(storage.getItem(LESSON_STORAGE_KEY) === serializeLessons(lessons), 'Successful save must write the Lesson snapshot.')
assert(storage.getItem(SHIFT_STORAGE_KEY) === serializeShiftState(shift), 'Successful save must write the Shift snapshot.')

const previousLessons = JSON.stringify({ previous: 'lessons' })
const previousShift = JSON.stringify({ previous: 'shift' })
storage.seed(LESSON_STORAGE_KEY, previousLessons)
storage.seed(SHIFT_STORAGE_KEY, previousShift)
storage.failSetKey = SHIFT_STORAGE_KEY
const failedSecondWrite = saveLessonAndShiftStateToBrowser(lessons, shift)
storage.failSetKey = null
assert(!failedSecondWrite.saved, 'Failure of the second write must fail the combined save.')
assert(failedSecondWrite.rollbackSucceeded, 'Failure of the second write must restore both prior values.')
assert(storage.getItem(LESSON_STORAGE_KEY) === previousLessons, 'Rollback must restore the exact prior Lesson value after Shift write failure.')
assert(storage.getItem(SHIFT_STORAGE_KEY) === previousShift, 'Rollback must preserve the exact prior Shift value after Shift write failure.')

storage.removeItem(LESSON_STORAGE_KEY)
storage.removeItem(SHIFT_STORAGE_KEY)
storage.failSetKey = SHIFT_STORAGE_KEY
const failedFromEmpty = saveLessonAndShiftStateToBrowser(lessons, shift)
storage.failSetKey = null
assert(!failedFromEmpty.saved && failedFromEmpty.rollbackSucceeded, 'A partial save from empty storage must roll back cleanly.')
assert(storage.getItem(LESSON_STORAGE_KEY) === null, 'Rollback from empty storage must remove a partially written Lesson value.')
assert(storage.getItem(SHIFT_STORAGE_KEY) === null, 'Rollback from empty storage must leave Shift storage empty.')

storage.seed(LESSON_STORAGE_KEY, previousLessons)
storage.seed(SHIFT_STORAGE_KEY, previousShift)
storage.failSetKey = SHIFT_STORAGE_KEY
storage.failRemoveKey = LESSON_STORAGE_KEY
const rollbackFailure = saveLessonAndShiftStateToBrowser(lessons, shift)
storage.failSetKey = null
storage.failRemoveKey = null
assert(!rollbackFailure.saved, 'A failed combined save must never report success.')
assert(rollbackFailure.rollbackSucceeded, 'Restoring a pre-existing Lesson value uses setItem and should remain recoverable in this scenario.')

console.log('lesson + shift persistence contract passed')
