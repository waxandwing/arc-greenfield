import {
  addTask,
  createTaskBarItem,
  deleteTask,
  moveTaskPriority,
  renameTask,
  setTaskCompleted,
  setTaskImportant,
  tasksForPriority,
} from './taskBar'
import type { PlanningWorkspace } from './workspace'

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

let workspace: PlanningWorkspace = { calendarId: 'calendar-a', courses: [], sections: [], notes: [] }
const created = createTaskBarItem('calendar-a', '  Make copies   for Unit 2  ', 'must', new Date('2026-09-07T12:00:00-04:00'), 'note-task-a')
check(created.text === 'Make copies for Unit 2', 'Task text must normalize without changing Note identity.')
check(created.placement === 'task-bar' && created.date === null, 'Task Bar entries must remain canonical unscheduled Notes.')
check(created.priority === 'must' && !created.completed && !created.important, 'New Task Bar Notes must start open and non-Important.')

workspace = addTask(workspace, created)
workspace = addTask(workspace, createTaskBarItem('calendar-a', 'Email observation notes', 'should', new Date('2026-09-07T12:01:00-04:00'), 'note-task-b'))
workspace = addTask(workspace, createTaskBarItem('calendar-a', 'Update display labels', 'could', new Date('2026-09-07T12:02:00-04:00'), 'note-task-c'))
check(tasksForPriority(workspace, 'must').length === 1, 'Must lane must project only Must Task Bar Notes.')
check(tasksForPriority(workspace, 'should').length === 1, 'Should lane must project only Should Task Bar Notes.')
check(tasksForPriority(workspace, 'could').length === 1, 'Could lane must project only Could Task Bar Notes.')

workspace = moveTaskPriority(workspace, 'note-task-b', 'must')
check(tasksForPriority(workspace, 'must').map((task) => task.id).join(',') === 'note-task-a,note-task-b', 'Priority move must preserve stable Note identity.')
workspace = setTaskImportant(workspace, 'note-task-b', true)
check(workspace.notes?.find((note) => note.id === 'note-task-b')?.important === true, 'Important is explicit Note state, not inferred from priority.')
workspace = setTaskCompleted(workspace, 'note-task-a', true, new Date('2026-09-07T12:10:00-04:00'))
check(workspace.notes?.find((note) => note.id === 'note-task-a')?.completedAt === '2026-09-07T16:10:00.000Z', 'Completion must record an explicit timestamp.')
workspace = setTaskCompleted(workspace, 'note-task-a', false)
check(workspace.notes?.find((note) => note.id === 'note-task-a')?.completedAt === null, 'Reopening a lightweight Task Bar Note must clear completion timestamp.')
workspace = renameTask(workspace, 'note-task-c', 'Update hallway labels')
check(workspace.notes?.find((note) => note.id === 'note-task-c')?.text === 'Update hallway labels', 'Rename must preserve Note ID while updating text.')
workspace = deleteTask(workspace, 'note-task-c')
check(!workspace.notes?.some((note) => note.id === 'note-task-c'), 'Explicit Delete must destroy only the targeted Task Bar Note.')
check(workspace.notes?.some((note) => note.id === 'note-task-a') && workspace.notes?.some((note) => note.id === 'note-task-b'), 'Deleting one Task Bar Note must not disturb neighboring Note truth.')

let rejected = false
try { addTask(workspace, created) } catch { rejected = true }
check(rejected, 'Duplicate Note IDs must be rejected explicitly.')

console.log('Task Bar canonical Note domain contract passed')
