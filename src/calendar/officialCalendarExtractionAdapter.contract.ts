import {
  acquireOfficialCalendarPayload,
  type OfficialCalendarExtractionAdapter,
  type OfficialCalendarStructuredExtraction,
} from './officialCalendarDateAcquisition'
import type { OfficialCalendarSourceCandidate, OfficialSourceCandidate } from './sourceAcquisition'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const school: OfficialSourceCandidate = {
  id: 'school-a',
  schoolName: 'Example High',
  districtName: 'Example District',
  locality: 'Example, FL',
  sourceLabel: 'Official identity provider',
  sourceLocator: 'https://identity.example.invalid/school-a',
  confidence: 'confirmed',
}

const source: OfficialCalendarSourceCandidate = {
  id: 'calendar-a',
  schoolCandidateId: school.id,
  label: '2026–27 School Calendar',
  publisher: 'Example District',
  locator: 'https://district.example.invalid/2026-27-calendar.pdf',
  kind: 'district-calendar-document',
  confidence: 'confirmed',
}

const extraction: OfficialCalendarStructuredExtraction = {
  sourceLocator: source.locator,
  sourceLabel: source.label,
  publisher: source.publisher,
  schoolYearLabel: '2026–27',
  rows: [
    { startDate: '2026-08-10', label: 'First Day of School' },
    { startDate: '2026-09-07', label: 'Labor Day Holiday' },
    { startDate: '2027-05-28', label: 'Last Day of School' },
  ],
}

let extractedSource: OfficialCalendarSourceCandidate | null = null
const adapter: OfficialCalendarExtractionAdapter = {
  id: 'fixture-structured-extractor',
  supports: (candidate) => candidate.kind === 'district-calendar-document',
  extract: async (candidate) => {
    extractedSource = candidate
    return extraction
  },
}

const success = await acquireOfficialCalendarPayload(school, source, adapter)
assert(success.status === 'payload', 'Supported trusted source should return a payload result.')
assert(success.status !== 'payload' || success.adapterId === adapter.id, 'Payload result must identify the adapter that produced it.')
assert(extractedSource?.id === source.id && extractedSource.locator === source.locator, 'Adapter did not receive the exact teacher-confirmed source candidate.')
assert(success.status !== 'payload' || success.payload.input.firstDay === '2026-08-10', 'Adapter result lost explicit first day.')
assert(success.status !== 'payload' || success.payload.input.patternConfidence === 'mixed', 'Adapter result silently promoted inferred weekday truth.')

let unsupportedExtractCalls = 0
const unsupported = await acquireOfficialCalendarPayload(school, source, {
  id: 'unsupported-adapter',
  supports: () => false,
  extract: async () => {
    unsupportedExtractCalls += 1
    return extraction
  },
})
assert(unsupported.status === 'unsupported', 'Unsupported source must remain an explicit unsupported result.')
assert(unsupportedExtractCalls === 0, 'Unsupported adapter must never be asked to extract the source.')
assert(unsupported.status !== 'unsupported' || unsupported.message.includes('No dates were created'), 'Unsupported result must state that no dates were created.')

const extractionFailure = await acquireOfficialCalendarPayload(school, source, {
  id: 'failing-adapter',
  supports: () => true,
  extract: async () => { throw new Error('upstream extractor unavailable') },
})
assert(extractionFailure.status === 'invalid', 'Extractor/network failure must remain an explicit invalid result.')
assert(extractionFailure.status !== 'invalid' || extractionFailure.message.includes('No dates were created'), 'Extractor failure must state that no dates were created.')
assert(extractionFailure.status !== 'invalid' || extractionFailure.message.includes('upstream extractor unavailable'), 'Extractor failure should retain actionable upstream context.')

const malformedExtraction = await acquireOfficialCalendarPayload(school, source, {
  id: 'malformed-adapter',
  supports: () => true,
  extract: async () => ({
    ...extraction,
    rows: [{ startDate: '2026-08-10', label: 'Ordinary event without school-year bounds' }],
  }),
})
assert(malformedExtraction.status === 'invalid', 'Structurally incomplete extraction must fail closed after adapter success.')
assert(malformedExtraction.status !== 'invalid' || malformedExtraction.message.includes('trustworthy school-calendar dates'), 'Post-extraction validation failure should explain that trustworthy dates could not be formed.')

let wrongSchoolExtractCalls = 0
const wrongSchool = await acquireOfficialCalendarPayload(
  { ...school, id: 'school-b' },
  source,
  {
    id: 'should-not-run',
    supports: () => true,
    extract: async () => {
      wrongSchoolExtractCalls += 1
      return extraction
    },
  },
)
assert(wrongSchool.status === 'invalid', 'Calendar source belonging to another school must fail before extraction.')
assert(wrongSchoolExtractCalls === 0, 'Mismatched school/source identity must block the extractor entirely.')

console.log('official calendar extraction adapter contract passed')
