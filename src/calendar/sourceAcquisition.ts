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

export type OfficialCalendarSourceKind =
  | 'district-calendar-page'
  | 'district-calendar-document'
  | 'school-calendar-page'
  | 'school-calendar-document'

export type OfficialCalendarSourceCandidate = {
  id: string
  schoolCandidateId: string
  label: string
  publisher: string
  locator: string
  kind: OfficialCalendarSourceKind
  confidence: 'confirmed' | 'mixed' | 'inferred'
}

export type OfficialCalendarSourceSearchResult =
  | { status: 'none'; candidates: []; message?: string }
  | { status: 'candidates'; candidates: OfficialCalendarSourceCandidate[] }
  | { status: 'invalid'; candidates: []; message: string }

export type TeacherConfirmedCalendarSourceDraft = {
  label: string
  publisher: string
  locator: string
  kind: OfficialCalendarSourceKind
  confirmedOfficial: boolean
}

export type OfficialCalendarPayload = {
  candidateId: string
  calendarSourceId: string
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

  const duplicate = firstDuplicateId(candidates)
  if (duplicate) {
    return { status: 'invalid', candidates: [], message: 'The official-source provider returned duplicate school candidates.' }
  }

  if (candidates.length === 0) {
    return { status: 'none', candidates: [], message: typeof value.message === 'string' ? value.message : undefined }
  }

  return { status: 'candidates', candidates }
}

export function normalizeOfficialCalendarSourceSearchResult(value: unknown): OfficialCalendarSourceSearchResult {
  if (!isRecord(value) || !Array.isArray(value.candidates)) {
    return { status: 'invalid', candidates: [], message: 'The calendar-source provider returned an unreadable result.' }
  }

  const candidates = value.candidates
    .map(parseCalendarSourceCandidate)
    .filter((candidate): candidate is OfficialCalendarSourceCandidate => Boolean(candidate))

  if (candidates.length !== value.candidates.length) {
    return { status: 'invalid', candidates: [], message: 'The calendar-source provider returned incomplete or untrusted source data.' }
  }

  const duplicate = firstDuplicateId(candidates)
  if (duplicate) {
    return { status: 'invalid', candidates: [], message: 'The calendar-source provider returned duplicate calendar sources.' }
  }

  if (candidates.length === 0) {
    return {
      status: 'none',
      candidates: [],
      message: typeof value.message === 'string'
        ? value.message
        : 'Arc did not find a trustworthy official calendar source. No dates were created.',
    }
  }

  return { status: 'candidates', candidates }
}

export function buildTeacherConfirmedCalendarSourceCandidate(
  schoolCandidate: OfficialSourceCandidate,
  draft: TeacherConfirmedCalendarSourceDraft,
): OfficialCalendarSourceCandidate {
  if (!draft.confirmedOfficial) {
    throw new Error('Confirm that this link comes from the official school or district before Arc uses it as a calendar source.')
  }

  const label = draft.label.trim()
  const publisher = draft.publisher.trim()
  const locator = normalizeTrustedHttpLocator(draft.locator)
  if (!label) throw new Error('Give the official calendar source a label.')
  if (!publisher) throw new Error('Name the school or district that publishes this calendar source.')
  if (!locator) throw new Error('Use a valid public HTTP(S) link for the official calendar source.')
  if (!isCalendarSourceKind(draft.kind)) throw new Error('Choose what kind of official calendar source this is.')

  return {
    id: `teacher-confirmed:${schoolCandidate.id}:${locator}`,
    schoolCandidateId: schoolCandidate.id,
    label,
    publisher,
    locator,
    kind: draft.kind,
    confidence: 'confirmed',
  }
}

export function buildProposalFromOfficialPayload(
  schoolCandidate: OfficialSourceCandidate,
  calendarSource: OfficialCalendarSourceCandidate,
  payload: OfficialCalendarPayload,
): CalendarProposal {
  if (calendarSource.schoolCandidateId !== schoolCandidate.id) {
    throw new Error('Official calendar source does not belong to the selected school candidate.')
  }
  if (payload.candidateId !== schoolCandidate.id) {
    throw new Error('Official calendar payload does not match the selected school candidate.')
  }
  if (payload.calendarSourceId !== calendarSource.id) {
    throw new Error('Official calendar payload does not match the selected calendar source.')
  }
  if (payload.input.patternSource !== 'district-source') {
    throw new Error('Official-source acquisition must produce district-source calendar truth.')
  }
  if (payload.evidence.length === 0) {
    throw new Error('Official calendar payload is missing provenance evidence.')
  }
  if (!payload.evidence.some((item) => item.locator === calendarSource.locator)) {
    throw new Error('Official calendar payload does not retain the selected calendar-source locator.')
  }

  return buildCalendarProposal({
    proposalId: `official-${schoolCandidate.id}-${calendarSource.id}-${payload.input.id}`,
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
    || typeof value.sourceLocator !== 'string' || !isTrustedHttpLocator(value.sourceLocator)
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

function parseCalendarSourceCandidate(value: unknown): OfficialCalendarSourceCandidate | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'string' || !value.id.trim()
    || typeof value.schoolCandidateId !== 'string' || !value.schoolCandidateId.trim()
    || typeof value.label !== 'string' || !value.label.trim()
    || typeof value.publisher !== 'string' || !value.publisher.trim()
    || typeof value.locator !== 'string' || !isTrustedHttpLocator(value.locator)
    || !isCalendarSourceKind(value.kind)
    || !isConfidence(value.confidence)
  ) return null

  return {
    id: value.id.trim(),
    schoolCandidateId: value.schoolCandidateId.trim(),
    label: value.label.trim(),
    publisher: value.publisher.trim(),
    locator: value.locator.trim(),
    kind: value.kind,
    confidence: value.confidence,
  }
}

function firstDuplicateId<T extends { id: string }>(items: T[]): string | null {
  const ids = new Set<string>()
  for (const item of items) {
    if (ids.has(item.id)) return item.id
    ids.add(item.id)
  }
  return null
}

function isCalendarSourceKind(value: unknown): value is OfficialCalendarSourceKind {
  return value === 'district-calendar-page'
    || value === 'district-calendar-document'
    || value === 'school-calendar-page'
    || value === 'school-calendar-document'
}

function isConfidence(value: unknown): value is OfficialSourceCandidate['confidence'] {
  return value === 'confirmed' || value === 'mixed' || value === 'inferred'
}

function isTrustedHttpLocator(value: string): boolean {
  return normalizeTrustedHttpLocator(value) !== null
}

function normalizeTrustedHttpLocator(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (url.username || url.password) return null
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}

function cleanOptional(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
