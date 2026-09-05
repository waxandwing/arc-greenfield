import {
  buildNcesSchoolSearchUrl,
  NCES_PUBLIC_SCHOOL_LAYER,
  searchNcesPublicSchools,
} from './ncesSchoolIdentityProvider'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function run() {
  const url = new URL(buildNcesSchoolSearchUrl({
    schoolName: "O'Brien High",
    districtName: 'Example District',
    city: 'Orlando',
    state: 'fl',
  }, 500))
  assert(url.origin + url.pathname === `${NCES_PUBLIC_SCHOOL_LAYER}/query`, 'NCES query must target only the declared public-school layer.')
  assert(url.searchParams.get('returnGeometry') === 'false', 'School identity lookup must not request unnecessary geometry.')
  assert(url.searchParams.get('resultRecordCount') === '50', 'Candidate limit must clamp to the provider-safe maximum.')
  const where = url.searchParams.get('where') ?? ''
  assert(where.includes("O''BRIEN HIGH"), 'NCES query must escape apostrophes in school names.')
  assert(where.includes("UPPER(LSTATE) = 'FL'"), 'NCES query must normalize state filtering.')
  assert(where.includes("UPPER(LCITY) = 'ORLANDO'"), 'NCES query must constrain supplied city identity.')
  assert(where.includes('EXAMPLE DISTRICT'), 'NCES query must constrain supplied district identity.')

  const fixturePayload = {
    features: [
      {
        attributes: {
          NCESSCH: '120144001406',
          LEAID: '1201440',
          LEA_NAME: 'Orange',
          SCH_NAME: 'Oak Ridge High',
          LSTREET1: '700 W Oak Ridge Rd',
          LCITY: 'Orlando',
          LSTATE: 'FL',
          LZIP: '32809',
          SY_STATUS_TEXT: 'Open',
        },
      },
    ],
  }

  const fixtureFetch = async () => new Response(JSON.stringify(fixturePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
  const found = await searchNcesPublicSchools({ schoolName: 'Oak Ridge', city: 'Orlando', state: 'FL' }, { fetchImpl: fixtureFetch })
  assert(found.status === 'candidates' && found.candidates.length === 1, 'Valid NCES response must return a candidate.')
  if (found.status === 'candidates') {
    const candidate = found.candidates[0]
    assert(candidate.id === 'nces:120144001406', 'Candidate identity must use stable NCES school ID.')
    assert(candidate.schoolName === 'Oak Ridge High', 'Candidate must retain NCES school name.')
    assert(candidate.districtName === 'Orange', 'Candidate must retain the NCES agency identity exactly as supplied.')
    assert(candidate.locality === 'Orlando, FL, 32809', 'Candidate must retain locality for teacher disambiguation.')
    assert(candidate.sourceLocator.endsWith('ID=120144001406'), 'Candidate must expose a stable official NCES detail locator.')
    assert(candidate.confidence === 'confirmed', 'NCES directory identity should be treated as confirmed identity evidence, not calendar-date evidence.')
  }

  const noneFetch = async () => new Response(JSON.stringify({ features: [] }), { status: 200 })
  const none = await searchNcesPublicSchools({ schoolName: 'Definitely Missing School', state: 'FL' }, { fetchImpl: noneFetch })
  assert(none.status === 'none', 'Zero NCES features must remain an honest no-result state.')

  const malformedFetch = async () => new Response(JSON.stringify({ features: [{ attributes: { NCESSCH: '123' } }] }), { status: 200 })
  const malformed = await searchNcesPublicSchools({ schoolName: 'Broken', state: 'FL' }, { fetchImpl: malformedFetch })
  assert(malformed.status === 'invalid', 'Incomplete NCES records must fail closed.')

  const providerErrorFetch = async () => new Response(JSON.stringify({ error: { message: 'Fixture provider error' } }), { status: 200 })
  const providerError = await searchNcesPublicSchools({ schoolName: 'Broken', state: 'FL' }, { fetchImpl: providerErrorFetch })
  assert(providerError.status === 'invalid', 'NCES ArcGIS error payload must fail closed.')

  const networkError = await searchNcesPublicSchools(
    { schoolName: 'Broken', state: 'FL' },
    { fetchImpl: async () => { throw new Error('offline') } },
  )
  assert(networkError.status === 'invalid' && networkError.message.includes('Nothing was selected or saved'), 'Network failure must be explicit and non-mutating.')

  const invalidQuery = await searchNcesPublicSchools({ schoolName: '' }, { fetchImpl: fixtureFetch })
  assert(invalidQuery.status === 'invalid', 'Invalid identity query must fail before provider lookup.')

  console.log('NCES school identity provider contract passed')
}

void run()
