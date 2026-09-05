import { hydratePlanningWorkspace, notesForWorkspaceDate, removeDayNote, upsertDayNote } from './workspace'

const base = hydratePlanningWorkspace({
  calendarId: 'calendar-1',
  courses: [],
  sections: [],
})

if ((base.dayNotes ?? []).length !== 0) throw new Error('Day notes contract: legacy workspace should hydrate with an empty note collection.')

const withNote = upsertDayNote(base, {
  id: 'note-1',
  date: '2026-09-05',
  text: 'Faculty meeting',
  lane: 'after-school',
})

const sameDate = notesForWorkspaceDate(withNote, '2026-09-05')
if (sameDate.length !== 1 || sameDate[0]?.id !== 'note-1') throw new Error('Day notes contract: note did not remain attached to its date.')
if (sameDate[0]?.lane !== 'after-school') throw new Error('Day notes contract: After School lane was not preserved.')

const movedLane = upsertDayNote(withNote, {
  id: 'note-1',
  date: '2026-09-05',
  text: 'Faculty meeting',
  lane: 'notes',
})
if ((movedLane.dayNotes ?? []).length !== 1 || movedLane.dayNotes?.[0]?.lane !== 'notes') throw new Error('Day notes contract: updating a note created a duplicate instead of preserving identity.')

const removed = removeDayNote(movedLane, 'note-1')
if ((removed.dayNotes ?? []).length !== 0) throw new Error('Day notes contract: removing a note did not remove the exact stable object.')

let rejected = false
try {
  upsertDayNote(base, { id: 'bad-note', date: '09/05/2026', text: 'Bad date', lane: 'notes' })
} catch {
  rejected = true
}
if (!rejected) throw new Error('Day notes contract: malformed dates must fail closed.')

console.log('Day notes contract passed')
