import {
  buildGoogleSchoolsRuntimeSearchUrl,
  GOOGLE_PLACES_DEMO_SOURCE_LABEL,
  GOOGLE_PLACES_SOURCE_LABEL,
  searchGoogleSchools,
} from './googleSchoolSearchProvider'
import { dedupePreferNces, searchSchoolIdentity } from './schoolIdentitySearch'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function run() {
  const runtime = buildGoogleSchoolsRuntimeSearchUrl({ schoolName: 'Oak Ridge', city: 'Orlando', state: 'FL' })
  assert(runtime.startsWith('/api/google-schools?'), 'Browser Google search must use the local proxy path.')
  assert(runtime.includes('schoolName=Oak+Ridge') || runtime.includes('schoolName=Oak%20Ridge'), 'Proxy URL must carry the school name.')

  const livePayload = {
    status: 'OK',
    results: [{
      place_id: 'ChIJdemoLiveOak',
      name: 'Oak Ridge High',
      formatted_address: '700 W Oak Ridge Rd, Orlando, FL 32809, USA',
    }],
  }
  const live = await searchGoogleSchools(
    { schoolName: 'Oak Ridge', city: 'Orlando', state: 'FL' },
    { fetchImpl: async () => new Response(JSON.stringify(livePayload), { status: 200 }) },
  )
  assert(live.status === 'candidates' && live.mode === 'live', 'Live Places payload must parse as live candidates.')
  assert(live.status === 'candidates' && live.candidates[0]?.id === 'google:ChIJdemoLiveOak', 'Live candidate ids must use google:placeId.')
  assert(live.status === 'candidates' && live.candidates[0]?.sourceLabel === GOOGLE_PLACES_SOURCE_LABEL, 'Live source label must name Google Places.')
  assert(live.status === 'candidates' && live.candidates[0]?.confidence === 'inferred', 'Google identity is inferred, not NCES-confirmed.')

  const demoPayload = {
    status: 'DEMO_FALLBACK',
    mode: 'demo',
    message: 'Google Places API key is not configured.',
    results: [{
      place_id: 'demo-oak-ridge-high',
      name: 'Oak Ridge High',
      formatted_address: 'Orlando, FL 32809, USA',
    }],
  }
  const demo = await searchGoogleSchools(
    { schoolName: 'Oak Ridge', city: 'Orlando', state: 'FL' },
    { fetchImpl: async () => new Response(JSON.stringify(demoPayload), { status: 200 }) },
  )
  assert(demo.status === 'candidates' && demo.mode === 'demo', 'Missing API key path must stay an honest demo mode.')
  assert(demo.status === 'candidates' && demo.candidates[0]?.sourceLabel === GOOGLE_PLACES_DEMO_SOURCE_LABEL, 'Demo results must be labeled as demo.')

  const missingHost = await searchGoogleSchools(
    { schoolName: 'Oak Ridge', state: 'FL' },
    { fetchImpl: async () => new Response('Not Found', { status: 404 }) },
  )
  assert(missingHost.mode === 'unavailable' && missingHost.status === 'none', 'Hosts without the Google proxy must soft-fail, not block setup.')

  const ncesPayload = {
    features: [{ attributes: {
      NCESSCH: '120144001406', LEAID: '1201440', NAME: 'Oak Ridge High', STREET: '700 W Oak Ridge Rd',
      CITY: 'Orlando', STATE: 'FL', ZIP: '32809',
    }}],
  }

  const combined = await searchSchoolIdentity(
    { schoolName: 'Oak Ridge', city: 'Orlando', state: 'FL' },
    {
      fetchImpl: async (input) => {
        const url = String(input)
        if (url.includes('google') || url.includes('maps.googleapis')) {
          return new Response(JSON.stringify(livePayload), { status: 200 })
        }
        return new Response(JSON.stringify(ncesPayload), { status: 200 })
      },
    },
  )
  assert(combined.status === 'candidates', 'Orchestrator must return candidates when Google or NCES hits.')
  assert(combined.status === 'candidates' && combined.candidates.some((row) => row.id.startsWith('nces:')), 'NCES ids must be preserved for class-times prefill.')
  assert(combined.providersUsed.includes('google') && combined.providersUsed.includes('nces'), 'Pathway must record Google + NCES.')

  const deduped = dedupePreferNces([
    {
      id: 'nces:120144001406',
      schoolName: 'Oak Ridge High',
      locality: 'Orlando, FL, 32809',
      sourceLabel: 'NCES',
      sourceLocator: 'https://nces.ed.gov/ccd/schoolsearch/school_detail.asp?ID=120144001406',
      confidence: 'confirmed',
    },
    {
      id: 'google:ChIJdemoLiveOak',
      schoolName: 'Oak Ridge High',
      locality: 'Orlando, FL 32809, USA',
      sourceLabel: GOOGLE_PLACES_SOURCE_LABEL,
      sourceLocator: 'https://www.google.com/maps/place/?q=place_id:ChIJdemoLiveOak',
      confidence: 'inferred',
    },
  ])
  assert(deduped.length === 1 && deduped[0]?.id.startsWith('nces:'), 'Duplicate Google/NCES rows must prefer the NCES identity.')

  const invalid = await searchSchoolIdentity({ schoolName: '' }, { fetchImpl: async () => new Response('{}', { status: 200 }) })
  assert(invalid.status === 'invalid', 'Blank school name must fail validation before provider calls matter.')

  console.log('Google school search + identity orchestrator contract passed')
}

void run()
