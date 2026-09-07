import { assertISODate } from '../calendar/dateMath'
import type { ISODate } from '../calendar/types'

export type PlanningNotePlacement = 'calendar' | 'after-school'

export type PlanningNote = {
  id: string
  calendarId: string
  date: ISODate
  text: string
  placement: PlanningNotePlacement
  important: boolean
  sourceLabel: string | null
  sourceLocator: string | null
}

export type PlanningNoteInput = {
  id: string
  calendarId: string
  date: ISODate
  text: string
  placement?: PlanningNotePlacement
  important?: boolean
  sourceLabel?: string | null
  sourceLocator?: string | null
}

export function createPlanningNote(input: PlanningNoteInput): PlanningNote {
  const note: PlanningNote = {
    id: input.id.trim(),
    calendarId: input.calendarId.trim(),
    date: input.date,
    text: input.text.trim(),
    placement: input.placement ?? 'calendar',
    important: input.important ?? false,
    sourceLabel: cleanOptional(input.sourceLabel),
    sourceLocator: cleanOptional(input.sourceLocator),
  }
  const errors = validatePlanningNote(note)
  if (errors.length > 0) throw new Error(`Cannot use Note. ${errors.join(' ')}`)
  return note
}

export function validatePlanningNote(note: PlanningNote): string[] {
  const errors: string[] = []
  if (!note.id.trim()) errors.push('Note ID is required.')
  if (!note.calendarId.trim()) errors.push('Note school calendar ID is required.')
  try { assertISODate(note.date) } catch { errors.push('Note date must be a valid ISO date.') }
  if (!note.text.trim()) errors.push('Note text is required.')
  if (note.placement !== 'calendar' && note.placement !== 'after-school') errors.push('Note placement must be calendar or after-school.')
  return errors
}

function cleanOptional(value: string | null | undefined): string | null {
  const cleaned = value?.trim() ?? ''
  return cleaned || null
}
