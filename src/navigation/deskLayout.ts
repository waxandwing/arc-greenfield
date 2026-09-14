/** Normalized desk layout — zone/cell grid, not pixel coordinates. */

export const DESK_LAYOUT_SCHEMA_VERSION = 1 as const
export const DESK_GRID_COLUMNS = 4
export const DESK_GRID_ROWS = 2

export type DeskObjectKind = 'planner' | 'tray' | 'msc' | 'arctable' | 'notes'

export type DeskZoneName =
  | 'main'
  | 'side-upper'
  | 'side-lower'
  | 'mid-upper'
  | 'notes-rail'

export type PlannerSizePreset = 'standard' | 'large'
export type TraySizePreset = 'standard' | 'wide'
export type MscSizePreset = 'compact' | 'standard'

export type DeskLayoutCell = {
  col: number
  row: number
  colSpan: number
  rowSpan: number
}

export type DeskObjectPlacement = {
  object: DeskObjectKind
  zone: DeskZoneName
}

export type DeskLayoutState = {
  schemaVersion: typeof DESK_LAYOUT_SCHEMA_VERSION
  customized: boolean
  placements: DeskObjectPlacement[]
  /** Reserved for a future theme appearance layer — not user-facing in this pass. */
  appearanceThemeId?: string | null
}

export type DeskViewportProfile = 'desktop' | 'tablet' | 'mobile'

const ZONE_CELLS: Record<DeskZoneName, DeskLayoutCell> = {
  main: { col: 1, row: 1, colSpan: 2, rowSpan: 2 },
  'mid-upper': { col: 3, row: 1, colSpan: 1, rowSpan: 1 },
  'side-upper': { col: 4, row: 1, colSpan: 1, rowSpan: 1 },
  'side-lower': { col: 4, row: 2, colSpan: 1, rowSpan: 1 },
  'notes-rail': { col: 3, row: 2, colSpan: 1, rowSpan: 1 },
}

const DEFAULT_ZONE_BY_OBJECT: Record<DeskObjectKind, DeskZoneName> = {
  planner: 'main',
  tray: 'side-upper',
  msc: 'side-lower',
  arctable: 'mid-upper',
  notes: 'notes-rail',
}

const OBJECTS_IN_EDIT_ORDER: DeskObjectKind[] = ['planner', 'tray', 'msc', 'arctable', 'notes']

const SWAPPABLE_ZONES: Record<DeskObjectKind, DeskZoneName[]> = {
  planner: ['main'],
  tray: ['side-upper', 'mid-upper'],
  msc: ['side-lower', 'notes-rail'],
  arctable: ['mid-upper', 'side-upper'],
  notes: ['notes-rail', 'side-lower'],
}

export const DEFAULT_DESK_LAYOUT: DeskLayoutState = {
  schemaVersion: DESK_LAYOUT_SCHEMA_VERSION,
  customized: false,
  placements: OBJECTS_IN_EDIT_ORDER.map((object) => ({ object, zone: DEFAULT_ZONE_BY_OBJECT[object] })),
  appearanceThemeId: null,
}

export const DESK_LAYOUT_STORAGE_KEY = 'arc.desk-layout.v1'
export const WORKSPACE_LAYOUT_STORAGE_KEY = 'arc.workspace-layout.v1'

export function loadDeskLayout(storage: Pick<Storage, 'getItem' | 'setItem'> | null = browserStorage()): DeskLayoutState {
  if (!storage) return DEFAULT_DESK_LAYOUT
  try {
    const workspaceRaw = storage.getItem(WORKSPACE_LAYOUT_STORAGE_KEY)
    if (workspaceRaw) return normalizeDeskLayout(JSON.parse(workspaceRaw))
    const raw = storage.getItem(DESK_LAYOUT_STORAGE_KEY)
    if (!raw) return DEFAULT_DESK_LAYOUT
    const migrated = normalizeDeskLayout(JSON.parse(raw))
    saveDeskLayout(migrated, storage)
    return migrated
  } catch {
    return DEFAULT_DESK_LAYOUT
  }
}

export function saveDeskLayout(layout: DeskLayoutState, storage: Pick<Storage, 'setItem'> | null = browserStorage()) {
  if (!storage) return
  try {
    const payload = JSON.stringify(normalizeDeskLayout(layout))
    storage.setItem(WORKSPACE_LAYOUT_STORAGE_KEY, payload)
    storage.setItem(DESK_LAYOUT_STORAGE_KEY, payload)
  } catch {
    /* ignore quota */
  }
}

export function normalizeDeskLayout(value: unknown): DeskLayoutState {
  if (!value || typeof value !== 'object') return DEFAULT_DESK_LAYOUT
  const candidate = value as Partial<DeskLayoutState>
  const placements: DeskObjectPlacement[] = []
  for (const object of OBJECTS_IN_EDIT_ORDER) {
    const found = Array.isArray(candidate.placements)
      ? candidate.placements.find((entry) => entry && typeof entry === 'object' && (entry as DeskObjectPlacement).object === object)
      : null
    const zone = found && isZoneName((found as DeskObjectPlacement).zone) ? (found as DeskObjectPlacement).zone : DEFAULT_ZONE_BY_OBJECT[object]
    if (isZoneAllowedForObject(object, zone)) {
      placements.push({ object, zone })
    } else {
      placements.push({ object, zone: DEFAULT_ZONE_BY_OBJECT[object] })
    }
  }
  const resolved = resolvePlacementCollisions(placements)
  return {
    schemaVersion: DESK_LAYOUT_SCHEMA_VERSION,
    customized: candidate.customized === true,
    placements: resolved,
    appearanceThemeId: typeof candidate.appearanceThemeId === 'string' ? candidate.appearanceThemeId : null,
  }
}

export function deskLayoutUsesDefault(layout: DeskLayoutState): boolean {
  if (!layout.customized) return true
  return JSON.stringify(layout.placements) === JSON.stringify(DEFAULT_DESK_LAYOUT.placements)
}

export function resetDeskLayoutToArcDefault(): DeskLayoutState {
  return { ...DEFAULT_DESK_LAYOUT, customized: false, appearanceThemeId: null }
}

export function placementForObject(layout: DeskLayoutState, object: DeskObjectKind): DeskObjectPlacement {
  return layout.placements.find((entry) => entry.object === object) ?? { object, zone: DEFAULT_ZONE_BY_OBJECT[object] }
}

export function zoneCell(zone: DeskZoneName, profile: DeskViewportProfile): DeskLayoutCell {
  const base = ZONE_CELLS[zone]
  if (profile !== 'desktop') {
    return { col: 1, row: 1, colSpan: 4, rowSpan: 1 }
  }
  return base
}

export function gridAreaStyle(cell: DeskLayoutCell): { gridColumn: string; gridRow: string } {
  const colEnd = cell.col + cell.colSpan
  const rowEnd = cell.row + cell.rowSpan
  return {
    gridColumn: `${cell.col} / ${colEnd}`,
    gridRow: `${cell.row} / ${rowEnd}`,
  }
}

export function resolveDeskLayoutForProfile(layout: DeskLayoutState, profile: DeskViewportProfile): DeskLayoutState {
  if (profile === 'desktop') return layout
  return {
    ...layout,
    placements: layout.placements.map((entry) => ({
      ...entry,
      zone: DEFAULT_ZONE_BY_OBJECT[entry.object],
    })),
  }
}

export type DeskMoveDirection = 'left' | 'right' | 'up' | 'down'

export function moveDeskObject(
  layout: DeskLayoutState,
  object: DeskObjectKind,
  direction: DeskMoveDirection,
): DeskLayoutState {
  const allowed = SWAPPABLE_ZONES[object]
  if (allowed.length <= 1) return layout
  const current = placementForObject(layout, object)
  const index = allowed.indexOf(current.zone)
  if (index < 0) return layout
  const delta = direction === 'left' || direction === 'up' ? -1 : 1
  const nextIndex = (index + delta + allowed.length) % allowed.length
  return assignDeskObjectZone(layout, object, allowed[nextIndex]!)
}

export function assignDeskObjectZone(
  layout: DeskLayoutState,
  object: DeskObjectKind,
  zone: DeskZoneName,
): DeskLayoutState {
  if (!isZoneAllowedForObject(object, zone)) return layout
  const next = layout.placements.map((entry) => (entry.object === object ? { ...entry, zone } : entry))
  const occupant = next.find((entry) => entry.object !== object && entry.zone === zone)
  let resolved = next
  if (occupant) {
    const fromZone = placementForObject(layout, object).zone
    resolved = next.map((entry) => {
      if (entry.object === occupant.object) return { ...entry, zone: fromZone }
      return entry
    })
  }
  return {
    ...layout,
    customized: true,
    placements: resolvePlacementCollisions(resolved),
  }
}

function resolvePlacementCollisions(placements: DeskObjectPlacement[]): DeskObjectPlacement[] {
  const used = new Set<DeskZoneName>()
  const resolved: DeskObjectPlacement[] = []
  for (const object of OBJECTS_IN_EDIT_ORDER) {
    const entry = placements.find((item) => item.object === object) ?? { object, zone: DEFAULT_ZONE_BY_OBJECT[object] }
    let zone = entry.zone
    if (used.has(zone) || !isZoneAllowedForObject(object, zone)) {
      zone = DEFAULT_ZONE_BY_OBJECT[object]
    }
    while (used.has(zone)) {
      const alternatives = SWAPPABLE_ZONES[object].find((candidate) => !used.has(candidate))
      if (!alternatives) break
      zone = alternatives
    }
    used.add(zone)
    resolved.push({ object, zone })
  }
  return resolved
}

function isZoneAllowedForObject(object: DeskObjectKind, zone: DeskZoneName): boolean {
  return SWAPPABLE_ZONES[object].includes(zone)
}

function isZoneName(value: unknown): value is DeskZoneName {
  return typeof value === 'string' && value in ZONE_CELLS
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}

export function sizeClassForObject(
  object: DeskObjectKind,
  sizes: {
    planner: PlannerSizePreset
    tray: TraySizePreset
    msc: MscSizePreset
  },
): string | null {
  if (object === 'planner' && sizes.planner === 'large') return 'arc-desk-object--planner-large'
  if (object === 'tray' && sizes.tray === 'wide') return 'arc-desk-object--tray-wide'
  if (object === 'msc' && sizes.msc === 'compact') return 'arc-desk-object--msc-compact'
  return null
}
