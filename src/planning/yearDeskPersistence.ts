import type { ISODate } from '../calendar/types'

export type YearDeskState = {
  calendarId: string
  caughtUpThrough: ISODate | null
  zoomPercent: number
}

export const YEAR_DESK_STORAGE_KEY = 'arc.year-desk.v1'

export function loadYearDeskState(calendarId: string, storage: Pick<Storage, 'getItem'> | null = browserStorage()): YearDeskState {
  const empty: YearDeskState = { calendarId, caughtUpThrough: null, zoomPercent: 100 }
  if (!storage) return empty
  try {
    const raw = storage.getItem(YEAR_DESK_STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<YearDeskState>
    if (parsed.calendarId !== calendarId) return empty
    return {
      calendarId,
      caughtUpThrough: typeof parsed.caughtUpThrough === 'string' ? parsed.caughtUpThrough as ISODate : null,
      zoomPercent: clampZoom(parsed.zoomPercent),
    }
  } catch {
    return empty
  }
}

export function saveYearDeskState(state: YearDeskState, storage: Pick<Storage, 'setItem'> | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(YEAR_DESK_STORAGE_KEY, JSON.stringify({ ...state, zoomPercent: clampZoom(state.zoomPercent) }))
    return true
  } catch {
    return false
  }
}

function clampZoom(value: unknown): number {
  const numeric = typeof value === 'number' ? value : 100
  return Math.min(140, Math.max(85, Math.round(numeric / 5) * 5))
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
