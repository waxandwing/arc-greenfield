export type PlannerStorageSnapshot = Record<string, string>

export type ParsedRemoteStorage =
  | { kind: 'missing' }
  | { kind: 'invalid'; reason: string }
  | { kind: 'valid'; snapshot: PlannerStorageSnapshot }

export type CloudHydrationDecision =
  | { action: 'keep-local'; reason: 'same-account-first-cloud-sync'; allowMirror: true }
  | { action: 'use-remote'; snapshot: PlannerStorageSnapshot; allowMirror: true }
  | { action: 'reconcile'; reason: 'unbound-local' | 'different-account-local' | 'divergent-local-remote'; allowMirror: false }

const AUTH_KEY = 'arc.auth.v1'
const CLOUD_OWNER_KEY = 'arc.cloud-owner.v1'
const CLOUD_PREFIX = 'arc.'

export function isPlannerStorageKey(key: string) {
  return key.startsWith(CLOUD_PREFIX) && key !== AUTH_KEY && key !== CLOUD_OWNER_KEY
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

function sameSnapshot(left: PlannerStorageSnapshot, right: PlannerStorageSnapshot) {
  const leftEntries = Object.entries(left).sort(([a], [b]) => a.localeCompare(b))
  const rightEntries = Object.entries(right).sort(([a], [b]) => a.localeCompare(b))
  if (leftEntries.length !== rightEntries.length) return false
  return leftEntries.every(([key, value], index) => {
    const [otherKey, otherValue] = rightEntries[index]
    return key === otherKey && value === otherValue
  })
}

export function decideCloudHydration(
  local: PlannerStorageSnapshot,
  remote: ParsedRemoteStorage,
  localOwnerId: string | null,
  authenticatedUserId: string,
): CloudHydrationDecision {
  if (remote.kind === 'invalid') throw new Error(remote.reason)

  const localHasPlannerState = Object.keys(local).length > 0
  const ownerMatches = localOwnerId === authenticatedUserId

  if (remote.kind === 'missing') {
    if (!localHasPlannerState) return { action: 'use-remote', snapshot: {}, allowMirror: true }
    if (ownerMatches) return { action: 'keep-local', reason: 'same-account-first-cloud-sync', allowMirror: true }
    return {
      action: 'reconcile',
      reason: localOwnerId ? 'different-account-local' : 'unbound-local',
      allowMirror: false,
    }
  }

  const remoteHasPlannerState = Object.keys(remote.snapshot).length > 0
  if (!localHasPlannerState) return { action: 'use-remote', snapshot: remote.snapshot, allowMirror: true }

  if (!remoteHasPlannerState) {
    if (ownerMatches) return { action: 'keep-local', reason: 'same-account-first-cloud-sync', allowMirror: true }
    return {
      action: 'reconcile',
      reason: localOwnerId ? 'different-account-local' : 'unbound-local',
      allowMirror: false,
    }
  }

  if (sameSnapshot(local, remote.snapshot)) {
    return { action: 'use-remote', snapshot: remote.snapshot, allowMirror: true }
  }

  return { action: 'reconcile', reason: 'divergent-local-remote', allowMirror: false }
}
