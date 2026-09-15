/** Icarus entry gate — splash + beta password or interest signup before Arc Plan. */

export const ENTRY_COMPLETE_STORAGE_KEY = 'arc.setup.complete'

const ENTRY_SESSION_KEY = 'arc.entry.access.v1'

function readSearch(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

function isLocalPreviewSmokeHost(): boolean {
  if (typeof window === 'undefined') return false
  const { hostname, port } = window.location
  return hostname === '127.0.0.1' && port === '4173'
}

/** Desk smoke / explicit opt-out paths skip the public entry gate. */
export function shouldBypassEntryGate(locationSearch = readSearch().toString()): boolean {
  if (isLocalPreviewSmokeHost()) return true
  const params = new URLSearchParams(locationSearch.startsWith('?') ? locationSearch : `?${locationSearch}`)
  if (params.get('skipEntry') === '1' || params.has('skipEntry')) return true
  if (params.get('forceDesk') === '1' || params.has('forceDesk')) return true
  return false
}

/** Production builds show entry unless desk preview or explicitly disabled. */
export function isEntryGateEnabled(): boolean {
  if (import.meta.env.VITE_ARC_DESK_PREVIEW === 'true') return false
  if (import.meta.env.VITE_ARC_ENTRY_REQUIRED === 'false') return false
  if (import.meta.env.VITE_ARC_ENTRY_REQUIRED === 'true') return true
  return import.meta.env.PROD
}

export function isEntryComplete(storage: Storage = localStorage): boolean {
  if (!isEntryGateEnabled()) return true
  if (shouldBypassEntryGate()) return true
  return storage.getItem(ENTRY_COMPLETE_STORAGE_KEY) === 'true'
    || storage.getItem(ENTRY_SESSION_KEY) === '1'
}

export function markEntryComplete(storage: Storage = localStorage): void {
  storage.setItem(ENTRY_COMPLETE_STORAGE_KEY, 'true')
  storage.setItem(ENTRY_SESSION_KEY, '1')
}
