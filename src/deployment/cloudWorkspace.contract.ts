import { decideCloudHydration, parseRemotePlannerStorage } from './cloudWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const missing = parseRemotePlannerStorage(undefined)
assert(missing.kind === 'missing', 'missing remote payload should stay missing')

const valid = parseRemotePlannerStorage({ browserStorage: { 'arc.calendar.v1': '{"ok":true}', 'arc.planning.v1': '[]' } })
assert(valid.kind === 'valid', 'valid planner storage should parse')
if (valid.kind === 'valid') {
  assert(valid.snapshot['arc.calendar.v1'] === '{"ok":true}', 'valid planner storage should preserve exact bytes')
}

const empty = parseRemotePlannerStorage({ browserStorage: {} })
assert(empty.kind === 'valid', 'empty browserStorage is a valid first-use cloud row')

const authLeak = parseRemotePlannerStorage({ browserStorage: { 'arc.auth.v1': 'secret' } })
assert(authLeak.kind === 'invalid', 'cloud workspace must never accept auth storage')

const foreignKey = parseRemotePlannerStorage({ browserStorage: { unrelated: 'value' } })
assert(foreignKey.kind === 'invalid', 'cloud workspace must reject non-Arc storage')

const nonString = parseRemotePlannerStorage({ browserStorage: { 'arc.calendar.v1': { bad: true } } })
assert(nonString.kind === 'invalid', 'cloud workspace must reject non-string browser storage values')

const local = { 'arc.calendar.v1': 'local-calendar' }
const noRemoteDecision = decideCloudHydration(local, missing)
assert(noRemoteDecision.action === 'keep-local', 'missing remote snapshot must preserve local state')

const firstSyncDecision = decideCloudHydration(local, empty)
assert(firstSyncDecision.action === 'keep-local', 'empty first-use cloud row must not erase non-empty local state')

const emptyBothDecision = decideCloudHydration({}, empty)
assert(emptyBothDecision.action === 'use-remote', 'empty local + empty remote is a valid empty account workspace')

const remote = parseRemotePlannerStorage({ browserStorage: { 'arc.calendar.v1': 'remote-calendar' } })
const remoteDecision = decideCloudHydration(local, remote)
assert(remoteDecision.action === 'use-remote', 'validated non-empty remote workspace should become account truth')
if (remoteDecision.action === 'use-remote') {
  assert(remoteDecision.snapshot['arc.calendar.v1'] === 'remote-calendar', 'validated remote snapshot should remain byte-identical')
}

let invalidRejected = false
try {
  decideCloudHydration(local, authLeak)
} catch {
  invalidRejected = true
}
assert(invalidRejected, 'invalid remote workspace must fail closed before local replacement')

console.log('B08 cloud hydration safety contract passed')
