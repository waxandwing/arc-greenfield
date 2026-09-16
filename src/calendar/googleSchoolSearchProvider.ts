import {
  normalizeOfficialSourceSearchResult,
  normalizeSchoolIdentityQuery,
  validateSchoolIdentityQuery,
  type OfficialSourceCandidate,
  type OfficialSourceSearchResult,
  type SchoolIdentityQuery,
} from './sourceAcquisition'

export const GOOGLE_PLACES_SOURCE_LABEL = 'Google Places (school search)'
export const GOOGLE_PLACES_DEMO_SOURCE_LABEL = 'Google Places demo (API key not configured)'

export type GoogleSchoolSearchMode = 'live' | 'demo' | 'unavailable'

export type GoogleSchoolSearchResult = OfficialSourceSearchResult & {
  mode: GoogleSchoolSearchMode
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type SearchOptions = { fetchImpl?: FetchLike; signal?: AbortSignal; maxCandidates?: number }

/**
 * Discover schools via Google Places Text Search (proxied).
 * Missing API keys return an honest demo list — setup is never blocked.
 */
export async function searchGoogleSchools(query: SchoolIdentityQuery, options: SearchOptions = {}): Promise<GoogleSchoolSearchResult> {
  const normalized = normalizeSchoolIdentityQuery(query)
  const queryErrors = validateSchoolIdentityQuery(normalized)
  if (queryErrors.length > 0) {
    return { status: 'invalid', candidates: [], message: queryErrors.join(' '), mode: 'unavailable' }
  }

  const url = options.fetchImpl
    ? buildGoogleSchoolsDirectProbeUrl(normalized)
    : buildGoogleSchoolsRuntimeSearchUrl(normalized)

  const fetchImpl = options.fetchImpl ?? fetch
  let response: Response
  try {
    response = await fetchImpl(url, { method: 'GET', headers: { Accept: 'application/json' }, signal: options.signal })
  } catch {
    return {
      status: 'invalid',
      candidates: [],
      message: 'Arc could not reach Google school search. Nothing was selected or saved.',
      mode: 'unavailable',
    }
  }

  if (response.status === 404 || response.status === 502 || response.status === 503) {
    return {
      status: 'none',
      candidates: [],
      message: 'Google school search is not available on this host. Arc will try NCES next.',
      mode: 'unavailable',
    }
  }

  if (!response.ok) {
    return {
      status: 'invalid',
      candidates: [],
      message: `Google school search returned HTTP ${response.status}. Nothing was selected or saved.`,
      mode: 'unavailable',
    }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return {
      status: 'invalid',
      candidates: [],
      message: 'Google school search returned unreadable data. Nothing was selected or saved.',
      mode: 'unavailable',
    }
  }

  return parseGoogleSchoolsPayload(payload, options.maxCandidates ?? 25)
}

export function buildGoogleSchoolsRuntimeSearchUrl(query: SchoolIdentityQuery): string {
  const normalized = normalizeSchoolIdentityQuery(query)
  const errors = validateSchoolIdentityQuery(normalized)
  if (errors.length > 0) throw new Error(errors.join(' '))
  const params = new URLSearchParams({ schoolName: normalized.schoolName })
  if (normalized.city) params.set('city', normalized.city)
  if (normalized.state) params.set('state', normalized.state)
  if (normalized.districtName) params.set('districtName', normalized.districtName)
  return `/api/google-schools?${params.toString()}`
}

/** Contract/test probe URL — not used for live browser calls. */
export function buildGoogleSchoolsDirectProbeUrl(query: SchoolIdentityQuery): string {
  const normalized = normalizeSchoolIdentityQuery(query)
  const errors = validateSchoolIdentityQuery(normalized)
  if (errors.length > 0) throw new Error(errors.join(' '))
  const params = new URLSearchParams({
    query: [normalized.schoolName, 'school', normalized.city, normalized.state].filter(Boolean).join(' '),
    type: 'school',
  })
  return `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
}

function parseGoogleSchoolsPayload(value: unknown, maxCandidates: number): GoogleSchoolSearchResult {
  if (!isRecord(value)) {
    return { status: 'invalid', candidates: [], message: 'Google school search returned an unreadable response.', mode: 'unavailable' }
  }

  if (isRecord(value.error) && typeof value.error.message === 'string') {
    return {
      status: 'invalid',
      candidates: [],
      message: `${value.error.message} Nothing was selected or saved.`,
      mode: 'unavailable',
    }
  }

  const mode: GoogleSchoolSearchMode = value.mode === 'demo' || value.status === 'DEMO_FALLBACK' ? 'demo' : 'live'
  const sourceLabel = mode === 'demo' ? GOOGLE_PLACES_DEMO_SOURCE_LABEL : GOOGLE_PLACES_SOURCE_LABEL

  if (typeof value.status === 'string' && value.status !== 'OK' && value.status !== 'ZERO_RESULTS' && value.status !== 'DEMO_FALLBACK') {
    const detail = typeof value.error_message === 'string' ? value.error_message : value.status
    return {
      status: 'invalid',
      candidates: [],
      message: `Google Places rejected the school search (${detail}). Nothing was selected or saved.`,
      mode: 'unavailable',
    }
  }

  if (!Array.isArray(value.results)) {
    return { status: 'invalid', candidates: [], message: 'Google school search did not include a result list.', mode: 'unavailable' }
  }

  const candidates: OfficialSourceCandidate[] = []
  for (const row of value.results.slice(0, clampCandidateLimit(maxCandidates))) {
    const candidate = parseGooglePlaceResult(row, sourceLabel)
    if (!candidate) {
      return { status: 'invalid', candidates: [], message: 'Google school search returned an incomplete school record.', mode }
    }
    candidates.push(candidate)
  }

  if (candidates.length === 0) {
    return {
      status: 'none',
      candidates: [],
      message: mode === 'demo'
        ? 'No demo Google school match yet. Try Oak Ridge High in Orlando, FL, or continue with NCES / manual dates.'
        : 'Google Places did not return a school match. Arc will try NCES next.',
      mode,
    }
  }

  const normalized = normalizeOfficialSourceSearchResult({ candidates })
  if (normalized.status === 'invalid') return { ...normalized, mode }
  return { ...normalized, mode }
}

function parseGooglePlaceResult(value: unknown, sourceLabel: string): OfficialSourceCandidate | null {
  if (!isRecord(value)) return null
  const placeId = requiredText(value.place_id)
  const schoolName = requiredText(value.name)
  if (!placeId || !schoolName) return null
  const locality = optionalText(value.formatted_address)
  return {
    id: `google:${placeId}`,
    schoolName,
    locality,
    sourceLabel,
    sourceLocator: `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`,
    confidence: 'inferred',
  }
}

function clampCandidateLimit(value: number): number {
  if (!Number.isFinite(value)) return 25
  return Math.max(1, Math.min(50, Math.floor(value)))
}

function requiredText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
