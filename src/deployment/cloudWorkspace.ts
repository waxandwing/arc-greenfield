export type PlannerStorageSnapshot = Record<string, string>

export type ParsedRemoteStorage =
  | { kind: 'missing' }
  | { kind: 'invalid'; reason: string }
  | { kind: 'valid'; snapshot: PlannerStorageSnapshot }

export type CloudHydrationDecision =
  | { action: 'keep-local'; reason: 'no-remote-snapshot' | 'first-cloud-sync' }
  | { action: 'use-remote'; snapshot: PlannerStorageSnapshot }

const AUTH_KEY = 'arc.auth.v1'
const CLOUD_PREFIX = 'arc.'

export function isPlannerStorageKey(key: string) {
  return key.startsWith(CLOUD_PREFIX) && key !== AUTH_KEY
}

export function parseRemotePlannerStorage(payload: unknown): ParsedRemoteStorage {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { kind: 'missing' }

  const storage = (payload as { browserStorage?: unknown }).browserStorage
  if (storage === undefined || storage === null) return { kind: 'missing' }
  if (typeof storage !== 'object' || Array.isArray(storage)) {
    return { kind: 'invalid', reason: 'browserStorage must be an object.' }
  }

  const snapshot: PlannerStorageSnapshot = {}
  for (const [key, value] of Object.entries(storage as Record<string, unknown>)) {
    if (!isPlannerStorageKey(key)) {
      return { kind: 'invalid', reason: `Unexpected cloud storage key: ${key}` }
    }
    if (typeof value !== 'string') {
      return { kind: 'invalid', reason: `Cloud storage value for ${key} must be a string.` }
    }
    snapshot[key] = value
  }

  return { kind: 'valid', snapshot }
}

export function decideCloudHydration(
  local: PlannerStorageSnapshot,
  remote: ParsedRemoteStorage,
): CloudHydrationDecision {
  if (remote.kind === 'invalid') throw new Error(remote.reason)
  if (remote.kind === 'missing') return { action: 'keep-local', reason: 'no-remote-snapshot' }

  const localHasPlannerState = Object.keys(local).length > 0
  const remoteHasPlannerState = Object.keys(remote.snapshot).length > 0
  if (localHasPlannerState && !remoteHasPlannerState) {
    return { action: 'keep-local', reason: 'first-cloud-sync' }
  }

  return { action: 'use-remote', snapshot: remote.snapshot }
}
