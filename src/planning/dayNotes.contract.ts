import { hydratePlanningWorkspace, notesForWorkspaceDate, removeDayNote, upsertDayNote } from './workspace'

const base = hydratePlanningWorkspace({ calendarId: 'calendar-1', courses: [], sections: [] })
if ((base.dayNotes ?? []).length !== 0) throw new Error('Day notes contract: legacy workspaces must hydrate safely with no notes.')

const withAfterSchool = upsertDayNote(base, {
  id: 'note-1',
  date: '2026-09-05',
  text: 'Faculty meeting',
  lane: 'after-school',
})

const onDate = notesForWorkspaceDate(withAfterSchool, '2026-09-05')
if (onDate.length !== 1 || onDate[0]?.id !== 'note-1') throw new Error('Day notes contract: note identity/date was not preserved.')
if (onDate[0]?.lane !== 'after-school') throw new Error('Day notes contract: After School lane was not preserved.')

const movedLane = upsertDayNote(withAfterSchool, {
  id: 'note-1',
  date: '2026-09-05',
  text: 'Faculty meeting',
  lane: 'notes',
})
if ((movedLane.dayNotes ?? []).length !== 1 || movedLane.dayNotes?.[0]?.lane !== 'notes') throw new Error('Day notes contract: moving lanes created a duplicate or lost identity.')

const removed = removeDayNote(movedLane, 'note-1')
if ((removed.dayNotes ?? []).length !== 0) throw new Error('Day notes contract: exact note removal failed.')

let rejected = false
try {
  upsertDayNote(base, { id: 'bad-note', date: '09/05/2026', text: 'Bad date', lane: 'notes' })
} catch {
  rejected = true
}
if (!rejected) throw new Error('Day notes contract: malformed dates must fail closed.')

console.log('Day notes contract passed')
