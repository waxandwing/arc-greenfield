import type { OfficialSourceCandidate, OfficialSourceSearchResult, SchoolIdentityQuery } from './sourceAcquisition'
import { normalizeSchoolIdentityQuery, validateSchoolIdentityQuery } from './sourceAcquisition'

/** Honest label when live NCES proxy is unavailable (e.g. GitHub Pages static host). */
export const LOCAL_SCHOOL_DIRECTORY_SOURCE_LABEL = 'Arc local school directory (offline fallback)'

/**
 * Curated public-school identities for demo / offline / Pages fallback.
 * Includes Oak Ridge High so bell-schedule lookup and Phase 3 fixtures stay aligned.
 */
export const LOCAL_SCHOOL_DIRECTORY: OfficialSourceCandidate[] = [
  {
    id: 'nces:120144001406',
    schoolName: 'Oak Ridge High',
    districtName: 'Orange County Public Schools',
    locality: 'Orlando, FL, 32809',
    sourceLabel: LOCAL_SCHOOL_DIRECTORY_SOURCE_LABEL,
    sourceLocator: 'https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=120144001406',
    confidence: 'confirmed',
  },
  {
    id: 'nces:120144001234',
    schoolName: 'Colonial High',
    districtName: 'Orange County Public Schools',
    locality: 'Orlando, FL, 32807',
    sourceLabel: LOCAL_SCHOOL_DIRECTORY_SOURCE_LABEL,
    sourceLocator: 'https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=120144001234',
    confidence: 'confirmed',
  },
  {
    id: 'nces:120150003045',
    schoolName: 'Winter Park High',
    districtName: 'Orange County Public Schools',
    locality: 'Winter Park, FL, 32789',
    sourceLabel: LOCAL_SCHOOL_DIRECTORY_SOURCE_LABEL,
    sourceLocator: 'https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=120150003045',
    confidence: 'confirmed',
  },
  {
    id: 'nces:062271003406',
    schoolName: 'Berkeley High',
    districtName: 'Berkeley Unified',
    locality: 'Berkeley, CA, 94704',
    sourceLabel: LOCAL_SCHOOL_DIRECTORY_SOURCE_LABEL,
    sourceLocator: 'https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=062271003406',
    confidence: 'confirmed',
  },
]

export function findLocalSchoolById(id: string | null | undefined): OfficialSourceCandidate | null {
  if (!id?.trim()) return null
  return LOCAL_SCHOOL_DIRECTORY.find((school) => school.id === id.trim()) ?? null
}

/** Filter the local directory the same way a teacher would search NCES. */
export function searchLocalSchoolDirectory(query: SchoolIdentityQuery): OfficialSourceSearchResult {
  const normalized = normalizeSchoolIdentityQuery(query)
  const errors = validateSchoolIdentityQuery(normalized)
  if (errors.length > 0) return { status: 'invalid', candidates: [], message: errors.join(' ') }

  const nameNeedle = normalized.schoolName.toLowerCase()
  const cityNeedle = normalized.city?.toLowerCase()
  const stateNeedle = normalized.state?.toUpperCase()
  const districtNeedle = normalized.districtName?.toLowerCase()

  const candidates = LOCAL_SCHOOL_DIRECTORY.filter((school) => {
    if (!school.schoolName.toLowerCase().includes(nameNeedle)) return false
    if (cityNeedle && !(school.locality ?? '').toLowerCase().includes(cityNeedle)) return false
    if (stateNeedle) {
      const locality = school.locality ?? ''
      const stateMatch = locality.toUpperCase().includes(`, ${stateNeedle}`) || locality.toUpperCase().endsWith(` ${stateNeedle}`)
      if (!stateMatch) return false
    }
    if (districtNeedle && !(school.districtName ?? '').toLowerCase().includes(districtNeedle)) return false
    return true
  })

  if (candidates.length === 0) {
    return {
      status: 'none',
      candidates: [],
      message: 'No match in Arc’s local school directory. Try Oak Ridge High in Orlando, FL, or enter dates manually below.',
    }
  }

  return { status: 'candidates', candidates }
}

export function isNcesReachabilityFailure(result: OfficialSourceSearchResult): boolean {
  if (result.status !== 'invalid') return false
  const message = result.message.toLowerCase()
  return (
    message.includes('could not reach')
    || message.includes('http 404')
    || message.includes('http 502')
    || message.includes('http 503')
    || message.includes('unreadable data')
  )
}
