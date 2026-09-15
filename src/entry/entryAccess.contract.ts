import assert from 'node:assert/strict'
import { isEntryComplete, isEntryGateEnabled, markEntryComplete, shouldBypassEntryGate } from './entryAccess'

const memoryStorage = (): Storage => {
  const map = new Map<string, string>()
  return {
    get length() { return map.size },
    clear() { map.clear() },
    getItem(key: string) { return map.get(key) ?? null },
    key(index: number) { return [...map.keys()][index] ?? null },
    removeItem(key: string) { map.delete(key) },
    setItem(key: string, value: string) { map.set(key, value) },
  }
}

assert.equal(shouldBypassEntryGate('?skipEntry=1'), true)
assert.equal(shouldBypassEntryGate('?demo=1'), false)

const storage = memoryStorage()
assert.equal(isEntryComplete(storage), !isEntryGateEnabled() || shouldBypassEntryGate())
markEntryComplete(storage)
assert.equal(isEntryComplete(storage), true)

console.log('entry access contract passed')
