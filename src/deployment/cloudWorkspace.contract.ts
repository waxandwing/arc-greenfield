import { decideCloudHydration, parseRemotePlannerStorage } from './cloudWorkspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const missing = parseRemotePlannerStorage(undefined)
assert(missing.kind === 'missing', 'missing remote payload should stay missing')

const valid = parseRemotePlannerStorage({ browserStorage: { 'arc.calendar.v1': '{"ok":true}', 'arc.planning.v1': '[]' } })
assert(valid.kind === 'valid', 'valid planner storage should parse')
if (valid.kind === 'valid') assert(valid.snapshot['arc.calendar.v1'] === '{"ok":true}', 'valid planner storage should preserve exact bytes')

const empty = parseRemotePlannerStorage({ browserStorage: {} })
assert(empty.kind === 'valid', 'empty browserStorage is a valid first-use cloud row')

const authLeak = parseRemotePlannerStorage({ browserStorage: { 'arc.auth.v1': 'secret' } })
assert(authLeak.kind === 'invalid', 'cloud workspace must never accept auth storage')
const ownerLeak = parseRemotePlannerStorage({ browserStorage: { 'arc.cloud-owner.v1': 'user-a' } })
assert(ownerLeak.kind === 'invalid', 'cloud workspace must never accept local account-owner metadata as planner data')

const local = { 'arc.calendar.v1': 'local-calendar' }
const noRemoteUnbound = decideCloudHydration(local, missing, null, 'user-a')
assert(noRemoteUnbound.action === 'reconcile' && !noRemoteUnbound.allowMirror, 'unbound local data must not seed an account when remote is missing')

const sameAccountFirstSync = decideCloudHydration(local, empty, 'user-a', 'user-a')
assert(sameAccountFirstSync.action === 'keep-local' && sameAccountFirstSync.allowMirror, 'same-account local data may seed an empty cloud workspace')

const crossAccount = decideCloudHydration(local, empty, 'user-a', 'user-b')
assert(crossAccount.action === 'reconcile' && !crossAccount.allowMirror, 'Account A local data must never seed fresh Account B cloud state')

const emptyBoth = decideCloudHydration({}, empty, null, 'user-b')
assert(emptyBoth.action === 'use-remote' && emptyBoth.allowMirror, 'empty local + empty remote is safe')

const remote = parseRemotePlannerStorage({ browserStorage: { 'arc.calendar.v1': 'remote-calendar' } })
const localEmptyRemote = decideCloudHydration({}, remote, null, 'user-a')
assert(localEmptyRemote.action === 'use-remote' && localEmptyRemote.allowMirror, 'valid remote workspace may hydrate an empty browser')

const equalRemote = parseRemotePlannerStorage({ browserStorage: { 'arc.calendar.v1': 'local-calendar' } })
const equalDecision = decideCloudHydration(local, equalRemote, 'user-a', 'user-a')
assert(equalDecision.action === 'use-remote' && equalDecision.allowMirror, 'byte-identical local and remote state is already reconciled')

const divergent = decideCloudHydration(local, remote, 'user-a', 'user-a')
assert(divergent.action === 'reconcile' && !divergent.allowMirror, 'divergent non-empty same-account state must not silently overwrite either copy')

let invalidRejected = false
try { decideCloudHydration(local, authLeak, 'user-a', 'user-a') } catch { invalidRejected = true }
assert(invalidRejected, 'invalid remote workspace must fail closed before local replacement')

console.log('B08 cloud hydration account-isolation contract passed')
