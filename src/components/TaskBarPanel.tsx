import { useEffect, useRef, useState } from 'react'
import { tasksForPriority, type TaskBarItem, type TaskBarWorkspace, type TaskPriority } from '../planning/taskBar'
import '../styles/taskBar.css'

const LANES: Array<{ priority: TaskPriority; label: string }> = [
  { priority: 'must', label: 'Must Do' },
  { priority: 'should', label: 'Should Do' },
  { priority: 'could', label: 'Could Do' },
]

type Props = {
  workspace: TaskBarWorkspace
  onAdd: (priority: TaskPriority, text: string) => void
  onRename: (taskId: string, text: string) => void
  onMove: (taskId: string, priority: TaskPriority) => void
  onSetImportant: (taskId: string, important: boolean) => void
  onSetCompleted: (taskId: string, completed: boolean) => void
  onDelete: (taskId: string) => void
}

export function TaskBarPanel(props: Props) {
  return (
    <section className="taskbar-panel" aria-label="Task priorities">
      {LANES.map((lane) => <TaskLane key={lane.priority} {...lane} {...props} />)}
    </section>
  )
}

function TaskLane({ priority, label, workspace, onAdd, onRename, onMove, onSetImportant, onSetCompleted, onDelete }: Props & { priority: TaskPriority; label: string }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const addTrigger = useRef<HTMLButtonElement>(null)
  const restoreAddFocus = useRef(false)
  const tasks = tasksForPriority(workspace, priority)

  useEffect(() => {
    if (adding || !restoreAddFocus.current) return
    restoreAddFocus.current = false
    addTrigger.current?.focus()
  }, [adding])

  function cancelAdd() {
    setDraft('')
    restoreAddFocus.current = true
    setAdding(false)
  }

  function commitAdd() {
    const text = draft.trim()
    if (!text) return
    onAdd(priority, text)
    setDraft('')
    restoreAddFocus.current = true
    setAdding(false)
  }

  return (
    <section className={`taskbar-lane taskbar-lane--${priority}`} aria-labelledby={`taskbar-${priority}-heading`}>
      <div className="taskbar-lane-heading">
        <h2 id={`taskbar-${priority}-heading`}>{label}</h2>
        <span className="taskbar-count" aria-label={`${tasks.length} ${label} tasks`}>{tasks.length}</span>
      </div>

      <div className="taskbar-list" role="list">
        {tasks.length === 0 ? <p className="taskbar-empty">Nothing here yet.</p> : tasks.map((task) => (
          <TaskRow key={task.id} task={task} onRename={onRename} onMove={onMove} onSetImportant={onSetImportant} onSetCompleted={onSetCompleted} onDelete={onDelete} />
        ))}
      </div>

      {adding ? (
        <div className="taskbar-add-row">
          <label className="sr-only" htmlFor={`taskbar-add-${priority}`}>Add {label} task</label>
          <input id={`taskbar-add-${priority}`} autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); commitAdd() }
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelAdd() }
          }} placeholder={`Add to ${label}`} />
          <button type="button" className="taskbar-add-confirm" disabled={!draft.trim()} onClick={commitAdd}>Add</button>
          <button type="button" className="taskbar-add-cancel" onClick={cancelAdd}>Cancel</button>
        </div>
      ) : (
        <button ref={addTrigger} type="button" className="taskbar-add-trigger" onClick={() => setAdding(true)}>+ Add</button>
      )}
    </section>
  )
}

function TaskRow({ task, onRename, onMove, onSetImportant, onSetCompleted, onDelete }: {
  task: TaskBarItem
  onRename: (taskId: string, text: string) => void
  onMove: (taskId: string, priority: TaskPriority) => void
  onSetImportant: (taskId: string, important: boolean) => void
  onSetCompleted: (taskId: string, completed: boolean) => void
  onDelete: (taskId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.text)

  function finishEdit() {
    const text = draft.trim()
    if (text && text !== task.text) onRename(task.id, text)
    else setDraft(task.text)
    setEditing(false)
  }

  return (
    <article className={`taskbar-task${task.completed ? ' taskbar-task--completed' : ''}${task.important ? ' taskbar-task--important' : ''}`} role="listitem">
      <label className="taskbar-complete">
        <input type="checkbox" checked={task.completed} onChange={(event) => onSetCompleted(task.id, event.target.checked)} />
        <span className="sr-only">{task.completed ? 'Mark task not complete' : 'Mark task complete'}: {task.text}</span>
      </label>
      {editing ? (
        <input className="taskbar-edit-input" autoFocus value={draft} aria-label={`Edit task ${task.text}`} onChange={(event) => setDraft(event.target.value)} onBlur={finishEdit} onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); finishEdit() }
          if (event.key === 'Escape') { event.preventDefault(); setDraft(task.text); setEditing(false) }
        }} />
      ) : (
        <button type="button" className="taskbar-task-text" onClick={() => setEditing(true)} aria-label={`Edit task ${task.text}`}>
          <span>{task.text}</span>
          {task.important ? <span className="taskbar-important-label">Important</span> : null}
        </button>
      )}
      <div className="taskbar-task-actions">
        <button type="button" aria-pressed={task.important} className="taskbar-important-toggle" onClick={() => onSetImportant(task.id, !task.important)}>{task.important ? 'Important ✓' : 'Important'}</button>
        <label>
          <span className="sr-only">Move {task.text} priority</span>
          <select value={task.priority ?? 'could'} aria-label={`Move ${task.text} priority`} onChange={(event) => onMove(task.id, event.target.value as TaskPriority)}>
            <option value="must">Must Do</option>
            <option value="should">Should Do</option>
            <option value="could">Could Do</option>
          </select>
        </label>
        <button type="button" className="taskbar-remove" onClick={() => onDelete(task.id)} aria-label={`Delete task ${task.text}`}>Delete</button>
      </div>
    </article>
  )
}
