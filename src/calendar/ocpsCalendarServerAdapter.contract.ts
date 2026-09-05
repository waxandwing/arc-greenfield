import { createOcpsCalendarServerExtractionAdapter } from './ocpsCalendarServerAdapter'
import { OCPS_2026_27_CALENDAR_LOCATOR } from './ocpsCalendarTextParser'
import type { OfficialCalendarSourceCandidate } from './sourceAcquisition'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const source: OfficialCalendarSourceCandidate = {
  id: 'official-calendar-source:ocps-2026-27',
  schoolCandidateId: 'nces:120144001406',
  label: 'OCPS 2026–27 School Calendar',
  locator: OCPS_2026_27_CALENDAR_LOCATOR,
  publisher: 'Orange County Public Schools',
  kind: 'district-calendar-document',
  confidence: 'confirmed',
}

const extractedText = `Orange County Public Schools
2026-2027 School Calendar
Tuesday August 11 First Day of School
Monday September 7 Labor Day Holiday
Friday October 9 End of First Marking Period
Monday October 12 Teacher Workday/Student Holiday
Tuesday October 13 Begin Second Marking Period
Monday-Friday November 23-27 Thanksgiving Break
Friday December 18 End of Second Marking Period
Monday-Friday
Two Weeks December 21-January 1 Winter Break
Monday January 4 Teacher Workday/Student Holiday
Tuesday January 5 Begin Third Marking Period
Begin Second Semester
Monday January 18 Martin Luther King, Jr. Holiday
Schools and District Offices Closed
Monday February 15 Presidents’ Day/Teacher Non-Work Day
Schools Closed/District Offices Open
Thursday March 11 End of Third Marking Period
Friday March 12 Teacher Workday/Student Holiday
Monday-Friday March 15-19 Spring Break
Schools Closed/District Offices Open
Monday March 22 Begin Fourth Marking Period
Friday April 23 Teacher Professional Day
Student Holiday/Teacher Non-Workday
Wednesday May 26 End of Fourth Marking Period
Last Day of School
2026-2027 Severe Weather Make-Up Days`

async function main() {
  let fetchCalls = 0
  const adapter = createOcpsCalendarServerExtractionAdapter({
    endpoint: 'https://example.supabase.co/functions/v1/official-calendar-source-text',
    authorizationToken: 'public-client-jwt',
    apiKey: 'public-client-jwt',
    fetchImpl: async (input, init) => {
      fetchCalls += 1
      assert(String(input).includes('official-calendar-source-text'), 'Adapter must call only the configured extraction endpoint.')
      assert(init?.method === 'POST', 'Adapter must use POST.')
      const headers = new Headers(init?.headers)
      assert(headers.get('Authorization') === 'Bearer public-client-jwt', 'Adapter must send bearer authorization.')
      assert(headers.get('apikey') === 'public-client-jwt', 'Adapter must send configured public API key.')
      assert(init?.body === JSON.stringify({ sourceLocator: source.locator }), 'Adapter must send only the confirmed source locator.')
      return new Response(JSON.stringify({
        sourceLocator: source.locator,
        sourceLabel: source.label,
        publisher: source.publisher,
        capturedAt: '2026-09-05T23:20:00Z',
        byteLength: 90944,
        totalPages: 2,
        text: extractedText,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },
  })

  assert(adapter.supports(source), 'Adapter must support the confirmed OCPS district calendar document.')
  const extraction = await adapter.extract(source)
  assert(fetchCalls === 1, 'Successful extraction must perform exactly one server request.')
  assert(extraction.rows.length === 18, 'Server text must pass through the canonical OCPS parser.')
  assert(extraction.rows[0]?.startDate === '2026-08-11', 'Canonical parser must preserve the explicit first day.')

  const unsupported: OfficialCalendarSourceCandidate = {
    ...source,
    id: 'official-calendar-source:other',
    locator: 'https://example.com/calendar.pdf',
  }
  assert(!adapter.supports(unsupported), 'Adapter must reject arbitrary external calendar sources.')
  let unsupportedFailed = false
  try { await adapter.extract(unsupported) } catch { unsupportedFailed = true }
  assert(unsupportedFailed, 'Direct extraction of an unsupported source must fail closed.')
  assert(fetchCalls === 1, 'Unsupported source must be rejected before any network call.')

  const errorAdapter = createOcpsCalendarServerExtractionAdapter({
    endpoint: 'https://example.supabase.co/functions/v1/official-calendar-source-text',
    authorizationToken: 'public-client-jwt',
    fetchImpl: async () => new Response(JSON.stringify({ error: 'Official calendar source returned HTTP 502.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    }),
  })
  let serviceErrorFailed = false
  try { await errorAdapter.extract(source) } catch (error) {
    serviceErrorFailed = error instanceof Error && error.message.includes('Official calendar source returned HTTP 502.')
  }
  assert(serviceErrorFailed, 'Server extraction error must be surfaced without manufacturing dates.')

  const malformedAdapter = createOcpsCalendarServerExtractionAdapter({
    endpoint: 'https://example.supabase.co/functions/v1/official-calendar-source-text',
    authorizationToken: 'public-client-jwt',
    fetchImpl: async () => new Response('not json', { status: 200 }),
  })
  let malformedFailed = false
  try { await malformedAdapter.extract(source) } catch (error) {
    malformedFailed = error instanceof Error && error.message.includes('malformed JSON')
  }
  assert(malformedFailed, 'Malformed server response must fail closed.')

  let insecureEndpointFailed = false
  try {
    createOcpsCalendarServerExtractionAdapter({ endpoint: 'http://example.com/function', authorizationToken: 'x' })
  } catch { insecureEndpointFailed = true }
  assert(insecureEndpointFailed, 'Non-local extraction endpoint must require HTTPS.')

  console.log('OCPS server extraction adapter contract passed')
}

void main()
