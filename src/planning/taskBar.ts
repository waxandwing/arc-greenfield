import { createPlanningNote, type PlanningNote, type PlanningNotePriority } from './notes'
import type { PlanningWorkspace } from './workspace'

export type TaskPriority = PlanningNotePriority
export type TaskBarItem = PlanningNote
export type TaskBarWorkspace = PlanningWorkspace

export function createTaskBarItem(
  calendarId: string,
  text: string,
  priority: TaskPriority,
  _now = new Date(),
  id = createTaskId(),
): TaskBarItem {
  return createPlanningNote({
    id,
    calendarId,
    date: null,
    text: normalizeTaskText(text),
    placement: 'task-bar',
    priority,
    important: false,
    completed: false,
    completedAt: null,
    sourceLabel: null,
    sourceLocator: null,
  })
}

export function addTask(workspace: TaskBarWorkspace, item: TaskBarItem): TaskBarWorkspace {
  if (item.placement !== 'task-bar') throw new Error('Only Notes placed in Task Bar can be added to Task Bar.')
  const notes = workspace.notes ?? []
  if (notes.some((candidate) => candidate.id === item.id)) throw new Error('Note IDs must remain unique.')
  return { ...workspace, notes: [...notes, item] }
}

export function renameTask(workspace: TaskBarWorkspace, noteId: string, text: string): TaskBarWorkspace {
  const cleaned = normalizeTaskText(text)
  if (!cleaned) throw new Error('Task text is required.')
  return replaceTask(workspace, noteId, (task) => ({ ...task, text: cleaned }))
}

export function moveTaskPriority(workspace: TaskBarWorkspace, noteId: string, priority: TaskPriority): TaskBarWorkspace {
  return replaceTask(workspace, noteId, (task) => ({ ...task, priority }))
}

export function setTaskImportant(workspace: TaskBarWorkspace, noteId: string, important: boolean): TaskBarWorkspace {
  return replaceTask(workspace, noteId, (task) => ({ ...task, important }))
}

export function setTaskCompleted(
  workspace: TaskBarWorkspace,
  noteId: string,
  completed: boolean,
  now = new Date(),
): TaskBarWorkspace {
  return replaceTask(workspace, noteId, (task) => ({
    ...task,
    completed,
    completedAt: completed ? now.toISOString() : null,
  }))
}

export function deleteTask(workspace: TaskBarWorkspace, noteId: string): TaskBarWorkspace {
  const notes = workspace.notes ?? []
  const task = notes.find((candidate) => candidate.id === noteId && candidate.placement === 'task-bar')
  if (!task) throw new Error('Task Bar Note does not exist.')
  return { ...workspace, notes: notes.filter((candidate) => candidate.id !== noteId) }
}

export function tasksForPriority(workspace: TaskBarWorkspace, priority: TaskPriority): TaskBarItem[] {
  return (workspace.notes ?? []).filter((note) => note.placement === 'task-bar' && note.priority === priority)
}

function replaceTask(
  workspace: TaskBarWorkspace,
  noteId: string,
  update: (task: TaskBarItem) => TaskBarItem,
): TaskBarWorkspace {
  let found = false
  const notes = (workspace.notes ?? []).map((note) => {
    if (note.id !== noteId || note.placement !== 'task-bar') return note
    found = true
    return update(note)
  })
  if (!found) throw new Error('Task Bar Note does not exist.')
  return { ...workspace, notes }
}

function normalizeTaskText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

function createTaskId(): string {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `note-task-${token}`
}
