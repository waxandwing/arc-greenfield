import {
  addMemberToStack,
  createStackFromMembers,
  normalizeStackWorkspace,
  removeMemberFromStack,
  reorderStackMember,
  stackForMember,
  trayRowsForCaptures,
  unstack,
  EMPTY_STACK_WORKSPACE,
} from './stacks'
import { STACK_STORAGE_KEY, loadStackWorkspace, saveStackWorkspace } from './stackPersistence'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendarId = 'cal-1'
let workspace = EMPTY_STACK_WORKSPACE(calendarId)

workspace = createStackFromMembers(workspace, 'capture', ['cap-a', 'cap-b'], 'stack-1')
assert(workspace.stacks.length === 1, 'Stack create must require at least two members.')
assert(stackForMember(workspace, 'cap-a')?.stackId === 'stack-1', 'Members must resolve to their stack.')
assert(trayRowsForCaptures(workspace, ['cap-a', 'cap-b', 'cap-c']).length === 2, 'Tray rows must collapse stack members to one row.')

workspace = addMemberToStack(workspace, 'stack-1', 'cap-c')
assert(workspace.stacks[0].memberOrder.length === 3, 'Add member must extend stack order.')

workspace = reorderStackMember(workspace, 'stack-1', 'cap-c', 0)
assert(workspace.stacks[0].memberOrder[0] === 'cap-c', 'Fan reorder must update memberOrder.')

workspace = removeMemberFromStack(workspace, 'stack-1', 'cap-b')
assert(workspace.stacks[0].memberOrder.length === 2, 'Remove member must shrink stack.')

workspace = removeMemberFromStack(workspace, 'stack-1', 'cap-c')
assert(workspace.stacks.length === 0, 'Stack must collapse when one member remains.')

const normalized = normalizeStackWorkspace({
  schemaVersion: 1,
  calendarId,
  stacks: [{ stackId: 's', memberKind: 'capture', memberIds: ['a', 'b'], memberOrder: ['a', 'b'] }],
}, calendarId)
assert(normalized.stacks[0].memberOrder.join(',') === 'a,b', 'Normalize must preserve member order.')

workspace = createStackFromMembers(EMPTY_STACK_WORKSPACE(calendarId), 'lesson', ['lesson-1', 'lesson-2'], 'lesson-stack')
assert(workspace.stacks[0].memberKind === 'lesson', 'Lesson stacks must not imply curricular Units.')
assert(unstack(workspace, 'lesson-stack').stacks.length === 0, 'Unstack must dissolve membership without deleting lessons.')

const memory = new Map<string, string>()
const storage = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => { memory.set(key, value) },
}
workspace = createStackFromMembers(EMPTY_STACK_WORKSPACE(calendarId), 'capture', ['persist-a', 'persist-b'], 'persist-stack')
assert(saveStackWorkspace(workspace, storage), 'Stack workspace must persist to storage.')
assert(memory.has(STACK_STORAGE_KEY), 'Stack persistence must write canonical storage key.')
const reloaded = loadStackWorkspace(calendarId, storage)
assert(reloaded.stacks[0]?.stackId === 'persist-stack' && reloaded.stacks[0].memberOrder.join(',') === 'persist-a,persist-b', 'Reload must restore stack member order.')

console.log('stack contract passed')
