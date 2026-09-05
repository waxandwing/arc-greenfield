import type { CalendarHydrationInput, Weekday } from './hydration'
import type { CalendarDay, CalendarProvenance, CalendarSource, Confidence, ISODate, TermBoundary } from './types'

export type ManualCalendarDraft = {
  calendarId: string
  schoolYearLabel: string
  firstDay: string
  lastDay: string
  instructionalWeekdays: Weekday[]
  exceptions: CalendarDay[]
  quarters?: TermBoundary[]
  semesters?: TermBoundary[]
  existingTruth?: {
    patternSource: CalendarSource
    patternConfidence: Confidence
    provenance?: CalendarProvenance[]
  }
}

export function createManualCalendarId(): string {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `manual-${token}`
}

export function buildManualCalendarInput(draft: ManualCalendarDraft): CalendarHydrationInput {
  return {
    id: draft.calendarId,
    schoolYearLabel: draft.schoolYearLabel.trim(),
    firstDay: draft.firstDay as ISODate,
    lastDay: draft.lastDay as ISODate,
    instructionalWeekdays: [...draft.instructionalWeekdays],
    patternSource: draft.existingTruth?.patternSource ?? 'manual',
    patternConfidence: draft.existingTruth?.patternConfidence ?? 'confirmed',
    exceptions: draft.exceptions.map((day) => ({ ...day })),
    quarters: draft.quarters ? draft.quarters.map((boundary) => ({ ...boundary })) : [],
    semesters: draft.semesters ? draft.semesters.map((boundary) => ({ ...boundary })) : [],
    provenance: draft.existingTruth?.provenance?.map((item) => ({ ...item })) ?? [],
  }
}
