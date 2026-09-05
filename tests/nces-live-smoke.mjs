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

const match = payload.features
  .map((feature) => feature?.attributes)
  .find((attributes) => {
    const school = String(attributes?.SCH_NAME ?? '').toUpperCase()
    const city = String(attributes?.LCITY ?? '').toUpperCase()
    const state = String(attributes?.LSTATE ?? '').toUpperCase()
    const district = String(attributes?.LEA_NAME ?? '').toUpperCase()
    return school.includes('OAK RIDGE')
      && city === 'ORLANDO'
      && state === 'FL'
      && district.includes('ORANGE COUNTY')
  })

if (!match) throw new Error('NCES live smoke did not return the expected Orlando Oak Ridge public-school identity')
if (!String(match.NCESSCH ?? '').trim()) throw new Error('NCES live smoke match omitted stable NCESSCH identity')
if (!String(match.LEAID ?? '').trim()) throw new Error('NCES live smoke match omitted stable LEAID identity')

console.log(`NCES live smoke passed: ${match.SCH_NAME} · ${match.LEA_NAME} · ${match.NCESSCH}`)
