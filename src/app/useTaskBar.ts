import {
  addTask,
  createTaskBarItem,
  deleteTask,
  moveTaskPriority,
  renameTask,
  setTaskCompleted,
  setTaskImportant,
  type PlanningWorkspace,
  type PlanningWorkspaceInput,
  type TaskPriority,
} from '../planning'
import type { SchoolCalendar } from '../calendar'

type TaskBarWorkspaceOwner = {
  calendar: SchoolCalendar | null
  planningWorkspace: PlanningWorkspace | null
  useClasses: (input: PlanningWorkspaceInput, workspace: PlanningWorkspace) => void
}

export function useTaskBar(owner: TaskBarWorkspaceOwner) {
  const workspace = owner.planningWorkspace ?? (owner.calendar ? emptyPlanningWorkspace(owner.calendar.id) : null)

  function commit(update: (current: PlanningWorkspace) => PlanningWorkspace) {
    if (!workspace) return
    const next = update(workspace)
    owner.useClasses(next, next)
  }

  return {
    workspace,
    add(priority: TaskPriority, text: string) {
      if (!workspace) return
      commit((current) => addTask(current, createTaskBarItem(current.calendarId, text, priority)))
    },
    rename(noteId: string, text: string) {
      commit((current) => renameTask(current, noteId, text))
    },
    move(noteId: string, priority: TaskPriority) {
      commit((current) => moveTaskPriority(current, noteId, priority))
    },
    setImportant(noteId: string, important: boolean) {
      commit((current) => setTaskImportant(current, noteId, important))
    },
    setCompleted(noteId: string, completed: boolean) {
      commit((current) => setTaskCompleted(current, noteId, completed))
    },
    delete(noteId: string) {
      commit((current) => deleteTask(current, noteId))
    },
  }
}

function emptyPlanningWorkspace(calendarId: string): PlanningWorkspace {
  return { calendarId, courses: [], sections: [], notes: [] }
}
