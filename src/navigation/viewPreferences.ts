import { CALENDAR_VIEWS, DEFAULT_HOME_VIEW, type CalendarView } from './calendarViews'

export type HomeViewPreference =
  | { mode: 'last-used' }
  | { mode: 'fixed'; view: CalendarView }

export type ViewPreferences = {
  home: HomeViewPreference
  lastUsedView: CalendarView
  showWeekends: boolean
}

const STORAGE_KEY = 'arc.view-preferences.v1'

export const DEFAULT_VIEW_PREFERENCES: ViewPreferences = {
  home: { mode: 'fixed', view: DEFAULT_HOME_VIEW },
  lastUsedView: DEFAULT_HOME_VIEW,
  showWeekends: false,
}

export function resolveHomeView(preferences: ViewPreferences): CalendarView {
  return preferences.home.mode === 'last-used' ? preferences.lastUsedView : preferences.home.view
}

export function recordLastUsedView(preferences: ViewPreferences, view: CalendarView): ViewPreferences {
  return { ...preferences, lastUsedView: view }
}

export function loadViewPreferences(storage: Pick<Storage, 'getItem'> | null = browserStorage()): ViewPreferences {
  if (!storage) return DEFAULT_VIEW_PREFERENCES
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_VIEW_PREFERENCES
    return normalizeViewPreferences(JSON.parse(raw))
  } catch {
    return DEFAULT_VIEW_PREFERENCES
  }
}

export function saveViewPreferences(preferences: ViewPreferences, storage: Pick<Storage, 'setItem'> | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    return true
  } catch {
    return false
  }
}

export function normalizeViewPreferences(value: unknown): ViewPreferences {
  if (!value || typeof value !== 'object') return DEFAULT_VIEW_PREFERENCES
  const candidate = value as Partial<ViewPreferences>
  const lastUsedView = isCalendarView(candidate.lastUsedView) ? candidate.lastUsedView : DEFAULT_HOME_VIEW
  const showWeekends = candidate.showWeekends === true
  const home = normalizeHome(candidate.home)
  return { home, lastUsedView, showWeekends }
}

function normalizeHome(value: unknown): HomeViewPreference {
  if (!value || typeof value !== 'object') return DEFAULT_VIEW_PREFERENCES.home
  const candidate = value as Partial<HomeViewPreference> & { view?: unknown }
  if (candidate.mode === 'last-used') return { mode: 'last-used' }
  if (candidate.mode === 'fixed' && isCalendarView(candidate.view)) return { mode: 'fixed', view: candidate.view }
  return DEFAULT_VIEW_PREFERENCES.home
}

function isCalendarView(value: unknown): value is CalendarView {
  return typeof value === 'string' && (CALENDAR_VIEWS as readonly string[]).includes(value)
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
