import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function trackRuntimeErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

const schoolPayload = {
  features: [{
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
  }],
}

const extractedText = `Orange County Public Schools
2026-2027 School Calendar
Day(s) of Week Date(s) Event
Monday-Monday August 3-10 Pre-Planning
August 5-Professional Development Day
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
Thursday-Friday May 27-28 Post Planning
Monday May 31 Memorial Day Holiday
Schools and District Offices Closed
Orange County Public Schools
2026-2027 Severe Weather Make-Up Days
In the event of severe weather closure(s), the Superintendent may waive a portion of the make-
up days and/or utilize other alternatives, such as extended Wednesdays or extending the school
year, to ensure that the district meets the state’s required hours of instruction for the school year.
After exhausting these alternatives, the district will utilize the prioritized make-up days listed
below.
Priority Date Current Use
1 February 15, 2027 Presidents’ Day
2 April 23, 2027 Professional Day/Student Holiday
3 November 23, 2026 Monday of Thanksgiving
4 November 24, 2026 Tuesday of Thanksgiving`

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 1100 } })
const page = await context.newPage()
const runtimeErrors = trackRuntimeErrors(page)
let ncesRequests = 0
let extractorRequests = 0
let extractorPreflights = 0
let extractorRouteError = ''

await page.route((url) => url.hostname === 'nces.ed.gov' && url.pathname.endsWith('/MapServer/1/query'), async (route) => {
  ncesRequests += 1
  await route.fulfill({
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(schoolPayload),
  })
})

await page.route((url) => url.hostname === 'calendar-text.example.invalid', async (route) => {
  const request = route.request()
  if (request.method() === 'OPTIONS') {
    extractorPreflights += 1
    await route.fulfill({
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
      },
    })
    return
  }

  extractorRequests += 1
  try {
    const headers = request.headers()
    assert(request.method() === 'POST', `Unexpected extraction method: ${request.method()}`)
    assert(request.url() === 'https://calendar-text.example.invalid/functions/v1/official-calendar-source-text', `Unexpected extraction endpoint: ${request.url()}`)
    assert(headers.authorization === 'Bearer test-public-client-jwt', 'Read dates did not send configured bearer authorization.')
    assert(headers.apikey === 'test-public-client-jwt', 'Read dates did not send configured public API key.')
    assert(request.postData() === JSON.stringify({ sourceLocator: 'https://www.ocps.net/110680_3' }), `Read dates sent unexpected request body: ${request.postData()}`)
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        sourceLocator: 'https://www.ocps.net/110680_3',
        sourceLabel: 'OCPS 2026–27 School Calendar',
        publisher: 'Orange County Public Schools',
        capturedAt: '2026-09-05T23:20:00Z',
        totalPages: 2,
        text: extractedText,
      }),
    })
  } catch (error) {
    extractorRouteError = error instanceof Error ? error.message : String(error)
    await route.abort('failed')
  }
})

await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.getByLabel('School name').fill('Oak Ridge')
await page.getByLabel('City').fill('Orlando')
await page.getByLabel('State').fill('FL')
await page.getByRole('button', { name: 'Find my school' }).click()
await page.getByText('One official record found.').waitFor({ state: 'visible' })
assert(ncesRequests === 1, `School identity lookup used ${ncesRequests} NCES requests, expected 1.`)
await page.getByRole('button', { name: 'This is my school' }).click()

await page.getByLabel('Published by', { exact: true }).fill('Orange County Public Schools')
await page.getByLabel('Source label', { exact: true }).fill('OCPS 2026–27 School Calendar')
await page.locator('#official-calendar-source-kind').selectOption('district-calendar-document')
await page.getByLabel('I confirm this link is published by the selected school or its district.', { exact: true }).check()

await page.getByLabel('Official calendar link', { exact: true }).fill('https://www.ocps.net/another-calendar')
await page.getByRole('button', { name: 'Hold this source' }).click()
await page.getByRole('button', { name: 'Read dates' }).click()
let sourceAlert = page.getByRole('alert')
await sourceAlert.waitFor({ state: 'visible' })
assert((await sourceAlert.textContent())?.includes('does not yet have a safe extractor'), 'Unsupported official source did not fail closed with an explicit no-dates message.')
assert(extractorRequests === 0, `Unsupported source unexpectedly called the extraction service ${extractorRequests} time(s).`)
assert(await page.evaluate(() => localStorage.getItem('arc.calendar.v1')) === null, 'Unsupported source unexpectedly persisted a calendar.')

await page.getByLabel('Official calendar link', { exact: true }).fill('https://www.ocps.net/110680_3')
await page.getByRole('button', { name: 'Hold this source' }).click()
const readButton = page.getByRole('button', { name: 'Read dates' })
await readButton.focus()
await page.keyboard.press('Enter')

const proposal = page.locator('.official-calendar-proposal')
const readOutcome = await Promise.race([
  proposal.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'proposal'),
  page.getByRole('alert').waitFor({ state: 'visible', timeout: 10000 }).then(() => 'alert'),
]).catch(() => 'timeout')
if (readOutcome !== 'proposal') {
  const alertText = await page.getByRole('alert').textContent().catch(() => '')
  throw new Error(`Read dates did not produce a proposal. outcome=${readOutcome}; preflights=${extractorPreflights}; extractorRequests=${extractorRequests}; routeError=${extractorRouteError || 'none'}; alert=${alertText || 'none'}`)
}
assert(extractorRequests === 1, `Supported source used ${extractorRequests} extraction requests, expected exactly 1.`)
assert((await proposal.textContent())?.includes('2026–27'), 'Calendar proposal lost the school-year label.')
assert((await proposal.textContent())?.includes('2026-08-11 → 2027-05-26'), 'Calendar proposal lost explicit first/last school-day truth.')
assert((await proposal.textContent())?.includes('OCPS 2026–27 School Calendar'), 'Calendar proposal lost source evidence.')
assert((await proposal.textContent())?.includes('Mixed'), 'Calendar proposal did not expose mixed weekday-pattern confidence.')
assert(await page.evaluate(() => localStorage.getItem('arc.calendar.v1')) === null, 'Reading dates persisted calendar state before review.')

const useCalendar = proposal.getByRole('button', { name: 'Use this calendar' })
assert(await useCalendar.isDisabled(), 'Use this calendar must be disabled before explicit proposal review.')
const reviewButton = proposal.getByRole('button', { name: 'I reviewed these dates' })
await reviewButton.focus()
await page.keyboard.press('Enter')
assert(!(await useCalendar.isDisabled()), 'Explicit review did not unlock the separate calendar commit action.')
assert(await page.evaluate(() => localStorage.getItem('arc.calendar.v1')) === null, 'Review confirmation persisted calendar state before commit.')

mkdirSync('artifacts/phase3-read-dates-proposal-review', { recursive: true })
await page.screenshot({ path: 'artifacts/phase3-read-dates-proposal-review/read-dates-proposal-1280.png', fullPage: true })

await page.setViewportSize({ width: 390, height: 844 })
const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
assert(geometry.scroll <= geometry.width + 1, `Read-dates proposal review overflowed at 390px (${geometry.scroll} > ${geometry.width}).`)

await useCalendar.click()
await page.getByRole('heading', { name: 'Month', exact: true }).waitFor({ state: 'visible' })
const persistedEnvelope = await page.evaluate(() => JSON.parse(localStorage.getItem('arc.calendar.v1') ?? 'null'))
const persisted = persistedEnvelope?.input
assert(persistedEnvelope?.schemaVersion === 1, 'Explicit commit did not persist the canonical calendar envelope.')
assert(persisted?.schoolYearLabel === '2026–27', 'Explicit commit lost the source-backed school-year label.')
assert(persisted?.firstDay === '2026-08-11', 'Explicit commit did not persist the source-backed first day.')
assert(persisted?.lastDay === '2027-05-26', 'Explicit commit did not persist the source-backed last day.')
assert(persisted?.patternSource === 'district-source', 'Explicit commit lost district-source truth.')
assert(persisted?.patternConfidence === 'mixed', 'Explicit commit silently promoted pattern confidence.')
assert(Array.isArray(persisted?.provenance) && persisted.provenance.some((item) => item.locator === 'https://www.ocps.net/110680_3'), 'Explicit commit lost official calendar provenance.')

await page.reload({ waitUntil: 'networkidle' })
assert(await page.getByRole('heading', { name: 'Month', exact: true }).count() === 1, 'Committed source-backed calendar did not restore the canonical Month workspace after reload.')
const restoredEnvelope = await page.evaluate(() => JSON.parse(localStorage.getItem('arc.calendar.v1') ?? 'null'))
assert(restoredEnvelope?.input?.schoolYearLabel === '2026–27', 'Committed source-backed school-year label did not survive reload.')
assert(runtimeErrors.length === 0, `Read-dates proposal review runtime errors: ${runtimeErrors.join(' | ')}`)

await context.close()
await browser.close()
console.log('phase3 read dates proposal review gate passed')
