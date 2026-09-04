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
  type FridgePriorityAssignment,
  type FridgeSurface,
  type Magnet,
} from './fridgeDoor'

const STORAGE_KEY = 'arc.fridgeDoor.v1'

export type FridgeDoorPersistenceInput = {
  calendarId: string
  state: FridgeDoorState
}

type StoredFridgeDoorV2 = {
  schemaVersion: 2
  input: FridgeDoorPersistenceInput
}

type StoredFridgeDoorV1 = {
  schemaVersion: 1
  input: {
    calendarId: string
    state: unknown
  }
}

export type FridgeDoorLoadResult =
  | { status: 'empty' }
  | { status: 'restored'; input: FridgeDoorPersistenceInput; state: FridgeDoorState }
  | { status: 'invalid' }
  | { status: 'unavailable' }

export function serializeFridgeDoor(input: FridgeDoorPersistenceInput): string {
  return JSON.stringify({ schemaVersion: 2, input } satisfies StoredFridgeDoorV2)
}

export function deserializeFridgeDoor(raw: string): FridgeDoorPersistenceInput | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredFridgeDoorV2 & StoredFridgeDoorV1>
    if (!parsed.input || typeof parsed.input.calendarId !== 'string') return null
    if (parsed.schemaVersion === 2) {
      const state = parseStateV2(parsed.input.state)
      return state ? { calendarId: parsed.input.calendarId, state } : null
    }
    if (parsed.schemaVersion === 1) {
      const state = parseStateV1(parsed.input.state)
      return state ? { calendarId: parsed.input.calendarId, state } : null
    }
    return null
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

function parseStateV2(raw: unknown): FridgeDoorState | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as Partial<FridgeDoorState>
  if (!Array.isArray(candidate.magnets) || !Array.isArray(candidate.placements) || !Array.isArray(candidate.priorities)) return null
  const magnets = parseMagnets(candidate.magnets)
  const placements = parsePlacements(candidate.placements)
  const priorities = parsePriorities(candidate.priorities)
  return magnets && placements && priorities ? { magnets, placements, priorities } : null
}

function parseStateV1(raw: unknown): FridgeDoorState | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as { magnets?: unknown; placements?: unknown }
  if (!Array.isArray(candidate.magnets) || !Array.isArray(candidate.placements)) return null
  const magnets = parseMagnets(candidate.magnets)
  if (!magnets) return null

  const placements: FridgePlacement[] = []
  const priorities: FridgePriorityAssignment[] = []
  for (const rawPlacement of candidate.placements) {
    if (!rawPlacement || typeof rawPlacement !== 'object') return null
    const placement = rawPlacement as Record<string, unknown>
    if (!isEntityRef(placement.entityRef) || !isSurface(placement.surface)) return null
    if (!Number.isInteger(placement.row) || !Number.isInteger(placement.column)) return null
    if (!(placement.stackId === null || typeof placement.stackId === 'string')) return null
    if (!(placement.stackOrder === null || Number.isInteger(placement.stackOrder))) return null
    if (!isPriority(placement.priority)) return null
    placements.push({
      entityRef: placement.entityRef,
      surface: placement.surface,
      row: placement.row as number,
      column: placement.column as number,
      stackId: placement.stackId as string | null,
      stackOrder: placement.stackOrder as number | null,
    })
    if (placement.priority) priorities.push({ entityRef: placement.entityRef, priority: placement.priority })
  }
  return { magnets, placements, priorities }
}

function parseMagnets(rawMagnets: unknown[]): Magnet[] | null {
  const magnets: Magnet[] = []
  for (const rawMagnet of rawMagnets) {
    if (!rawMagnet || typeof rawMagnet !== 'object') return null
    const magnet = rawMagnet as Partial<Magnet>
    if (typeof magnet.id !== 'string' || typeof magnet.title !== 'string') return null
    magnets.push({ id: magnet.id, title: magnet.title })
  }
  return magnets
}

function parsePlacements(rawPlacements: unknown[]): FridgePlacement[] | null {
  const placements: FridgePlacement[] = []
  for (const rawPlacement of rawPlacements) {
    if (!rawPlacement || typeof rawPlacement !== 'object') return null
    const placement = rawPlacement as Partial<FridgePlacement>
    if (!isEntityRef(placement.entityRef) || !isSurface(placement.surface)) return null
    if (!Number.isInteger(placement.row) || !Number.isInteger(placement.column)) return null
    if (!(placement.stackId === null || typeof placement.stackId === 'string')) return null
    if (!(placement.stackOrder === null || Number.isInteger(placement.stackOrder))) return null
    placements.push({
      entityRef: placement.entityRef,
      surface: placement.surface,
      row: placement.row as number,
      column: placement.column as number,
      stackId: placement.stackId,
      stackOrder: placement.stackOrder as number | null,
    })
  }
  return placements
}

function parsePriorities(rawPriorities: unknown[]): FridgePriorityAssignment[] | null {
  const priorities: FridgePriorityAssignment[] = []
  for (const rawPriority of rawPriorities) {
    if (!rawPriority || typeof rawPriority !== 'object') return null
    const assignment = rawPriority as Partial<FridgePriorityAssignment>
    if (!isEntityRef(assignment.entityRef) || !isPriority(assignment.priority) || assignment.priority === null) return null
    priorities.push({ entityRef: assignment.entityRef, priority: assignment.priority })
  }
  return priorities
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
