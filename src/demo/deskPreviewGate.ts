import { GAUNTLET_DEMO_CALENDAR_ID } from './gauntletDemo'

export const DESK_PREVIEW_SEEDED_SESSION_KEY = 'arc.desk-preview-seeded.v1'

/** Preview / demo URL hints that must force the wood desk shell (preview builds only). */
export function readDeskShellForceFromSearch(
  search: string,
  deskPreview: boolean,
): boolean {
  if (!deskPreview) return false
  const params = new URLSearchParams(search)
  if (params.get('forceDesk') === '1' || params.has('forceDesk')) return true
  const demo = params.get('demo')
  if (demo === '1' || demo === 'true' || demo === 'gauntlet') return true
  if (params.get('demoReset') === '1' || params.has('demoReset')) return true
  return false
}

export function readDeskPreviewSeededSession(
  deskPreview: boolean,
  storage: Storage = sessionStorage,
): boolean {
  if (!deskPreview) return false
  return storage.getItem(DESK_PREVIEW_SEEDED_SESSION_KEY) === '1'
}

export function markDeskPreviewSeededSession(
  deskPreview: boolean,
  storage: Storage = sessionStorage,
): void {
  if (!deskPreview) return
  storage.setItem(DESK_PREVIEW_SEEDED_SESSION_KEY, '1')
}

export function clearDeskPreviewSeededSession(storage: Storage = sessionStorage): void {
  storage.removeItem(DESK_PREVIEW_SEEDED_SESSION_KEY)
}

/** When true, AppFrame must not keep the cream plan shell for onboarding/setup gating. */
export function shouldForceDeskShell(input: {
  deskPreview: boolean
  locationSearch?: string
  calendarId?: string | null
  sessionSeeded?: boolean
  sessionStorage?: Storage
}): boolean {
  if (!input.deskPreview) return false
  const search = input.locationSearch ?? (typeof window !== 'undefined' ? window.location.search : '')
  if (readDeskShellForceFromSearch(search, input.deskPreview)) return true
  const session = input.sessionStorage ?? (typeof sessionStorage !== 'undefined' ? sessionStorage : null)
  const seeded = input.sessionSeeded ?? (session ? readDeskPreviewSeededSession(input.deskPreview, session) : false)
  if (seeded) return true
  if (input.calendarId === GAUNTLET_DEMO_CALENDAR_ID) return true
  return false
}
