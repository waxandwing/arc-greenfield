import {
  DESK_POSTIT_LINKS_STORAGE_KEY,
  DESK_POSTIT_OVERLAP_THRESHOLD,
  EMPTY_DESK_POSTIT_LINKS,
  createDeskPostItLink,
  deskPostItStackForMember,
  findSignificantOverlapTarget,
  loadDeskPostItLinks,
  normalizeDeskPostItLinks,
  overlapRatio,
  pairKey,
  saveDeskPostItLinks,
  unlinkDeskPostItStack,
} from './deskPostItLinks'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

let workspace = createDeskPostItLink(EMPTY_DESK_POSTIT_LINKS, ['accent-blue', 'accent-pink'], 'stack-1')
assert(workspace.stacks.length === 1, 'Link create must require at least two members.')
assert(deskPostItStackForMember(workspace, 'accent-blue')?.stackId === 'stack-1', 'Members must resolve to their stack.')
assert(unlinkDeskPostItStack(workspace, 'stack-1').stacks.length === 0, 'Unlink must dissolve the stack.')

const normalized = normalizeDeskPostItLinks({
  schemaVersion: 1,
  stacks: [{ stackId: 's', memberIds: ['a', 'b', 'a'] }],
})
assert(normalized.stacks[0].memberIds.join(',') === 'a,b', 'Normalize must de-dupe member ids.')

const ratio = overlapRatio(
  { left: 0, top: 0, width: 100, height: 100 },
  { left: 40, top: 40, width: 100, height: 100 },
)
assert(ratio >= DESK_POSTIT_OVERLAP_THRESHOLD, 'Significant layering must meet overlap threshold.')
assert(pairKey('pink', 'blue') === pairKey('blue', 'pink'), 'Pair keys must be order-independent.')

const target = findSignificantOverlapTarget(
  'accent-blue',
  {
    'accent-blue': { left: 10, top: 10, width: 80, height: 80 },
    'accent-pink': { left: 30, top: 30, width: 80, height: 80 },
    'accent-mustard': { left: 400, top: 400, width: 80, height: 80 },
  },
  EMPTY_DESK_POSTIT_LINKS,
)
assert(target === 'accent-pink', 'Overlap finder must pick the significant collision target.')

const linked = createDeskPostItLink(EMPTY_DESK_POSTIT_LINKS, ['accent-blue', 'accent-pink'], 'linked')
assert(
  findSignificantOverlapTarget(
    'accent-blue',
    {
      'accent-blue': { left: 10, top: 10, width: 80, height: 80 },
      'accent-pink': { left: 30, top: 30, width: 80, height: 80 },
    },
    linked,
  ) === null,
  'Already-linked peers must not re-prompt.',
)

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
}
workspace = createDeskPostItLink(EMPTY_DESK_POSTIT_LINKS, ['persist-a', 'persist-b'], 'persist-stack')
assert(saveDeskPostItLinks(workspace, storage), 'Desk post-it links must persist to localStorage.')
assert(memory.has(DESK_POSTIT_LINKS_STORAGE_KEY), 'Link persistence must write canonical storage key.')
const reloaded = loadDeskPostItLinks(storage)
assert(
  reloaded.stacks[0]?.stackId === 'persist-stack' && reloaded.stacks[0].memberIds.join(',') === 'persist-a,persist-b',
  'Reload must restore linked member order.',
)

console.log('deskPostItLinks contract passed')
