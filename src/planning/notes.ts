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

export type PlanningNoteInput = {
  id: string
  calendarId: string
  date?: ISODate | null
  text: string
  placement?: PlanningNotePlacement
  important?: boolean
  sourceLabel?: string | null
  sourceLocator?: string | null
  priority?: PlanningNotePriority | null
  completed?: boolean
  completedAt?: string | null
}

export function createPlanningNote(input: PlanningNoteInput): PlanningNote {
  const placement = input.placement ?? 'calendar'
  const completed = input.completed ?? false
  const note: PlanningNote = {
    id: input.id.trim(),
    calendarId: input.calendarId.trim(),
    date: input.date ?? null,
    text: input.text.trim(),
    placement,
    important: input.important ?? false,
    sourceLabel: cleanOptional(input.sourceLabel),
    sourceLocator: cleanOptional(input.sourceLocator),
    priority: placement === 'task-bar' ? input.priority ?? 'could' : null,
    completed,
    completedAt: completed ? cleanOptional(input.completedAt) : null,
  }
  const errors = validatePlanningNote(note)
  if (errors.length > 0) throw new Error(`Cannot use Note. ${errors.join(' ')}`)
  return note
}

export function validatePlanningNote(note: PlanningNote): string[] {
  const errors: string[] = []
  const priority = note.priority ?? null
  const completed = note.completed ?? false
  const completedAt = note.completedAt ?? null
  if (!note.id.trim()) errors.push('Note ID is required.')
  if (!note.calendarId.trim()) errors.push('Note school calendar ID is required.')
  if (!note.text.trim()) errors.push('Note text is required.')
  if (note.placement !== 'calendar' && note.placement !== 'after-school' && note.placement !== 'task-bar') {
    errors.push('Note placement must be calendar, after-school, or task-bar.')
  }

  if (note.placement === 'task-bar') {
    if (note.date !== null) errors.push('Task Bar Notes must remain unscheduled.')
    if (!isPlanningNotePriority(priority)) errors.push('Task Bar Notes require Must, Should, or Could priority.')
  } else {
    if (note.date === null) errors.push('Calendar and After School Notes require a date.')
    else {
      try { assertISODate(note.date) } catch { errors.push('Note date must be a valid ISO date.') }
    }
    if (priority !== null) errors.push('Only Task Bar Notes carry task priority.')
  }

  if (completedAt !== null && Number.isNaN(Date.parse(completedAt))) errors.push('Note completion time must be a valid timestamp.')
  if (!completed && completedAt !== null) errors.push('Incomplete Notes cannot retain a completion timestamp.')
  return errors
}

export function isPlanningNotePriority(value: unknown): value is PlanningNotePriority {
  return value === 'must' || value === 'should' || value === 'could'
}

function cleanOptional(value: string | null | undefined): string | null {
  const cleaned = value?.trim() ?? ''
  return cleaned || null
}
