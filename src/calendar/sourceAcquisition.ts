import { buildCalendarProposal, type CalendarEvidence, type CalendarProposal } from './calendarProposal'
import type { CalendarHydrationInput } from './hydration'

export type SchoolIdentityQuery = {
  schoolName: string
  districtName?: string
  city?: string
  state?: string
  schoolYearLabel?: string
}

export type OfficialSourceCandidate = {
  id: string
  schoolName: string
  districtName?: string
  locality?: string
  sourceLabel: string
  sourceLocator: string
  confidence: 'confirmed' | 'mixed' | 'inferred'
}

export type OfficialSourceSearchResult =
  | { status: 'none'; candidates: []; message?: string }
  | { status: 'candidates'; candidates: OfficialSourceCandidate[] }
  | { status: 'invalid'; candidates: []; message: string }

export type OfficialCalendarPayload = {
  candidateId: string
  input: CalendarHydrationInput
  evidence: CalendarEvidence[]
}

export function normalizeSchoolIdentityQuery(query: SchoolIdentityQuery): SchoolIdentityQuery {
  return {
    schoolName: query.schoolName.trim(),
    districtName: cleanOptional(query.districtName),
    city: cleanOptional(query.city),
    state: cleanOptional(query.state)?.toUpperCase(),
    schoolYearLabel: cleanOptional(query.schoolYearLabel),
  }
}

export function validateSchoolIdentityQuery(query: SchoolIdentityQuery): string[] {
  const normalized = normalizeSchoolIdentityQuery(query)
  const errors: string[] = []
  if (!normalized.schoolName) errors.push('Enter a school name before searching official sources.')
  if (!normalized.districtName && !normalized.city && !normalized.state) {
    errors.push('Add a district, city, or state so Arc can distinguish similarly named schools.')
  }
  return errors
}

export function normalizeOfficialSourceSearchResult(value: unknown): OfficialSourceSearchResult {
  if (!isRecord(value) || !Array.isArray(value.candidates)) {
    return { status: 'invalid', candidates: [], message: 'The official-source provider returned an unreadable result.' }
  }

  const candidates = value.candidates
    .map(parseCandidate)
    .filter((candidate): candidate is OfficialSourceCandidate => Boolean(candidate))

  if (candidates.length !== value.candidates.length) {
    return { status: 'invalid', candidates: [], message: 'The official-source provider returned incomplete school identity data.' }
  }

  const ids = new Set<string>()
  for (const candidate of candidates) {
    if (ids.has(candidate.id)) {
      return { status: 'invalid', candidates: [], message: 'The official-source provider returned duplicate school candidates.' }
    }
    ids.add(candidate.id)
  }

  if (candidates.length === 0) {
    return { status: 'none', candidates: [], message: typeof value.message === 'string' ? value.message : undefined }
  }

  return { status: 'candidates', candidates }
}

export function buildProposalFromOfficialPayload(
  candidate: OfficialSourceCandidate,
  payload: OfficialCalendarPayload,
): CalendarProposal {
  if (payload.candidateId !== candidate.id) {
    throw new Error('Official calendar payload does not match the selected school candidate.')
  }
  if (payload.input.patternSource !== 'district-source') {
    throw new Error('Official-source acquisition must produce district-source calendar truth.')
  }
  if (payload.evidence.length === 0) {
    throw new Error('Official calendar payload is missing provenance evidence.')
  }
  if (!payload.evidence.some((item) => item.locator === candidate.sourceLocator)) {
    throw new Error('Official calendar payload does not retain the selected source locator.')
  }

  return buildCalendarProposal({
    proposalId: `official-${candidate.id}-${payload.input.id}`,
    input: payload.input,
    evidence: payload.evidence,
  })
}

function parseCandidate(value: unknown): OfficialSourceCandidate | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' || !value.id.trim()
    || typeof value.schoolName !== 'string' || !value.schoolName.trim()
    || typeof value.sourceLabel !== 'string' || !value.sourceLabel.trim()
    || typeof value.sourceLocator !== 'string' || !value.sourceLocator.trim()
    || !isConfidence(value.confidence)
  ) return null
  if (value.districtName !== undefined && typeof value.districtName !== 'string') return null
  if (value.locality !== undefined && typeof value.locality !== 'string') return null

  return {
    id: value.id.trim(),
    schoolName: value.schoolName.trim(),
    districtName: cleanOptional(value.districtName),
    locality: cleanOptional(value.locality),
    sourceLabel: value.sourceLabel.trim(),
    sourceLocator: value.sourceLocator.trim(),
    confidence: value.confidence,
  }
}

function isConfidence(value: unknown): value is OfficialSourceCandidate['confidence'] {
  return value === 'confirmed' || value === 'mixed' || value === 'inferred'
}

function cleanOptional(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
