import {
  buildProposalFromOfficialPayload,
  buildTeacherConfirmedCalendarSourceCandidate,
  normalizeOfficialCalendarSourceSearchResult,
  normalizeOfficialSourceSearchResult,
  normalizeSchoolIdentityQuery,
  validateSchoolIdentityQuery,
  type OfficialCalendarSourceCandidate,
  type OfficialSourceCandidate,
} from './sourceAcquisition'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const normalized = normalizeSchoolIdentityQuery({
  schoolName: '  Oak Ridge High School  ',
  districtName: '  Orange County Public Schools ',
  city: ' Orlando ',
  state: ' fl ',
  schoolYearLabel: ' 2026–27 ',
})
assert(normalized.schoolName === 'Oak Ridge High School', 'School name should be trimmed.')
assert(normalized.districtName === 'Orange County Public Schools', 'District name should be trimmed.')
assert(normalized.state === 'FL', 'State should normalize uppercase.')
assert(validateSchoolIdentityQuery({ schoolName: '', state: 'FL' }).length === 1, 'Blank school name must fail validation.')
assert(validateSchoolIdentityQuery({ schoolName: 'Central High School' }).length === 1, 'Ambiguous school identity without locality/district must fail validation.')
assert(validateSchoolIdentityQuery({ schoolName: 'Central High School', city: 'Orlando' }).length === 0, 'School plus locality should be searchable.')

const none = normalizeOfficialSourceSearchResult({ candidates: [] })
assert(none.status === 'none', 'Zero official school candidates must remain an explicit no-result state.')

const candidateA: OfficialSourceCandidate = {
  id: 'candidate-a',
  schoolName: 'Oak Ridge High School',
  districtName: 'Orange County Public Schools',
  locality: 'Orlando, FL',
  sourceLabel: 'NCES school identity fixture',
  sourceLocator: 'https://nces.example.invalid/school/candidate-a',
  confidence: 'confirmed',
}
const candidateB: OfficialSourceCandidate = {
  id: 'candidate-b',
  schoolName: 'Oak Ridge High School',
  districtName: 'Example District',
  locality: 'Example City, FL',
  sourceLabel: 'Second NCES identity fixture',
  sourceLocator: 'https://nces.example.invalid/school/candidate-b',
  confidence: 'mixed',
}

const multiple = normalizeOfficialSourceSearchResult({ candidates: [candidateA, candidateB] })
assert(multiple.status === 'candidates' && multiple.candidates.length === 2, 'Multiple school candidates must survive for explicit teacher selection.')

const malformed = normalizeOfficialSourceSearchResult({ candidates: [{ id: 'bad' }] })
assert(malformed.status === 'invalid' && malformed.candidates.length === 0, 'Malformed school provider result must fail closed.')

const duplicate = normalizeOfficialSourceSearchResult({ candidates: [candidateA, { ...candidateA }] })
assert(duplicate.status === 'invalid', 'Duplicate school candidate identity must fail closed.')

const calendarSourceA: OfficialCalendarSourceCandidate = {
  id: 'calendar-source-a',
  schoolCandidateId: candidateA.id,
  label: '2026–27 district calendar',
  publisher: 'Orange County Public Schools',
  locator: 'https://calendar.example.invalid/ocps/2026-27',
  kind: 'district-calendar-page',
  confidence: 'confirmed',
}
const calendarSourceB: OfficialCalendarSourceCandidate = {
  id: 'calendar-source-b',
  schoolCandidateId: candidateA.id,
  label: '2026–27 school calendar PDF',
  publisher: 'Oak Ridge High School',
  locator: 'https://calendar.example.invalid/oak-ridge/2026-27.pdf',
  kind: 'school-calendar-document',
  confidence: 'mixed',
}

const noCalendarSource = normalizeOfficialCalendarSourceSearchResult({ candidates: [] })
assert(noCalendarSource.status === 'none', 'Missing trustworthy calendar source must remain an explicit no-result state.')
assert((noCalendarSource.message ?? '').includes('No dates were created'), 'No-source state must explicitly preserve non-mutation truth.')

const calendarSources = normalizeOfficialCalendarSourceSearchResult({ candidates: [calendarSourceA, calendarSourceB] })
assert(calendarSources.status === 'candidates' && calendarSources.candidates.length === 2, 'Multiple trustworthy calendar sources must remain explicit.')

const malformedCalendarSource = normalizeOfficialCalendarSourceSearchResult({ candidates: [{ ...calendarSourceA, locator: 'fixture://not-teacher-facing' }] })
assert(malformedCalendarSource.status === 'invalid', 'Calendar source without a trustworthy HTTP(S) locator must fail closed.')

const duplicateCalendarSource = normalizeOfficialCalendarSourceSearchResult({ candidates: [calendarSourceA, { ...calendarSourceA }] })
assert(duplicateCalendarSource.status === 'invalid', 'Duplicate calendar source identity must fail closed.')

let unconfirmedSourceRejected = false
try {
  buildTeacherConfirmedCalendarSourceCandidate(candidateA, {
    label: '2026–27 district calendar',
    publisher: 'Orange County Public Schools',
    locator: 'https://www.ocps.net/calendar#school-year',
    kind: 'district-calendar-page',
    confirmedOfficial: false,
  })
} catch {
  unconfirmedSourceRejected = true
}
assert(unconfirmedSourceRejected, 'Teacher URL handoff must not create an official source without explicit confirmation.')

let invalidSourceUrlRejected = false
try {
  buildTeacherConfirmedCalendarSourceCandidate(candidateA, {
    label: '2026–27 district calendar',
    publisher: 'Orange County Public Schools',
    locator: 'javascript:alert(1)',
    kind: 'district-calendar-page',
    confirmedOfficial: true,
  })
} catch {
  invalidSourceUrlRejected = true
}
assert(invalidSourceUrlRejected, 'Teacher-confirmed source must reject non-HTTP(S) locators.')

const teacherConfirmedSource = buildTeacherConfirmedCalendarSourceCandidate(candidateA, {
  label: '  2026–27 district calendar  ',
  publisher: '  Orange County Public Schools ',
  locator: 'https://www.ocps.net/calendar#school-year',
  kind: 'district-calendar-page',
  confirmedOfficial: true,
})
assert(teacherConfirmedSource.schoolCandidateId === candidateA.id, 'Teacher-confirmed source must remain tied to the selected school identity.')
assert(teacherConfirmedSource.label === '2026–27 district calendar', 'Teacher-confirmed source label should be normalized.')
assert(teacherConfirmedSource.publisher === 'Orange County Public Schools', 'Teacher-confirmed source publisher should be normalized.')
assert(teacherConfirmedSource.locator === 'https://www.ocps.net/calendar', 'Teacher-confirmed source locator should normalize and drop non-provenance fragments.')
assert(teacherConfirmedSource.confidence === 'confirmed', 'Explicit teacher confirmation should create confirmed source identity, not inferred source identity.')

const proposal = buildProposalFromOfficialPayload(candidateA, calendarSourceA, {
  candidateId: candidateA.id,
  calendarSourceId: calendarSourceA.id,
  input: {
    id: 'official-calendar-fixture',
    schoolYearLabel: '2026–27 fixture',
    firstDay: '2026-08-10',
    lastDay: '2027-05-28',
    instructionalWeekdays: [1, 2, 3, 4, 5],
    patternSource: 'district-source',
    patternConfidence: 'mixed',
    exceptions: [],
    quarters: [],
    semesters: [],
  },
  evidence: [{
    id: 'calendar-evidence-a',
    source: 'district-source',
    label: 'Official district calendar fixture',
    locator: calendarSourceA.locator,
  }],
})
assert(proposal.reviewedAt === null, 'Acquiring official calendar dates must produce an unreviewed proposal, not committed calendar truth.')
assert(proposal.input.patternSource === 'district-source', 'Official calendar payload must retain district-source truth.')
assert(proposal.evidence[0]?.locator === calendarSourceA.locator, 'Calendar proposal must retain selected calendar-source locator rather than using school identity as date evidence.')
assert(proposal.evidence[0]?.locator !== candidateA.sourceLocator, 'School identity locator must not masquerade as calendar-date evidence.')

let sourceOwnershipRejected = false
try {
  buildProposalFromOfficialPayload(candidateB, calendarSourceA, {
    candidateId: candidateB.id,
    calendarSourceId: calendarSourceA.id,
    input: proposal.input,
    evidence: proposal.evidence,
  })
} catch {
  sourceOwnershipRejected = true
}
assert(sourceOwnershipRejected, 'Calendar source tied to a different school candidate must fail closed.')

let schoolMismatchRejected = false
try {
  buildProposalFromOfficialPayload(candidateA, calendarSourceA, {
    candidateId: candidateB.id,
    calendarSourceId: calendarSourceA.id,
    input: proposal.input,
    evidence: proposal.evidence,
  })
} catch {
  schoolMismatchRejected = true
}
assert(schoolMismatchRejected, 'Calendar payload for a different school candidate must fail closed.')

let calendarSourceMismatchRejected = false
try {
  buildProposalFromOfficialPayload(candidateA, calendarSourceA, {
    candidateId: candidateA.id,
    calendarSourceId: calendarSourceB.id,
    input: proposal.input,
    evidence: proposal.evidence,
  })
} catch {
  calendarSourceMismatchRejected = true
}
assert(calendarSourceMismatchRejected, 'Calendar payload for a different source candidate must fail closed.')

let calendarLocatorRejected = false
try {
  buildProposalFromOfficialPayload(candidateA, calendarSourceA, {
    candidateId: candidateA.id,
    calendarSourceId: calendarSourceA.id,
    input: proposal.input,
    evidence: [{ id: 'wrong', source: 'district-source', label: 'Wrong fixture', locator: 'https://calendar.example.invalid/other' }],
  })
} catch {
  calendarLocatorRejected = true
}
assert(calendarLocatorRejected, 'Payload without selected calendar-source locator must fail closed.')

let manualTruthRejected = false
try {
  buildProposalFromOfficialPayload(candidateA, calendarSourceA, {
    candidateId: candidateA.id,
    calendarSourceId: calendarSourceA.id,
    input: { ...proposal.input, patternSource: 'manual' },
    evidence: proposal.evidence,
  })
} catch {
  manualTruthRejected = true
}
assert(manualTruthRejected, 'Official calendar acquisition must not silently create manual truth.')

console.log('official source acquisition contract passed')
