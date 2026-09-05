import {
  normalizeOfficialSourceSearchResult,
  normalizeSchoolIdentityQuery,
  validateSchoolIdentityQuery,
  type OfficialSourceCandidate,
  type OfficialSourceSearchResult,
  type SchoolIdentityQuery,
} from './sourceAcquisition'

export const NCES_PUBLIC_SCHOOL_LAYER = 'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_ADMINDATA_PUBLICSCH_2425/MapServer/1'
export const NCES_SOURCE_LABEL = 'NCES Common Core of Data — Public School Administrative Data 2024–25'

const OUT_FIELDS = [
  'NCESSCH',
  'LEAID',
  'LEA_NAME',
  'SCH_NAME',
  'LSTREET1',
  'LCITY',
  'LSTATE',
  'LZIP',
  'SY_STATUS_TEXT',
].join(',')

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

type SearchOptions = {
  fetchImpl?: FetchLike
  signal?: AbortSignal
  maxCandidates?: number
}

export async function searchNcesPublicSchools(
  query: SchoolIdentityQuery,
  options: SearchOptions = {},
): Promise<OfficialSourceSearchResult> {
  const normalized = normalizeSchoolIdentityQuery(query)
  const queryErrors = validateSchoolIdentityQuery(normalized)
  if (queryErrors.length > 0) {
    return { status: 'invalid', candidates: [], message: queryErrors.join(' ') }
  }

  const url = buildNcesSchoolSearchUrl(normalized, options.maxCandidates ?? 25)
  const fetchImpl = options.fetchImpl ?? fetch

  let response: Response
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: options.signal,
    })
  } catch {
    return {
      status: 'invalid',
      candidates: [],
      message: 'Arc could not reach the NCES public-school directory. Nothing was selected or saved.',
    }
  }

  if (!response.ok) {
    return {
      status: 'invalid',
      candidates: [],
      message: `NCES public-school directory returned HTTP ${response.status}. Nothing was selected or saved.`,
    }
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return {
      status: 'invalid',
      candidates: [],
      message: 'NCES public-school directory returned unreadable data. Nothing was selected or saved.',
    }
  }

  const parsed = parseNcesFeatureResponse(payload)
  if (parsed.status === 'invalid') return parsed
  if (parsed.candidates.length === 0) {
    return {
      status: 'none',
      candidates: [],
      message: 'NCES did not return a public-school match for that identity. Arc did not guess or create school data.',
    }
  }

  return normalizeOfficialSourceSearchResult({ candidates: parsed.candidates })
}

export function buildNcesSchoolSearchUrl(query: SchoolIdentityQuery, maxCandidates = 25): string {
  const normalized = normalizeSchoolIdentityQuery(query)
  const errors = validateSchoolIdentityQuery(normalized)
  if (errors.length > 0) throw new Error(errors.join(' '))

  const where = [
    `UPPER(SCH_NAME) LIKE '%${escapeSqlLike(normalized.schoolName.toUpperCase())}%'`,
    normalized.state ? `UPPER(LSTATE) = '${escapeSql(normalized.state)}'` : null,
    normalized.city ? `UPPER(LCITY) = '${escapeSql(normalized.city.toUpperCase())}'` : null,
    normalized.districtName ? `UPPER(LEA_NAME) LIKE '%${escapeSqlLike(normalized.districtName.toUpperCase())}%'` : null,
  ].filter((part): part is string => Boolean(part)).join(' AND ')

  const params = new URLSearchParams({
    f: 'json',
    where,
    outFields: OUT_FIELDS,
    returnGeometry: 'false',
    orderByFields: 'SCH_NAME ASC, LEA_NAME ASC, LCITY ASC',
    resultRecordCount: String(clampCandidateLimit(maxCandidates)),
  })

  return `${NCES_PUBLIC_SCHOOL_LAYER}/query?${params.toString()}`
}

function parseNcesFeatureResponse(value: unknown): OfficialSourceSearchResult {
  if (!isRecord(value)) {
    return { status: 'invalid', candidates: [], message: 'NCES returned an unreadable school-directory response.' }
  }
  if (isRecord(value.error)) {
    const message = typeof value.error.message === 'string' ? value.error.message : 'NCES rejected the school-directory query.'
    return { status: 'invalid', candidates: [], message: `${message} Nothing was selected or saved.` }
  }
  if (!Array.isArray(value.features)) {
    return { status: 'invalid', candidates: [], message: 'NCES response did not include a school candidate list.' }
  }

  const candidates: OfficialSourceCandidate[] = []
  for (const feature of value.features) {
    const candidate = parseNcesFeature(feature)
    if (!candidate) {
      return { status: 'invalid', candidates: [], message: 'NCES returned an incomplete school identity record.' }
    }
    candidates.push(candidate)
  }

  return candidates.length > 0
    ? { status: 'candidates', candidates }
    : { status: 'none', candidates: [] }
}

function parseNcesFeature(value: unknown): OfficialSourceCandidate | null {
  if (!isRecord(value) || !isRecord(value.attributes)) return null
  const attributes = value.attributes
  const schoolId = requiredText(attributes.NCESSCH)
  const schoolName = requiredText(attributes.SCH_NAME)
  const districtName = optionalText(attributes.LEA_NAME)
  const city = optionalText(attributes.LCITY)
  const state = optionalText(attributes.LSTATE)
  const zip = optionalText(attributes.LZIP)
  if (!schoolId || !schoolName) return null

  return {
    id: `nces:${schoolId}`,
    schoolName,
    districtName,
    locality: [city, state, zip].filter(Boolean).join(', '),
    sourceLabel: NCES_SOURCE_LABEL,
    sourceLocator: `https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=${encodeURIComponent(schoolId)}`,
    confidence: 'confirmed',
  }
}

function clampCandidateLimit(value: number): number {
  if (!Number.isFinite(value)) return 25
  return Math.max(1, Math.min(50, Math.floor(value)))
}

function escapeSql(value: string): string {
  return value.replaceAll("'", "''")
}

function escapeSqlLike(value: string): string {
  return escapeSql(value).replaceAll('%', '').replaceAll('_', '')
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
