import { PLANNING_CONTEXT_STORAGE_KEY } from '../calendar/navigationContext'
import { serializeCalendarInput } from '../calendar/persistence'
import { serializeCaptures, CAPTURE_STORAGE_KEY } from '../planning/capturePersistence'
import { serializeLessons, LESSON_STORAGE_KEY } from '../planning/lessonPersistence'
import { ONBOARDING_STORAGE_KEY, serializeOnboardingDraft } from '../planning/onboardingPersistence'
import { serializeShiftState, SHIFT_STORAGE_KEY } from '../planning/shiftPersistence'
import { serializeUnits, UNIT_STORAGE_KEY } from '../planning/unitPersistence'
import { serializePlanningWorkspace, PLANNING_WORKSPACE_STORAGE_KEY } from '../planning/workspacePersistence'
import { buildGauntletDemoBundle } from './gauntletDemo'

const CALENDAR_STORAGE_KEY = 'arc.calendar.v1'
const VIEW_PREFERENCES_KEY = 'arc.view-preferences.v1'

export type DemoSeedMode = 'gauntlet'

function writeGauntletDemo(storage: Storage): void {
  const bundle = buildGauntletDemoBundle()
  storage.setItem(CALENDAR_STORAGE_KEY, serializeCalendarInput(bundle.calendarInput))
  storage.setItem(PLANNING_WORKSPACE_STORAGE_KEY, serializePlanningWorkspace(bundle.planningInput))
  storage.setItem(UNIT_STORAGE_KEY, serializeUnits(bundle.unitsInput))
  storage.setItem(LESSON_STORAGE_KEY, serializeLessons(bundle.lessonsInput))
  storage.setItem(SHIFT_STORAGE_KEY, serializeShiftState(bundle.shiftInput))
  storage.setItem(CAPTURE_STORAGE_KEY, serializeCaptures(bundle.captures))
  storage.setItem(PLANNING_CONTEXT_STORAGE_KEY, JSON.stringify(bundle.planContext))
  storage.setItem(VIEW_PREFERENCES_KEY, JSON.stringify(bundle.viewPreferences))
  storage.setItem(ONBOARDING_STORAGE_KEY, serializeOnboardingDraft({
    stage: 'landed',
    dismissed: true,
    firstCapturePromptDismissed: true,
  }))
}

export function resolveDemoSeedRequest(location: Pick<Location, 'search'>, envDemo = false): { mode: DemoSeedMode; force: boolean } | null {
  const params = new URLSearchParams(location.search)
  const fromQuery = params.get('demo')
  const raw = fromQuery ?? (envDemo ? 'gauntlet' : null)
  if (!raw || raw === '0' || raw === 'false') return null
  if (raw !== 'gauntlet' && raw !== '1' && raw !== 'true') return null
  const force = params.get('demoReset') === '1' || params.has('demoReset')
  return { mode: 'gauntlet', force }
}

/** Seed local storage before first React render so onboarding is skipped and Day opens with demo content. */
export function maybeApplyDemoSeed(
  location: Pick<Location, 'search' | 'pathname' | 'hash'> = window.location,
  storage: Storage = window.localStorage,
  options?: { envDemo?: boolean },
): boolean {
  const request = resolveDemoSeedRequest(location, options?.envDemo === true)
  if (!request) return false

  const hadCalendar = Boolean(storage.getItem(CALENDAR_STORAGE_KEY))

  if (request.mode === 'gauntlet') writeGauntletDemo(storage)

  const params = new URLSearchParams(location.search)
  if (params.has('demo') || params.has('demoReset')) {
    params.delete('demo')
    params.delete('demoReset')
    const query = params.toString()
    const nextUrl = `${location.pathname}${query ? `?${query}` : ''}${location.hash}`
    if (typeof window !== 'undefined') {
      if (hadCalendar) {
        window.location.replace(nextUrl)
        return true
      }
      window.history.replaceState({}, '', nextUrl)
    }
  }

  return true
}
