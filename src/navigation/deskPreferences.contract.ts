import {
  DEFAULT_DESK_PREFERENCES,
  loadDeskAwareViewPreferences,
  normalizeDeskPreferences,
  resolveHomeDeskPlannerView,
  saveDeskAwareViewPreferences,
  seedDeskFromViewPreferences,
} from './deskPreferences'
import { DEFAULT_VIEW_PREFERENCES } from './viewPreferences'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
}

memory.set('arc.view-preferences.v1', JSON.stringify(DEFAULT_VIEW_PREFERENCES))

assert(JSON.stringify(normalizeDeskPreferences(null)) === JSON.stringify(DEFAULT_DESK_PREFERENCES), 'Desk prefs must default safely.')
assert(DEFAULT_DESK_PREFERENCES.showDeskNotes === true, 'Desk notes strip must default on for Teaching week demo.')
assert(normalizeDeskPreferences({}).showDeskNotes === true, 'Missing showDeskNotes must resolve to on.')
assert(normalizeDeskPreferences({ showDeskNotes: false }).showDeskNotes === false, 'Explicit false must still turn notes strip off.')
assert(DEFAULT_DESK_PREFERENCES.homeDeskPlannerView === 'Week', 'Desk calendar default must be Teaching week (Week view).')
assert(resolveHomeDeskPlannerView({ ...DEFAULT_VIEW_PREFERENCES, desk: { ...DEFAULT_DESK_PREFERENCES, homeDeskPlannerView: 'Week' } }) === 'Week', 'Home desk planner view must resolve from desk prefs.')
assert(
  resolveHomeDeskPlannerView({ ...DEFAULT_VIEW_PREFERENCES, desk: { ...DEFAULT_DESK_PREFERENCES, homeDeskPlannerView: 'bogus' as 'Week' } }) === 'Week',
  'Invalid desk home view must fall back to Teaching week (Week), not Month.',
)

const seededMonth = seedDeskFromViewPreferences({ ...DEFAULT_VIEW_PREFERENCES, home: { mode: 'fixed', view: 'Month' } })
assert(seededMonth.desk.homeDeskPlannerView === 'Week', 'Legacy Month home must seed desk to Teaching week calendar.')

const seededWeek = seedDeskFromViewPreferences({ ...DEFAULT_VIEW_PREFERENCES, home: { mode: 'fixed', view: 'Week' } })
assert(seededWeek.desk.homeDeskPlannerView === 'Week', 'Desk home must seed from legacy Week view prefs when desk storage absent.')

saveDeskAwareViewPreferences({ ...seededWeek, desk: { ...seededWeek.desk, showTray: false, showArcTable: true, plannerSize: 'large', traySize: 'wide', mscSize: 'compact' } }, storage)
const loadedPrefs = loadDeskAwareViewPreferences(storage)
assert(loadedPrefs.desk.showTray === false, 'Desk prefs must persist independently.')
assert(loadedPrefs.desk.plannerSize === 'large' && loadedPrefs.desk.traySize === 'wide', 'Desk size presets must persist.')

console.log('Desk preferences contract passed')
