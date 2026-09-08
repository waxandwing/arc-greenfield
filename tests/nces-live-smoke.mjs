import { buildNcesFallbackTargetUrl, buildNcesTargetUrl } from '../server/ncesProxy.mjs'

const query = { schoolName: 'Oak Ridge', city: 'Orlando', state: 'FL', maxCandidates: 10 }

let payload
let source = 'geocode'
try {
  payload = await fetchPayload(buildNcesTargetUrl(query))
  if (!hasExpectedCandidate(payload, 'NAME', 'CITY', 'STATE')) {
    source = 'admin'
    payload = await fetchPayload(buildNcesFallbackTargetUrl(query))
  }
} catch (error) {
  console.log(`NCES live availability sentinel: provider unreachable from this runner (${error instanceof Error ? error.message : String(error)}). Deterministic Arc integration gates remain authoritative.`)
  process.exit(0)
}

if (payload?.error) throw new Error(`NCES live smoke provider error: ${payload.error.message ?? 'unknown error'}`)
if (!Array.isArray(payload?.features)) throw new Error('NCES live smoke response omitted features')

const candidates = payload.features.map((feature) => feature?.attributes)
const match = candidates.find((attributes) => {
  const school = String(source === 'admin' ? attributes?.SCH_NAME : attributes?.NAME ?? '').trim().toUpperCase()
  const city = String(source === 'admin' ? attributes?.LCITY : attributes?.CITY ?? '').trim().toUpperCase()
  const state = String(source === 'admin' ? attributes?.LSTATE : attributes?.STATE ?? '').trim().toUpperCase()
  return school === 'OAK RIDGE HIGH' && city === 'ORLANDO' && state === 'FL'
})

if (!match) {
  console.error(`NCES live smoke ${source} candidates:`, JSON.stringify(candidates, null, 2))
  throw new Error('NCES live smoke did not return the expected Orlando Oak Ridge public-school identity from either official 2024-25 layer')
}
if (String(match.NCESSCH ?? '').trim() !== '120144001406') throw new Error(`NCES live smoke returned unexpected Oak Ridge school ID: ${match.NCESSCH ?? 'missing'}`)
if (String(match.LEAID ?? '').trim() !== '1201440') throw new Error(`NCES live smoke returned unexpected Orange agency ID: ${match.LEAID ?? 'missing'}`)

const name = source === 'admin' ? match.SCH_NAME : match.NAME
console.log(`NCES live availability sentinel passed via ${source}: ${name} · ${match.NCESSCH}`)

async function fetchPayload(url) {
  const response = await fetch(url)
  if (response.status >= 500) throw new Error(`provider returned HTTP ${response.status}`)
  if (!response.ok) throw new Error(`NCES live smoke HTTP ${response.status}`)
  return response.json()
}

function hasExpectedCandidate(value, nameField, cityField, stateField) {
  if (!Array.isArray(value?.features)) return false
  return value.features.some((feature) => {
    const attributes = feature?.attributes
    return String(attributes?.[nameField] ?? '').trim().toUpperCase() === 'OAK RIDGE HIGH'
      && String(attributes?.[cityField] ?? '').trim().toUpperCase() === 'ORLANDO'
      && String(attributes?.[stateField] ?? '').trim().toUpperCase() === 'FL'
  })
}
