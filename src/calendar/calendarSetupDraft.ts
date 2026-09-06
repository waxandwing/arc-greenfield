import type { Weekday } from './hydration'
import type { CalendarSource, Confidence, DayKind } from './types'

export const CALENDAR_SETUP_DRAFT_KEY = 'arc.calendar-setup-draft.v1'

export type CalendarSetupDraftException = {
  id: string
  date: string
  kind: Exclude<DayKind, 'unknown'>
  label: string
  source?: CalendarSource
  confidence?: Confidence
}

export type CalendarSetupDraft = {
  schemaVersion: 1
  calendarId: string
  schoolYearLabel: string
  firstDay: string
  lastDay: string
  weekdays: Weekday[]
  exceptions: CalendarSetupDraftException[]
}

const VALID_WEEKDAYS = new Set<Weekday>([0, 1, 2, 3, 4, 5, 6])
const VALID_KINDS = new Set<CalendarSetupDraftException['kind']>([
  'no-school',
  'teacher-workday',
  'holiday',
  'break',
  'instructional',
])

export function loadCalendarSetupDraft(storage: Pick<Storage, 'getItem'> = localStorage): CalendarSetupDraft | null {
  try {
    const raw = storage.getItem(CALENDAR_SETUP_DRAFT_KEY)
    if (!raw) return null
    return parseCalendarSetupDraft(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveCalendarSetupDraft(
  draft: CalendarSetupDraft,
  storage: Pick<Storage, 'setItem'> = localStorage,
): boolean {
  try {
    storage.setItem(CALENDAR_SETUP_DRAFT_KEY, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function clearCalendarSetupDraft(storage: Pick<Storage, 'removeItem'> = localStorage): boolean {
  try {
    storage.removeItem(CALENDAR_SETUP_DRAFT_KEY)
    return true
  } catch {
    return false
  }
}

export function parseCalendarSetupDraft(value: unknown): CalendarSetupDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (record.schemaVersion !== 1) return null
  if (!nonEmptyString(record.calendarId)) return null
  if (typeof record.schoolYearLabel !== 'string' || typeof record.firstDay !== 'string' || typeof record.lastDay !== 'string') return null
  if (!Array.isArray(record.weekdays) || !record.weekdays.every(isWeekday) || new Set(record.weekdays).size !== record.weekdays.length) return null
  if (!Array.isArray(record.exceptions)) return null

  const exceptions: CalendarSetupDraftException[] = []
  for (const value of record.exceptions) {
    const parsed = parseException(value)
    if (!parsed) return null
    exceptions.push(parsed)
  }

  return {
    schemaVersion: 1,
    calendarId: record.calendarId.trim(),
    schoolYearLabel: record.schoolYearLabel,
    firstDay: record.firstDay,
    lastDay: record.lastDay,
    weekdays: [...record.weekdays] as Weekday[],
    exceptions,
  }
}

function parseException(value: unknown): CalendarSetupDraftException | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (!nonEmptyString(record.id) || typeof record.date !== 'string' || typeof record.label !== 'string') return null
  if (typeof record.kind !== 'string' || !VALID_KINDS.has(record.kind as CalendarSetupDraftException['kind'])) return null
  if (record.source !== undefined && typeof record.source !== 'string') return null
  if (record.confidence !== undefined && typeof record.confidence !== 'string') return null
  return {
    id: record.id.trim(),
    date: record.date,
    kind: record.kind as CalendarSetupDraftException['kind'],
    label: record.label,
    source: record.source as CalendarSource | undefined,
    confidence: record.confidence as Confidence | undefined,
  }
}

function isWeekday(value: unknown): value is Weekday {
  return typeof value === 'number' && Number.isInteger(value) && VALID_WEEKDAYS.has(value as Weekday)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}
