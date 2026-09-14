import { CALENDAR_VIEWS, DEFAULT_HOME_VIEW, type CalendarView } from './calendarViews'
import type { MscSizePreset, PlannerSizePreset, TraySizePreset } from './deskLayout'
import { loadViewPreferences, saveViewPreferences, type ViewPreferences } from './viewPreferences'

export type HomeDeskPlannerView = Extract<CalendarView, 'Day' | 'Week' | 'Month'>

/** Teacher-facing labels for desk home planner (Week = teaching-week calendar grid). */
export const HOME_DESK_PLANNER_VIEW_LABELS: Record<HomeDeskPlannerView, string> = {
  Day: 'My Teaching Day',
  Week: 'Teaching week (calendar)',
  Month: 'Month',
}

export type DeskSurfacePreferences = {
  showTray: boolean
  showPriorityPad: boolean
  showDeskNotes: boolean
  showArcTable: boolean
  homeDeskPlannerView: HomeDeskPlannerView
  plannerSize: PlannerSizePreset
  traySize: TraySizePreset
  mscSize: MscSizePreset
}

export type DeskAwareViewPreferences = ViewPreferences & {
  desk: DeskSurfacePreferences
}

export const DEFAULT_DESK_PREFERENCES: DeskSurfacePreferences = {
  showTray: true,
  showPriorityPad: true,
  showDeskNotes: false,
  showArcTable: true,
  /** Teaching-week grid is the desk calendar surface (Kelly); not Day / My Teaching Day. */
  homeDeskPlannerView: 'Week',
  plannerSize: 'standard',
  traySize: 'standard',
  mscSize: 'standard',
}

export function loadDeskAwareViewPreferences(storage: Pick<Storage, 'getItem'> | null = browserStorage()): DeskAwareViewPreferences {
  const base = loadViewPreferences(storage)
  return { ...base, desk: readDeskFromStorage(storage) ?? DEFAULT_DESK_PREFERENCES }
}

export function saveDeskAwareViewPreferences(preferences: DeskAwareViewPreferences, storage: Pick<Storage, 'setItem'> | null = browserStorage()): boolean {
  const { desk, ...viewPrefs } = preferences
  writeDeskToStorage(desk, storage)
  return saveViewPreferences(viewPrefs, storage)
}

export function mergeDeskPreferences(preferences: ViewPreferences, desk: Partial<DeskSurfacePreferences>): DeskAwareViewPreferences {
  return { ...preferences, desk: normalizeDeskPreferences({ ...DEFAULT_DESK_PREFERENCES, ...readDeskFromStorage(), ...desk }) }
}

export function resolveHomeDeskPlannerView(preferences: DeskAwareViewPreferences): HomeDeskPlannerView {
  const view = preferences.desk.homeDeskPlannerView
  return isHomeDeskPlannerView(view) ? view : 'Month'
}

const DESK_STORAGE_KEY = 'arc.desk-preferences.v1'

function readDeskFromStorage(storage: Pick<Storage, 'getItem'> | null = browserStorage()): DeskSurfacePreferences | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(DESK_STORAGE_KEY)
    if (!raw) return null
    return normalizeDeskPreferences(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeDeskToStorage(desk: DeskSurfacePreferences, storage: Pick<Storage, 'setItem'> | null = browserStorage()) {
  if (!storage) return
  try {
    storage.setItem(DESK_STORAGE_KEY, JSON.stringify(desk))
  } catch {
    /* ignore quota */
  }
}

export function normalizeDeskPreferences(value: unknown): DeskSurfacePreferences {
  if (!value || typeof value !== 'object') return DEFAULT_DESK_PREFERENCES
  const candidate = value as Partial<DeskSurfacePreferences>
  return {
    showTray: candidate.showTray !== false,
    showPriorityPad: candidate.showPriorityPad !== false,
    showDeskNotes: candidate.showDeskNotes === true,
    showArcTable: candidate.showArcTable !== false,
    homeDeskPlannerView: isHomeDeskPlannerView(candidate.homeDeskPlannerView) ? candidate.homeDeskPlannerView : DEFAULT_DESK_PREFERENCES.homeDeskPlannerView,
    plannerSize: candidate.plannerSize === 'large' ? 'large' : 'standard',
    traySize: candidate.traySize === 'wide' ? 'wide' : 'standard',
    mscSize: candidate.mscSize === 'compact' ? 'compact' : 'standard',
  }
}

function isHomeDeskPlannerView(value: unknown): value is HomeDeskPlannerView {
  return typeof value === 'string' && (CALENDAR_VIEWS as readonly string[]).includes(value) && value !== 'Year Map' && value !== 'Quarter' && value !== 'Semester'
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}

/** Migration: legacy view-preferences home view seeds desk home when desk prefs absent. */
export function seedDeskFromViewPreferences(base: ViewPreferences): DeskAwareViewPreferences {
  const existing = readDeskFromStorage()
  if (existing) return { ...base, desk: existing }
  const legacyHome = base.home.mode === 'fixed' && isHomeDeskPlannerView(base.home.view) ? base.home.view : null
  const homeView =
    legacyHome === 'Day'
      ? 'Day'
      : legacyHome === 'Month'
        ? 'Week'
        : legacyHome ?? DEFAULT_DESK_PREFERENCES.homeDeskPlannerView
  return { ...base, desk: { ...DEFAULT_DESK_PREFERENCES, homeDeskPlannerView: homeView } }
}
