export type StorageTransactionTarget = {
  key: string
  value: string
}

export type TransactionalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type StorageTransactionResult =
  | { ok: true }
  | { ok: false; rollbackComplete: boolean; failedKey: string }

export function commitStorageTransaction(
  storage: TransactionalStorage,
  targets: StorageTransactionTarget[],
): StorageTransactionResult {
  const keys = targets.map((target) => target.key)
  if (new Set(keys).size !== keys.length) throw new Error('Storage transaction keys must be unique.')

  const previous = new Map<string, string | null>()
  for (const target of targets) previous.set(target.key, storage.getItem(target.key))

  const committed: string[] = []
  for (const target of targets) {
    try {
      storage.setItem(target.key, target.value)
      committed.push(target.key)
    } catch {
      return {
        ok: false,
        rollbackComplete: rollback(storage, committed, previous),
        failedKey: target.key,
      }
    }
  }

  return { ok: true }
}

function rollback(
  storage: TransactionalStorage,
  committed: string[],
  previous: Map<string, string | null>,
): boolean {
  let complete = true
  for (const key of committed.slice().reverse()) {
    try {
      const prior = previous.get(key) ?? null
      if (prior === null) storage.removeItem(key)
      else storage.setItem(key, prior)
    } catch {
      complete = false
    }
  }
  return complete
}
