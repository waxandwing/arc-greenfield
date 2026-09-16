import {
  searchGoogleSchools,
  type GoogleSchoolSearchMode,
  type GoogleSchoolSearchResult,
} from './googleSchoolSearchProvider'
import {
  isNcesReachabilityFailure,
  searchLocalSchoolDirectory,
} from './localSchoolDirectory'
import { searchNcesPublicSchools } from './ncesSchoolIdentityProvider'
import type { OfficialSourceCandidate, OfficialSourceSearchResult, SchoolIdentityQuery } from './sourceAcquisition'

export type SchoolIdentityProvider = 'google' | 'nces' | 'local'

export type SchoolIdentitySearchOutcome = OfficialSourceSearchResult & {
  providersUsed: SchoolIdentityProvider[]
  googleMode: GoogleSchoolSearchMode
  usedLocalFallback?: boolean
  /** Short teacher-facing note about which discovery path ran. */
  pathwayNote?: string
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type SearchOptions = { fetchImpl?: FetchLike; signal?: AbortSignal; maxCandidates?: number }

/**
 * Load-school discovery: Google Places first (live or honest demo), then NCES,
 * then the curated local directory when live sources are unreachable.
 */
export async function searchSchoolIdentity(
  query: SchoolIdentityQuery,
  options: SearchOptions = {},
): Promise<SchoolIdentitySearchOutcome> {
  const google = await searchGoogleSchools(query, options)
  if (google.status === 'invalid' && google.mode !== 'unavailable' && !isSoftGoogleFailure(google)) {
    // Hard validation errors (blank name, etc.) stop before other providers.
    if (isValidationFailure(google)) {
      return { ...google, providersUsed: ['google'], googleMode: google.mode }
    }
  }

  const nces = await searchNcesPublicSchools(query, options)
  if (nces.status === 'invalid' && isValidationFailure(nces)) {
    return { ...nces, providersUsed: ['google', 'nces'], googleMode: google.mode }
  }

  const merged = mergeGoogleAndNces(google, nces)
  if (merged.status === 'candidates' || merged.status === 'none') {
    return merged
  }

  if (isNcesReachabilityFailure(nces) || google.mode === 'demo' || google.mode === 'unavailable') {
    const local = searchLocalSchoolDirectory(query)
    return {
      ...local,
      providersUsed: ['google', 'nces', 'local'],
      googleMode: google.mode,
      usedLocalFallback: true,
      pathwayNote: pathwayForLocal(google.mode),
    }
  }

  return {
    ...nces,
    providersUsed: ['google', 'nces'],
    googleMode: google.mode,
    pathwayNote: 'Google and NCES both failed closed. Nothing was selected or saved.',
  }
}

function mergeGoogleAndNces(
  google: GoogleSchoolSearchResult,
  nces: OfficialSourceSearchResult,
): SchoolIdentitySearchOutcome {
  const providersUsed: SchoolIdentityProvider[] = ['google', 'nces']
  const googleCandidates = google.status === 'candidates' ? google.candidates : []
  const ncesCandidates = nces.status === 'candidates' ? nces.candidates : []

  if (ncesCandidates.length === 0 && googleCandidates.length === 0) {
    if (nces.status === 'none' || google.status === 'none') {
      const noneMessage = nces.status === 'none'
        ? (nces.message ?? 'No official school match yet.')
        : (google.status === 'none' ? (google.message ?? 'No school match yet.') : 'No school match yet.')
      return {
        status: 'none',
        candidates: [],
        message: noneMessage,
        providersUsed,
        googleMode: google.mode,
        pathwayNote: noteForEmpty(google.mode),
      }
    }
    // Both invalid/unreachable — let caller fall through to local.
    const failureMessage = nces.status === 'invalid'
      ? nces.message
      : (google.status === 'invalid' ? google.message : 'School search failed.')
    return {
      status: 'invalid',
      candidates: [],
      message: failureMessage,
      providersUsed,
      googleMode: google.mode,
    }
  }

  // Official NCES hits win over Google demo rows (same curated schools, quieter UI).
  // Live Google extras still append when they are not obvious duplicates.
  const googleForMerge = google.mode === 'demo' && ncesCandidates.length > 0 ? [] : googleCandidates
  const candidates = dedupePreferNces([...ncesCandidates, ...googleForMerge])
  return {
    status: 'candidates',
    candidates,
    providersUsed,
    googleMode: google.mode,
    pathwayNote: noteForCandidates(google.mode, ncesCandidates.length, googleForMerge.length),
  }
}

export function dedupePreferNces(candidates: OfficialSourceCandidate[]): OfficialSourceCandidate[] {
  const seenKeys = new Set<string>()
  const out: OfficialSourceCandidate[] = []
  for (const candidate of candidates) {
    const key = identityKey(candidate)
    if (seenKeys.has(key)) continue
    seenKeys.add(key)
    out.push(candidate)
  }
  return out
}

function identityKey(candidate: OfficialSourceCandidate): string {
  const name = candidate.schoolName.trim().toLowerCase().replace(/\s+/g, ' ')
  const locality = (candidate.locality ?? '')
    .toLowerCase()
    .replace(/\d{5}(-\d{4})?/g, ' ')
    .replace(/\busa\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Keep distinct provider rows when locality differs; collapse obvious duplicates.
  return `${name}|${locality}`
}

function isValidationFailure(result: OfficialSourceSearchResult): boolean {
  if (result.status !== 'invalid') return false
  const message = result.message.toLowerCase()
  return message.includes('enter a school name') || message.includes('add a district, city, or state')
}

function isSoftGoogleFailure(result: GoogleSchoolSearchResult): boolean {
  if (result.status !== 'invalid') return false
  const message = result.message.toLowerCase()
  return message.includes('could not reach') || message.includes('http ')
}

function noteForCandidates(mode: GoogleSchoolSearchMode, ncesCount: number, googleCount: number): string {
  if (mode === 'live' && googleCount > 0 && ncesCount > 0) {
    return 'Results combine Google Places and the NCES directory. Prefer an NCES row when both appear.'
  }
  if (mode === 'live' && googleCount > 0) {
    return 'Google Places found school matches. Official NCES identity may still be incomplete.'
  }
  if (mode === 'demo' && googleCount > 0) {
    return 'Google Places API key is not configured — showing demo Google matches alongside any NCES hits.'
  }
  if (ncesCount > 0) {
    return mode === 'unavailable'
      ? 'Google school search was unavailable here — showing NCES directory matches.'
      : 'Showing NCES directory matches.'
  }
  return 'Choose the school yourself. Arc will not guess.'
}

function noteForEmpty(mode: GoogleSchoolSearchMode): string {
  if (mode === 'demo') return 'No demo Google or NCES match yet. Try Oak Ridge High in Orlando, FL, or enter dates manually.'
  if (mode === 'unavailable') return 'Google school search was unavailable; NCES also found no match.'
  return 'Google and NCES found no match. Try a fuller school name, or enter dates manually.'
}

function pathwayForLocal(mode: GoogleSchoolSearchMode): string {
  if (mode === 'demo') {
    return 'Live Google key is missing and NCES was unreachable — using Arc’s local school list.'
  }
  return 'Live Google/NCES lookup was unavailable — using Arc’s local school list so you can still finish setup.'
}
