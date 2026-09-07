import { useCallback, useState } from 'react'
import {
  addTask,
  createTaskBarItem,
  moveTaskPriority,
  removeTask,
  renameTask,
  setTaskCompleted,
  setTaskImportant,
  type TaskPriority,
} from '../planning/taskBar'
import { loadTaskBar, saveTaskBar } from '../planning/taskBarPersistence'

export function useTaskBar() {
  const [workspace, setWorkspace] = useState(() => loadTaskBar().workspace)
  const [storageNotice, setStorageNotice] = useState<string | null>(null)

  const commit = useCallback((update: Parameters<typeof setWorkspace>[0]) => {
    setWorkspace((current) => {
      const next = typeof update === 'function' ? update(current) : update
      setStorageNotice(saveTaskBar(next) ? null : 'Task Bar changes are available for this session, but browser storage is unavailable.')
      return next
    })
  }, [])

  return {
    workspace,
    storageNotice,
    add(priority: TaskPriority, text: string) {
      commit((current) => addTask(current, createTaskBarItem(text, priority)))
    },
    rename(taskId: string, text: string) {
      commit((current) => renameTask(current, taskId, text))
    },
    move(taskId: string, priority: TaskPriority) {
      commit((current) => moveTaskPriority(current, taskId, priority))
    },
    setImportant(taskId: string, important: boolean) {
      commit((current) => setTaskImportant(current, taskId, important))
    },
    setCompleted(taskId: string, completed: boolean) {
      commit((current) => setTaskCompleted(current, taskId, completed))
    },
    remove(taskId: string) {
      commit((current) => removeTask(current, taskId))
    },
  }
}
