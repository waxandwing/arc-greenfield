import { hydrateSchoolCalendar } from '../calendar/hydration'
import { serializeCalendarInput } from '../calendar/persistence'
import { buildGauntletDemoBundle } from './gauntletDemo'
import { maybeApplyDemoSeed, resolveDemoSeedRequest } from './applyDemoSeed'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const bundle = buildGauntletDemoBundle()
assert(hydrateSchoolCalendar(bundle.calendarInput).id === bundle.calendarInput.id, 'Gauntlet demo calendar must hydrate.')
serializeCalendarInput(bundle.calendarInput)

const storage = new Map<string, string>()
const fakeStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value) },
  removeItem: (key: string) => { storage.delete(key) },
} as Storage

assert(resolveDemoSeedRequest({ search: '?demo=1' })?.mode === 'gauntlet', 'demo=1 must request gauntlet seed.')
assert(maybeApplyDemoSeed({ search: '?demo=gauntlet', pathname: '/', hash: '' }, fakeStorage), 'Demo seed must write storage.')
assert(fakeStorage.getItem('arc.calendar.v1'), 'Demo seed must persist calendar.')
assert(JSON.parse(fakeStorage.getItem('arc.onboarding.v1') ?? '{}').draft.dismissed === true, 'Demo seed must dismiss onboarding.')

const staleStorage = new Map<string, string>([['arc.calendar.v1', '{"schemaVersion":1}']])
const staleFakeStorage = {
  getItem: (key: string) => staleStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { staleStorage.set(key, value) },
  removeItem: (key: string) => { staleStorage.delete(key) },
} as Storage
assert(maybeApplyDemoSeed({ search: '?demo=1', pathname: '/', hash: '' }, staleFakeStorage), '?demo=1 must reseed even when a calendar already exists.')
assert(JSON.parse(staleFakeStorage.getItem('arc.onboarding.v1') ?? '{}').draft.dismissed === true, 'Demo reseed must dismiss onboarding for desk shell.')

const resetStorage = new Map<string, string>([
  ['arc.calendar.v1', '{"schemaVersion":1}'],
  ['arc.planningWorkspace.v1', '{"schemaVersion":1}'],
  ['arc.legacy.v1', 'keep-not'],
])
const resetFakeStorage = {
  getItem: (key: string) => resetStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { resetStorage.set(key, value) },
  removeItem: (key: string) => { resetStorage.delete(key) },
  get length() { return resetStorage.size },
  key: (index: number) => [...resetStorage.keys()][index] ?? null,
  clear: () => resetStorage.clear(),
} as Storage
assert(maybeApplyDemoSeed({ search: '?demo=1&demoReset=1', pathname: '/', hash: '' }, resetFakeStorage), 'demoReset must seed gauntlet.')
assert(resetFakeStorage.getItem('arc.legacy.v1') === null, 'demoReset must wipe prior arc.* storage.')
assert(resetFakeStorage.getItem('arc.desk-preferences.v1'), 'demoReset must write desk preferences.')

const partialOnboarding = new Map<string, string>([
  ['arc.onboarding.v1', JSON.stringify({ schemaVersion: 1, draft: { stage: 'welcome', dismissed: false } })],
])
const partialOnboardingStorage = {
  getItem: (key: string) => partialOnboarding.get(key) ?? null,
  setItem: (key: string, value: string) => { partialOnboarding.set(key, value) },
  removeItem: (key: string) => { partialOnboarding.delete(key) },
  get length() { return partialOnboarding.size },
  key: (index: number) => [...partialOnboarding.keys()][index] ?? null,
} as Storage
assert(maybeApplyDemoSeed({ search: '?demo=1', pathname: '/', hash: '' }, partialOnboardingStorage), '?demo=1 must seed when only partial arc.* exists.')
assert(JSON.parse(partialOnboardingStorage.getItem('arc.onboarding.v1') ?? '{}').draft.dismissed === true, '?demo=1 must dismiss onboarding for desk shell.')
assert(partialOnboardingStorage.getItem('arc.desk-preferences.v1'), '?demo=1 must write desk preferences.')
assert(partialOnboardingStorage.getItem('arc.calendar.v1'), '?demo=1 must write demo calendar.')

console.log('demo seed contract passed')
