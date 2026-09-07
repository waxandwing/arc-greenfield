const layer = 'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_GEOCODE_PUBLICSCH_2425/MapServer/0'
const params = new URLSearchParams({
  f: 'json',
  where: "NAME LIKE '%Oak Ridge%' AND CITY LIKE 'Orlando' AND STATE = 'FL'",
  outFields: 'NCESSCH,LEAID,NAME,CITY,STATE,ZIP',
  returnGeometry: 'false',
  resultRecordCount: '10',
})

let response
try {
  response = await fetch(`${layer}/query?${params}`)
} catch (error) {
  console.log(`NCES live availability sentinel: provider unreachable from this runner (${error instanceof Error ? error.message : String(error)}). Deterministic Arc integration gates remain authoritative.`)
  process.exit(0)
}

if (response.status >= 500) {
  console.log(`NCES live availability sentinel: provider returned HTTP ${response.status} to this runner. This is recorded as external-provider unavailability; deterministic Arc integration gates remain authoritative.`)
  process.exit(0)
}
if (!response.ok) throw new Error(`NCES live smoke HTTP ${response.status}`)

const payload = await response.json()
if (payload?.error) throw new Error(`NCES live smoke provider error: ${payload.error.message ?? 'unknown error'}`)
if (!Array.isArray(payload?.features)) throw new Error('NCES live smoke response omitted features')

const candidates = payload.features.map((feature) => feature?.attributes)
const match = candidates.find((attributes) => {
  const school = String(attributes?.NAME ?? '').trim().toUpperCase()
  const city = String(attributes?.CITY ?? '').trim().toUpperCase()
  const state = String(attributes?.STATE ?? '').trim().toUpperCase()
  return school === 'OAK RIDGE HIGH' && city === 'ORLANDO' && state === 'FL'
})

if (!match) {
  console.error('NCES live smoke candidates:', JSON.stringify(candidates, null, 2))
  throw new Error('NCES live smoke did not return the expected Orlando Oak Ridge public-school identity')
}
if (String(match.NCESSCH ?? '').trim() !== '120144001406') throw new Error(`NCES live smoke returned unexpected Oak Ridge school ID: ${match.NCESSCH ?? 'missing'}`)
if (String(match.LEAID ?? '').trim() !== '1201440') throw new Error(`NCES live smoke returned unexpected Orange agency ID: ${match.LEAID ?? 'missing'}`)

console.log(`NCES live availability sentinel passed: ${match.NAME} · ${match.NCESSCH}`)
