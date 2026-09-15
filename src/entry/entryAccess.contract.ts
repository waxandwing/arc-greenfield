import { isEntryComplete, isEntryGateEnabled, markEntryComplete, shouldBypassEntryGate } from './entryAccess'

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message ?? `Expected ${String(expected)}, received ${String(actual)}`)
  }
}

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

assertEqual(shouldBypassEntryGate('?skipEntry=1'), true)
assertEqual(shouldBypassEntryGate('?demo=1'), false)

const storage = memoryStorage()
assertEqual(isEntryComplete(storage), !isEntryGateEnabled() || shouldBypassEntryGate())
markEntryComplete(storage)
assertEqual(isEntryComplete(storage), true)

console.log('entry access contract passed')
