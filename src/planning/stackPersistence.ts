import { EMPTY_STACK_WORKSPACE, normalizeStackWorkspace, type StackWorkspace } from './stacks'

export const STACK_STORAGE_KEY = 'arc.object-stacks.v1'

export function serializeStackWorkspace(workspace: StackWorkspace): string {
  return JSON.stringify(workspace)
}

export function deserializeStackWorkspace(raw: string, calendarId: string): StackWorkspace | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    const normalized = normalizeStackWorkspace(parsed, calendarId)
    if (normalized.calendarId !== calendarId) return EMPTY_STACK_WORKSPACE(calendarId)
    return normalized
  } catch {
    return null
  }
}

export function loadStackWorkspace(calendarId: string, storage: Pick<Storage, 'getItem'> | null = browserStorage()): StackWorkspace {
  if (!storage) return EMPTY_STACK_WORKSPACE(calendarId)
  try {
    const raw = storage.getItem(STACK_STORAGE_KEY)
    if (!raw) return EMPTY_STACK_WORKSPACE(calendarId)
    return deserializeStackWorkspace(raw, calendarId) ?? EMPTY_STACK_WORKSPACE(calendarId)
  } catch {
    return EMPTY_STACK_WORKSPACE(calendarId)
  }
}

export function saveStackWorkspace(workspace: StackWorkspace, storage: Pick<Storage, 'setItem'> | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(STACK_STORAGE_KEY, serializeStackWorkspace(workspace))
    return true
  } catch {
    return false
  }
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
