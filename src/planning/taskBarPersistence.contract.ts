import { addTask, createTaskBarItem, EMPTY_TASK_BAR } from './taskBar'
import { loadTaskBar, saveTaskBar } from './taskBarPersistence'

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const storage = new MemoryStorage()
check(loadTaskBar(storage).status === 'empty', 'Fresh Task Bar persistence must distinguish empty state.')
const workspace = addTask(EMPTY_TASK_BAR, createTaskBarItem('Print critique sheets', 'must', new Date('2026-09-07T12:00:00-04:00'), 'task-persist'))
check(saveTaskBar(workspace, storage), 'Task Bar save must report successful persistence.')
const restored = loadTaskBar(storage)
check(restored.status === 'restored', 'Saved Task Bar must restore as restored state.')
check(restored.workspace.items[0]?.id === 'task-persist', 'Task Bar reload must preserve stable ID.')
check(restored.workspace.items[0]?.text === 'Print critique sheets', 'Task Bar reload must preserve task text.')

const malformed = new MemoryStorage()
malformed.setItem('arc.task-bar.v1', '{not-json')
const invalid = loadTaskBar(malformed)
check(invalid.status === 'invalid' && invalid.workspace.items.length === 0, 'Malformed Task Bar persistence must fail closed to an explicit invalid result.')

console.log('Task Bar persistence contract passed')
