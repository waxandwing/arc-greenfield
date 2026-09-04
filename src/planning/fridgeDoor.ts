import type { Lesson } from './lessons'
import type { SectionLessonDateOverride } from './sectionSchedule'
import type { Unit } from './units'

export type FridgeEntityRef = `unit:${string}` | `lesson:${string}` | `magnet:${string}`
export type FridgeSurface = 'door' | 'drawer'
export type FridgePriority = 'must' | 'should' | 'could' | null

export type Magnet = {
  id: string
  title: string
}

export type FridgePlacement = {
  entityRef: FridgeEntityRef
  surface: FridgeSurface
  row: number
  column: number
  stackId: string | null
  stackOrder: number | null
  priority: FridgePriority
}

export type FridgeDoorState = {
  magnets: Magnet[]
  placements: FridgePlacement[]
}

export type FridgeCapacity = {
  rows: number
  columns: number
}

export type CaptureIntent =
  | { kind: 'magnet'; title: string }
  | { kind: 'unit'; title: string }
  | { kind: 'lesson'; title: string }

export function createEmptyFridgeDoorState(): FridgeDoorState {
  return { magnets: [], placements: [] }
}

export function createMagnet(title: string, id = createMagnetId()): Magnet {
  const cleanTitle = title.trim()
  if (!cleanTitle) throw new Error('Magnet title is required.')
  return { id, title: cleanTitle }
}

export function parseCaptureIntent(raw: string): CaptureIntent {
  const value = raw.trim()
  if (!value) throw new Error('Capture text is required.')
  const match = /^([ulm])\s+(.+)$/i.exec(value)
  if (!match) return { kind: 'magnet', title: value }
  const title = match[2].trim()
  if (!title) throw new Error('Capture text is required.')
  if (match[1].toLowerCase() === 'u') return { kind: 'unit', title }
  if (match[1].toLowerCase() === 'l') return { kind: 'lesson', title }
  return { kind: 'magnet', title }
}

export function validateFridgeDoorState(
  state: FridgeDoorState,
  units: Unit[],
  lessons: Lesson[],
): string[] {
  const errors: string[] = []
  const refs = new Set<string>()
  const magnets = new Set(state.magnets.map((magnet) => magnet.id))
  const unitIds = new Set(units.map((unit) => unit.id))
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))

  for (const placement of state.placements) {
    if (refs.has(placement.entityRef)) errors.push(`Duplicate Fridge reference: ${placement.entityRef}.`)
    refs.add(placement.entityRef)
    if (!Number.isInteger(placement.row) || placement.row < 0) errors.push(`Invalid Fridge row for ${placement.entityRef}.`)
    if (!Number.isInteger(placement.column) || placement.column < 0) errors.push(`Invalid Fridge column for ${placement.entityRef}.`)
    if ((placement.stackId === null) !== (placement.stackOrder === null)) errors.push(`Incomplete stack state for ${placement.entityRef}.`)
    if (placement.stackOrder !== null && (!Number.isInteger(placement.stackOrder) || placement.stackOrder < 0)) errors.push(`Invalid stack order for ${placement.entityRef}.`)

    const [kind, id] = splitRef(placement.entityRef)
    if (kind === 'unit' && !unitIds.has(id)) errors.push(`Orphaned Unit Fridge reference: ${placement.entityRef}.`)
    if (kind === 'lesson' && !lessonIds.has(id)) errors.push(`Orphaned Lesson Fridge reference: ${placement.entityRef}.`)
    if (kind === 'magnet' && !magnets.has(id)) errors.push(`Orphaned Magnet Fridge reference: ${placement.entityRef}.`)
  }

  for (const magnet of state.magnets) {
    if (!magnet.id.trim()) errors.push('Magnet ID is required.')
    if (!magnet.title.trim()) errors.push(`Magnet ${magnet.id || '(missing id)'} needs a title.`)
  }

  return [...new Set(errors)]
}

export function placeEntity(
  state: FridgeDoorState,
  entityRef: FridgeEntityRef,
  surface: FridgeSurface,
  row: number,
  column: number,
): FridgeDoorState {
  const next: FridgePlacement = { entityRef, surface, row, column, stackId: null, stackOrder: null, priority: null }
  return {
    ...state,
    placements: [...state.placements.filter((item) => item.entityRef !== entityRef), next],
  }
}

export function assignPriority(state: FridgeDoorState, entityRef: FridgeEntityRef, priority: FridgePriority): FridgeDoorState {
  return {
    ...state,
    placements: state.placements.map((item) => item.entityRef === entityRef ? { ...item, priority } : item),
  }
}

export function putAway(state: FridgeDoorState, entityRef: FridgeEntityRef): FridgeDoorState {
  return setSurface(state, entityRef, 'drawer')
}

export function bringBack(state: FridgeDoorState, entityRef: FridgeEntityRef, capacity: FridgeCapacity): FridgeDoorState {
  const slot = firstFreeDoorSlot(state, capacity)
  if (!slot) throw new Error('Fridge Door is full. Keep this item in the Drawer until space is available.')
  return placeEntityPreservingPriority(state, entityRef, 'door', slot.row, slot.column)
}

export function stackEntities(state: FridgeDoorState, refs: FridgeEntityRef[], stackId: string): FridgeDoorState {
  const unique = [...new Set(refs)]
  if (unique.length < 2) throw new Error('A stack needs at least two items.')
  if (unique.some((ref) => ref.startsWith('unit:'))) throw new Error('Units cannot be stack members in the Fridge Door domain.')
  const anchor = state.placements.find((item) => item.entityRef === unique[0])
  if (!anchor) throw new Error(`Cannot stack missing Fridge item: ${unique[0]}.`)
  for (const ref of unique) {
    const item = state.placements.find((candidate) => candidate.entityRef === ref)
    if (!item) throw new Error(`Cannot stack missing Fridge item: ${ref}.`)
    if (item.surface !== anchor.surface) throw new Error('Stack members must be on the same Fridge surface.')
  }
  return {
    ...state,
    placements: state.placements.map((item) => {
      const order = unique.indexOf(item.entityRef)
      return order < 0 ? item : { ...item, row: anchor.row, column: anchor.column, stackId, stackOrder: order }
    }),
  }
}

export function unstackEntity(state: FridgeDoorState, entityRef: FridgeEntityRef, row: number, column: number): FridgeDoorState {
  return {
    ...state,
    placements: state.placements.map((item) => item.entityRef === entityRef ? { ...item, row, column, stackId: null, stackOrder: null } : item),
  }
}

export function reconcileFridgeDoor(
  state: FridgeDoorState,
  units: Unit[],
  lessons: Lesson[],
  overrides: SectionLessonDateOverride[],
  capacity: FridgeCapacity,
): FridgeDoorState {
  const unitIds = new Set(units.map((unit) => unit.id))
  const lessonIds = new Set(lessons.map((lesson) => lesson.id))
  const magnetIds = new Set(state.magnets.map((magnet) => magnet.id))
  let next: FridgeDoorState = {
    magnets: state.magnets.map((magnet) => ({ ...magnet })),
    placements: state.placements.filter((placement) => {
      const [kind, id] = splitRef(placement.entityRef)
      return kind === 'unit' ? unitIds.has(id) : kind === 'lesson' ? lessonIds.has(id) : magnetIds.has(id)
    }).map((placement) => ({ ...placement })),
  }

  for (const lesson of lessons) {
    if (!isFullyUnplacedLesson(lesson, overrides)) continue
    const ref = `lesson:${lesson.id}` as const
    if (next.placements.some((item) => item.entityRef === ref)) continue
    const slot = firstFreeDoorSlot(next, capacity)
    if (slot) next = placeEntity(next, ref, 'door', slot.row, slot.column)
    else next = placeEntity(next, ref, 'drawer', 0, next.placements.filter((item) => item.surface === 'drawer').length)
  }
  return next
}

export function isFullyUnplacedLesson(lesson: Lesson, overrides: SectionLessonDateOverride[]): boolean {
  return lesson.plannedDate === null && !overrides.some((override) => override.lessonId === lesson.id)
}

export function removeEntityReference(state: FridgeDoorState, entityRef: FridgeEntityRef): FridgeDoorState {
  return { ...state, placements: state.placements.filter((item) => item.entityRef !== entityRef) }
}

function firstFreeDoorSlot(state: FridgeDoorState, capacity: FridgeCapacity): { row: number; column: number } | null {
  if (!Number.isInteger(capacity.rows) || !Number.isInteger(capacity.columns) || capacity.rows < 1 || capacity.columns < 1) {
    throw new Error('Fridge Door capacity must use positive whole rows and columns.')
  }
  const occupied = new Set(state.placements.filter((item) => item.surface === 'door').map((item) => `${item.row}:${item.column}`))
  for (let row = 0; row < capacity.rows; row += 1) {
    for (let column = 0; column < capacity.columns; column += 1) {
      if (!occupied.has(`${row}:${column}`)) return { row, column }
    }
  }
  return null
}

function setSurface(state: FridgeDoorState, entityRef: FridgeEntityRef, surface: FridgeSurface): FridgeDoorState {
  const item = state.placements.find((candidate) => candidate.entityRef === entityRef)
  if (!item) throw new Error(`Fridge item does not exist: ${entityRef}.`)
  return { ...state, placements: state.placements.map((candidate) => candidate.entityRef === entityRef ? { ...candidate, surface } : candidate) }
}

function placeEntityPreservingPriority(state: FridgeDoorState, entityRef: FridgeEntityRef, surface: FridgeSurface, row: number, column: number): FridgeDoorState {
  const current = state.placements.find((item) => item.entityRef === entityRef)
  const next = placeEntity(state, entityRef, surface, row, column)
  return current?.priority ? assignPriority(next, entityRef, current.priority) : next
}

function splitRef(ref: FridgeEntityRef): ['unit' | 'lesson' | 'magnet', string] {
  const index = ref.indexOf(':')
  return [ref.slice(0, index) as 'unit' | 'lesson' | 'magnet', ref.slice(index + 1)]
}

function createMagnetId(): string {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `magnet-${token}`
}
