import { assertISODate } from '../calendar/dateMath'
import type { ISODate } from '../calendar/types'

export type PlanningNotePlacement = 'calendar' | 'after-school' | 'task-bar'
export type PlanningNotePriority = 'must' | 'should' | 'could'

export type PlanningNote = {
  id: string
  calendarId: string
  date: ISODate | null
  text: string
  placement: PlanningNotePlacement
  important: boolean
  sourceLabel: string | null
  sourceLocator: string | null
  priority?: PlanningNotePriority | null
  completed?: boolean
  completedAt?: string | null
}

export type PlanningNoteInput = PlanningNote

export function createPlanningNote(input: PlanningNoteInput): PlanningNote {
  const note: PlanningNote = {
    ...input,
    id: input.id.trim(),
    calendarId: input.calendarId.trim(),
    text: input.text.trim(),
    sourceLabel: cleanOptional(input.sourceLabel),
    sourceLocator: cleanOptional(input.sourceLocator),
    priority: input.placement === 'task-bar' ? input.priority ?? 'could' : null,
    completed: input.completed ?? false,
    completedAt: input.completed ? cleanOptional(input.completedAt) : null,
  }
  const errors = validatePlanningNote(note)
  if (errors.length) throw new Error(`Cannot use Note. ${errors.join(' ')}`)
  return note
}

export function validatePlanningNote(note: PlanningNote): string[] {
  const errors: string[] = []
  if (!note.id) errors.push('Note ID is required.')
  if (!note.calendarId) errors.push('Note school calendar ID is required.')
  if (!note.text) errors.push('Note text is required.')
  if (note.placement === 'task-bar') {
    if (note.date !== null) errors.push('Task Bar Notes must remain unscheduled.')
    if (!isPlanningNotePriority(note.priority ?? null)) errors.push('Task Bar Notes require Must, Should, or Could priority.')
  } else {
    if (note.date === null) errors.push('Calendar and After School Notes require a date.')
    else { try { assertISODate(note.date) } catch { errors.push('Note date must be a valid ISO date.') } }
    if (note.priority != null) errors.push('Only Task Bar Notes carry task priority.')
  }
  if (note.completedAt && Number.isNaN(Date.parse(note.completedAt))) errors.push('Note completion time must be valid.')
  return errors
}

export function isPlanningNotePriority(value: unknown): value is PlanningNotePriority {
  return value === 'must' || value === 'should' || value === 'could'
}

function cleanOptional(value: string | null | undefined): string | null {
  const cleaned = value?.trim() ?? ''
  return cleaned || null
}
