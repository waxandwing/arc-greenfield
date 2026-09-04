import type { ISODate } from '../calendar'
import type { FridgeDoorState } from '../planning'

const STORAGE_KEY = 'arc.undo.v1'

export type ReversibleAction =
  | { kind: 'shift' }
  | { kind: 'lesson-move'; lessonId: string; previousDate: ISODate | null; beforeFridge: FridgeDoorState }
  | { kind: 'fridge'; label: string; beforeFridge: FridgeDoorState }

export type ReversibleActionSlot = {
  action: ReversibleAction | null
  supersedesShift: boolean
}

type StoredSlot = {
  schemaVersion: 1
  calendarId: string
  action: ReversibleAction | null
  supersedesShift: boolean
}

export function loadReversibleActionSlot(calendarId: string | null): ReversibleActionSlot {
  if (!calendarId) return { action: null, supersedesShift: false }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { action: null, supersedesShift: false }
    const parsed = JSON.parse(raw) as Partial<StoredSlot>
    if (parsed.schemaVersion !== 1 || parsed.calendarId !== calendarId || typeof parsed.supersedesShift !== 'boolean') {
      return { action: null, supersedesShift: false }
    }
    if (parsed.action === null) return { action: null, supersedesShift: parsed.supersedesShift }
    if (!isReversibleAction(parsed.action)) return { action: null, supersedesShift: true }
    return { action: cloneAction(parsed.action), supersedesShift: parsed.supersedesShift }
  } catch {
    return { action: null, supersedesShift: true }
  }
}

export function saveReversibleActionSlot(calendarId: string, slot: ReversibleActionSlot): boolean {
  try {
    const stored: StoredSlot = {
      schemaVersion: 1,
      calendarId,
      action: slot.action ? cloneAction(slot.action) : null,
      supersedesShift: slot.supersedesShift,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    return true
  } catch {
    return false
  }
}

function isReversibleAction(value: unknown): value is ReversibleAction {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ReversibleAction>
  if (candidate.kind === 'shift') return true
  if (candidate.kind === 'fridge') {
    return typeof candidate.label === 'string' && isFridgeState(candidate.beforeFridge)
  }
  if (candidate.kind === 'lesson-move') {
    return typeof candidate.lessonId === 'string'
      && (candidate.previousDate === null || typeof candidate.previousDate === 'string')
      && isFridgeState(candidate.beforeFridge)
  }
  return false
}

function isFridgeState(value: unknown): value is FridgeDoorState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<FridgeDoorState>
  if (!Array.isArray(candidate.magnets) || !Array.isArray(candidate.placements)) return false
  return candidate.magnets.every((item) => item && typeof item.id === 'string' && typeof item.title === 'string')
    && candidate.placements.every((item) => item
      && typeof item.entityRef === 'string'
      && (item.surface === 'door' || item.surface === 'drawer')
      && Number.isInteger(item.row)
      && Number.isInteger(item.column)
      && (item.stackId === null || typeof item.stackId === 'string')
      && (item.stackOrder === null || Number.isInteger(item.stackOrder))
      && (item.priority === null || item.priority === 'must' || item.priority === 'should' || item.priority === 'could'))
}

function cloneAction(action: ReversibleAction): ReversibleAction {
  if (action.kind === 'shift') return { kind: 'shift' }
  if (action.kind === 'fridge') return { kind: 'fridge', label: action.label, beforeFridge: cloneFridge(action.beforeFridge) }
  return { kind: 'lesson-move', lessonId: action.lessonId, previousDate: action.previousDate, beforeFridge: cloneFridge(action.beforeFridge) }
}

function cloneFridge(state: FridgeDoorState): FridgeDoorState {
  return {
    magnets: state.magnets.map((item) => ({ ...item })),
    placements: state.placements.map((item) => ({ ...item })),
  }
}
