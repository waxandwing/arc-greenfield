import { createPlanningNote, type PlanningNote, type PlanningNotePriority } from './notes'
import type { PlanningWorkspace } from './workspace'

export type TaskPriority = PlanningNotePriority
export type TaskBarItem = PlanningNote
export type TaskBarWorkspace = PlanningWorkspace

export function createTaskBarItem(calendarId: string, text: string, priority: TaskPriority, id = createTaskId()): TaskBarItem {
  return createPlanningNote({
    id, calendarId, date: null, text: normalizeTaskText(text), placement: 'task-bar', priority,
    important: false, completed: false, completedAt: null, sourceLabel: null, sourceLocator: null,
  })
}

export function addTask(workspace: TaskBarWorkspace, item: TaskBarItem): TaskBarWorkspace {
  const notes = workspace.notes ?? []
  if (item.placement !== 'task-bar') throw new Error('Only Task Bar Notes can be added to Task Bar.')
  if (notes.some((note) => note.id === item.id)) throw new Error('Note IDs must remain unique.')
  return { ...workspace, notes: [...notes, item] }
}

export function renameTask(workspace: TaskBarWorkspace, noteId: string, text: string): TaskBarWorkspace {
  return replaceTask(workspace, noteId, (task) => ({ ...task, text: normalizeTaskText(text) }))
}
export function moveTaskPriority(workspace: TaskBarWorkspace, noteId: string, priority: TaskPriority): TaskBarWorkspace {
  return replaceTask(workspace, noteId, (task) => ({ ...task, priority }))
}
export function setTaskImportant(workspace: TaskBarWorkspace, noteId: string, important: boolean): TaskBarWorkspace {
  return replaceTask(workspace, noteId, (task) => ({ ...task, important }))
}
export function setTaskCompleted(workspace: TaskBarWorkspace, noteId: string, completed: boolean, now = new Date()): TaskBarWorkspace {
  return replaceTask(workspace, noteId, (task) => ({ ...task, completed, completedAt: completed ? now.toISOString() : null }))
}
export function deleteTask(workspace: TaskBarWorkspace, noteId: string): TaskBarWorkspace {
  return { ...workspace, notes: (workspace.notes ?? []).filter((note) => note.id !== noteId) }
}
export function tasksForPriority(workspace: TaskBarWorkspace, priority: TaskPriority): TaskBarItem[] {
  return (workspace.notes ?? []).filter((note) => note.placement === 'task-bar' && note.priority === priority)
}

function replaceTask(workspace: TaskBarWorkspace, noteId: string, update: (task: TaskBarItem) => TaskBarItem): TaskBarWorkspace {
  let found = false
  const notes = (workspace.notes ?? []).map((note) => {
    if (note.id !== noteId || note.placement !== 'task-bar') return note
    found = true
    return update(note)
  })
  if (!found) throw new Error('Task Bar Note does not exist.')
  return { ...workspace, notes }
}

function normalizeTaskText(text: string) { return text.trim().replace(/\s+/g, ' ') }
function createTaskId() { return `note-task-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}` }
