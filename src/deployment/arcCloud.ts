import { decideCloudHydration, isPlannerStorageKey, parseRemotePlannerStorage } from './cloudWorkspace'

export type ArcAuthSession = {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

export type ArcRuntimeConfig = {
  supabaseUrl: string
  publishableKey: string
}

export type BetaAccessResult = {
  unlocked: boolean
  error?: string
}

export type CloudSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const AUTH_KEY = 'arc.auth.v1'
const CLOUD_OWNER_KEY = 'arc.cloud-owner.v1'

export async function loadRuntimeConfig(): Promise<ArcRuntimeConfig> {
  const response = await fetch('/api/runtime-config', { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Arc could not load its beta configuration.')
  return response.json() as Promise<ArcRuntimeConfig>
}

export async function checkBetaAccess(): Promise<BetaAccessResult> {
  const response = await fetch('/api/beta-access', { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'same-origin', cache: 'no-store' })
  if (!response.ok) throw new Error('Arc could not verify beta access.')
  return response.json() as Promise<BetaAccessResult>
}

export async function unlockBeta(password: string): Promise<BetaAccessResult> {
  const response = await fetch('/api/beta-access', {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ password }),
  })
  const result = await response.json().catch(() => ({ unlocked: false })) as BetaAccessResult
  if (!response.ok) return { unlocked: false, error: result.error ?? 'That beta password is not correct.' }
  return result
}

export async function lockBeta() { await fetch('/api/beta-access', { method: 'DELETE', credentials: 'same-origin' }) }

export function beginGoogleSignIn(config: ArcRuntimeConfig) {
  const redirectTo = `${window.location.origin}/auth/callback`
  const authorize = new URL('/auth/v1/authorize', config.supabaseUrl)
  authorize.searchParams.set('provider', 'google')
  authorize.searchParams.set('redirect_to', redirectTo)
  window.location.assign(authorize.toString())
}

export function captureOAuthCallback(): ArcAuthSession | null {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const accessToken = hash.get('access_token') ?? query.get('access_token')
  if (!accessToken) return null
  const expiresIn = Number(hash.get('expires_in') ?? query.get('expires_in') ?? '3600')
  const session: ArcAuthSession = { accessToken, refreshToken: hash.get('refresh_token') ?? query.get('refresh_token') ?? undefined, expiresAt: Date.now() + Math.max(0, expiresIn - 30) * 1000 }
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  window.history.replaceState({}, '', '/auth/callback')
  return session
}

export function loadAuthSession(): ArcAuthSession | null {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as ArcAuthSession
    return session.accessToken ? session : null
  } catch { return null }
}

export function clearAuthSession() { window.localStorage.removeItem(AUTH_KEY) }

export async function refreshAuthSession(config: ArcRuntimeConfig, session: ArcAuthSession): Promise<ArcAuthSession> {
  if (!session.expiresAt || session.expiresAt > Date.now()) return session
  if (!session.refreshToken) throw new Error('Arc cloud session expired.')
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refreshToken }),
  })
  if (!response.ok) throw new Error('Arc cloud session expired.')
  const next = await response.json() as { access_token: string; refresh_token?: string; expires_in?: number }
  const refreshed: ArcAuthSession = { accessToken: next.access_token, refreshToken: next.refresh_token ?? session.refreshToken, expiresAt: Date.now() + Math.max(0, (next.expires_in ?? 3600) - 30) * 1000 }
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(refreshed))
  return refreshed
}

export async function getCloudUser(config: ArcRuntimeConfig, session: ArcAuthSession): Promise<{ id: string; email: string | null }> {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, { headers: authHeaders(config, session) })
  if (!response.ok) throw new Error('Arc could not verify this cloud account.')
  const user = await response.json() as { id?: string; email?: string | null }
  if (!user.id) throw new Error('Arc cloud account is unavailable.')
  return { id: user.id, email: user.email ?? null }
}

export async function joinInterestList(config: ArcRuntimeConfig, input: { email: string; name?: string; role?: string }) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/arc_interest_signups`, {
    method: 'POST', headers: { apikey: config.publishableKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ ...input, source: 'landing' }),
  })
  if (!response.ok) throw new Error('Arc could not save that interest signup.')
}

export async function hydrateCloudWorkspace(config: ArcRuntimeConfig, session: ArcAuthSession, userId: string) {
  const endpoint = new URL('/rest/v1/arc_workspaces', config.supabaseUrl)
  endpoint.searchParams.set('select', 'payload')
  endpoint.searchParams.set('user_id', `eq.${userId}`)
  endpoint.searchParams.set('limit', '1')
  const response = await fetch(endpoint, { headers: authHeaders(config, session) })
  if (!response.ok) throw new Error('Arc could not restore this account workspace.')

  const rows = await response.json() as Array<{ payload?: unknown }>
  const local = snapshotPlannerStorage()
  const localOwnerId = window.localStorage.getItem(CLOUD_OWNER_KEY)
  const parsedRemote = parseRemotePlannerStorage(rows[0]?.payload)
  const decision = decideCloudHydration(local, parsedRemote, localOwnerId, userId)

  if (decision.action === 'use-remote') replacePlannerStorage(decision.snapshot)
  if (decision.allowMirror) window.localStorage.setItem(CLOUD_OWNER_KEY, userId)
  return decision
}

export function startCloudWorkspaceMirror(config: ArcRuntimeConfig, session: ArcAuthSession, userId: string, onStatus: (status: CloudSaveStatus) => void = () => undefined) {
  if (window.localStorage.getItem(CLOUD_OWNER_KEY) !== userId) throw new Error('Arc cloud mirror requires an account-bound local workspace.')
  let last = serializePlannerStorage()
  let saving = false

  async function flush(force = false) {
    const current = serializePlannerStorage()
    if ((!force && current === last) || saving) return
    if (window.localStorage.getItem(CLOUD_OWNER_KEY) !== userId) return
    saving = true
    onStatus('saving')
    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/arc_workspaces?on_conflict=user_id`, {
        method: 'POST', headers: { ...authHeaders(config, session), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: userId, payload: { schemaVersion: 1, browserStorage: snapshotPlannerStorage() }, updated_at: new Date().toISOString() }), keepalive: force,
      })
      if (!response.ok) throw new Error(`workspace save failed (${response.status})`)
      last = current
      onStatus('saved')
    } catch (error) {
      console.error('Arc cloud workspace save failed', error)
      onStatus('error')
    } finally { saving = false }
  }

  const interval = window.setInterval(() => { void flush() }, 1200)
  const onVisibility = () => { if (document.visibilityState === 'hidden') void flush(true) }
  const onPageHide = () => { void flush(true) }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', onPageHide)
  void flush(true)

  return () => {
    window.clearInterval(interval)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onPageHide)
    void flush(true)
  }
}

function authHeaders(config: ArcRuntimeConfig, session: ArcAuthSession) {
  return { apikey: config.publishableKey, Authorization: `Bearer ${session.accessToken}`, Accept: 'application/json' }
}

function replacePlannerStorage(snapshot: Record<string, string>) {
  const previous = snapshotPlannerStorage()
  try {
    clearPlannerStorage()
    for (const [key, value] of Object.entries(snapshot)) window.localStorage.setItem(key, value)
  } catch (error) {
    clearPlannerStorage()
    for (const [key, value] of Object.entries(previous)) window.localStorage.setItem(key, value)
    throw error
  }
}

function clearPlannerStorage() {
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index)
    if (key && isPlannerStorageKey(key)) window.localStorage.removeItem(key)
  }
}

function snapshotPlannerStorage() {
  const snapshot: Record<string, string> = {}
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key || !isPlannerStorageKey(key)) continue
    const value = window.localStorage.getItem(key)
    if (value !== null) snapshot[key] = value
  }
  return snapshot
}

function serializePlannerStorage() {
  const snapshot = snapshotPlannerStorage()
  return JSON.stringify(Object.fromEntries(Object.entries(snapshot).sort(([a], [b]) => a.localeCompare(b))))
}
