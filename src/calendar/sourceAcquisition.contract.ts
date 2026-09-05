import {
  buildProposalFromOfficialPayload,
  normalizeOfficialSourceSearchResult,
  normalizeSchoolIdentityQuery,
  validateSchoolIdentityQuery,
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
assert(none.status === 'none', 'Zero official candidates must remain an explicit no-result state.')

const candidateA: OfficialSourceCandidate = {
  id: 'candidate-a',
  schoolName: 'Oak Ridge High School',
  districtName: 'Orange County Public Schools',
  locality: 'Orlando, FL',
  sourceLabel: 'District calendar page fixture',
  sourceLocator: 'fixture://official-source/a',
  confidence: 'confirmed',
}
const candidateB: OfficialSourceCandidate = {
  id: 'candidate-b',
  schoolName: 'Oak Ridge High School',
  districtName: 'Example District',
  locality: 'Example City, FL',
  sourceLabel: 'Second fixture source',
  sourceLocator: 'fixture://official-source/b',
  confidence: 'mixed',
}

const multiple = normalizeOfficialSourceSearchResult({ candidates: [candidateA, candidateB] })
assert(multiple.status === 'candidates' && multiple.candidates.length === 2, 'Multiple candidates must survive for explicit teacher selection.')

const malformed = normalizeOfficialSourceSearchResult({ candidates: [{ id: 'bad' }] })
assert(malformed.status === 'invalid' && malformed.candidates.length === 0, 'Malformed provider result must fail closed.')

const duplicate = normalizeOfficialSourceSearchResult({ candidates: [candidateA, { ...candidateA }] })
assert(duplicate.status === 'invalid', 'Duplicate candidate identity must fail closed.')

const proposal = buildProposalFromOfficialPayload(candidateA, {
  candidateId: candidateA.id,
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
    id: 'evidence-a',
    source: 'district-source',
    label: 'Automated fixture only',
    locator: candidateA.sourceLocator,
  }],
})
assert(proposal.reviewedAt === null, 'Selecting an official candidate must produce an unreviewed proposal, not committed calendar truth.')
assert(proposal.input.patternSource === 'district-source', 'Official payload must retain district-source truth.')
assert(proposal.evidence[0]?.locator === candidateA.sourceLocator, 'Official payload must retain selected source locator.')

let mismatchRejected = false
try {
  buildProposalFromOfficialPayload(candidateA, {
    candidateId: candidateB.id,
    input: proposal.input,
    evidence: proposal.evidence,
  })
} catch {
  mismatchRejected = true
}
assert(mismatchRejected, 'Payload for a different candidate must fail closed.')

let locatorRejected = false
try {
  buildProposalFromOfficialPayload(candidateA, {
    candidateId: candidateA.id,
    input: proposal.input,
    evidence: [{ id: 'wrong', source: 'district-source', label: 'Wrong fixture', locator: 'fixture://other' }],
  })
} catch {
  locatorRejected = true
}
assert(locatorRejected, 'Payload without selected official source locator must fail closed.')

console.log('official source acquisition contract passed')
