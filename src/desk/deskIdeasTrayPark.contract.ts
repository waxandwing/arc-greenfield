import {
  DESK_IDEAS_TRAY_PARK_STORAGE_KEY,
  DESK_IDEAS_TRAY_PARK_TOP_DEFAULT_PCT,
  DESK_IDEAS_TRAY_PARK_TOP_MAX_PCT,
  clampParkTopPct,
  loadIdeasTrayPark,
  normalizeIdeasTrayPark,
  saveIdeasTrayPark,
} from './deskIdeasTrayPark'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(DESK_IDEAS_TRAY_PARK_STORAGE_KEY === 'arc.desk-ideas-tray-park.v1', 'IDEAS tray park storage key must stay stable.')
assert(DESK_IDEAS_TRAY_PARK_TOP_DEFAULT_PCT === 0, 'Default park must keep the tray flush at the top.')
assert(normalizeIdeasTrayPark(null).topPct === 0, 'Missing park must default to top.')
assert(clampParkTopPct(-4) === 0, 'Park must not go above the top edge.')
assert(clampParkTopPct(99) === DESK_IDEAS_TRAY_PARK_TOP_MAX_PCT, 'Park must clamp below the desk floor.')

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value)
  },
}

saveIdeasTrayPark({ topPct: 18 }, storage)
assert(loadIdeasTrayPark(storage).topPct === 18, 'IDEAS tray park must persist in localStorage.')

console.log('Desk IDEAS tray park contract passed')
