import { compareISODate } from '../calendar/dateMath'
import type { ISODate } from '../calendar/types'

export type YearDeskState = {
  calendarId: string
  /** Bulk watermark: all instructional days on/before this date are caught up (unless cleared). */
  caughtUpThrough: ISODate | null
  /** Individually marked caught-up days. */
  caughtUpDates: ISODate[]
  /** Individually unmarked days that would otherwise fall under caughtUpThrough. */
  caughtUpCleared: ISODate[]
  zoomPercent: number
}

export const YEAR_DESK_STORAGE_KEY = 'arc.year-desk.v1'

export function emptyYearDeskState(calendarId: string): YearDeskState {
  return { calendarId, caughtUpThrough: null, caughtUpDates: [], caughtUpCleared: [], zoomPercent: 100 }
}

export function loadYearDeskState(calendarId: string, storage: Pick<Storage, 'getItem'> | null = browserStorage()): YearDeskState {
  const empty = emptyYearDeskState(calendarId)
  if (!storage) return empty
  try {
    const raw = storage.getItem(YEAR_DESK_STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<YearDeskState>
    if (parsed.calendarId !== calendarId) return empty
    return {
      calendarId,
      caughtUpThrough: typeof parsed.caughtUpThrough === 'string' ? parsed.caughtUpThrough as ISODate : null,
      caughtUpDates: normalizeCaughtUpDateList(parsed.caughtUpDates),
      caughtUpCleared: normalizeCaughtUpDateList(parsed.caughtUpCleared),
      zoomPercent: clampZoom(parsed.zoomPercent),
    }
  } catch {
    return empty
  }
}

export function saveYearDeskState(state: YearDeskState, storage: Pick<Storage, 'setItem'> | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(YEAR_DESK_STORAGE_KEY, JSON.stringify({
      ...state,
      caughtUpDates: normalizeCaughtUpDateList(state.caughtUpDates),
      caughtUpCleared: normalizeCaughtUpDateList(state.caughtUpCleared),
      zoomPercent: clampZoom(state.zoomPercent),
    }))
    return true
  } catch {
    return false
  }
}

export function normalizeCaughtUpDateList(value: unknown): ISODate[] {
  if (!Array.isArray(value)) return []
  const dates: ISODate[] = []
  for (const item of value) {
    if (typeof item === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item)) {
      dates.push(item as ISODate)
    }
  }
  return [...new Set(dates)].sort(compareISODate)
}

function clampZoom(value: unknown): number {
  const numeric = typeof value === 'number' ? value : 100
  return Math.min(140, Math.max(85, Math.round(numeric / 5) * 5))
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
