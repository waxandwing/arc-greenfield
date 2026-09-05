import {
  DEFAULT_NAVIGATION_PREFERENCE,
  homePreferenceFromValue,
  loadNavigationPreference,
  resolveHomeView,
  saveNavigationPreference,
  withHomePreference,
  withLastUsedView,
} from '../src/navigation/homeViewPreference'

function equal(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`)
}

function deepEqual(actual: unknown, expected: unknown, label: string) {
  const actualJson = JSON.stringify(actual)
  const expectedJson = JSON.stringify(expected)
  if (actualJson !== expectedJson) throw new Error(`${label}: expected ${expectedJson}, got ${actualJson}`)
}

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() { return data.size },
    clear() { data.clear() },
    getItem(key: string) { return data.get(key) ?? null },
    key(index: number) { return [...data.keys()][index] ?? null },
    removeItem(key: string) { data.delete(key) },
    setItem(key: string, value: string) { data.set(key, value) },
  }
}

const storage = memoryStorage()
const empty = loadNavigationPreference(storage)
equal(empty.status, 'empty', 'empty storage status')
deepEqual(empty.state, DEFAULT_NAVIGATION_PREFERENCE, 'empty storage defaults safely')

let state = withLastUsedView(DEFAULT_NAVIGATION_PREFERENCE, 'Week')
equal(resolveHomeView(state), 'Week', 'last-used home resolves to last used view')

state = withHomePreference(state, { mode: 'fixed', view: 'Day' })
equal(resolveHomeView(state), 'Day', 'fixed home overrides last-used view')

equal(resolveHomeView(state, (view) => view !== 'Day'), 'Month', 'unavailable fixed home falls back to documented default')

deepEqual(homePreferenceFromValue('last-used'), { mode: 'last-used' }, 'last-used select value parses')
deepEqual(homePreferenceFromValue('fixed:Year Map'), { mode: 'fixed', view: 'Year Map' }, 'fixed select value parses')
equal(homePreferenceFromValue('fixed:Nonsense'), null, 'unknown fixed view is rejected')

equal(saveNavigationPreference(state, storage), true, 'valid preference saves')
const restored = loadNavigationPreference(storage)
equal(restored.status, 'restored', 'saved preference restores')
deepEqual(restored.state, state, 'saved preference round-trips')

const invalidStorage = memoryStorage({ 'arc.navigation-preference.v1': '{"version":1,"home":{"mode":"fixed","view":"Nope"},"lastUsedView":"Month"}' })
const invalid = loadNavigationPreference(invalidStorage)
equal(invalid.status, 'invalid', 'corrupt preference is rejected')
deepEqual(invalid.state, DEFAULT_NAVIGATION_PREFERENCE, 'corrupt preference falls back without mutating other state')

console.log('home view preference contract passed')
