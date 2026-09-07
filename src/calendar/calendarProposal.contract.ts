import { buildCalendarProposal, commitCalendarProposal, reviewCalendarProposal } from './calendarProposal'
import { deserializeCalendarInput, serializeCalendarInput } from './persistence'
import type { CalendarHydrationInput } from './hydration'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const sourceInput: CalendarHydrationInput = {
  id: 'district-2026-27',
  schoolYearLabel: '2026–27',
  firstDay: '2026-08-10',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'district-source',
  patternConfidence: 'mixed',
  exceptions: [
    { date: '2026-09-07', kind: 'holiday', label: 'Labor Day', source: 'district-source', confidence: 'confirmed' },
    { date: '2026-10-12', kind: 'no-school', label: 'Source needs teacher confirmation', source: 'district-source', confidence: 'inferred' },
  ],
  quarters: [],
  semesters: [],
}

const proposal = buildCalendarProposal({
  proposalId: 'proposal-1',
  input: sourceInput,
  evidence: [{
    id: 'district-calendar-page',
    source: 'district-source',
    label: 'District 2026–27 school calendar',
    locator: 'https://district.example/calendar',
    capturedAt: '2026-09-05T13:00:00Z',
  }],
})

assert(proposal.reviewedAt === null, 'A source-backed proposal must begin unreviewed.')
assert(proposal.warnings.length === 2, 'Mixed pattern confidence plus an inferred exception must remain visible as review warnings.')
assert(proposal.input.provenance?.[0]?.locator === 'https://district.example/calendar', 'Proposal must attach source provenance to the canonical hydration input.')

let blockedBeforeReview = false
try {
  commitCalendarProposal(proposal)
} catch (error) {
  blockedBeforeReview = error instanceof Error && error.message.includes('Review this calendar proposal')
}
assert(blockedBeforeReview, 'Source-backed calendar truth must fail closed before explicit review.')

const reviewed = reviewCalendarProposal(proposal, '2026-09-05T13:05:00Z')
const committed = commitCalendarProposal(reviewed)
assert(committed.patternSource === 'district-source', 'Explicit commit must preserve source-backed pattern truth.')
assert(committed.patternConfidence === 'mixed', 'Explicit commit must preserve confidence instead of silently upgrading it.')
assert(committed.provenance?.length === 1, 'Explicit commit must preserve source provenance.')
assert(committed.exceptions?.[1]?.confidence === 'inferred', 'Explicit commit must preserve uncertain exception confidence.')

const roundTrip = deserializeCalendarInput(serializeCalendarInput(committed))
assert(roundTrip?.provenance?.[0]?.id === 'district-calendar-page', 'Save/reload must preserve calendar provenance evidence.')
assert(roundTrip?.provenance?.[0]?.locator === 'https://district.example/calendar', 'Save/reload must preserve provenance locator.')

let missingEvidenceBlocked = false
try {
  buildCalendarProposal({ proposalId: 'proposal-2', input: sourceInput, evidence: [] })
} catch (error) {
  missingEvidenceBlocked = error instanceof Error && error.message.includes('require provenance evidence')
}
assert(missingEvidenceBlocked, 'Source-backed proposal without evidence must fail closed.')

let sourceMismatchBlocked = false
try {
  buildCalendarProposal({
    proposalId: 'proposal-3',
    input: sourceInput,
    evidence: [{ id: 'file', source: 'import', label: 'Uploaded calendar' }],
  })
} catch (error) {
  sourceMismatchBlocked = error instanceof Error && error.message.includes('does not match pattern source')
}
assert(sourceMismatchBlocked, 'Proposal evidence source must match the declared calendar pattern source.')

console.log('calendar proposal review contract passed')
