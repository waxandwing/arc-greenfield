/** Tray/desk object stacks — curricular Units are separate (stack ≠ unit). */

export const STACK_SCHEMA_VERSION = 1 as const

export type StackMemberKind = 'capture' | 'lesson'

export type ObjectStack = {
  stackId: string
  memberKind: StackMemberKind
  memberIds: string[]
  memberOrder: string[]
  label?: string | null
}

export type StackWorkspace = {
  schemaVersion: typeof STACK_SCHEMA_VERSION
  calendarId: string
  stacks: ObjectStack[]
}

export const EMPTY_STACK_WORKSPACE = (calendarId: string): StackWorkspace => ({
  schemaVersion: STACK_SCHEMA_VERSION,
  calendarId,
  stacks: [],
})

export function normalizeStackWorkspace(value: unknown, calendarId: string): StackWorkspace {
  if (!value || typeof value !== 'object') return EMPTY_STACK_WORKSPACE(calendarId)
  const candidate = value as Partial<StackWorkspace>
  const stacks: ObjectStack[] = []
  if (Array.isArray(candidate.stacks)) {
    for (const raw of candidate.stacks) {
      if (!raw || typeof raw !== 'object') continue
      const row = raw as Partial<ObjectStack>
      if (typeof row.stackId !== 'string' || !row.stackId.trim()) continue
      const memberKind = row.memberKind === 'lesson' ? 'lesson' : 'capture'
      const order = Array.isArray(row.memberOrder)
        ? row.memberOrder.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        : []
      const memberIds = Array.isArray(row.memberIds)
        ? row.memberIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        : order
      const mergedOrder = order.length ? order : memberIds
      const uniqueOrder = mergedOrder.filter((id, index) => mergedOrder.indexOf(id) === index)
      if (uniqueOrder.length < 2) continue
      stacks.push({
        stackId: row.stackId,
        memberKind,
        memberIds: uniqueOrder,
        memberOrder: uniqueOrder,
        label: typeof row.label === 'string' ? row.label : null,
      })
    }
  }
  return {
    schemaVersion: STACK_SCHEMA_VERSION,
    calendarId: typeof candidate.calendarId === 'string' ? candidate.calendarId : calendarId,
    stacks,
  }
}

export function stackForMember(workspace: StackWorkspace, memberId: string): ObjectStack | null {
  return workspace.stacks.find((stack) => stack.memberOrder.includes(memberId)) ?? null
}

export function createStackFromMembers(
  workspace: StackWorkspace,
  memberKind: StackMemberKind,
  memberIds: string[],
  stackId: string,
): StackWorkspace {
  const order = memberIds.filter((id, index) => memberIds.indexOf(id) === index)
  if (order.length < 2) return workspace
  const without = removeMembersFromAllStacks(workspace, order)
  const stack: ObjectStack = {
    stackId,
    memberKind,
    memberIds: order,
    memberOrder: order,
    label: null,
  }
  return { ...without, stacks: [...without.stacks, stack] }
}

export function addMemberToStack(workspace: StackWorkspace, stackId: string, memberId: string): StackWorkspace {
  const stack = workspace.stacks.find((item) => item.stackId === stackId)
  if (!stack || stack.memberOrder.includes(memberId)) return workspace
  const nextOrder = [...stack.memberOrder, memberId]
  return replaceStack(workspace, stackId, { ...stack, memberIds: nextOrder, memberOrder: nextOrder })
}

export function removeMemberFromStack(workspace: StackWorkspace, stackId: string, memberId: string): StackWorkspace {
  const stack = workspace.stacks.find((item) => item.stackId === stackId)
  if (!stack) return workspace
  const nextOrder = stack.memberOrder.filter((id) => id !== memberId)
  if (nextOrder.length <= 1) {
    return { ...workspace, stacks: workspace.stacks.filter((item) => item.stackId !== stackId) }
  }
  return replaceStack(workspace, stackId, { ...stack, memberIds: nextOrder, memberOrder: nextOrder })
}

export function unstack(workspace: StackWorkspace, stackId: string): StackWorkspace {
  return { ...workspace, stacks: workspace.stacks.filter((item) => item.stackId !== stackId) }
}

export function reorderStackMember(workspace: StackWorkspace, stackId: string, memberId: string, toIndex: number): StackWorkspace {
  const stack = workspace.stacks.find((item) => item.stackId === stackId)
  if (!stack) return workspace
  const fromIndex = stack.memberOrder.indexOf(memberId)
  if (fromIndex < 0) return workspace
  const nextOrder = [...stack.memberOrder]
  nextOrder.splice(fromIndex, 1)
  const clamped = Math.max(0, Math.min(toIndex, nextOrder.length))
  nextOrder.splice(clamped, 0, memberId)
  return replaceStack(workspace, stackId, { ...stack, memberIds: nextOrder, memberOrder: nextOrder })
}

export type TrayStackRow =
  | { kind: 'single'; memberId: string }
  | { kind: 'stack'; stack: ObjectStack }

export function trayRowsForCaptures(workspace: StackWorkspace, captureIds: string[]): TrayStackRow[] {
  const seenStacks = new Set<string>()
  const rows: TrayStackRow[] = []
  for (const captureId of captureIds) {
    const stack = stackForMember(workspace, captureId)
    if (stack) {
      if (seenStacks.has(stack.stackId)) continue
      seenStacks.add(stack.stackId)
      rows.push({ kind: 'stack', stack })
      continue
    }
    rows.push({ kind: 'single', memberId: captureId })
  }
  return rows
}

function removeMembersFromAllStacks(workspace: StackWorkspace, memberIds: string[]): StackWorkspace {
  let next = workspace
  for (const memberId of memberIds) {
    const stack = stackForMember(next, memberId)
    if (stack) next = removeMemberFromStack(next, stack.stackId, memberId)
  }
  return next
}

function replaceStack(workspace: StackWorkspace, stackId: string, stack: ObjectStack): StackWorkspace {
  return {
    ...workspace,
    stacks: workspace.stacks.map((item) => (item.stackId === stackId ? stack : item)),
  }
}
