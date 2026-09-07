import { EMPTY_TASK_BAR, normalizeTaskBarWorkspace, type TaskBarWorkspace } from './taskBar'

const STORAGE_KEY = 'arc.task-bar.v1'

export type TaskBarLoadResult =
  | { status: 'empty'; workspace: TaskBarWorkspace }
  | { status: 'restored'; workspace: TaskBarWorkspace }
  | { status: 'invalid'; workspace: TaskBarWorkspace }
  | { status: 'unavailable'; workspace: TaskBarWorkspace }

export function loadTaskBar(storage: Pick<Storage, 'getItem'> | null = browserStorage()): TaskBarLoadResult {
  if (!storage) return { status: 'unavailable', workspace: EMPTY_TASK_BAR }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { status: 'empty', workspace: EMPTY_TASK_BAR }
    const parsed = JSON.parse(raw)
    const normalized = normalizeTaskBarWorkspace(parsed)
    if (!parsed || typeof parsed !== 'object' || (parsed as { version?: unknown }).version !== 1 || !Array.isArray((parsed as { items?: unknown }).items)) {
      return { status: 'invalid', workspace: EMPTY_TASK_BAR }
    }
    return { status: 'restored', workspace: normalized }
  } catch {
    return { status: 'invalid', workspace: EMPTY_TASK_BAR }
  }
}

export function saveTaskBar(workspace: TaskBarWorkspace, storage: Pick<Storage, 'setItem'> | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(workspace))
    return true
  } catch {
    return false
  }
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
