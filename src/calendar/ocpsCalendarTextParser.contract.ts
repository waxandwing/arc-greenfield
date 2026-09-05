import { buildOfficialCalendarPayloadFromStructuredRows } from './officialCalendarDateAcquisition'
import { OCPS_2026_27_CALENDAR_LOCATOR, isSupportedOcpsCalendarLocator, parseOcpsCalendarText } from './ocpsCalendarTextParser'
import type { OfficialCalendarSourceCandidate, OfficialSourceCandidate } from './sourceAcquisition'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const exactExtractedText = `Orange County Public Schools
2026-2027 School Calendar
Day(s) of Week Date(s) Event
Monday-Monday August 3-10 Pre-Planning
August 5-Professional Development Day
Tuesday August 11 First Day of School
Monday September 7 Labor Day Holiday
Friday October 9 End of First Marking Period
Monday October 12 Teacher Workday/Student Holiday
Tuesday October 13 Begin Second Marking Period
Monday-Friday November 23-27 Thanksgiving Break
Friday December 18 End of Second Marking Period
Monday-Friday
Two Weeks December 21-January 1 Winter Break
Monday January 4 Teacher Workday/Student Holiday
Tuesday January 5 Begin Third Marking Period
Begin Second Semester
Monday January 18 Martin Luther King, Jr. Holiday
Schools and District Offices Closed
Monday February 15 Presidents’ Day/Teacher Non-Work Day
Schools Closed/District Offices Open
Thursday March 11 End of Third Marking Period
Friday March 12 Teacher Workday/Student Holiday
Monday-Friday March 15-19 Spring Break
Schools Closed/District Offices Open
Monday March 22 Begin Fourth Marking Period
Friday April 23 Teacher Professional Day
Student Holiday/Teacher Non-Workday
Wednesday May 26 End of Fourth Marking Period
Last Day of School
Thursday-Friday May 27-28 Post Planning
Monday May 31 Memorial Day Holiday
Schools and District Offices Closed
Orange County Public Schools
2026-2027 Severe Weather Make-Up Days
In the event of severe weather closure(s), the Superintendent may waive a portion of the make-
up days and/or utilize other alternatives, such as extended Wednesdays or extending the school
year, to ensure that the district meets the state’s required hours of instruction for the school year.
After exhausting these alternatives, the district will utilize the prioritized make-up days listed
below.
Priority Date Current Use
1 February 15, 2027 Presidents’ Day
2 April 23, 2027 Professional Day/Student Holiday
3 November 23, 2026 Monday of Thanksgiving
4 November 24, 2026 Tuesday of Thanksgiving`

const school: OfficialSourceCandidate = {
  id: 'nces:120144001406',
  schoolName: 'Oak Ridge High',
  districtName: 'Orange',
  locality: 'Orlando, FL 32809',
  sourceLabel: 'NCES Common Core of Data — Public School Administrative Data 2024–25',
  sourceLocator: 'https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=120144001406',
  confidence: 'confirmed',
}

const source: OfficialCalendarSourceCandidate = {
  id: 'official-calendar-source:ocps-2026-27',
  schoolCandidateId: school.id,
  sourceLabel: 'OCPS 2026–27 School Calendar',
  locator: OCPS_2026_27_CALENDAR_LOCATOR,
  publisher: 'Orange County Public Schools',
  sourceType: 'pdf',
}

assert(isSupportedOcpsCalendarLocator(OCPS_2026_27_CALENDAR_LOCATOR), 'Current OCPS calendar locator must be supported.')
assert(!isSupportedOcpsCalendarLocator('https://example.com/calendar.pdf'), 'Non-OCPS sources must not be accepted by the OCPS parser.')
assert(!isSupportedOcpsCalendarLocator('http://www.ocps.net/110680_3'), 'OCPS source must not downgrade to HTTP.')
assert(!isSupportedOcpsCalendarLocator('https://www.ocps.net/another-calendar'), 'Unreviewed OCPS paths must not be accepted by the narrow extractor.')

const extraction = parseOcpsCalendarText({
  sourceLocator: source.locator,
  sourceLabel: source.sourceLabel,
  publisher: source.publisher,
  capturedAt: '2026-09-05T23:08:57Z',
  text: exactExtractedText,
})

assert(extraction.schoolYearLabel === '2026–27', 'OCPS parser must retain the 2026–27 school year.')
assert(extraction.rows.length === 18, `OCPS parser must emit only the 18 explicit supported calendar statements, got ${extraction.rows.length}.`)
assert(extraction.rows.some((row) => row.startDate === '2026-08-11' && row.label.includes('First Day of School')), 'OCPS parser must emit the explicit first day.')
assert(extraction.rows.some((row) => row.startDate === '2027-05-26' && row.label.includes('Last Day of School')), 'OCPS parser must emit the explicit last day.')
assert(!extraction.rows.some((row) => /make-up/i.test(row.label)), 'Severe-weather contingency priorities must not become current calendar rows.')

const payload = buildOfficialCalendarPayloadFromStructuredRows(school, source, extraction)
assert(payload.input.firstDay === '2026-08-11', 'OCPS payload first day must be Aug. 11, 2026.')
assert(payload.input.lastDay === '2027-05-26', 'OCPS payload last day must be May 26, 2027.')
assert(payload.input.patternSource === 'district-source', 'OCPS payload must retain district-source provenance.')
assert(payload.input.patternConfidence === 'mixed', 'Weekday baseline must remain mixed because it is inferred from the district calendar.')
assert(payload.input.quarters?.length === 4, 'OCPS payload must derive four complete marking periods.')
assert(payload.input.semesters?.length === 2, 'OCPS payload must derive two complete semesters.')
assert(payload.input.exceptions.some((day) => day.date === '2027-02-15' && day.kind === 'holiday'), 'Feb. 15 schools-closed evidence must become a holiday exception.')
assert(payload.input.exceptions.some((day) => day.date === '2027-04-23' && day.kind === 'teacher-workday'), 'Apr. 23 Teacher Professional Day must become a teacher-workday exception.')
assert(!payload.input.exceptions.some((day) => day.date === '2027-05-31'), 'Post-school-year Memorial Day must not become an in-year exception.')

let missingFirstDayFailed = false
try {
  parseOcpsCalendarText({
    sourceLocator: source.locator,
    sourceLabel: source.sourceLabel,
    publisher: source.publisher,
    text: exactExtractedText.replace('Tuesday August 11 First Day of School', 'Tuesday August 11 Students Arrive'),
  })
} catch {
  missingFirstDayFailed = true
}
assert(missingFirstDayFailed, 'OCPS parser must fail closed if an expected authoritative statement changes or disappears.')

let wrongIdentityFailed = false
try {
  parseOcpsCalendarText({
    sourceLocator: source.locator,
    sourceLabel: source.sourceLabel,
    publisher: source.publisher,
    text: exactExtractedText.replace('Orange County Public Schools\n2026-2027 School Calendar', 'Example Schools\n2026-2027 School Calendar'),
  })
} catch {
  wrongIdentityFailed = true
}
assert(wrongIdentityFailed, 'OCPS parser must fail closed when the PDF does not identify as the supported OCPS calendar.')

console.log('OCPS calendar text parser contract passed')
