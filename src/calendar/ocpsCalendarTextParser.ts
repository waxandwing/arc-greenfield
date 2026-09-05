import type { OfficialCalendarStructuredExtraction, OfficialCalendarStructuredRow } from './officialCalendarDateAcquisition'

export const OCPS_CALENDAR_HOST = 'www.ocps.net'
export const OCPS_2026_27_CALENDAR_LOCATOR = 'https://www.ocps.net/110680_3'

export type OcpsCalendarParseInput = {
  sourceLocator: string
  sourceLabel: string
  publisher: string
  capturedAt?: string
  text: string
}

export function parseOcpsCalendarText(input: OcpsCalendarParseInput): OfficialCalendarStructuredExtraction {
  const sourceLocator = normalizeSupportedLocator(input.sourceLocator)
  const text = normalizeText(input.text)
  assertDocumentIdentity(text)

  const rows: OfficialCalendarStructuredRow[] = []
  pushSingle(rows, text, /Tuesday\s+August 11\s+First Day of School/i, '2026-08-11', 'First Day of School')
  pushSingle(rows, text, /Monday\s+September 7\s+Labor Day Holiday/i, '2026-09-07', 'Labor Day Holiday')
  pushSingle(rows, text, /Friday\s+October 9\s+End of First Marking Period/i, '2026-10-09', 'End of First Marking Period')
  pushSingle(rows, text, /Monday\s+October 12\s+Teacher Workday\/Student Holiday/i, '2026-10-12', 'Teacher Workday/Student Holiday')
  pushSingle(rows, text, /Tuesday\s+October 13\s+Begin Second Marking Period/i, '2026-10-13', 'Begin Second Marking Period')
  pushRange(rows, text, /Monday-Friday\s+November 23-27\s+Thanksgiving Break/i, '2026-11-23', '2026-11-27', 'Thanksgiving Break')
  pushSingle(rows, text, /Friday\s+December 18\s+End of Second Marking Period/i, '2026-12-18', 'End of Second Marking Period')
  pushRange(rows, text, /Monday-Friday\s+Two Weeks\s+December 21-January 1\s+Winter Break/i, '2026-12-21', '2027-01-01', 'Winter Break')
  pushSingle(rows, text, /Monday\s+January 4\s+Teacher Workday\/Student Holiday/i, '2027-01-04', 'Teacher Workday/Student Holiday')
  pushSingle(rows, text, /Tuesday\s+January 5\s+Begin Third Marking Period\s+Begin Second Semester/i, '2027-01-05', 'Begin Third Marking Period; Begin Second Semester')
  pushSingle(rows, text, /Monday\s+January 18\s+Martin Luther King, Jr\. Holiday/i, '2027-01-18', 'Martin Luther King, Jr. Holiday')
  pushSingle(rows, text, /Monday\s+February 15\s+Presidents[’'] Day\/Teacher Non-Work Day/i, '2027-02-15', 'Presidents’ Day/Teacher Non-Work Day')
  pushSingle(rows, text, /Thursday\s+March 11\s+End of Third Marking Period/i, '2027-03-11', 'End of Third Marking Period')
  pushSingle(rows, text, /Friday\s+March 12\s+Teacher Workday\/Student Holiday/i, '2027-03-12', 'Teacher Workday/Student Holiday')
  pushRange(rows, text, /Monday-Friday\s+March 15-19\s+Spring Break/i, '2027-03-15', '2027-03-19', 'Spring Break')
  pushSingle(rows, text, /Monday\s+March 22\s+Begin Fourth Marking Period/i, '2027-03-22', 'Begin Fourth Marking Period')
  pushSingle(rows, text, /Friday\s+April 23\s+Teacher Professional Day\s+Student Holiday\/Teacher Non-Workday/i, '2027-04-23', 'Teacher Professional Day; Student Holiday/Teacher Non-Workday')
  pushSingle(rows, text, /Wednesday\s+May 26\s+End of Fourth Marking Period\s+Last Day of School/i, '2027-05-26', 'End of Fourth Marking Period; Last Day of School')

  // The severe-weather table is contingency priority, not current calendar truth.
  if (!/2026-2027 Severe Weather Make-Up Days/i.test(text)) {
    throw new Error('OCPS calendar text is missing the severe-weather contingency section expected for this supported source.')
  }

  return {
    sourceLocator,
    sourceLabel: input.sourceLabel.trim(),
    publisher: input.publisher.trim(),
    schoolYearLabel: '2026–27',
    capturedAt: cleanOptional(input.capturedAt),
    rows,
  }
}

export function isSupportedOcpsCalendarLocator(locator: string): boolean {
  try {
    return normalizeSupportedLocator(locator) === OCPS_2026_27_CALENDAR_LOCATOR
  } catch {
    return false
  }
}

function normalizeSupportedLocator(value: string): string {
  let url: URL
  try { url = new URL(value) } catch { throw new Error('OCPS calendar source locator is not a valid URL.') }
  if (url.protocol !== 'https:') throw new Error('OCPS calendar source must use HTTPS.')
  if (url.hostname.toLowerCase() !== OCPS_CALENDAR_HOST) throw new Error('OCPS calendar source must be hosted on www.ocps.net.')
  url.hash = ''
  url.search = ''
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  const normalized = url.toString().replace(/\/$/, '')
  if (normalized !== OCPS_2026_27_CALENDAR_LOCATOR) {
    throw new Error('This extractor supports only the confirmed OCPS 2026–27 calendar source.')
  }
  return normalized
}

function normalizeText(value: string): string {
  return value.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim()
}

function assertDocumentIdentity(text: string): void {
  if (!/Orange County Public Schools\s+2026-2027 School Calendar/i.test(text)) {
    throw new Error('PDF text does not identify itself as the Orange County Public Schools 2026–2027 School Calendar.')
  }
}

function pushSingle(rows: OfficialCalendarStructuredRow[], text: string, pattern: RegExp, startDate: OfficialCalendarStructuredRow['startDate'], label: string): void {
  requirePhrase(text, pattern, label)
  rows.push({ startDate, label })
}

function pushRange(rows: OfficialCalendarStructuredRow[], text: string, pattern: RegExp, startDate: OfficialCalendarStructuredRow['startDate'], endDate: OfficialCalendarStructuredRow['startDate'], label: string): void {
  requirePhrase(text, pattern, label)
  rows.push({ startDate, endDate, label })
}

function requirePhrase(text: string, pattern: RegExp, label: string): void {
  if (!pattern.test(text)) throw new Error(`OCPS calendar text is missing the expected ${label} statement.`)
}

function cleanOptional(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
