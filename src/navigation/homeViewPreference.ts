import { CALENDAR_VIEWS, DEFAULT_HOME_VIEW, type CalendarView } from './calendarViews'

export type HomeViewPreference =
  | { mode: 'last-used' }
  | { mode: 'fixed'; view: CalendarView }

export type NavigationPreferenceState = {
  version: 1
  home: HomeViewPreference
  lastUsedView: CalendarView
}

export type NavigationPreferenceLoadResult =
  | { status: 'empty'; state: NavigationPreferenceState }
  | { status: 'restored'; state: NavigationPreferenceState }
  | { status: 'invalid'; state: NavigationPreferenceState }
  | { status: 'unavailable'; state: NavigationPreferenceState }

const STORAGE_KEY = 'arc.navigation-preference.v1'

export const DEFAULT_NAVIGATION_PREFERENCE: NavigationPreferenceState = {
  version: 1,
  home: { mode: 'last-used' },
  lastUsedView: DEFAULT_HOME_VIEW,
}

export function loadNavigationPreference(storage: Storage | null = browserStorage()): NavigationPreferenceLoadResult {
  if (!storage) return { status: 'unavailable', state: DEFAULT_NAVIGATION_PREFERENCE }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return { status: 'empty', state: DEFAULT_NAVIGATION_PREFERENCE }
    const parsed = JSON.parse(raw)
    if (!isNavigationPreferenceState(parsed)) return { status: 'invalid', state: DEFAULT_NAVIGATION_PREFERENCE }
    return { status: 'restored', state: parsed }
  } catch {
    return { status: 'unavailable', state: DEFAULT_NAVIGATION_PREFERENCE }
  }
}

export function saveNavigationPreference(state: NavigationPreferenceState, storage: Storage | null = browserStorage()): boolean {
  if (!storage || !isNavigationPreferenceState(state)) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function withLastUsedView(state: NavigationPreferenceState, view: CalendarView): NavigationPreferenceState {
  return { ...state, lastUsedView: view }
}

export function withHomePreference(state: NavigationPreferenceState, home: HomeViewPreference): NavigationPreferenceState {
  return { ...state, home }
}

export function resolveHomeView(
  state: NavigationPreferenceState,
  isAvailable: (view: CalendarView) => boolean = () => true,
): CalendarView {
  const requested = state.home.mode === 'fixed' ? state.home.view : state.lastUsedView
  if (isAvailable(requested)) return requested
  if (isAvailable(DEFAULT_HOME_VIEW)) return DEFAULT_HOME_VIEW
  return CALENDAR_VIEWS.find(isAvailable) ?? DEFAULT_HOME_VIEW
}

export function homePreferenceValue(home: HomeViewPreference): string {
  return home.mode === 'last-used' ? 'last-used' : `fixed:${home.view}`
}

export function homePreferenceFromValue(value: string): HomeViewPreference | null {
  if (value === 'last-used') return { mode: 'last-used' }
  if (!value.startsWith('fixed:')) return null
  const view = value.slice('fixed:'.length)
  return isCalendarView(view) ? { mode: 'fixed', view } : null
}

function isNavigationPreferenceState(value: unknown): value is NavigationPreferenceState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<NavigationPreferenceState>
  if (candidate.version !== 1 || !isCalendarView(candidate.lastUsedView)) return false
  if (!candidate.home || typeof candidate.home !== 'object') return false
  if (candidate.home.mode === 'last-used') return true
  return candidate.home.mode === 'fixed' && isCalendarView(candidate.home.view)
}

function isCalendarView(value: unknown): value is CalendarView {
  return typeof value === 'string' && (CALENDAR_VIEWS as readonly string[]).includes(value)
}

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}
