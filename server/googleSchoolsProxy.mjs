/**
 * Server-side Google Places Text Search proxy for school identity discovery.
 * When GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) is missing, returns an
 * honest demo payload so setup never blocks.
 */

const PLACES_TEXT_SEARCH = 'https://maps.googleapis.com/maps/api/place/textsearch/json'

/** Curated demo rows when the Places API key is not configured. */
export const GOOGLE_SCHOOL_DEMO_RESULTS = [
  {
    place_id: 'demo-oak-ridge-high',
    name: 'Oak Ridge High',
    formatted_address: '700 W Oak Ridge Rd, Orlando, FL 32809, USA',
    types: ['school', 'point_of_interest', 'establishment'],
  },
  {
    place_id: 'demo-colonial-high',
    name: 'Colonial High',
    formatted_address: 'Orlando, FL 32807, USA',
    types: ['school', 'point_of_interest', 'establishment'],
  },
  {
    place_id: 'demo-winter-park-high',
    name: 'Winter Park High',
    formatted_address: 'Winter Park, FL 32789, USA',
    types: ['school', 'point_of_interest', 'establishment'],
  },
  {
    place_id: 'demo-berkeley-high',
    name: 'Berkeley High',
    formatted_address: 'Berkeley, CA 94704, USA',
    types: ['school', 'point_of_interest', 'establishment'],
  },
]

export function resolveGooglePlacesApiKey(env = process.env) {
  const key = clean(env.GOOGLE_PLACES_API_KEY) || clean(env.GOOGLE_MAPS_API_KEY)
  return key || null
}

export function buildGooglePlacesTextSearchUrl(params, apiKey) {
  const schoolName = clean(params.schoolName)
  if (!schoolName) throw new Error('School name is required.')
  const city = clean(params.city)
  const state = clean(params.state).toUpperCase()
  if (state && !/^[A-Z]{2}$/.test(state)) throw new Error('State must be a two-letter abbreviation.')

  const queryParts = [schoolName, 'school', city, state].filter(Boolean)
  const query = new URLSearchParams({
    query: queryParts.join(' '),
    type: 'school',
    key: apiKey,
  })
  return `${PLACES_TEXT_SEARCH}?${query.toString()}`
}

export function filterDemoGoogleSchools(params) {
  const schoolName = clean(params.schoolName).toLowerCase()
  const city = clean(params.city).toLowerCase()
  const state = clean(params.state).toUpperCase()
  if (!schoolName) throw new Error('School name is required.')

  return GOOGLE_SCHOOL_DEMO_RESULTS.filter((row) => {
    if (!row.name.toLowerCase().includes(schoolName)) return false
    const address = row.formatted_address.toLowerCase()
    if (city && !address.includes(city)) return false
    if (state) {
      const stateNeedle = `, ${state.toLowerCase()}`
      if (!address.includes(stateNeedle) && !address.includes(` ${state.toLowerCase()} `)) return false
    }
    return true
  })
}

export async function fetchGoogleSchoolsProxy(params, fetchImpl = fetch, env = process.env) {
  const schoolName = clean(params.schoolName)
  if (!schoolName) throw new Error('School name is required.')

  const apiKey = resolveGooglePlacesApiKey(env)
  if (!apiKey) {
    const results = filterDemoGoogleSchools(params)
    return {
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        status: 'DEMO_FALLBACK',
        mode: 'demo',
        message: 'Google Places API key is not configured. Arc is using a demo school list so you can still finish setup.',
        results,
      }),
    }
  }

  const target = buildGooglePlacesTextSearchUrl(params, apiKey)
  const response = await fetchImpl(target, { headers: { Accept: 'application/json' } })
  const text = await response.text()
  return {
    status: response.status,
    contentType: response.headers.get('content-type') || 'application/json; charset=utf-8',
    body: text,
  }
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}
