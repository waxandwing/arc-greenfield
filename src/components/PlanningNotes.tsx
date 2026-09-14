import { useState } from 'react'
import type { ISODate } from '../calendar'
import type { PlanningNote } from '../planning'
import { formatShortDate } from './dateLabels'

export function PlanningNotes({ notes, dates, focusDate, onAdd, onDelete, tone = 'primary' }: {
  notes: PlanningNote[]
  dates: ISODate[]
  focusDate: ISODate
  onAdd?: (date: ISODate, text: string) => boolean
  onDelete?: (noteId: string) => void
  tone?: 'primary' | 'secondary'
}) {
  const [draft, setDraft] = useState('')
  const [date, setDate] = useState<ISODate>(focusDate)
  const visible = notes.filter((note) => note.placement === 'calendar' && note.date && dates.includes(note.date))

  function save() {
    if (!draft.trim() || !onAdd) return
    if (onAdd(date, draft)) setDraft('')
  }

  return (
    <section className={`planning-notes${tone === 'secondary' ? ' planning-notes--secondary' : ''}`} aria-label="Planning Notes">
      <div className="planning-notes-list">
        <strong>Notes</strong>
        {visible.length === 0 ? <span>No Notes in this view.</span> : visible.map((note) => <article key={note.id}><span>{note.date ? formatShortDate(note.date) : ''}</span><p>{note.text}</p>{onDelete ? <button type="button" aria-label={`Delete Note ${note.text}`} onClick={() => onDelete(note.id)}>Delete</button> : null}</article>)}
      </div>
      {onAdd ? <div className="planning-note-add"><label><span>Date</span><input type="date" value={date} min={dates[0]} max={dates.at(-1)} onChange={(event) => setDate(event.target.value as ISODate)} /></label><label><span>New Note</span><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); save() } }} /></label><button type="button" disabled={!draft.trim()} onClick={save}>Add Note</button></div> : null}
    </section>
  )
}
