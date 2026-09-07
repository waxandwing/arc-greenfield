import {
  EMPTY_TASK_BAR,
  addTask,
  createTaskBarItem,
  moveTaskPriority,
  normalizeTaskBarWorkspace,
  removeTask,
  renameTask,
  setTaskCompleted,
  setTaskImportant,
  tasksForPriority,
} from './taskBar'

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const created = createTaskBarItem('  Make copies   for Unit 2  ', 'must', new Date('2026-09-07T12:00:00-04:00'), 'task-a')
check(created.text === 'Make copies for Unit 2', 'Task text must normalize without changing identity.')
check(created.priority === 'must' && !created.completed && !created.important, 'New tasks must start open and non-Important.')

let workspace = addTask(EMPTY_TASK_BAR, created)
workspace = addTask(workspace, createTaskBarItem('Email observation notes', 'should', new Date('2026-09-07T12:01:00-04:00'), 'task-b'))
workspace = addTask(workspace, createTaskBarItem('Update display labels', 'could', new Date('2026-09-07T12:02:00-04:00'), 'task-c'))
check(tasksForPriority(workspace, 'must').length === 1, 'Must lane must project only Must tasks.')
check(tasksForPriority(workspace, 'should').length === 1, 'Should lane must project only Should tasks.')
check(tasksForPriority(workspace, 'could').length === 1, 'Could lane must project only Could tasks.')

workspace = moveTaskPriority(workspace, 'task-b', 'must')
check(tasksForPriority(workspace, 'must').map((task) => task.id).join(',') === 'task-a,task-b', 'Priority move must preserve stable task identity.')
workspace = setTaskImportant(workspace, 'task-b', true)
check(workspace.items.find((task) => task.id === 'task-b')?.important === true, 'Important is explicit state, not inferred from priority.')
workspace = setTaskCompleted(workspace, 'task-a', true, new Date('2026-09-07T12:10:00-04:00'))
check(workspace.items.find((task) => task.id === 'task-a')?.completedAt === '2026-09-07T16:10:00.000Z', 'Completion must record an explicit timestamp.')
workspace = setTaskCompleted(workspace, 'task-a', false)
check(workspace.items.find((task) => task.id === 'task-a')?.completedAt === null, 'Reopening a lightweight task must clear completion timestamp.')
workspace = renameTask(workspace, 'task-c', 'Update hallway labels')
check(workspace.items.find((task) => task.id === 'task-c')?.text === 'Update hallway labels', 'Rename must preserve ID while updating text.')
workspace = removeTask(workspace, 'task-c')
check(!workspace.items.some((task) => task.id === 'task-c'), 'Explicit remove must remove only the targeted task.')
check(workspace.items.some((task) => task.id === 'task-a') && workspace.items.some((task) => task.id === 'task-b'), 'Removing one task must not disturb neighboring task truth.')

const restored = normalizeTaskBarWorkspace(JSON.parse(JSON.stringify(workspace)))
check(restored.items.length === 2 && restored.items[1]?.important === true, 'Normalized persistence must retain stable IDs and Important state.')
const duplicate = normalizeTaskBarWorkspace({ version: 1, items: [workspace.items[0], workspace.items[0]] })
check(duplicate.items.length === 1, 'Malformed duplicate IDs must fail closed rather than create ambiguous tasks.')

let rejected = false
try { addTask(workspace, created) } catch { rejected = true }
check(rejected, 'Duplicate task IDs must be rejected explicitly.')

console.log('Task Bar domain contract passed')
