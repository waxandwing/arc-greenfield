import type { SectionLessonDateOverride } from './sectionSchedule'
import type { Unit } from './units'
import type { Lesson } from './lessons'
import {
  reconcileFridgeDoor,
  validateFridgeDoorState,
  type FridgeCapacity,
  type FridgeDoorState,
  type FridgeEntityRef,
  type FridgePlacement,
  type FridgePriority,
  type FridgeSurface,
  type Magnet,
} from './fridgeDoor'

const STORAGE_KEY = 'arc.fridgeDoor.v1'

export type FridgeDoorPersistenceInput = {
  calendarId: string
  state: FridgeDoorState
}

type StoredFridgeDoor = {
  schemaVersion: 1
  input: FridgeDoorPersistenceInput
}

export type FridgeDoorLoadResult =
  | { status: 'empty' }
  | { status: 'restored'; input: FridgeDoorPersistenceInput; state: FridgeDoorState }
  | { status: 'invalid' }
  | { status: 'unavailable' }

export function serializeFridgeDoor(input: FridgeDoorPersistenceInput): string {
  return JSON.stringify({ schemaVersion: 1, input } satisfies StoredFridgeDoor)
}

export function deserializeFridgeDoor(raw: string): FridgeDoorPersistenceInput | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredFridgeDoor>
    if (parsed.schemaVersion !== 1 || !parsed.input || typeof parsed.input.calendarId !== 'string') return null
    const state = parseState(parsed.input.state)
    return state ? { calendarId: parsed.input.calendarId, state } : null
  } catch {
    return null
  }
}

export function restoreFridgeDoor(
  raw: string | null,
  calendarId: string,
  units: Unit[],
  lessons: Lesson[],
  overrides: SectionLessonDateOverride[],
  capacity: FridgeCapacity,
): FridgeDoorLoadResult {
  if (!raw) return { status: 'empty' }
  const input = deserializeFridgeDoor(raw)
  if (!input) return { status: 'invalid' }
  if (input.calendarId !== calendarId) return { status: 'empty' }

  try {
    const reconciled = reconcileFridgeDoor(input.state, units, lessons, overrides, capacity)
    if (validateFridgeDoorState(reconciled, units, lessons).length > 0) return { status: 'invalid' }
    if (!doorFitsCapacity(reconciled, capacity)) return { status: 'invalid' }
    return {
      status: 'restored',
      input: { calendarId, state: reconciled },
      state: reconciled,
    }
  } catch {
    return { status: 'invalid' }
  }
}

export function saveFridgeDoorToBrowser(input: FridgeDoorPersistenceInput): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeFridgeDoor(input))
    return true
  } catch {
    return false
  }
}

export function loadFridgeDoorFromBrowser(
  calendarId: string,
  units: Unit[],
  lessons: Lesson[],
  overrides: SectionLessonDateOverride[],
  capacity: FridgeCapacity,
): FridgeDoorLoadResult {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return { status: 'unavailable' }
  }
  return restoreFridgeDoor(raw, calendarId, units, lessons, overrides, capacity)
}

function parseState(raw: unknown): FridgeDoorState | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as Partial<FridgeDoorState>
  if (!Array.isArray(candidate.magnets) || !Array.isArray(candidate.placements)) return null

  const magnets: Magnet[] = []
  for (const rawMagnet of candidate.magnets) {
    if (!rawMagnet || typeof rawMagnet !== 'object') return null
    const magnet = rawMagnet as Partial<Magnet>
    if (typeof magnet.id !== 'string' || typeof magnet.title !== 'string') return null
    magnets.push({ id: magnet.id, title: magnet.title })
  }

  const placements: FridgePlacement[] = []
  for (const rawPlacement of candidate.placements) {
    if (!rawPlacement || typeof rawPlacement !== 'object') return null
    const placement = rawPlacement as Partial<FridgePlacement>
    if (!isEntityRef(placement.entityRef)) return null
    if (!isSurface(placement.surface)) return null
    if (!Number.isInteger(placement.row) || !Number.isInteger(placement.column)) return null
    if (!(placement.stackId === null || typeof placement.stackId === 'string')) return null
    if (!(placement.stackOrder === null || Number.isInteger(placement.stackOrder))) return null
    if (!isPriority(placement.priority)) return null
    placements.push({
      entityRef: placement.entityRef,
      surface: placement.surface,
      row: placement.row as number,
      column: placement.column as number,
      stackId: placement.stackId,
      stackOrder: placement.stackOrder as number | null,
      priority: placement.priority,
    })
  }

  return { magnets, placements }
}

function doorFitsCapacity(state: FridgeDoorState, capacity: FridgeCapacity): boolean {
  if (!Number.isInteger(capacity.rows) || !Number.isInteger(capacity.columns) || capacity.rows < 1 || capacity.columns < 1) return false
  return state.placements.every((placement) => placement.surface !== 'door'
    || (placement.row >= 0 && placement.row < capacity.rows && placement.column >= 0 && placement.column < capacity.columns))
}

function isEntityRef(value: unknown): value is FridgeEntityRef {
  return typeof value === 'string' && /^(unit|lesson|magnet):.+/.test(value)
}

function isSurface(value: unknown): value is FridgeSurface {
  return value === 'door' || value === 'drawer'
}

function isPriority(value: unknown): value is FridgePriority {
  return value === null || value === 'must' || value === 'should' || value === 'could'
}
