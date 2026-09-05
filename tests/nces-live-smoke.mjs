const layer = 'https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_ADMINDATA_PUBLICSCH_2425/MapServer/1'
const params = new URLSearchParams({
  f: 'json',
  where: "UPPER(SCH_NAME) LIKE '%OAK RIDGE%' AND UPPER(LCITY) = 'ORLANDO' AND UPPER(LSTATE) = 'FL'",
  outFields: 'NCESSCH,LEAID,LEA_NAME,SCH_NAME,LCITY,LSTATE,SY_STATUS_TEXT',
  returnGeometry: 'false',
  orderByFields: 'SCH_NAME ASC',
  resultRecordCount: '10',
})

const response = await fetch(`${layer}/query?${params}`)
if (!response.ok) throw new Error(`NCES live smoke HTTP ${response.status}`)
const payload = await response.json()
if (payload?.error) throw new Error(`NCES live smoke provider error: ${payload.error.message ?? 'unknown error'}`)
if (!Array.isArray(payload?.features)) throw new Error('NCES live smoke response omitted features')

const candidates = payload.features.map((feature) => feature?.attributes)
const match = candidates.find((attributes) => {
  const school = String(attributes?.SCH_NAME ?? '').trim().toUpperCase()
  const city = String(attributes?.LCITY ?? '').trim().toUpperCase()
  const state = String(attributes?.LSTATE ?? '').trim().toUpperCase()
  const district = String(attributes?.LEA_NAME ?? '').trim().toUpperCase()
  return school === 'OAK RIDGE HIGH'
    && city === 'ORLANDO'
    && state === 'FL'
    && district === 'ORANGE'
})

if (!match) {
  console.error('NCES live smoke candidates:', JSON.stringify(candidates, null, 2))
  throw new Error('NCES live smoke did not return the expected Orlando Oak Ridge public-school identity')
}
if (String(match.NCESSCH ?? '').trim() !== '120144001406') throw new Error(`NCES live smoke returned unexpected Oak Ridge school ID: ${match.NCESSCH ?? 'missing'}`)
if (String(match.LEAID ?? '').trim() !== '1201440') throw new Error(`NCES live smoke returned unexpected Orange agency ID: ${match.LEAID ?? 'missing'}`)

console.log(`NCES live smoke passed: ${match.SCH_NAME} · ${match.LEA_NAME} · ${match.NCESSCH}`)
