const NCES_PUBLIC_SCHOOL_LAYER = 'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PUBLICSCH_2425/MapServer/0'
const NCES_PUBLIC_SCHOOL_ADMIN_LAYER = 'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_ADMINDATA_PUBLICSCH_2425/MapServer/1'
const OUT_FIELDS = ['NCESSCH','LEAID','NAME','STREET','CITY','STATE','ZIP'].join(',')
const ADMIN_OUT_FIELDS = ['NCESSCH','LEAID','SCH_NAME','LSTREET1','LCITY','LSTATE','LZIP'].join(',')

export function buildNcesTargetUrl(params) {
  const schoolName = clean(params.schoolName)
  const city = clean(params.city)
  const state = clean(params.state).toUpperCase()
  if (!schoolName) throw new Error('School name is required.')
  if (state && !/^[A-Z]{2}$/.test(state)) throw new Error('State must be a two-letter abbreviation.')
  const where = [
    `NAME LIKE '%${escapeSqlLike(schoolName)}%'`,
    state ? `STATE = '${escapeSql(state)}'` : null,
    city ? `CITY LIKE '${escapeSqlLike(city)}'` : null,
  ].filter(Boolean).join(' AND ')
  const query = new URLSearchParams({ f: 'json', where, outFields: OUT_FIELDS, returnGeometry: 'false', resultRecordCount: String(clampLimit(params.maxCandidates)) })
  return `${NCES_PUBLIC_SCHOOL_LAYER}/query?${query.toString()}`
}

export function buildNcesFallbackTargetUrl(params) {
  const schoolName = clean(params.schoolName)
  const state = clean(params.state).toUpperCase()
  if (!schoolName) throw new Error('School name is required.')
  if (state && !/^[A-Z]{2}$/.test(state)) throw new Error('State must be a two-letter abbreviation.')
  const where = `UPPER(SCH_NAME) LIKE '%${escapeSqlLike(schoolName.toUpperCase())}%'`
  const query = new URLSearchParams({ f: 'json', where, outFields: ADMIN_OUT_FIELDS, returnGeometry: 'false', resultRecordCount: String(clampLimit(params.maxCandidates)) })
  return `${NCES_PUBLIC_SCHOOL_ADMIN_LAYER}/query?${query.toString()}`
}

export async function fetchNcesProxy(params, fetchImpl = fetch) {
  const primary = await fetchText(fetchImpl, buildNcesTargetUrl(params))
  if (primary.response.ok && hasCandidates(primary.text)) {
    return asProxyResult(primary.response, primary.text)
  }

  const fallback = await fetchText(fetchImpl, buildNcesFallbackTargetUrl(params))
  if (fallback.response.ok) {
    const normalized = normalizeAdminPayload(fallback.text, params)
    if (normalized) return asProxyResult(fallback.response, normalized)
  }

  return asProxyResult(primary.response, primary.text)
}

async function fetchText(fetchImpl, target) {
  const response = await fetchImpl(target, { headers: { Accept: 'application/json' } })
  return { response, text: await response.text() }
}

function asProxyResult(response, body) {
  return { status: response.status, contentType: response.headers.get('content-type') || 'application/json; charset=utf-8', body }
}

function hasCandidates(text) {
  try {
    const payload = JSON.parse(text)
    return Array.isArray(payload?.features) && payload.features.length > 0
  } catch {
    return false
  }
}

function normalizeAdminPayload(text, params) {
  try {
    const payload = JSON.parse(text)
    if (payload?.error || !Array.isArray(payload?.features)) return null
    const wantedCity = clean(params.city).toUpperCase()
    const wantedState = clean(params.state).toUpperCase()
    const features = payload.features
      .map((feature) => ({
        ...feature,
        attributes: {
          NCESSCH: feature?.attributes?.NCESSCH,
          LEAID: feature?.attributes?.LEAID,
          NAME: feature?.attributes?.SCH_NAME,
          STREET: feature?.attributes?.LSTREET1,
          CITY: feature?.attributes?.LCITY,
          STATE: feature?.attributes?.LSTATE,
          ZIP: feature?.attributes?.LZIP,
        },
      }))
      .filter((feature) => {
        const city = clean(feature?.attributes?.CITY).toUpperCase()
        const state = clean(feature?.attributes?.STATE).toUpperCase()
        return (!wantedCity || city === wantedCity) && (!wantedState || state === wantedState)
      })
    return JSON.stringify({ ...payload, features })
  } catch {
    return null
  }
}

function clampLimit(value) { const parsed = Number(value); if (!Number.isFinite(parsed)) return 25; return Math.max(1, Math.min(50, Math.floor(parsed))) }
function clean(value) { return typeof value === 'string' ? value.trim() : '' }
function escapeSql(value) { return value.replaceAll("'", "''") }
function escapeSqlLike(value) { return escapeSql(value).replaceAll('%', '').replaceAll('_', '') }
