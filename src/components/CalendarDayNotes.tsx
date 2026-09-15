import { useId, useState, type ReactNode } from 'react'
import type { ISODate } from '../calendar/types'
import type { PlanningCapture, PlanningNote } from '../planning'
import { hasTrayCaptureDrag, readTrayCaptureDrag, TRAY_CAPTURE_DRAG_MIME, encodeTrayCaptureDrag } from '../planning/deskDrag'
import { ArcImportantObject } from './ArcImportantObject'
import { ArcObjectMenu, promptMoveToDate, type ArcObjectMenuItem } from './ArcObjectMenu'

export type CalendarDayNoteHandlers = {
  onAdd?: (date: ISODate, text: string) => boolean
  onUpdateText?: (noteId: string, text: string) => boolean
  onMove?: (noteId: string, date: ISODate) => boolean
  onRemove?: (noteId: string) => void
  onSetImportant?: (noteId: string, important: boolean) => void
}

export function CalendarDayNotes({
  notes,
  date,
  compact = false,
  dateBounds,
  handlers,
}: {
  notes: PlanningNote[]
  date: ISODate
  compact?: boolean
  dateBounds?: { min?: ISODate; max?: ISODate }
  handlers: CalendarDayNoteHandlers
}) {
  const dayNotes = notes.filter((note) => note.placement === 'calendar' && note.date === date)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const composerId = useId()

  function saveNote() {
    if (!draft.trim() || !handlers.onAdd) return
    if (handlers.onAdd(date, draft)) {
      setDraft('')
      setComposerOpen(false)
    }
  }

  return (
    <div className={`calendar-day-notes${compact ? ' calendar-day-notes--compact' : ''}`} data-day-note-date={date}>
      {dayNotes.map((note) => (
        <DayNoteCard key={note.id} note={note} compact={compact} dateBounds={dateBounds} handlers={handlers} />
      ))}
      {handlers.onAdd && !composerOpen ? (
        <button
          type="button"
          className="calendar-day-note-add"
          aria-label={`Add note for ${date}`}
          onClick={() => setComposerOpen(true)}
        >
          + Note
        </button>
      ) : null}
      {handlers.onAdd && composerOpen ? (
        <div className="calendar-day-note-composer" id={composerId}>
          <input
            value={draft}
            autoFocus
            aria-label="New day note"
            placeholder="Something visible on this date…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                saveNote()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                setComposerOpen(false)
                setDraft('')
              }
            }}
          />
          <button type="button" disabled={!draft.trim()} onClick={saveNote}>Save</button>
          <button type="button" className="quiet-button" onClick={() => { setComposerOpen(false); setDraft('') }}>Cancel</button>
        </div>
      ) : null}
    </div>
  )
}

function DayNoteCard({
  note,
  compact,
  dateBounds,
  handlers,
}: {
  note: PlanningNote
  compact: boolean
  dateBounds?: { min?: ISODate; max?: ISODate }
  handlers: CalendarDayNoteHandlers
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(note.text)

  const menuItems: ArcObjectMenuItem[] = []
  if (handlers.onSetImportant) {
    menuItems.push({
      id: 'important',
      label: note.important ? 'Remove Important' : 'Mark Important',
      onSelect: () => handlers.onSetImportant?.(note.id, !note.important),
    })
  }
  if (handlers.onMove) {
    menuItems.push({
      id: 'move',
      label: 'Move to date…',
      onSelect: () => {
        const next = promptMoveToDate(note.date ?? '', dateBounds?.min, dateBounds?.max)
        if (next && next !== note.date) handlers.onMove?.(note.id, next as ISODate)
      },
    })
  }
  if (handlers.onUpdateText) {
    menuItems.push({
      id: 'edit',
      label: 'Edit note…',
      onSelect: () => {
        setDraft(note.text)
        setEditing(true)
      },
    })
  }
  if (handlers.onRemove) {
    menuItems.push({
      id: 'remove',
      label: 'Remove note',
      onSelect: () => handlers.onRemove?.(note.id),
    })
  }

  function commitEdit() {
    if (!draft.trim() || draft === note.text) {
      setEditing(false)
      return
    }
    if (handlers.onUpdateText?.(note.id, draft)) setEditing(false)
  }

  return (
    <ArcImportantObject
      important={note.important}
      className={`calendar-day-note${compact ? ' calendar-day-note--compact' : ''}`}
      draggable={Boolean(handlers.onMove)}
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-arc-day-note-id', note.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
    >
      <ArcObjectMenu label={note.text} items={menuItems} showMoreButton={!compact}>
        {editing ? (
          <div className="calendar-day-note-edit">
            <input
              value={draft}
              aria-label={`Edit note ${note.text}`}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitEdit()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setEditing(false)
                  setDraft(note.text)
                }
              }}
            />
            <button type="button" onClick={commitEdit}>Save</button>
          </div>
        ) : (
          <p className="calendar-day-note-text">{note.text}</p>
        )}
      </ArcObjectMenu>
    </ArcImportantObject>
  )
}

export function CalendarDayCaptures({
  captures,
  date,
  onMoveCaptureToDate,
}: {
  captures: PlanningCapture[]
  date: ISODate
  onMoveCaptureToDate?: (captureId: string, anchorDate: ISODate | null) => boolean
}) {
  const dayCaptures = captures.filter((capture) => capture.anchorDate === date)
  if (!dayCaptures.length) return null
  return (
    <div className="calendar-day-captures" data-testid={`calendar-day-captures-${date}`}>
      {dayCaptures.map((capture) => (
        <button
          key={capture.id}
          type="button"
          className="calendar-day-capture-chip"
          data-testid={`calendar-capture-${capture.id}`}
          draggable={Boolean(onMoveCaptureToDate)}
          onDragStart={(event) => {
            if (!onMoveCaptureToDate) return
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData(TRAY_CAPTURE_DRAG_MIME, encodeTrayCaptureDrag({ kind: 'capture', captureId: capture.id }))
          }}
        >
          {capture.text}
        </button>
      ))}
    </div>
  )
}

export function CalendarDayNoteDropTarget({
  date,
  onDropNote,
  onDropCapture,
  children,
}: {
  date: ISODate
  onDropNote?: (noteId: string, date: ISODate) => boolean
  onDropCapture?: (captureId: string, date: ISODate) => boolean
  children: ReactNode
}) {
  return (
    <div
      className="calendar-day-note-drop"
      data-drag-target="DATE"
      data-plan-drop-date={date}
      data-desk-postit-drop="date"
      data-desk-postit-date={date}
      onDragOver={(event) => {
        const acceptsNote = event.dataTransfer.types.includes('application/x-arc-day-note-id')
        const acceptsCapture = hasTrayCaptureDrag(event.dataTransfer)
        if (acceptsNote || acceptsCapture) {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
        }
      }}
      onDrop={(event) => {
        const capturePayload = readTrayCaptureDrag(event.dataTransfer)
        if (capturePayload && onDropCapture) {
          event.preventDefault()
          onDropCapture(capturePayload.captureId, date)
          return
        }
        const noteId = event.dataTransfer.getData('application/x-arc-day-note-id')
        if (!noteId || !onDropNote) return
        event.preventDefault()
        onDropNote(noteId, date)
      }}
    >
      {children}
    </div>
  )
}
