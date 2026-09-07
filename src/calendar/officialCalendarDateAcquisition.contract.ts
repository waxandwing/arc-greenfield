import { buildProposalFromOfficialPayload, type OfficialCalendarSourceCandidate, type OfficialSourceCandidate } from './sourceAcquisition'
import { buildOfficialCalendarPayloadFromStructuredRows, type OfficialCalendarStructuredExtraction } from './officialCalendarDateAcquisition'
import { validateHydrationInput } from './hydration'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const school: OfficialSourceCandidate = {
  id: 'nces:120144001406',
  schoolName: 'Oak Ridge High',
  districtName: 'Orange County Public Schools',
  locality: 'Orlando, FL',
  sourceLabel: 'NCES Common Core of Data / EDGE',
  sourceLocator: 'https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=120144001406',
  confidence: 'confirmed',
}

const source: OfficialCalendarSourceCandidate = {
  id: 'calendar:ocps:2026-27',
  schoolCandidateId: school.id,
  label: '2026–27 School Calendar',
  publisher: 'Orange County Public Schools',
  locator: 'https://www.ocps.net/UserFiles/Servers/Server_54619/File/Frequently%20Updated%20Documents/2026-2027%20School%20Calendar.pdf',
  kind: 'district-calendar-document',
  confidence: 'confirmed',
}

const extraction: OfficialCalendarStructuredExtraction = {
  sourceLocator: source.locator,
  sourceLabel: source.label,
  publisher: source.publisher,
  schoolYearLabel: '2026–27',
  capturedAt: '2026-09-05T19:00:00Z',
  rows: [
    { startDate: '2026-08-03', endDate: '2026-08-10', label: 'Pre-Planning · August 5 Professional Development Day' },
    { startDate: '2026-08-11', label: 'First Day of School' },
    { startDate: '2026-09-07', label: 'Labor Day Holiday' },
    { startDate: '2026-10-09', label: 'End of First Marking Period' },
    { startDate: '2026-10-12', label: 'Teacher Workday / Student Holiday' },
    { startDate: '2026-10-13', label: 'Begin Second Marking Period' },
    { startDate: '2026-11-23', endDate: '2026-11-27', label: 'Thanksgiving Break' },
    { startDate: '2026-12-18', label: 'End of Second Marking Period' },
    { startDate: '2026-12-21', endDate: '2027-01-01', label: 'Winter Break' },
    { startDate: '2027-01-04', label: 'Teacher Workday / Student Holiday' },
    { startDate: '2027-01-05', label: 'Begin Third Marking Period · Begin Second Semester' },
    { startDate: '2027-01-18', label: 'Martin Luther King, Jr. Holiday · Schools and District Offices Closed' },
    { startDate: '2027-02-15', label: 'Presidents’ Day / Teacher Non-Work Day · Schools Closed / District Offices Open' },
    { startDate: '2027-03-11', label: 'End of Third Marking Period' },
    { startDate: '2027-03-12', label: 'Teacher Workday / Student Holiday' },
    { startDate: '2027-03-15', endDate: '2027-03-19', label: 'Spring Break · Schools Closed / District Offices Open' },
    { startDate: '2027-03-22', label: 'Begin Fourth Marking Period' },
    { startDate: '2027-04-23', label: 'Teacher Professional Day · Student Holiday / Teacher Non-Workday' },
    { startDate: '2027-05-26', label: 'End of Fourth Marking Period · Last Day of School' },
    { startDate: '2027-05-27', endDate: '2027-05-28', label: 'Post Planning' },
  ],
}

const payload = buildOfficialCalendarPayloadFromStructuredRows(school, source, extraction)
assert(payload.candidateId === school.id, 'Payload lost selected school identity.')
assert(payload.calendarSourceId === source.id, 'Payload lost selected calendar source identity.')
assert(payload.input.firstDay === '2026-08-11', 'Explicit first day was not retained.')
assert(payload.input.lastDay === '2027-05-26', 'Explicit last day was not retained.')
assert(payload.input.patternSource === 'district-source', 'Official acquisition must remain district-source truth.')
assert(payload.input.patternConfidence === 'mixed', 'Inferred weekday pattern must not be silently promoted to confirmed.')
assert(payload.input.instructionalWeekdays.join(',') === '1,2,3,4,5', 'Expected inferred Monday–Friday baseline was not produced.')
assert(payload.evidence.length === 1 && payload.evidence[0]?.locator === source.locator, 'Payload did not retain the actual calendar document as provenance.')
assert(payload.evidence[0]?.capturedAt === extraction.capturedAt, 'Evidence capture timestamp was not retained.')
assert(validateHydrationInput(payload.input).length === 0, 'Structured acquisition produced invalid hydration input.')

const thanksgiving = payload.input.exceptions?.filter((day) => day.date >= '2026-11-23' && day.date <= '2026-11-27') ?? []
assert(thanksgiving.length === 5 && thanksgiving.every((day) => day.kind === 'break' && day.confidence === 'confirmed'), 'Explicit Thanksgiving break was not expanded as confirmed source truth.')
assert(payload.input.exceptions?.some((day) => day.date === '2026-10-12' && day.kind === 'teacher-workday'), 'Teacher workday/student holiday was not retained as an explicit exception.')
assert(payload.input.exceptions?.some((day) => day.date === '2027-02-15' && day.kind === 'holiday'), 'Explicit Presidents’ Day closure was not retained.')
assert(!payload.input.exceptions?.some((day) => day.date === '2026-08-05'), 'Pre-planning evidence outside school-year bounds leaked into the student calendar.')
assert(!payload.input.exceptions?.some((day) => day.date === '2027-05-27'), 'Post-planning evidence outside school-year bounds leaked into the student calendar.')

assert(payload.input.quarters?.length === 4, 'Complete marking-period evidence should produce four quarter boundaries.')
assert(payload.input.quarters?.[0]?.startDate === '2026-08-11' && payload.input.quarters?.[0]?.endDate === '2026-10-09', 'Quarter 1 boundary is wrong.')
assert(payload.input.quarters?.[3]?.startDate === '2027-03-22' && payload.input.quarters?.[3]?.endDate === '2027-05-26', 'Quarter 4 boundary is wrong.')
assert(payload.input.semesters?.length === 2, 'Explicit second-semester evidence plus complete quarters should produce two semester boundaries.')
assert(payload.input.semesters?.[1]?.startDate === '2027-01-05', 'Second-semester start was not retained from explicit evidence.')

const proposal = buildProposalFromOfficialPayload(school, source, payload)
assert(proposal.reviewedAt === null, 'Date acquisition must stop at an unreviewed proposal.')
assert(proposal.input.patternConfidence === 'mixed', 'Proposal review boundary lost acquisition uncertainty.')
assert(proposal.evidence[0]?.locator === source.locator, 'Proposal provenance does not point to the teacher-confirmed official calendar source.')

let locatorMismatchRejected = false
try {
  buildOfficialCalendarPayloadFromStructuredRows(school, source, {
    ...extraction,
    sourceLocator: 'https://example.invalid/not-the-confirmed-source.pdf',
  })
} catch {
  locatorMismatchRejected = true
}
assert(locatorMismatchRejected, 'Extraction from a different source locator must fail closed.')

let publisherMismatchRejected = false
try {
  buildOfficialCalendarPayloadFromStructuredRows(school, source, {
    ...extraction,
    publisher: 'Different Publisher',
  })
} catch {
  publisherMismatchRejected = true
}
assert(publisherMismatchRejected, 'Extraction from a different publisher must fail closed.')

let missingFirstDayRejected = false
try {
  buildOfficialCalendarPayloadFromStructuredRows(school, source, {
    ...extraction,
    rows: extraction.rows.filter((row) => !row.label.includes('First Day of School')),
  })
} catch {
  missingFirstDayRejected = true
}
assert(missingFirstDayRejected, 'Extraction without an explicit first day must fail closed.')

let invalidDateRejected = false
try {
  buildOfficialCalendarPayloadFromStructuredRows(school, source, {
    ...extraction,
    rows: [{ startDate: '2026-99-99', label: 'First Day of School' }, ...extraction.rows],
  })
} catch {
  invalidDateRejected = true
}
assert(invalidDateRejected, 'Malformed extracted dates must fail closed.')

let overlapRejected = false
try {
  buildOfficialCalendarPayloadFromStructuredRows(school, source, {
    ...extraction,
    rows: [
      ...extraction.rows,
      { startDate: '2026-11-25', label: 'Student Holiday' },
    ],
  })
} catch {
  overlapRejected = true
}
assert(overlapRejected, 'Overlapping non-instructional evidence must fail closed rather than silently choosing one meaning.')

const incompleteTerms = buildOfficialCalendarPayloadFromStructuredRows(school, source, {
  ...extraction,
  rows: extraction.rows.filter((row) => !row.label.includes('Begin Fourth Marking Period')),
})
assert(incompleteTerms.input.quarters?.length === 0, 'Incomplete marking-period evidence must not fabricate partial quarter boundaries.')
assert(incompleteTerms.input.semesters?.length === 0, 'Semester boundaries must not be fabricated when term evidence is incomplete.')

console.log('official calendar date acquisition contract passed')
