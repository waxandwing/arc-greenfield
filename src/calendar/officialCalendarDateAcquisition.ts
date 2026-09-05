import { assertISODate, compareISODate, eachCalendarDay } from './dateMath'
import type { CalendarEvidence } from './calendarProposal'
import type { CalendarHydrationInput } from './hydration'
import type { CalendarDay, DayKind, ISODate, TermBoundary } from './types'
import type { OfficialCalendarPayload, OfficialCalendarSourceCandidate, OfficialSourceCandidate } from './sourceAcquisition'

export type OfficialCalendarStructuredRow = {
  startDate: ISODate
  endDate?: ISODate
  label: string
}

export type OfficialCalendarStructuredExtraction = {
  sourceLocator: string
  sourceLabel: string
  publisher: string
  schoolYearLabel: string
  capturedAt?: string
  rows: OfficialCalendarStructuredRow[]
}

export function buildOfficialCalendarPayloadFromStructuredRows(
  schoolCandidate: OfficialSourceCandidate,
  calendarSource: OfficialCalendarSourceCandidate,
  extraction: OfficialCalendarStructuredExtraction,
): OfficialCalendarPayload {
  validateSourceIdentity(schoolCandidate, calendarSource, extraction)
  const rows = validateAndCloneRows(extraction.rows)
  if (rows.length === 0) throw new Error('Official calendar extraction contains no dated rows.')

  const firstDay = uniqueMarkerDate(rows, 'first day of school', 'first day of school')
  const lastDay = uniqueMarkerDate(rows, 'last day of school', 'last day of school')
  if (compareISODate(firstDay, lastDay) > 0) {
    throw new Error('Official calendar extraction places the first day after the last day.')
  }

  const exceptions = buildExplicitExceptions(rows, firstDay, lastDay)
  const quarters = buildQuarterBoundaries(rows, firstDay, lastDay)
  const semesters = buildSemesterBoundaries(rows, firstDay, lastDay, quarters)
  const evidence: CalendarEvidence[] = [{
    id: `official-calendar-evidence:${calendarSource.id}`,
    source: 'district-source',
    label: extraction.sourceLabel.trim(),
    locator: calendarSource.locator,
    capturedAt: cleanOptional(extraction.capturedAt),
  }]

  const input: CalendarHydrationInput = {
    id: `official-calendar:${schoolCandidate.id}:${calendarSource.id}`,
    schoolYearLabel: extraction.schoolYearLabel.trim(),
    firstDay,
    lastDay,
    instructionalWeekdays: [1, 2, 3, 4, 5],
    patternSource: 'district-source',
    patternConfidence: 'mixed',
    exceptions,
    quarters,
    semesters,
  }

  return {
    candidateId: schoolCandidate.id,
    calendarSourceId: calendarSource.id,
    input,
    evidence,
  }
}

function validateSourceIdentity(
  schoolCandidate: OfficialSourceCandidate,
  calendarSource: OfficialCalendarSourceCandidate,
  extraction: OfficialCalendarStructuredExtraction,
): void {
  if (calendarSource.schoolCandidateId !== schoolCandidate.id) {
    throw new Error('Official calendar source does not belong to the selected school candidate.')
  }
  if (!extraction.sourceLabel.trim()) throw new Error('Official calendar extraction is missing a source label.')
  if (!extraction.publisher.trim()) throw new Error('Official calendar extraction is missing a publisher.')
  if (!extraction.schoolYearLabel.trim()) throw new Error('Official calendar extraction is missing a school-year label.')
  if (extraction.sourceLocator.trim() !== calendarSource.locator) {
    throw new Error('Official calendar extraction does not match the teacher-confirmed source locator.')
  }
  if (extraction.publisher.trim() !== calendarSource.publisher.trim()) {
    throw new Error('Official calendar extraction publisher does not match the teacher-confirmed source publisher.')
  }
}

function validateAndCloneRows(rows: OfficialCalendarStructuredRow[]): OfficialCalendarStructuredRow[] {
  return rows.map((row, index) => {
    if (!row.label.trim()) throw new Error(`Official calendar row ${index + 1} is missing an event label.`)
    try { assertISODate(row.startDate) } catch { throw new Error(`Official calendar row ${index + 1} has an invalid start date.`) }
    if (row.endDate) {
      try { assertISODate(row.endDate) } catch { throw new Error(`Official calendar row ${index + 1} has an invalid end date.`) }
      if (compareISODate(row.startDate, row.endDate) > 0) {
        throw new Error(`Official calendar row ${index + 1} ends before it starts.`)
      }
    }
    return { startDate: row.startDate, endDate: row.endDate, label: row.label.trim() }
  })
}

function uniqueMarkerDate(
  rows: OfficialCalendarStructuredRow[],
  marker: string,
  description: string,
): ISODate {
  const matches = rows.filter((row) => normalizeLabel(row.label).includes(marker))
  if (matches.length === 0) throw new Error(`Official calendar extraction is missing an explicit ${description}.`)
  if (matches.length > 1) throw new Error(`Official calendar extraction contains more than one explicit ${description}.`)
  if (matches[0].endDate && matches[0].endDate !== matches[0].startDate) {
    throw new Error(`Official calendar ${description} must resolve to one date.`)
  }
  return matches[0].startDate
}

function buildExplicitExceptions(
  rows: OfficialCalendarStructuredRow[],
  firstDay: ISODate,
  lastDay: ISODate,
): CalendarDay[] {
  const byDate = new Map<ISODate, CalendarDay>()

  for (const row of rows) {
    const kind = explicitExceptionKind(row.label)
    if (!kind) continue
    const rangeEnd = row.endDate ?? row.startDate
    for (const date of eachCalendarDay(row.startDate, rangeEnd)) {
      if (compareISODate(date, firstDay) < 0 || compareISODate(date, lastDay) > 0) continue
      if (byDate.has(date)) {
        throw new Error(`Official calendar extraction contains overlapping non-instructional evidence for ${date}.`)
      }
      byDate.set(date, {
        date,
        kind,
        label: row.label,
        source: 'district-source',
        confidence: 'confirmed',
      })
    }
  }

  return [...byDate.values()].sort((a, b) => compareISODate(a.date, b.date))
}

function explicitExceptionKind(label: string): DayKind | null {
  const normalized = normalizeLabel(label)
  if (normalized.includes('thanksgiving break') || normalized.includes('winter break') || normalized.includes('spring break')) return 'break'
  if (normalized.includes('teacher workday') || normalized.includes('professional day') || normalized.includes('professional development day')) return 'teacher-workday'
  if (normalized.includes('student holiday') || normalized.includes('holiday') || normalized.includes('schools closed')) return 'holiday'
  return null
}

function buildQuarterBoundaries(
  rows: OfficialCalendarStructuredRow[],
  firstDay: ISODate,
  lastDay: ISODate,
): TermBoundary[] {
  const q1End = optionalUniqueMarkerDate(rows, 'end of first marking period')
  const q2Start = optionalUniqueMarkerDate(rows, 'begin second marking period')
  const q2End = optionalUniqueMarkerDate(rows, 'end of second marking period')
  const q3Start = optionalUniqueMarkerDate(rows, 'begin third marking period')
  const q3End = optionalUniqueMarkerDate(rows, 'end of third marking period')
  const q4Start = optionalUniqueMarkerDate(rows, 'begin fourth marking period')
  const q4End = optionalUniqueMarkerDate(rows, 'end of fourth marking period')
  if (!q1End || !q2Start || !q2End || !q3Start || !q3End || !q4Start || !q4End) return []
  if (q4End !== lastDay) return []

  return [
    { id: 'q1', label: 'Quarter 1', startDate: firstDay, endDate: q1End },
    { id: 'q2', label: 'Quarter 2', startDate: q2Start, endDate: q2End },
    { id: 'q3', label: 'Quarter 3', startDate: q3Start, endDate: q3End },
    { id: 'q4', label: 'Quarter 4', startDate: q4Start, endDate: q4End },
  ]
}

function buildSemesterBoundaries(
  rows: OfficialCalendarStructuredRow[],
  firstDay: ISODate,
  lastDay: ISODate,
  quarters: TermBoundary[],
): TermBoundary[] {
  if (quarters.length !== 4) return []
  const secondSemesterStart = optionalUniqueMarkerDate(rows, 'begin second semester')
  if (!secondSemesterStart || secondSemesterStart !== quarters[2].startDate) return []
  return [
    { id: 's1', label: 'Semester 1', startDate: firstDay, endDate: quarters[1].endDate },
    { id: 's2', label: 'Semester 2', startDate: secondSemesterStart, endDate: lastDay },
  ]
}

function optionalUniqueMarkerDate(rows: OfficialCalendarStructuredRow[], marker: string): ISODate | null {
  const matches = rows.filter((row) => normalizeLabel(row.label).includes(marker))
  if (matches.length === 0) return null
  if (matches.length > 1) throw new Error(`Official calendar extraction contains duplicate ${marker} rows.`)
  return matches[0].startDate
}

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

function cleanOptional(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
