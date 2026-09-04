import type { Lesson } from './lessons'
import type { SectionLessonDateOverride } from './sectionSchedule'
import type { Unit } from './units'
import {
  createEmptyFridgeDoorState,
  reconcileFridgeDoor,
  validateFridgeDoorState,
  type FridgeCapacity,
  type FridgeDoorState,
  type FridgePlacement,
} from './fridgeDoor'

export const FRIDGE_DOOR_STORAGE_KEY = 'arc.fridgeDoor.v1'

type StoredFridgeDoorState = {
  schemaVersion: 1
  state: FridgeDoorState
}

export type FridgeDoorLoadResult =
  | { status: 'empty'; state: FridgeDoorState }
  | { status: 'restored'; state: FridgeDoorState; repaired: boolean }
  | { status: 'invalid'; state: FridgeDoorState }
  | { status: 'unavailable'; state: FridgeDoorState }

export function serializeFridgeDoorState(state: FridgeDoorState): string {
  return JSON.stringify({ schemaVersion: 1, state } satisfies StoredFridgeDoorState)
}

export function deserializeFridgeDoorState(raw: string): FridgeDoorState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredFridgeDoorState>
    if (parsed.schemaVersion !== 1 || !parsed.state) return null
    if (!Array.isArray(parsed.state.magnets) || !Array.isArray(parsed.state.placements)) return null

    const magnets = parsed.state.magnets.map((candidate) => {
      if (!candidate || typeof candidate !== 'object') throw new Error('Invalid magnet.')
      const magnet = candidate as { id?: unknown; title?: unknown }
      if (typeof magnet.id !== 'string' || typeof magnet.title !== 'string') throw new Error('Invalid magnet.')
      return { id: magnet.id, title: magnet.title }
    })

    const placements: FridgePlacement[] = parsed.state.placements.map((candidate) => {
      if (!candidate || typeof candidate !== 'object') throw new Error('Invalid placement.')
      const item = candidate as Record<string, unknown>
      if (typeof item.entityRef !== 'string' || !/^(unit|lesson|magnet):.+/.test(item.entityRef)) throw new Error('Invalid entity ref.')
      if (item.surface !== 'door' && item.surface !== 'drawer') throw new Error('Invalid surface.')
      if (typeof item.row !== 'number' || typeof item.column !== 'number') throw new Error('Invalid coordinates.')
      if (item.stackId !== null && typeof item.stackId !== 'string') throw new Error('Invalid stack ID.')
      if (item.stackOrder !== null && typeof item.stackOrder !== 'number') throw new Error('Invalid stack order.')
      if (item.priority !== null && item.priority !== 'must' && item.priority !== 'should' && item.priority !== 'could') throw new Error('Invalid priority.')
      return {
        entityRef: item.entityRef as FridgePlacement['entityRef'],
        surface: item.surface,
        row: item.row,
        column: item.column,
        stackId: item.stackId as string | null,
        stackOrder: item.stackOrder as number | null,
        priority: item.priority as FridgePlacement['priority'],
      }
    })

    return { magnets, placements }
  } catch {
    return null
  }
}

export function saveFridgeDoorStateToBrowser(state: FridgeDoorState): boolean {
  try {
    window.localStorage.setItem(FRIDGE_DOOR_STORAGE_KEY, serializeFridgeDoorState(state))
    return true
  } catch {
    return false
  }
}

export function loadFridgeDoorStateFromBrowser(
  units: Unit[],
  lessons: Lesson[],
  overrides: SectionLessonDateOverride[],
  capacity: FridgeCapacity,
): FridgeDoorLoadResult {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(FRIDGE_DOOR_STORAGE_KEY)
  } catch {
    return { status: 'unavailable', state: createEmptyFridgeDoorState() }
  }

  if (!raw) {
    return {
      status: 'empty',
      state: reconcileFridgeDoor(createEmptyFridgeDoorState(), units, lessons, overrides, capacity),
    }
  }

  const parsed = deserializeFridgeDoorState(raw)
  if (!parsed) {
    return {
      status: 'invalid',
      state: reconcileFridgeDoor(createEmptyFridgeDoorState(), units, lessons, overrides, capacity),
    }
  }

  const validationErrors = validateFridgeDoorState(parsed, units, lessons)
  const reconciled = reconcileFridgeDoor(parsed, units, lessons, overrides, capacity)
  const repaired = validationErrors.length > 0 || serializeFridgeDoorState(reconciled) !== serializeFridgeDoorState(parsed)
  return { status: 'restored', state: reconciled, repaired }
}
