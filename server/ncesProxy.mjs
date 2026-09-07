const NCES_PUBLIC_SCHOOL_LAYER = 'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_ADMINDATA_PUBLICSCH_2425/MapServer/1'
const OUT_FIELDS = ['NCESSCH','LEAID','LEA_NAME','SCH_NAME','LSTREET1','LCITY','LSTATE','LZIP','SY_STATUS_TEXT'].join(',')

export function buildNcesTargetUrl(params) {
  const schoolName = clean(params.schoolName)
  const city = clean(params.city)
  const state = clean(params.state).toUpperCase()
  const districtName = clean(params.districtName)
  if (!schoolName) throw new Error('School name is required.')
  if (state && !/^[A-Z]{2}$/.test(state)) throw new Error('State must be a two-letter abbreviation.')

  const where = [
    `UPPER(SCH_NAME) LIKE '%${escapeSqlLike(schoolName.toUpperCase())}%'`,
    state ? `UPPER(LSTATE) = '${escapeSql(state)}'` : null,
    city ? `UPPER(LCITY) = '${escapeSql(city.toUpperCase())}'` : null,
    districtName ? `UPPER(LEA_NAME) LIKE '%${escapeSqlLike(districtName.toUpperCase())}%'` : null,
  ].filter(Boolean).join(' AND ')

  const query = new URLSearchParams({
    f: 'json',
    where,
    outFields: OUT_FIELDS,
    returnGeometry: 'false',
    orderByFields: 'SCH_NAME ASC, LEA_NAME ASC, LCITY ASC',
    resultRecordCount: String(clampLimit(params.maxCandidates)),
  })
  return `${NCES_PUBLIC_SCHOOL_LAYER}/query?${query.toString()}`
}

export async function fetchNcesProxy(params, fetchImpl = fetch) {
  const target = buildNcesTargetUrl(params)
  const response = await fetchImpl(target, { headers: { Accept: 'application/json' } })
  const text = await response.text()
  return {
    status: response.status,
    contentType: response.headers.get('content-type') || 'application/json; charset=utf-8',
    body: text,
  }
}

function clampLimit(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 25
  return Math.max(1, Math.min(50, Math.floor(parsed)))
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function escapeSql(value) {
  return value.replaceAll("'", "''")
}

function escapeSqlLike(value) {
  return escapeSql(value).replaceAll('%', '').replaceAll('_', '')
}
