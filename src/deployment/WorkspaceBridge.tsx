import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { loadArcSupabase } from './supabase'

const CLOUD_USER_KEY = 'arc.cloud.user.v1'
const CLOUD_SYNC_KEY = 'arc.cloud.lastSync.v1'
const POLL_MS = 900

function isPlannerKey(key: string): boolean {
  return key.startsWith('arc.') && !key.startsWith('arc.cloud.')
}

function readPlannerStorage(): Record<string, string> {
  const payload: Record<string, string> = {}
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (!key || !isPlannerKey(key)) continue
    const value = window.localStorage.getItem(key)
    if (value !== null) payload[key] = value
  }
  return payload
}

function clearPlannerStorage() {
  const keys: string[] = []
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (key && isPlannerKey(key)) keys.push(key)
  }
  keys.forEach((key) => window.localStorage.removeItem(key))
}

function hydratePlannerStorage(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return
  clearPlannerStorage()
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (isPlannerKey(key) && typeof value === 'string') window.localStorage.setItem(key, value)
  }
}

function stableSnapshot(payload: Record<string, string>): string {
  return JSON.stringify(Object.keys(payload).sort().map((key) => [key, payload[key]]))
}

type Props = { children: ReactNode }

export function WorkspaceBridge({ children }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('Loading your Arc workspace…')
  const initialPath = useMemo(() => window.location.pathname, [])

  useEffect(() => {
    let cancelled = false
    let timer: number | null = null
    let lastSnapshot = ''
    let syncing = false

    async function start() {
      try {
        const gateResponse = await fetch('/api/beta-access', {
          cache: 'no-store',
          credentials: 'same-origin',
        })
        const gate = gateResponse.ok ? await gateResponse.json() as { unlocked?: boolean } : { unlocked: false }
        if (!gate.unlocked) {
          window.location.replace('/core')
          return
        }

        const supabase = await loadArcSupabase()
        const { data, error } = await supabase.auth.getSession()
        if (error || !data.session?.user?.id) {
          window.location.replace(`/core?return=${encodeURIComponent(initialPath)}`)
          return
        }

        const userId = data.session.user.id as string
        const priorUserId = window.localStorage.getItem(CLOUD_USER_KEY)
        const localBeforeHydration = readPlannerStorage()

        const { data: row, error: loadError } = await supabase
          .from('arc_workspaces')
          .select('payload,updated_at')
          .eq('user_id', userId)
          .maybeSingle()

        if (loadError) throw loadError
        if (cancelled) return

        const remotePayload = row?.payload && typeof row.payload === 'object' ? row.payload : null
        const remoteHasData = remotePayload && Object.keys(remotePayload).length > 0

        if (remoteHasData) {
          hydratePlannerStorage(remotePayload)
        } else if (priorUserId && priorUserId !== userId) {
          clearPlannerStorage()
        } else if (Object.keys(localBeforeHydration).length > 0) {
          const { error: migrateError } = await supabase
            .from('arc_workspaces')
            .upsert({ user_id: userId, payload: localBeforeHydration, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
          if (migrateError) throw migrateError
        }

        window.localStorage.setItem(CLOUD_USER_KEY, userId)
        window.localStorage.setItem(CLOUD_SYNC_KEY, new Date().toISOString())
        lastSnapshot = stableSnapshot(readPlannerStorage())
        setStatus('ready')

        timer = window.setInterval(async () => {
          if (syncing || cancelled) return
          const payload = readPlannerStorage()
          const nextSnapshot = stableSnapshot(payload)
          if (nextSnapshot === lastSnapshot) return
          syncing = true
          try {
            const { error: saveError } = await supabase
              .from('arc_workspaces')
              .upsert({ user_id: userId, payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
            if (saveError) throw saveError
            lastSnapshot = nextSnapshot
            window.localStorage.setItem(CLOUD_SYNC_KEY, new Date().toISOString())
          } catch (error) {
            console.error('Arc cloud workspace save failed', error)
            setMessage('Arc is open, but cloud save is temporarily unavailable. Your browser copy is still intact.')
          } finally {
            syncing = false
          }
        }, POLL_MS)
      } catch (error) {
        console.error('Arc workspace bootstrap failed', error)
        if (!cancelled) {
          setMessage('Arc could not load your cloud workspace. Nothing has been overwritten.')
          setStatus('error')
        }
      }
    }

    void start()
    return () => {
      cancelled = true
      if (timer !== null) window.clearInterval(timer)
    }
  }, [initialPath])

  if (status === 'loading') return <main className="arc-release-status" role="status">{message}</main>
  if (status === 'error') return <main className="arc-release-status arc-release-error" role="alert">{message}<br /><a href="/core">Return to beta access</a></main>
  return <>{message !== 'Loading your Arc workspace…' && <div className="arc-cloud-notice" role="status">{message}</div>}{children}</>
}
