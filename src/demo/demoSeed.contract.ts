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

console.log('demo seed contract passed')
