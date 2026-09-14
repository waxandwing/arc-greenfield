import { useRef, useState } from 'react'
import { tasksForPriority, type TaskBarItem, type TaskBarWorkspace, type TaskPriority } from '../planning/taskBar'
import { DESK_PRIORITY_DRAG_MIME, encodeDeskPriorityDrag, hasDeskPriorityDrag, readDeskPriorityDrag } from '../planning/deskDrag'
import { TRAY_CAPTURE_DRAG_MIME, readTrayCaptureDrag } from '../planning/deskDrag'

const LANES: Array<{ priority: TaskPriority; label: string; short: string }> = [
  { priority: 'must', label: 'Must', short: 'Must' },
  { priority: 'should', label: 'Should', short: 'Should' },
  { priority: 'could', label: 'Could', short: 'Could' },
]

type Props = {
  workspace: TaskBarWorkspace
  onAdd: (priority: TaskPriority, text: string) => void
  onMove: (taskId: string, priority: TaskPriority) => void
  onPromoteCaptureText?: (captureId: string, priority: TaskPriority) => boolean
  planningDragDisabled?: boolean
}

export function DeskPriorityPad({ workspace, onAdd, onMove, onPromoteCaptureText, planningDragDisabled = false }: Props) {
  return (
    <section className="desk-priority-pad" aria-label="Must Should Could priority pad" data-testid="desk-priority-pad">
      <header className="desk-priority-pad-heading">
        <p className="section-label">Priority pad</p>
        <h2>Must · Should · Could</h2>
      </header>
      <div className="desk-priority-lanes">
        {LANES.map((lane) => (
          <DeskPriorityLane
            key={lane.priority}
            {...lane}
            tasks={tasksForPriority(workspace, lane.priority)}
            planningDragDisabled={planningDragDisabled}
            onAdd={onAdd}
            onMove={onMove}
            onPromoteCaptureText={onPromoteCaptureText}
          />
        ))}
      </div>
    </section>
  )
}

function DeskPriorityLane({ priority, label, tasks, planningDragDisabled = false, onAdd, onMove, onPromoteCaptureText }: {
  priority: TaskPriority
  label: string
  tasks: TaskBarItem[]
  planningDragDisabled?: boolean
  onAdd: Props['onAdd']
  onMove: Props['onMove']
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
      <h3 id={`desk-lane-${priority}`}>{label}</h3>
      <ul className="desk-priority-list" aria-labelledby={`desk-lane-${priority}`}>
        {tasks.map((task) => (
          <DeskPriorityTask key={task.id} task={task} planningDragDisabled={planningDragDisabled} onMove={onMove} />
        ))}
      </ul>
      <label className="desk-priority-add">
        <span className="sr-only">Add to {label}</span>
        <input
          value={draft}
          placeholder={`+ ${label}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); commitDraft() }
          }}
        />
      </label>
    </div>
  )
}

function DeskPriorityTask({ task, planningDragDisabled = false, onMove }: { task: TaskBarItem; planningDragDisabled?: boolean; onMove: (taskId: string, priority: TaskPriority) => void }) {
  const [lifting, setLifting] = useState(false)

  return (
    <li
      className={`desk-priority-task${lifting ? ' desk-priority-task--lift' : ''}${task.important ? ' desk-priority-task--important' : ''}`}
      draggable={!planningDragDisabled}
      onDragStart={(event) => {
        if (planningDragDisabled) {
          event.preventDefault()
          return
        }
        setLifting(true)
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData(DESK_PRIORITY_DRAG_MIME, encodeDeskPriorityDrag({
          kind: 'task',
          taskId: task.id,
          fromPriority: task.priority ?? 'could',
        }))
      }}
      onDragEnd={() => setLifting(false)}
    >
      <span>{task.text}</span>
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
