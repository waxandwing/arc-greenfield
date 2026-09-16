import { useRef, useState } from 'react'
import { tasksForPriority, type TaskBarItem, type TaskBarWorkspace, type TaskPriority } from '../planning/taskBar'
import { DESK_PRIORITY_DRAG_MIME, encodeDeskPriorityDrag, hasDeskPriorityDrag, readDeskPriorityDrag } from '../planning/deskDrag'
import { TRAY_CAPTURE_DRAG_MIME, readTrayCaptureDrag } from '../planning/deskDrag'

const LANES: Array<{ priority: TaskPriority; label: string; short: string; folderLabel?: string }> = [
  { priority: 'must', label: 'Must', short: 'Must', folderLabel: 'MUST DO' },
  { priority: 'should', label: 'Should', short: 'Should', folderLabel: 'SHOULD DO' },
  { priority: 'could', label: 'Could', short: 'Could', folderLabel: 'COULD DO' },
]

type Props = {
  workspace: TaskBarWorkspace
  onAdd: (priority: TaskPriority, text: string) => void
  onRename: (taskId: string, text: string) => void
  onMove: (taskId: string, priority: TaskPriority) => void
  onSetCompleted: (taskId: string, completed: boolean) => void
  onPromoteCaptureText?: (captureId: string, priority: TaskPriority) => boolean
  planningDragDisabled?: boolean
  /** Kelly TO-DOS folder: vertical MUST DO / SHOULD DO / COULD DO labels only. */
  folderChrome?: boolean
}

export function DeskPriorityPad({
  workspace,
  onAdd,
  onRename,
  onMove,
  onSetCompleted,
  onPromoteCaptureText,
  planningDragDisabled = false,
  folderChrome = false,
}: Props) {
  return (
    <section
      className={`desk-priority-pad${folderChrome ? ' desk-priority-pad--folder' : ''}`}
      aria-label="Must Should Could priority pad"
      data-testid="desk-priority-pad"
    >
      {folderChrome ? null : (
        <header className="desk-priority-pad-heading">
          <p className="section-label">To-dos</p>
          <h2>MUST · SHOULD · COULD</h2>
        </header>
      )}
      <div className="desk-priority-lanes">
        {LANES.map((lane) => (
          <DeskPriorityLane
            key={lane.priority}
            {...lane}
            folderChrome={folderChrome}
            tasks={tasksForPriority(workspace, lane.priority)}
            planningDragDisabled={planningDragDisabled}
            onAdd={onAdd}
            onRename={onRename}
            onMove={onMove}
            onSetCompleted={onSetCompleted}
            onPromoteCaptureText={onPromoteCaptureText}
          />
        ))}
      </div>
    </section>
  )
}

function DeskPriorityLane({
  priority,
  label,
  folderLabel,
  folderChrome = false,
  tasks,
  planningDragDisabled = false,
  onAdd,
  onRename,
  onMove,
  onSetCompleted,
  onPromoteCaptureText,
}: {
  priority: TaskPriority
  label: string
  folderLabel?: string
  folderChrome?: boolean
  tasks: TaskBarItem[]
  planningDragDisabled?: boolean
  onAdd: Props['onAdd']
  onRename: Props['onRename']
  onMove: Props['onMove']
  onSetCompleted: Props['onSetCompleted']
  onPromoteCaptureText?: Props['onPromoteCaptureText']
}) {
  const [draft, setDraft] = useState('')
  const [dropHint, setDropHint] = useState(false)
  const laneRef = useRef<HTMLDivElement>(null)

  function commitDraft() {
    const text = draft.trim()
    if (!text) return
    onAdd(priority, text)
    setDraft('')
  }

  return (
    <div
      ref={laneRef}
      className={`desk-priority-lane desk-priority-lane--${priority}${dropHint ? ' desk-priority-lane--drop-target' : ''}`}
      data-desk-postit-drop="priority"
      data-priority={priority}
      data-testid={`desk-priority-lane-${priority}`}
      onDragOver={(event) => {
        if (planningDragDisabled) return
        if (!hasDeskPriorityDrag(event.dataTransfer) && !event.dataTransfer.types.includes(TRAY_CAPTURE_DRAG_MIME)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setDropHint(true)
      }}
      onDragLeave={() => setDropHint(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDropHint(false)
        const taskPayload = readDeskPriorityDrag(event.dataTransfer)
        if (taskPayload && taskPayload.fromPriority !== priority) {
          onMove(taskPayload.taskId, priority)
          return
        }
        const capturePayload = readTrayCaptureDrag(event.dataTransfer)
        if (capturePayload && onPromoteCaptureText) {
          onPromoteCaptureText(capturePayload.captureId, priority)
        }
      }}
    >
      <h3 id={`desk-lane-${priority}`}>{folderChrome && folderLabel ? folderLabel : label}</h3>
      <ul className="desk-priority-list" aria-labelledby={`desk-lane-${priority}`}>
        {tasks.map((task) => (
          <DeskPriorityTask
            key={task.id}
            task={task}
            planningDragDisabled={planningDragDisabled}
            onRename={onRename}
            onMove={onMove}
            onSetCompleted={onSetCompleted}
          />
        ))}
      </ul>
      <label className="desk-priority-add">
        <span className="sr-only">Add to {label}</span>
        <input
          data-testid={`desk-priority-add-${priority}`}
          value={draft}
          placeholder={`+ ${label}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitDraft()
            }
          }}
        />
      </label>
    </div>
  )
}

function DeskPriorityTask({
  task,
  planningDragDisabled = false,
  onRename,
  onMove,
  onSetCompleted,
}: {
  task: TaskBarItem
  planningDragDisabled?: boolean
  onRename: (taskId: string, text: string) => void
  onMove: (taskId: string, priority: TaskPriority) => void
  onSetCompleted: (taskId: string, completed: boolean) => void
}) {
  const [lifting, setLifting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.text)

  function finishEdit() {
    const text = draft.trim()
    if (text && text !== task.text) onRename(task.id, text)
    else setDraft(task.text)
    setEditing(false)
  }

  return (
    <li
      className={`desk-priority-task${lifting ? ' desk-priority-task--lift' : ''}${task.important ? ' desk-priority-task--important' : ''}${task.completed ? ' desk-priority-task--completed' : ''}`}
      data-testid={`desk-priority-task-${task.id}`}
      data-completed={task.completed ? 'true' : 'false'}
      draggable={!planningDragDisabled && !editing}
      onDragStart={(event) => {
        if (planningDragDisabled || editing) {
          event.preventDefault()
          return
        }
        setLifting(true)
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData(
          DESK_PRIORITY_DRAG_MIME,
          encodeDeskPriorityDrag({
            kind: 'task',
            taskId: task.id,
            fromPriority: task.priority ?? 'could',
          }),
        )
      }}
      onDragEnd={() => setLifting(false)}
    >
      <label className="desk-priority-complete">
        <input
          type="checkbox"
          data-testid={`desk-priority-complete-${task.id}`}
          checked={task.completed}
          onChange={(event) => onSetCompleted(task.id, event.target.checked)}
        />
        <span className="sr-only">
          {task.completed ? 'Mark task not complete' : 'Mark task complete'}: {task.text}
        </span>
      </label>
      {editing ? (
        <input
          className="desk-priority-edit-input"
          data-testid={`desk-priority-edit-${task.id}`}
          autoFocus
          value={draft}
          aria-label={`Edit task ${task.text}`}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={finishEdit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              finishEdit()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              setDraft(task.text)
              setEditing(false)
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="desk-priority-task-text"
          data-testid={`desk-priority-task-text-${task.id}`}
          onClick={() => setEditing(true)}
          aria-label={`Edit task ${task.text}`}
        >
          <span>{task.text}</span>
        </button>
      )}
      <select
        className="desk-priority-task-move sr-only-focusable"
        value={task.priority ?? 'could'}
        aria-label={`Move ${task.text}`}
        onChange={(event) => onMove(task.id, event.target.value as TaskPriority)}
      >
        <option value="must">Must</option>
        <option value="should">Should</option>
        <option value="could">Could</option>
      </select>
    </li>
  )
}
