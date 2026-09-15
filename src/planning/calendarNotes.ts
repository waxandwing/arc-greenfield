import { assertISODate } from '../calendar/dateMath'
import type { ISODate } from '../calendar/types'
import { createPlanningNote, type PlanningNote } from './notes'

export function isCalendarDayNote(note: PlanningNote): boolean {
  return note.placement === 'calendar' && note.date !== null
}

export function calendarDayNotesForDate(notes: PlanningNote[], date: ISODate): PlanningNote[] {
  return notes.filter((note) => isCalendarDayNote(note) && note.date === date)
}

export function addCalendarDayNote(
  notes: PlanningNote[],
  input: { calendarId: string; date: ISODate; text: string; id?: string },
): PlanningNote[] {
  assertISODate(input.date)
  const token = input.id ?? newNoteId()
  const note = createPlanningNote({
    id: `note-${token}`,
    calendarId: input.calendarId,
    date: input.date,
    text: input.text,
    placement: 'calendar',
    important: false,
    sourceLabel: null,
    sourceLocator: null,
  })
  return [...notes, note]
}

export function updateCalendarDayNoteText(notes: PlanningNote[], noteId: string, text: string): PlanningNote[] {
  return notes.map((note) => (note.id === noteId && isCalendarDayNote(note) ? createPlanningNote({ ...note, text }) : note))
}

export function moveCalendarDayNote(notes: PlanningNote[], noteId: string, date: ISODate): PlanningNote[] {
  assertISODate(date)
  return notes.map((note) => (note.id === noteId && isCalendarDayNote(note) ? createPlanningNote({ ...note, date }) : note))
}

export function removeCalendarDayNote(notes: PlanningNote[], noteId: string): PlanningNote[] {
  return notes.filter((note) => note.id !== noteId)
}

export function setCalendarDayNoteImportant(notes: PlanningNote[], noteId: string, important: boolean): PlanningNote[] {
  return notes.map((note) => (note.id === noteId && isCalendarDayNote(note) ? { ...note, important } : note))
}

function newNoteId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
