import { compareISODate } from './dateMath'
import type { ISODate, SchoolCalendar } from './types'

export const PLANNING_CONTEXT_STORAGE_KEY = 'arc.planning-context.v1'

export function savePlanningAnchor(calendarId: string, anchorDate: ISODate, storage: Pick<Storage, 'setItem'> | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(PLANNING_CONTEXT_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, calendarId, anchorDate }))
    return true
  } catch {
    return false
  }
}

export function loadPlanningAnchor(calendar: SchoolCalendar, storage: Pick<Storage, 'getItem'> | null = browserStorage()): ISODate | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(PLANNING_CONTEXT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { schemaVersion?: unknown; calendarId?: unknown; anchorDate?: unknown }
    if (parsed.schemaVersion !== 1 || parsed.calendarId !== calendar.id || typeof parsed.anchorDate !== 'string') return null
    const anchor = parsed.anchorDate as ISODate
    return compareISODate(anchor, calendar.firstDay) >= 0 && compareISODate(anchor, calendar.lastDay) <= 0 ? anchor : null
  } catch {
    return null
  }
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
