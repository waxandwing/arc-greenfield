/** Accent desk post-it link stacks — separate from tray capture/lesson stacks. */

export const DESK_POSTIT_LINKS_STORAGE_KEY = 'arc.desk-postit-links.v1'
export const DESK_POSTIT_LINKS_SCHEMA_VERSION = 1 as const

/** Intersection / min(area) ratio that counts as a significant layering collision. */
export const DESK_POSTIT_OVERLAP_THRESHOLD = 0.35

export type DeskPostItStack = {
  stackId: string
  memberIds: string[]
}

export type DeskPostItLinkWorkspace = {
  schemaVersion: typeof DESK_POSTIT_LINKS_SCHEMA_VERSION
  stacks: DeskPostItStack[]
}

export type DeskPostItRect = {
  left: number
  top: number
  width: number
  height: number
}

export const EMPTY_DESK_POSTIT_LINKS: DeskPostItLinkWorkspace = {
  schemaVersion: DESK_POSTIT_LINKS_SCHEMA_VERSION,
  stacks: [],
}

export function normalizeDeskPostItLinks(value: unknown): DeskPostItLinkWorkspace {
  if (!value || typeof value !== 'object') return EMPTY_DESK_POSTIT_LINKS
  const candidate = value as Partial<DeskPostItLinkWorkspace>
  const stacks: DeskPostItStack[] = []
  if (Array.isArray(candidate.stacks)) {
    for (const raw of candidate.stacks) {
      if (!raw || typeof raw !== 'object') continue
      const row = raw as Partial<DeskPostItStack>
      if (typeof row.stackId !== 'string' || !row.stackId.trim()) continue
      const memberIds = Array.isArray(row.memberIds)
        ? row.memberIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        : []
      const unique = memberIds.filter((id, index) => memberIds.indexOf(id) === index)
      if (unique.length < 2) continue
      stacks.push({ stackId: row.stackId, memberIds: unique })
    }
  }
  return {
    schemaVersion: DESK_POSTIT_LINKS_SCHEMA_VERSION,
    stacks,
  }
}

export function deskPostItStackForMember(
  workspace: DeskPostItLinkWorkspace,
  memberId: string,
): DeskPostItStack | null {
  return workspace.stacks.find((stack) => stack.memberIds.includes(memberId)) ?? null
}

export function createDeskPostItLink(
  workspace: DeskPostItLinkWorkspace,
  memberIds: string[],
  stackId: string,
): DeskPostItLinkWorkspace {
  const order = memberIds.filter((id, index) => memberIds.indexOf(id) === index)
  if (order.length < 2) return workspace
  let next = workspace
  for (const memberId of order) {
    const existing = deskPostItStackForMember(next, memberId)
    if (existing) next = unlinkDeskPostItStack(next, existing.stackId)
  }
  return {
    ...next,
    stacks: [...next.stacks, { stackId, memberIds: order }],
  }
}

export function unlinkDeskPostItStack(
  workspace: DeskPostItLinkWorkspace,
  stackId: string,
): DeskPostItLinkWorkspace {
  return {
    ...workspace,
    stacks: workspace.stacks.filter((stack) => stack.stackId !== stackId),
  }
}

export function overlapRatio(a: DeskPostItRect, b: DeskPostItRect): number {
  const left = Math.max(a.left, b.left)
  const top = Math.max(a.top, b.top)
  const right = Math.min(a.left + a.width, b.left + b.width)
  const bottom = Math.min(a.top + a.height, b.top + b.height)
  const width = Math.max(0, right - left)
  const height = Math.max(0, bottom - top)
  const intersection = width * height
  if (intersection <= 0) return 0
  const minArea = Math.min(Math.max(a.width * a.height, 1), Math.max(b.width * b.height, 1))
  return intersection / minArea
}

export function findSignificantOverlapTarget(
  draggedId: string,
  rects: Record<string, DeskPostItRect>,
  workspace: DeskPostItLinkWorkspace,
  threshold = DESK_POSTIT_OVERLAP_THRESHOLD,
): string | null {
  const draggedRect = rects[draggedId]
  if (!draggedRect) return null
  const draggedStack = deskPostItStackForMember(workspace, draggedId)
  let bestId: string | null = null
  let bestRatio = threshold
  for (const [otherId, otherRect] of Object.entries(rects)) {
    if (otherId === draggedId) continue
    if (draggedStack?.memberIds.includes(otherId)) continue
    const ratio = overlapRatio(draggedRect, otherRect)
    if (ratio >= bestRatio) {
      bestRatio = ratio
      bestId = otherId
    }
  }
  return bestId
}

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join('::')
}

export function loadDeskPostItLinks(
  storage: Pick<Storage, 'getItem'> | null = browserStorage(),
): DeskPostItLinkWorkspace {
  if (!storage) return EMPTY_DESK_POSTIT_LINKS
  try {
    const raw = storage.getItem(DESK_POSTIT_LINKS_STORAGE_KEY)
    if (!raw) return EMPTY_DESK_POSTIT_LINKS
    return normalizeDeskPostItLinks(JSON.parse(raw) as unknown)
  } catch {
    return EMPTY_DESK_POSTIT_LINKS
  }
}

export function saveDeskPostItLinks(
  workspace: DeskPostItLinkWorkspace,
  storage: Pick<Storage, 'setItem'> | null = browserStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(DESK_POSTIT_LINKS_STORAGE_KEY, JSON.stringify(normalizeDeskPostItLinks(workspace)))
    return true
  } catch {
    return false
  }
}

function browserStorage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}
