export type TaskPriority = 'must' | 'should' | 'could'

export type TaskBarItem = {
  id: string
  text: string
  priority: TaskPriority
  completed: boolean
  important: boolean
  createdAt: string
  completedAt: string | null
}

export type TaskBarWorkspace = {
  version: 1
  items: TaskBarItem[]
}

export const EMPTY_TASK_BAR: TaskBarWorkspace = { version: 1, items: [] }

export function createTaskBarItem(
  text: string,
  priority: TaskPriority,
  now = new Date(),
  id = createTaskId(),
): TaskBarItem {
  const cleaned = normalizeTaskText(text)
  if (!cleaned) throw new Error('Task text is required.')
  return {
    id,
    text: cleaned,
    priority,
    completed: false,
    important: false,
    createdAt: now.toISOString(),
    completedAt: null,
  }
}

export function addTask(workspace: TaskBarWorkspace, item: TaskBarItem): TaskBarWorkspace {
  if (workspace.items.some((candidate) => candidate.id === item.id)) throw new Error('Task IDs must remain unique.')
  return { ...workspace, items: [...workspace.items, item] }
}

export function renameTask(workspace: TaskBarWorkspace, taskId: string, text: string): TaskBarWorkspace {
  const cleaned = normalizeTaskText(text)
  if (!cleaned) throw new Error('Task text is required.')
  return replaceTask(workspace, taskId, (task) => ({ ...task, text: cleaned }))
}

export function moveTaskPriority(workspace: TaskBarWorkspace, taskId: string, priority: TaskPriority): TaskBarWorkspace {
  return replaceTask(workspace, taskId, (task) => ({ ...task, priority }))
}

export function setTaskImportant(workspace: TaskBarWorkspace, taskId: string, important: boolean): TaskBarWorkspace {
  return replaceTask(workspace, taskId, (task) => ({ ...task, important }))
}

export function setTaskCompleted(
  workspace: TaskBarWorkspace,
  taskId: string,
  completed: boolean,
  now = new Date(),
): TaskBarWorkspace {
  return replaceTask(workspace, taskId, (task) => ({
    ...task,
    completed,
    completedAt: completed ? now.toISOString() : null,
  }))
}

export function removeTask(workspace: TaskBarWorkspace, taskId: string): TaskBarWorkspace {
  if (!workspace.items.some((task) => task.id === taskId)) throw new Error('Task does not exist.')
  return { ...workspace, items: workspace.items.filter((task) => task.id !== taskId) }
}

export function tasksForPriority(workspace: TaskBarWorkspace, priority: TaskPriority): TaskBarItem[] {
  return workspace.items.filter((task) => task.priority === priority)
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return value === 'must' || value === 'should' || value === 'could'
}

export function normalizeTaskBarWorkspace(value: unknown): TaskBarWorkspace {
  if (!value || typeof value !== 'object') return EMPTY_TASK_BAR
  const candidate = value as { version?: unknown; items?: unknown }
  if (candidate.version !== 1 || !Array.isArray(candidate.items)) return EMPTY_TASK_BAR

  const seen = new Set<string>()
  const items: TaskBarItem[] = []
  for (const raw of candidate.items) {
    if (!raw || typeof raw !== 'object') continue
    const task = raw as Partial<TaskBarItem>
    if (typeof task.id !== 'string' || !task.id || seen.has(task.id)) continue
    if (typeof task.text !== 'string' || !normalizeTaskText(task.text)) continue
    if (!isTaskPriority(task.priority)) continue
    if (typeof task.completed !== 'boolean') continue
    if (typeof task.createdAt !== 'string' || Number.isNaN(Date.parse(task.createdAt))) continue
    if (task.completedAt !== null && task.completedAt !== undefined && (typeof task.completedAt !== 'string' || Number.isNaN(Date.parse(task.completedAt)))) continue
    seen.add(task.id)
    items.push({
      id: task.id,
      text: normalizeTaskText(task.text),
      priority: task.priority,
      completed: task.completed,
      important: task.important === true,
      createdAt: task.createdAt,
      completedAt: task.completed ? task.completedAt ?? task.createdAt : null,
    })
  }
  return { version: 1, items }
}

function replaceTask(
  workspace: TaskBarWorkspace,
  taskId: string,
  update: (task: TaskBarItem) => TaskBarItem,
): TaskBarWorkspace {
  let found = false
  const items = workspace.items.map((task) => {
    if (task.id !== taskId) return task
    found = true
    return update(task)
  })
  if (!found) throw new Error('Task does not exist.')
  return { ...workspace, items }
}

function normalizeTaskText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

function createTaskId(): string {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `task-${token}`
}
