import { useState, type PointerEventHandler } from 'react'
import {
  parseCaptureIntent,
  type FridgeDoorState,
  type FridgeEntityRef,
  type FridgePriority,
  type LessonWorkspace,
  type PlanningWorkspace,
  type UnitWorkspace,
} from '../planning'
import { FRIDGE_DOOR_CAPACITY } from '../app/useFridgeDoorWorkspace'
import { useFridgePointerDrag } from './useFridgePointerDrag'

type PendingCapture = { kind: 'unit' | 'lesson'; title: string } | null
type Placement = FridgeDoorState['placements'][number]

type Props = {
  state: FridgeDoorState
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  notice: string | null
  onCreateMagnet: (title: string) => string | null
  onCreateUnit: (title: string, courseId: string) => string | null
  onCreateLesson: (title: string, unitId: string) => string | null
  onReposition: (entityRef: FridgeEntityRef, row: number, column: number) => string | null
  onStack: (anchorRef: FridgeEntityRef, memberRef: FridgeEntityRef) => string | null
  onReorderStack: (entityRef: FridgeEntityRef, direction: 'up' | 'down') => string | null
  onRepositionStack: (stackId: string, row: number, column: number) => string | null
  onUnstack: (entityRef: FridgeEntityRef, row: number, column: number) => string | null
  onSetPriority: (entityRef: FridgeEntityRef, priority: FridgePriority) => string | null
  onPutAway: (entityRef: FridgeEntityRef) => string | null
  onBringBack: (entityRef: FridgeEntityRef) => string | null
  onOpenUnit: (unitId: string) => void
  onOpenLesson: (lessonId: string) => void
}

type ItemInfo = {
  ref: FridgeEntityRef
  kind: 'Unit' | 'Lesson' | 'Magnet'
  title: string
  context: string | null
}

export function FridgeDoorPanel(props: Props) {
  const [capture, setCapture] = useState('')
  const [pendingCapture, setPendingCapture] = useState<PendingCapture>(null)
  const [captureContextId, setCaptureContextId] = useState('')
  const [stackAnchorRef, setStackAnchorRef] = useState<FridgeEntityRef | ''>('')
  const [stackMemberRef, setStackMemberRef] = useState<FridgeEntityRef | ''>('')
  const [localError, setLocalError] = useState<string | null>(null)
  const drag = useFridgePointerDrag({
    onRepositionEntity: props.onReposition,
    onRepositionStack: props.onRepositionStack,
    onPutAway: props.onPutAway,
    onBringBack: props.onBringBack,
    onReject: setLocalError,
  })
  const door = props.state.placements
    .filter((item) => item.surface === 'door')
    .slice()
    .sort((a, b) => a.row - b.row || a.column - b.column || (a.stackOrder ?? 0) - (b.stackOrder ?? 0))
  const drawer = props.state.placements
    .filter((item) => item.surface === 'drawer')
    .slice()
    .sort((a, b) => a.column - b.column || a.row - b.row)
  const stackGroups = groupDoorStacks(door)
  const looseDoor = door.filter((item) => !item.stackId)
  const stackAnchors = [
    ...looseDoor.filter(isStackEligible),
    ...stackGroups.map((group) => group[0]).filter(Boolean),
  ]
  const stackMembers = looseDoor.filter(isStackEligible)
  const status = localError ?? props.notice

  function report(result: string | null) {
    setLocalError(result)
  }

  function resetCapture() {
    setCapture('')
    setPendingCapture(null)
    setCaptureContextId('')
  }

  function beginCapture() {
    try {
      const intent = parseCaptureIntent(capture)
      if (intent.kind === 'magnet') {
        const result = props.onCreateMagnet(intent.title)
        report(result)
        if (!result) resetCapture()
        return
      }
      setPendingCapture({ kind: intent.kind, title: intent.title })
      setCaptureContextId('')
      setLocalError(null)
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : String(error))
    }
  }

  function finishContextCapture() {
    if (!pendingCapture) return
    if (!captureContextId) {
      setLocalError(pendingCapture.kind === 'unit' ? 'Choose a Course for this Unit.' : 'Choose a Unit for this Lesson.')
      return
    }
    const result = pendingCapture.kind === 'unit'
      ? props.onCreateUnit(pendingCapture.title, captureContextId)
      : props.onCreateLesson(pendingCapture.title, captureContextId)
    report(result)
    if (!result) resetCapture()
  }

  function createStack() {
    if (!stackAnchorRef || !stackMemberRef) {
      setLocalError('Choose an anchor or stack and one loose Lesson or Magnet.')
      return
    }
    const result = props.onStack(stackAnchorRef, stackMemberRef)
    report(result)
    if (!result) {
      setStackAnchorRef('')
      setStackMemberRef('')
    }
  }

  const availableMembers = stackMembers.filter((placement) => placement.entityRef !== stackAnchorRef)

  return (
    <section className="fridge-door" aria-label="Fridge Door">
      <header className="fridge-door-heading">
        <div>
          <p className="section-label">Fridge Door</p>
          <p className="fridge-door-note">Off the calendar, not gone.</p>
        </div>
        <div className="fridge-door-counts" aria-label="Fridge Door item counts">
          <span>{door.length} on Door</span>
          <span>{drawer.length} in Drawer</span>
        </div>
      </header>

      <form className="fridge-capture" onSubmit={(event) => { event.preventDefault(); beginCapture() }}>
        <label>
          <span>Quick capture</span>
          <input
            value={capture}
            onChange={(event) => {
              setCapture(event.target.value)
              setPendingCapture(null)
              setCaptureContextId('')
            }}
            placeholder="M gallery walk idea"
          />
        </label>
        <button type="submit" className="quiet-button" disabled={!capture.trim()}>Capture</button>
      </form>
      <p className="fridge-capture-note"><strong>U</strong> Unit · <strong>L</strong> Lesson · <strong>M</strong> Magnet. No prefix becomes a Magnet.</p>

      {pendingCapture ? (
        <div className="fridge-capture-context" role="group" aria-label={`${pendingCapture.kind === 'unit' ? 'Unit' : 'Lesson'} capture context`}>
          <p><strong>{pendingCapture.title}</strong> needs one piece of context before Arc creates it.</p>
          <label>
            <span>{pendingCapture.kind === 'unit' ? 'Course' : 'Unit'}</span>
            <select value={captureContextId} onChange={(event) => setCaptureContextId(event.target.value)}>
              <option value="">Choose…</option>
              {(pendingCapture.kind === 'unit' ? props.planning.courses : props.units.units).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <div>
            <button type="button" className="text-button" onClick={() => { setPendingCapture(null); setCaptureContextId('') }}>Cancel</button>
            <button type="button" className="primary-button" onClick={finishContextCapture}>Create {pendingCapture.kind === 'unit' ? 'Unit' : 'Lesson'}</button>
          </div>
        </div>
      ) : null}

      {stackAnchors.length > 0 && stackMembers.length > 0 ? (
        <div className="fridge-stack-builder" role="group" aria-label="Stack items">
          <p><strong>Stack items</strong> keeps temporary grouping separate from curriculum structure.</p>
          <label>
            <span>Anchor or stack</span>
            <select value={stackAnchorRef} onChange={(event) => { setStackAnchorRef(event.target.value as FridgeEntityRef | ''); setStackMemberRef('') }}>
              <option value="">Choose…</option>
              {stackAnchors.map((placement) => {
                const item = resolveItem(placement.entityRef, props.units, props.lessons, props.state)
                if (!item) return null
                const group = placement.stackId ? stackGroups.find((candidate) => candidate[0]?.stackId === placement.stackId) : null
                return <option key={placement.stackId ?? placement.entityRef} value={placement.entityRef}>{group ? `Stack · ${group.length} items · ${item.title}` : item.title}</option>
              })}
            </select>
          </label>
          <label>
            <span>Add loose item</span>
            <select value={stackMemberRef} onChange={(event) => setStackMemberRef(event.target.value as FridgeEntityRef | '')} disabled={!stackAnchorRef}>
              <option value="">Choose…</option>
              {availableMembers.map((placement) => {
                const item = resolveItem(placement.entityRef, props.units, props.lessons, props.state)
                return item ? <option key={placement.entityRef} value={placement.entityRef}>{item.title}</option> : null
              })}
            </select>
          </label>
          <button type="button" className="quiet-button" disabled={!stackAnchorRef || !stackMemberRef} onClick={createStack}>Stack</button>
        </div>
      ) : null}

      {status ? <p className="fridge-door-status" role="status">{status}</p> : null}
      <p className="sr-only" role="status">{drag.active ? 'Fridge drag active. Release over a valid Fridge target, or release elsewhere to cancel.' : ''}</p>

      <div className="fridge-door-scroll" tabIndex={0} aria-label="Fridge Door spatial surface">
        <div
          className={`fridge-door-grid${drag.active ? ' fridge-door-grid--dragging' : ''}`}
          data-fridge-drop-door="true"
          style={{
            gridTemplateColumns: `repeat(${FRIDGE_DOOR_CAPACITY.columns}, minmax(150px, 1fr))`,
            gridTemplateRows: `repeat(${FRIDGE_DOOR_CAPACITY.rows}, minmax(108px, auto))`,
          }}
        >
          {Array.from({ length: FRIDGE_DOOR_CAPACITY.rows * FRIDGE_DOOR_CAPACITY.columns }, (_, index) => {
            const row = Math.floor(index / FRIDGE_DOOR_CAPACITY.columns)
            const column = index % FRIDGE_DOOR_CAPACITY.columns
            return (
              <div
                key={`${row}:${column}`}
                className="fridge-door-cell"
                aria-hidden="true"
                data-fridge-drop-cell="true"
                data-fridge-row={row}
                data-fridge-column={column}
                style={{ gridRow: row + 1, gridColumn: column + 1 }}
              />
            )
          })}
          {looseDoor.map((placement) => {
            const item = resolveItem(placement.entityRef, props.units, props.lessons, props.state)
            if (!item) return null
            return (
              <FridgeItem
                key={placement.entityRef}
                item={item}
                placement={placement}
                door={door}
                onOpen={() => openItem(item, props)}
                onDragStart={(event) => drag.startEntity(event, item.ref, 'door')}
                onReposition={(row, column) => report(props.onReposition(item.ref, row, column))}
                onSetPriority={(priority) => report(props.onSetPriority(item.ref, priority))}
                onPutAway={() => report(props.onPutAway(item.ref))}
              />
            )
          })}
          {stackGroups.map((members) => {
            const stackId = members[0]?.stackId
            if (!stackId) return null
            return (
              <FridgeStack
                key={stackId}
                stackId={stackId}
                members={members}
                door={door}
                state={props.state}
                units={props.units}
                lessons={props.lessons}
                onOpen={(item) => openItem(item, props)}
                onDragStart={(event) => drag.startStack(event, stackId)}
                onReposition={(row, column) => report(props.onRepositionStack(stackId, row, column))}
                onSetPriority={(ref, priority) => report(props.onSetPriority(ref, priority))}
                onReorder={(ref, direction) => report(props.onReorderStack(ref, direction))}
                onUnstack={(ref, row, column) => report(props.onUnstack(ref, row, column))}
              />
            )
          })}
        </div>
      </div>

      <details className={`fridge-drawer${drag.active ? ' fridge-drawer--dragging' : ''}`} data-fridge-drop-drawer="true" open={drawer.length > 0}>
        <summary>Drawer <span>{drawer.length}</span></summary>
        <p>Things worth keeping, but not in front of you right now.</p>
        {drawer.length === 0 ? <p className="fridge-drawer-empty">Nothing put away.</p> : (
          <div className="fridge-drawer-list">
            {drawer.map((placement) => {
              const item = resolveItem(placement.entityRef, props.units, props.lessons, props.state)
              if (!item) return null
              return (
                <div className="fridge-drawer-item" key={placement.entityRef} data-fridge-ref={placement.entityRef}>
                  <DragHandle label={`Drag ${item.title}`} onPointerDown={(event) => drag.startEntity(event, item.ref, 'drawer')} />
                  <div>
                    <span>{item.kind}</span>
                    {item.kind === 'Magnet' ? <strong>{item.title}</strong> : (
                      <button type="button" className="fridge-item-title" onClick={() => openItem(item, props)}>{item.title}</button>
                    )}
                    {item.context ? <small>{item.context}</small> : null}
                  </div>
                  <PrioritySelect value={placement.priority} onChange={(priority) => report(props.onSetPriority(item.ref, priority))} />
                  <button type="button" className="text-button fridge-item-action" onClick={() => report(props.onBringBack(item.ref))}>Bring back</button>
                </div>
              )
            })}
          </div>
        )}
      </details>
    </section>
  )
}

function FridgeItem({
  item,
  placement,
  door,
  onOpen,
  onDragStart,
  onReposition,
  onSetPriority,
  onPutAway,
}: {
  item: ItemInfo
  placement: Placement
  door: Placement[]
  onOpen: () => void
  onDragStart: PointerEventHandler<HTMLButtonElement>
  onReposition: (row: number, column: number) => void
  onSetPriority: (priority: FridgePriority) => void
  onPutAway: () => void
}) {
  return (
    <article
      className={`fridge-item fridge-item--${item.kind.toLowerCase()}`}
      style={{ gridRow: placement.row + 1, gridColumn: placement.column + 1 }}
      data-fridge-ref={item.ref}
      data-fridge-drop-cell="true"
      data-fridge-row={placement.row}
      data-fridge-column={placement.column}
    >
      <DragHandle label={`Drag ${item.title}`} onPointerDown={onDragStart} />
      <div className="fridge-item-copy">
        <span>{item.kind}</span>
        {item.kind === 'Magnet' ? <strong>{item.title}</strong> : <button type="button" className="fridge-item-title" onClick={onOpen}>{item.title}</button>}
        {item.context ? <small>{item.context}</small> : null}
      </div>
      <div className="fridge-item-controls">
        <PositionSelect
          label="Position"
          value={`${placement.row}:${placement.column}`}
          door={door}
          currentRefs={[item.ref]}
          onChange={onReposition}
        />
        <PrioritySelect value={placement.priority} onChange={onSetPriority} />
        <button type="button" className="text-button fridge-item-action" onClick={onPutAway}>Put away</button>
      </div>
    </article>
  )
}

function FridgeStack({
  stackId,
  members,
  door,
  state,
  units,
  lessons,
  onOpen,
  onDragStart,
  onReposition,
  onSetPriority,
  onReorder,
  onUnstack,
}: {
  stackId: string
  members: Placement[]
  door: Placement[]
  state: FridgeDoorState
  units: UnitWorkspace
  lessons: LessonWorkspace
  onOpen: (item: ItemInfo) => void
  onDragStart: PointerEventHandler<HTMLButtonElement>
  onReposition: (row: number, column: number) => void
  onSetPriority: (ref: FridgeEntityRef, priority: FridgePriority) => void
  onReorder: (ref: FridgeEntityRef, direction: 'up' | 'down') => void
  onUnstack: (ref: FridgeEntityRef, row: number, column: number) => void
}) {
  const ordered = members.slice().sort((a, b) => (a.stackOrder ?? 0) - (b.stackOrder ?? 0))
  const anchor = ordered[0]
  if (!anchor) return null
  const memberRefs = ordered.map((item) => item.entityRef)
  const freePositions = doorPositions().filter(({ row, column }) => !door.some((item) => item.row === row && item.column === column))

  return (
    <article
      className="fridge-stack"
      style={{ gridRow: anchor.row + 1, gridColumn: anchor.column + 1 }}
      data-fridge-stack={stackId}
      data-fridge-drop-cell="true"
      data-fridge-row={anchor.row}
      data-fridge-column={anchor.column}
    >
      <DragHandle label={`Drag stack with ${ordered.length} items`} onPointerDown={onDragStart} />
      <div className="fridge-stack-heading">
        <div>
          <span>Stack</span>
          <strong>{ordered.length} items</strong>
        </div>
        <PositionSelect
          label="Stack position"
          value={`${anchor.row}:${anchor.column}`}
          door={door}
          currentRefs={memberRefs}
          onChange={onReposition}
        />
      </div>
      <details>
        <summary>Open stack</summary>
        <div className="fridge-stack-members">
          {ordered.map((placement, index) => {
            const item = resolveItem(placement.entityRef, units, lessons, state)
            if (!item) return null
            return (
              <div className="fridge-stack-member" key={placement.entityRef} data-fridge-ref={placement.entityRef}>
                <div className="fridge-stack-member-copy">
                  <span>{index + 1} · {item.kind}</span>
                  {item.kind === 'Magnet' ? <strong>{item.title}</strong> : <button type="button" className="fridge-item-title" onClick={() => onOpen(item)}>{item.title}</button>}
                  {item.context ? <small>{item.context}</small> : null}
                </div>
                <PrioritySelect value={placement.priority} onChange={(priority) => onSetPriority(item.ref, priority)} />
                <div className="fridge-stack-order" aria-label={`Reorder ${item.title}`}>
                  <button type="button" className="text-button" disabled={index === 0} onClick={() => onReorder(item.ref, 'up')}>Up</button>
                  <button type="button" className="text-button" disabled={index === ordered.length - 1} onClick={() => onReorder(item.ref, 'down')}>Down</button>
                </div>
                <form
                  className="fridge-unstack"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const value = new FormData(event.currentTarget).get('target')
                    if (typeof value !== 'string' || !value) return
                    const [row, column] = value.split(':').map(Number)
                    onUnstack(item.ref, row, column)
                  }}
                >
                  <label>
                    <span>Unstack to</span>
                    <select name="target" aria-label={`Unstack ${item.title} to`} defaultValue="" required>
                      <option value="">Choose…</option>
                      {freePositions.map(({ row, column }) => <option key={`${row}:${column}`} value={`${row}:${column}`}>Row {row + 1}, spot {column + 1}</option>)}
                    </select>
                  </label>
                  <button type="submit" className="text-button">Unstack</button>
                </form>
              </div>
            )
          })}
        </div>
      </details>
    </article>
  )
}

function DragHandle({ label, onPointerDown }: { label: string; onPointerDown: PointerEventHandler<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      className="fridge-drag-handle"
      aria-label={`${label}. Use the Position control for keyboard movement.`}
      tabIndex={-1}
      onPointerDown={onPointerDown}
      onClick={(event) => event.preventDefault()}
    >
      Drag
    </button>
  )
}

function PositionSelect({
  label,
  value,
  door,
  currentRefs,
  onChange,
}: {
  label: string
  value: string
  door: Placement[]
  currentRefs: FridgeEntityRef[]
  onChange: (row: number, column: number) => void
}) {
  return (
    <label>
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => {
          const [row, column] = event.target.value.split(':').map(Number)
          onChange(row, column)
        }}
      >
        {doorPositions().map(({ row, column }) => {
          const occupied = door.some((item) => item.row === row && item.column === column && !currentRefs.includes(item.entityRef))
          return <option key={`${row}:${column}`} value={`${row}:${column}`} disabled={occupied}>Row {row + 1}, spot {column + 1}</option>
        })}
      </select>
    </label>
  )
}

function PrioritySelect({ value, onChange }: { value: FridgePriority; onChange: (priority: FridgePriority) => void }) {
  return (
    <label className="fridge-priority-control">
      <span>Priority</span>
      <select value={value ?? ''} onChange={(event) => onChange((event.target.value || null) as FridgePriority)}>
        <option value="">None</option>
        <option value="must">Must</option>
        <option value="should">Should</option>
        <option value="could">Could</option>
      </select>
    </label>
  )
}

function groupDoorStacks(door: Placement[]): Placement[][] {
  const groups = new Map<string, Placement[]>()
  for (const placement of door) {
    if (!placement.stackId) continue
    const group = groups.get(placement.stackId) ?? []
    group.push(placement)
    groups.set(placement.stackId, group)
  }
  return [...groups.values()].map((group) => group.sort((a, b) => (a.stackOrder ?? 0) - (b.stackOrder ?? 0)))
}

function isStackEligible(placement: Placement) {
  return !placement.entityRef.startsWith('unit:')
}

function doorPositions() {
  return Array.from({ length: FRIDGE_DOOR_CAPACITY.rows * FRIDGE_DOOR_CAPACITY.columns }, (_, index) => ({
    row: Math.floor(index / FRIDGE_DOOR_CAPACITY.columns),
    column: index % FRIDGE_DOOR_CAPACITY.columns,
  }))
}

function resolveItem(ref: FridgeEntityRef, units: UnitWorkspace, lessons: LessonWorkspace, state: FridgeDoorState): ItemInfo | null {
  if (ref.startsWith('unit:')) {
    const id = ref.slice('unit:'.length)
    const unit = units.units.find((candidate) => candidate.id === id)
    return unit ? { ref, kind: 'Unit', title: unit.title, context: unit.placement ? `${unit.placement.startDate} → ${unit.placement.endDate}` : 'Off calendar' } : null
  }
  if (ref.startsWith('lesson:')) {
    const id = ref.slice('lesson:'.length)
    const lesson = lessons.lessons.find((candidate) => candidate.id === id)
    const unit = lesson ? units.units.find((candidate) => candidate.id === lesson.unitId) : null
    return lesson ? { ref, kind: 'Lesson', title: lesson.title, context: unit?.title ?? 'Unit unavailable' } : null
  }
  const id = ref.slice('magnet:'.length)
  const magnet = state.magnets.find((candidate) => candidate.id === id)
  return magnet ? { ref, kind: 'Magnet', title: magnet.title, context: null } : null
}

function openItem(item: ItemInfo, props: Pick<Props, 'onOpenUnit' | 'onOpenLesson'>) {
  const id = item.ref.slice(item.ref.indexOf(':') + 1)
  if (item.kind === 'Unit') props.onOpenUnit(id)
  if (item.kind === 'Lesson') props.onOpenLesson(id)
}
