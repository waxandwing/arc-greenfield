import { useEffect, useId, useState } from 'react'
import type { ISODate } from '../calendar'
import type { PlanningNote } from '../planning'
import { formatShortDate } from './dateLabels'

export function PlanningNotes({ notes, dates, focusDate, onAdd, onDelete }: {
  notes: PlanningNote[]
  dates: ISODate[]
  focusDate: ISODate
  onAdd?: (date: ISODate, text: string) => boolean
  onDelete?: (noteId: string) => void
}) {
  const [draft, setDraft] = useState('')
  const [date, setDate] = useState<ISODate>(focusDate)
  const [composerOpen, setComposerOpen] = useState(false)
  const [showDateField, setShowDateField] = useState(false)
  const composerId = useId()
  const visible = notes.filter((note) => note.placement === 'calendar' && note.date && dates.includes(note.date))

  useEffect(() => {
    setDate(focusDate)
  }, [focusDate])

  function save() {
    if (!draft.trim() || !onAdd) return
    if (onAdd(date, draft)) {
      setDraft('')
      setComposerOpen(false)
      setShowDateField(false)
    }
  }

  const expanded = composerOpen || visible.length > 0

  return (
    <section
      className={`planning-notes${expanded ? ' planning-notes--expanded' : ' planning-notes--collapsed'}`}
      aria-label="Planning Notes"
    >
      {visible.length > 0 ? (
        <div className="planning-notes-list">
          {visible.map((note) => (
            <article key={note.id}>
              <span>{note.date ? formatShortDate(note.date) : ''}</span>
              <p>{note.text}</p>
              {onDelete ? (
                <button type="button" aria-label={`Delete Note ${note.text}`} onClick={() => onDelete(note.id)}>
                  Delete
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {onAdd && !composerOpen ? (
        <button type="button" className="planning-notes-add-trigger" onClick={() => { setComposerOpen(true); setDate(focusDate) }}>
          + Note
        </button>
      ) : null}

      {onAdd && composerOpen ? (
        <div className="planning-note-add" id={composerId}>
          <label>
            <span>New Note</span>
            <input
              value={draft}
              autoFocus
              aria-label="New Note"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  save()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setComposerOpen(false)
                  setDraft('')
                }
              }}
            />
          </label>
          <button type="button" disabled={!draft.trim()} onClick={save}>
            Add Note
          </button>
          <button type="button" className="quiet-button" onClick={() => { setComposerOpen(false); setDraft('') }}>
            Cancel
          </button>
          <details className="planning-note-date-advanced" open={showDateField} onToggle={(event) => setShowDateField(event.currentTarget.open)}>
            <summary>Change date</summary>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={date}
                min={dates[0]}
                max={dates.at(-1)}
                onChange={(event) => setDate(event.target.value as ISODate)}
              />
            </label>
          </details>
        </div>
      ) : null}
    </section>
  )
}
