/** Persist IDEAS tray vertical park offset so teachers can slide it down and drop post-its in. */

export const DESK_IDEAS_TRAY_PARK_STORAGE_KEY = 'arc.desk-ideas-tray-park.v1'

/** Default flush with the desk top edge (coordinates with top-flush tray work). */
export const DESK_IDEAS_TRAY_PARK_TOP_DEFAULT_PCT = 0

/** Keep the tray usable — not dragged off the bottom of the desk. */
export const DESK_IDEAS_TRAY_PARK_TOP_MAX_PCT = 42

export type DeskIdeasTrayPark = {
  /** `top` percentage on `.arc-desk-tray-dock` (0 = sit at top). */
  topPct: number
}

export function normalizeIdeasTrayPark(value: unknown): DeskIdeasTrayPark {
  if (!value || typeof value !== 'object') {
    return { topPct: DESK_IDEAS_TRAY_PARK_TOP_DEFAULT_PCT }
  }
  const candidate = value as Partial<DeskIdeasTrayPark>
  const raw = typeof candidate.topPct === 'number' && Number.isFinite(candidate.topPct) ? candidate.topPct : DESK_IDEAS_TRAY_PARK_TOP_DEFAULT_PCT
  return { topPct: clampParkTopPct(raw) }
}

export function clampParkTopPct(value: number): number {
  return Math.min(DESK_IDEAS_TRAY_PARK_TOP_MAX_PCT, Math.max(DESK_IDEAS_TRAY_PARK_TOP_DEFAULT_PCT, value))
}

export function loadIdeasTrayPark(storage: Pick<Storage, 'getItem'> | null = browserStorage()): DeskIdeasTrayPark {
  if (!storage) return { topPct: DESK_IDEAS_TRAY_PARK_TOP_DEFAULT_PCT }
  try {
    const raw = storage.getItem(DESK_IDEAS_TRAY_PARK_STORAGE_KEY)
    if (!raw) return { topPct: DESK_IDEAS_TRAY_PARK_TOP_DEFAULT_PCT }
    return normalizeIdeasTrayPark(JSON.parse(raw))
  } catch {
    return { topPct: DESK_IDEAS_TRAY_PARK_TOP_DEFAULT_PCT }
  }
}

export function saveIdeasTrayPark(park: DeskIdeasTrayPark, storage: Pick<Storage, 'setItem'> | null = browserStorage()): void {
  if (!storage) return
  try {
    storage.setItem(DESK_IDEAS_TRAY_PARK_STORAGE_KEY, JSON.stringify(normalizeIdeasTrayPark(park)))
  } catch {
    /* ignore quota / private mode */
  }
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
