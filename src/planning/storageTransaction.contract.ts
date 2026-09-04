import { commitStorageTransaction, type TransactionalStorage } from './storageTransaction'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

class FaultStorage implements TransactionalStorage {
  private data = new Map<string, string>()
  failSetKey: string | null = null
  failRollbackKey: string | null = null
  private failureTriggered = false

  constructor(initial: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initial)) this.data.set(key, value)
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    if (!this.failureTriggered && this.failSetKey === key) {
      this.failureTriggered = true
      throw new Error(`Injected write failure for ${key}`)
    }
    if (this.failureTriggered && this.failRollbackKey === key) throw new Error(`Injected rollback failure for ${key}`)
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    if (this.failureTriggered && this.failRollbackKey === key) throw new Error(`Injected rollback failure for ${key}`)
    this.data.delete(key)
  }
}

const lessonKey = 'arc.lessons.v1'
const shiftKey = 'arc.shift.v1'
const fridgeKey = 'arc.fridgeDoor.v1'

{
  const storage = new FaultStorage({ [lessonKey]: 'lessons-old', [shiftKey]: 'shift-old', [fridgeKey]: 'fridge-old' })
  const result = commitStorageTransaction(storage, [
    { key: lessonKey, value: 'lessons-new' },
    { key: shiftKey, value: 'shift-new' },
    { key: fridgeKey, value: 'fridge-new' },
  ])
  assert(result.ok, 'A healthy transaction must commit all records.')
  assert(storage.getItem(lessonKey) === 'lessons-new', 'Lesson record did not commit.')
  assert(storage.getItem(shiftKey) === 'shift-new', 'Shift record did not commit.')
  assert(storage.getItem(fridgeKey) === 'fridge-new', 'Fridge record did not commit.')
}

{
  const storage = new FaultStorage({ [lessonKey]: 'lessons-old', [shiftKey]: 'shift-old', [fridgeKey]: 'fridge-old' })
  storage.failSetKey = shiftKey
  const result = commitStorageTransaction(storage, [
    { key: lessonKey, value: 'lessons-new' },
    { key: shiftKey, value: 'shift-new' },
    { key: fridgeKey, value: 'fridge-new' },
  ])
  assert(!result.ok && result.failedKey === shiftKey, 'Second-write failure must be reported at Shift.')
  assert(result.rollbackComplete, 'Second-write failure must restore earlier writes.')
  assert(storage.getItem(lessonKey) === 'lessons-old', 'Lesson write was not rolled back after Shift failure.')
  assert(storage.getItem(shiftKey) === 'shift-old', 'Failed Shift write changed persisted Shift state.')
  assert(storage.getItem(fridgeKey) === 'fridge-old', 'Fridge must remain untouched after earlier failure.')
}

{
  const storage = new FaultStorage({ [lessonKey]: 'lessons-old', [shiftKey]: 'shift-old' })
  storage.failSetKey = fridgeKey
  const result = commitStorageTransaction(storage, [
    { key: lessonKey, value: 'lessons-new' },
    { key: shiftKey, value: 'shift-new' },
    { key: fridgeKey, value: 'fridge-new' },
  ])
  assert(!result.ok && result.failedKey === fridgeKey, 'Third-write failure must be reported at Fridge.')
  assert(result.rollbackComplete, 'Fridge failure must restore Lesson and Shift records.')
  assert(storage.getItem(lessonKey) === 'lessons-old', 'Lesson write was not rolled back after Fridge failure.')
  assert(storage.getItem(shiftKey) === 'shift-old', 'Shift write was not rolled back after Fridge failure.')
  assert(storage.getItem(fridgeKey) === null, 'A failed first Fridge creation must not leave a new Fridge record behind.')
}

{
  const storage = new FaultStorage({ [lessonKey]: 'lessons-old', [shiftKey]: 'shift-old' })
  storage.failSetKey = fridgeKey
  storage.failRollbackKey = lessonKey
  const result = commitStorageTransaction(storage, [
    { key: lessonKey, value: 'lessons-new' },
    { key: shiftKey, value: 'shift-new' },
    { key: fridgeKey, value: 'fridge-new' },
  ])
  assert(!result.ok && !result.rollbackComplete, 'Rollback failure must be surfaced instead of reported as safe.')
}

{
  const storage = new FaultStorage()
  let blocked = false
  try {
    commitStorageTransaction(storage, [
      { key: lessonKey, value: 'a' },
      { key: lessonKey, value: 'b' },
    ])
  } catch {
    blocked = true
  }
  assert(blocked, 'Duplicate keys must be rejected before any write begins.')
}

console.log('Storage transaction fault-injection contract passed.')
