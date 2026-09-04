import { useState } from 'react'
import type {
  FridgeDoorState,
  FridgeEntityRef,
  FridgePriority,
  LessonWorkspace,
  UnitWorkspace,
} from '../planning'
import { FRIDGE_DOOR_CAPACITY } from '../app/useFridgeDoorWorkspace'

type Props = {
  state: FridgeDoorState
  units: UnitWorkspace
  lessons: LessonWorkspace
  notice: string | null
  onCreateMagnet: (title: string) => string | null
  onReposition: (entityRef: FridgeEntityRef, row: number, column: number) => string | null
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
  const [localError, setLocalError] = useState<string | null>(null)
  const door = props.state.placements
    .filter((item) => item.surface === 'door')
    .slice()
    .sort((a, b) => a.row - b.row || a.column - b.column || (a.stackOrder ?? 0) - (b.stackOrder ?? 0))
  const drawer = props.state.placements
    .filter((item) => item.surface === 'drawer')
    .slice()
    .sort((a, b) => a.column - b.column || a.row - b.row)
  const occupied = new Map(door.map((item) => [`${item.row}:${item.column}`, item.entityRef]))
  const status = localError ?? props.notice

  function report(result: string | null) {
    setLocalError(result)
  }

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

      <form className="fridge-capture" onSubmit={(event) => {
        event.preventDefault()
        const result = props.onCreateMagnet(capture)
        report(result)
        if (!result) setCapture('')
      }}>
        <label>
          <span>Quick magnet</span>
          <input
            value={capture}
            onChange={(event) => setCapture(event.target.value)}
            placeholder="Try the comparison before the quiz"
          />
        </label>
        <button type="submit" className="quiet-button" disabled={!capture.trim()}>Add magnet</button>
      </form>
      <p className="fridge-capture-note">For the thought you want in sight before you decide what it becomes.</p>

      {status ? <p className="fridge-door-status" role="status">{status}</p> : null}

      <div className="fridge-door-scroll" tabIndex={0} aria-label="Fridge Door spatial surface">
        <div
          className="fridge-door-grid"
          style={{
            gridTemplateColumns: `repeat(${FRIDGE_DOOR_CAPACITY.columns}, minmax(150px, 1fr))`,
            gridTemplateRows: `repeat(${FRIDGE_DOOR_CAPACITY.rows}, minmax(108px, auto))`,
          }}
        >
          {Array.from({ length: FRIDGE_DOOR_CAPACITY.rows * FRIDGE_DOOR_CAPACITY.columns }, (_, index) => {
            const row = Math.floor(index / FRIDGE_DOOR_CAPACITY.columns)
            const column = index % FRIDGE_DOOR_CAPACITY.columns
            return <div key={`${row}:${column}`} className="fridge-door-cell" aria-hidden="true" style={{ gridRow: row + 1, gridColumn: column + 1 }} />
          })}
          {door.map((placement) => {
            const item = resolveItem(placement.entityRef, props.units, props.lessons, props.state)
            if (!item) return null
            return (
              <FridgeItem
                key={placement.entityRef}
                item={item}
                placement={placement}
                occupied={occupied}
                onOpen={() => openItem(item, props)}
                onReposition={(row, column) => report(props.onReposition(item.ref, row, column))}
                onSetPriority={(priority) => report(props.onSetPriority(item.ref, priority))}
                onPutAway={() => report(props.onPutAway(item.ref))}
              />
            )
          })}
        </div>
      </div>

      <details className="fridge-drawer" open={drawer.length > 0}>
        <summary>Drawer <span>{drawer.length}</span></summary>
        <p>Things worth keeping, but not in front of you right now.</p>
        {drawer.length === 0 ? <p className="fridge-drawer-empty">Nothing put away.</p> : (
          <div className="fridge-drawer-list">
            {drawer.map((placement) => {
              const item = resolveItem(placement.entityRef, props.units, props.lessons, props.state)
              if (!item) return null
              return (
                <div className="fridge-drawer-item" key={placement.entityRef}>
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
  occupied,
  onOpen,
  onReposition,
  onSetPriority,
  onPutAway,
}: {
  item: ItemInfo
  placement: FridgeDoorState['placements'][number]
  occupied: Map<string, FridgeEntityRef>
  onOpen: () => void
  onReposition: (row: number, column: number) => void
  onSetPriority: (priority: FridgePriority) => void
  onPutAway: () => void
}) {
  const stacked = Boolean(placement.stackId)
  return (
    <article
      className={`fridge-item fridge-item--${item.kind.toLowerCase()}${stacked ? ' fridge-item--stacked' : ''}`}
      style={{ gridRow: placement.row + 1, gridColumn: placement.column + 1 }}
      data-fridge-ref={item.ref}
    >
      <div className="fridge-item-copy">
        <span>{item.kind}{stacked ? ' · Stacked' : ''}</span>
        {item.kind === 'Magnet' ? <strong>{item.title}</strong> : <button type="button" className="fridge-item-title" onClick={onOpen}>{item.title}</button>}
        {item.context ? <small>{item.context}</small> : null}
      </div>
      <div className="fridge-item-controls">
        <label>
          <span>Position</span>
          <select
            value={`${placement.row}:${placement.column}`}
            disabled={stacked}
            onChange={(event) => {
              const [row, column] = event.target.value.split(':').map(Number)
              onReposition(row, column)
            }}
          >
            {Array.from({ length: FRIDGE_DOOR_CAPACITY.rows * FRIDGE_DOOR_CAPACITY.columns }, (_, index) => {
              const row = Math.floor(index / FRIDGE_DOOR_CAPACITY.columns)
              const column = index % FRIDGE_DOOR_CAPACITY.columns
              const key = `${row}:${column}`
              const takenBy = occupied.get(key)
              return <option key={key} value={key} disabled={Boolean(takenBy && takenBy !== item.ref)}>Row {row + 1}, spot {column + 1}</option>
            })}
          </select>
        </label>
        <PrioritySelect value={placement.priority} onChange={onSetPriority} />
        <button type="button" className="text-button fridge-item-action" disabled={stacked} onClick={onPutAway}>Put away</button>
      </div>
    </article>
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
