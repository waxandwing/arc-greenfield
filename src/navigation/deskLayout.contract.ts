import {
  DEFAULT_DESK_LAYOUT,
  assignDeskObjectZone,
  deskLayoutUsesDefault,
  loadDeskLayout,
  moveDeskObject,
  normalizeDeskLayout,
  placementForObject,
  resetDeskLayoutToArcDefault,
  saveDeskLayout,
  zoneCell,
} from './deskLayout'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(JSON.stringify(normalizeDeskLayout(null)) === JSON.stringify(DEFAULT_DESK_LAYOUT), 'Desk layout must default safely.')

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
}

const customized = assignDeskObjectZone(DEFAULT_DESK_LAYOUT, 'tray', 'mid-upper')
saveDeskLayout(customized, storage)
const loaded = loadDeskLayout(storage)
assert(loaded.customized === true, 'Desk layout persistence must round-trip.')
assert(placementForObject(loaded, 'tray').zone === 'mid-upper', 'Tray zone must persist.')

const swapped = assignDeskObjectZone(customized, 'arctable', 'side-upper')
assert(placementForObject(swapped, 'tray').zone === 'mid-upper', 'One-frame swap must not orphan tray.')

const moved = moveDeskObject(customized, 'msc', 'left')
assert(placementForObject(moved, 'msc').zone !== placementForObject(customized, 'msc').zone, 'Keyboard move must change MSC zone.')

assert(deskLayoutUsesDefault(resetDeskLayoutToArcDefault()) === true, 'Reset must restore Arc default layout.')

const desktopMain = zoneCell('main', 'desktop')
const mobileMain = zoneCell('main', 'mobile')
assert(
  desktopMain.colSpan !== mobileMain.colSpan || desktopMain.rowSpan !== mobileMain.rowSpan,
  'Mobile adaptive fallback must not mirror desktop spans literally.',
)

console.log('Desk layout contract passed')
