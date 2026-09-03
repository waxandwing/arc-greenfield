import { hydrateSchoolCalendar, validateHydrationInput, type CalendarHydrationInput } from './hydration'
import type { CalendarDay, CalendarSource, Confidence, DayKind, ISODate, SchoolCalendar, TermBoundary } from './types'

const STORAGE_KEY = 'arc.calendar.v1'
const SCHEMA_VERSION = 1

export type PersistedCalendarEnvelope = {
  schemaVersion: 1
  savedAt: string
  input: CalendarHydrationInput
}

export type RestoredCalendar = {
  input: CalendarHydrationInput
  calendar: SchoolCalendar
}

export function serializeCalendarInput(input: CalendarHydrationInput): string {
  const errors = validateHydrationInput(input)
  if (errors.length > 0) throw new Error(`Cannot persist invalid calendar declaration. ${errors.join(' ')}`)

  const envelope: PersistedCalendarEnvelope = {
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    input,
  }

  return JSON.stringify(envelope)
}

export function deserializeCalendarInput(raw: string): CalendarHydrationInput | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== SCHEMA_VERSION || !isRecord(parsed.input)) return null

  const input = parseHydrationInput(parsed.input)
  if (!input) return null
  if (validateHydrationInput(input).length > 0) return null

  return input
}

export function restoreCalendarFromRaw(raw: string): RestoredCalendar | null {
  const input = deserializeCalendarInput(raw)
  if (!input) return null

  try {
    return { input, calendar: hydrateSchoolCalendar(input) }
  } catch {
    return null
  }
}

export function saveCalendarToBrowser(input: CalendarHydrationInput): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, serializeCalendarInput(input))
}

export function loadCalendarFromBrowser(): RestoredCalendar | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  return restoreCalendarFromRaw(raw)
}

export function clearCalendarFromBrowser(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

function parseHydrationInput(value: Record<string, unknown>): CalendarHydrationInput | null {
  if (
    typeof value.id !== 'string' ||
    typeof value.schoolYearLabel !== 'string' ||
    typeof value.firstDay !== 'string' ||
    typeof value.lastDay !== 'string' ||
    !Array.isArray(value.instructionalWeekdays) ||
    !isCalendarSource(value.patternSource) ||
    !isConfidence(value.patternConfidence)
  ) return null

  const weekdays = value.instructionalWeekdays.filter((item): item is 0 | 1 | 2 | 3 | 4 | 5 | 6 =>
    Number.isInteger(item) && typeof item === 'number' && item >= 0 && item <= 6,
  )
  if (weekdays.length !== value.instructionalWeekdays.length) return null

  const exceptions = parseCalendarDays(value.exceptions)
  if (exceptions === null) return null
  const quarters = parseBoundaries(value.quarters)
  if (quarters === null) return null
  const semesters = parseBoundaries(value.semesters)
  if (semesters === null) return null

  return {
    id: value.id,
    schoolYearLabel: value.schoolYearLabel,
    firstDay: value.firstDay as ISODate,
    lastDay: value.lastDay as ISODate,
    instructionalWeekdays: weekdays,
    patternSource: value.patternSource,
    patternConfidence: value.patternConfidence,
    exceptions,
    quarters,
    semesters,
  }
}

function parseCalendarDays(value: unknown): CalendarDay[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null

  const days: CalendarDay[] = []
  for (const item of value) {
    if (!isRecord(item) || typeof item.date !== 'string' || !isDayKind(item.kind)) return null
    if (item.label !== undefined && typeof item.label !== 'string') return null
    if (item.source !== undefined && !isCalendarSource(item.source)) return null
    if (item.confidence !== undefined && !isConfidence(item.confidence)) return null
    days.push({
      date: item.date as ISODate,
      kind: item.kind,
      label: item.label as string | undefined,
      source: item.source as CalendarSource | undefined,
      confidence: item.confidence as Confidence | undefined,
    })
  }
  return days
}

function parseBoundaries(value: unknown): TermBoundary[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null

  const boundaries: TermBoundary[] = []
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.label !== 'string' ||
      typeof item.startDate !== 'string' ||
      typeof item.endDate !== 'string'
    ) return null
    boundaries.push({
      id: item.id,
      label: item.label,
      startDate: item.startDate as ISODate,
      endDate: item.endDate as ISODate,
    })
  }
  return boundaries
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCalendarSource(value: unknown): value is CalendarSource {
  return value === 'manual' || value === 'import' || value === 'district-source'
}

function isConfidence(value: unknown): value is Confidence {
  return value === 'confirmed' || value === 'mixed' || value === 'inferred'
}

function isDayKind(value: unknown): value is DayKind {
  return value === 'instructional' || value === 'no-school' || value === 'teacher-workday' || value === 'holiday' || value === 'break' || value === 'unknown'
}
