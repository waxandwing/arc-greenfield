import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const rawBase = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const baseUrl = rawBase.includes('skipEntry') ? rawBase : `${rawBase.replace(/\/$/, '')}/?skipEntry=1`

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

const candidatesPayload = {
  features: [
    { attributes: { NCESSCH: '120144001406', LEAID: '1201440', NAME: 'Oak Ridge High', STREET: '700 W Oak Ridge Rd', CITY: 'Orlando', STATE: 'FL', ZIP: '32809' } },
    { attributes: { NCESSCH: '999999999999', LEAID: '9999999', NAME: 'Oak Ridge High School', STREET: '1 Fixture Way', CITY: 'Orlando', STATE: 'FL', ZIP: '32801' } },
  ],
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
const runtimeErrors = trackRuntimeErrors(page)
let responseMode = 'candidates'
let interceptedSearches = 0

// Soft-disable Google in this gate so NCES fixture counts stay deterministic.
await page.route('**/api/google-schools?**', async (route) => {
  await route.fulfill({
    status: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'unavailable', results: [] }),
  })
})

await page.route('**/api/nces?**', async (route) => {
  interceptedSearches += 1
  const headers = { 'Content-Type': 'application/json' }
  if (responseMode === 'error') {
    await route.fulfill({ status: 200, headers, body: JSON.stringify({ error: { message: 'fixture provider rejection' } }) })
    return
  }
  const payload = responseMode === 'none' ? { features: [] } : candidatesPayload
  await route.fulfill({ status: 200, headers, body: JSON.stringify(payload) })
})

await page.goto(baseUrl, { waitUntil: 'networkidle' })
assert(await page.getByRole('heading', { name: 'Find and load your school’s official identity.' }).count() === 1, 'School identity search is missing from first-time calendar setup.')
assert(await page.getByTestId('school-load').count() === 1, 'School load region must be present.')
const schoolMoreInfo = page.locator('.school-identity-search-heading details.calendar-setup-more-info')
assert(await schoolMoreInfo.count() === 1, 'School identity help must use a More info disclosure.')
assert(await schoolMoreInfo.evaluate((node) => !node.open), 'More info must start collapsed.')
assert(await schoolMoreInfo.locator('summary').innerText() === 'More info', 'Disclosure summary must read More info.')
assert(
  await schoolMoreInfo.locator('p').innerText().then((text) => /Google Places/i.test(text) && /NCES/i.test(text)),
  'Expanded More info must keep the Google Places / NCES explanation.',
)

await page.getByRole('button', { name: 'Load school' }).click()
assert(await page.getByRole('alert').count() === 1, 'Invalid identity search did not surface an accessible error.')
assert(interceptedSearches === 0, 'Invalid identity query unexpectedly reached NCES.')

await page.getByLabel('School name').fill('Oak Ridge')
await page.getByLabel('City').fill('Orlando')
await page.getByLabel('State').fill('FL')
await page.getByRole('button', { name: 'Load school' }).click()
await page.getByText('2 school records found.').waitFor({ state: 'visible' })
assert(interceptedSearches === 1, `Candidate search did not use the deterministic NCES proxy fixture (${interceptedSearches} interceptions).`)

const renderedResults = page.locator('.school-identity-results')
const renderedCandidates = page.locator('.school-identity-candidate')
const renderedResultText = await renderedResults.textContent()
const renderedCandidateCount = await renderedCandidates.count()
assert(renderedCandidateCount === 2, `Multiple official candidates were not kept explicit. Rendered candidates=${renderedCandidateCount}; results=${renderedResultText}`)
assert((renderedResultText ?? '').includes('2 school records found.'), `Candidate summary is incorrect: ${renderedResultText}`)
assert((renderedResultText ?? '').includes('Arc will not guess.'), 'Candidate chooser does not state the no-guess rule.')
assert(await page.getByText('Source: NCES Common Core of Data — Public School Locations 2024–25').count() === 2, 'NCES source labeling is missing from candidates.')

const firstChoice = page.getByRole('button', { name: 'Load this school' }).first()
await firstChoice.focus()
await page.keyboard.press('Enter')
const selected = page.getByRole('status', { name: 'Loaded school identity' })
await selected.waitFor({ state: 'visible' })
assert((await selected.textContent())?.includes('does not invent your school year') || (await selected.textContent())?.includes('Nothing has been added'), 'Selected identity does not explicitly preserve calendar non-mutation truth.')

const persistedAfterSelection = await page.evaluate(() => localStorage.getItem('arc.calendar.v1'))
assert(persistedAfterSelection === null, 'Selecting an NCES school identity incorrectly persisted canonical calendar state.')

mkdirSync('artifacts/phase3-school-identity-search', { recursive: true })
await page.screenshot({ path: 'artifacts/phase3-school-identity-search/school-identity-search-1280.png', fullPage: true })

responseMode = 'none'
await page.getByRole('button', { name: 'Change school' }).click()
await page.getByLabel('School name').fill('Definitely Missing School')
await page.getByRole('button', { name: 'Load school' }).click()
await page.getByText('No school match yet.').waitFor({ state: 'visible' })
assert(interceptedSearches === 2, 'Zero-result search did not use the deterministic NCES proxy fixture.')

responseMode = 'error'
await page.getByLabel('School name').fill('Provider Failure School')
await page.getByRole('button', { name: 'Load school' }).click()
const providerAlert = page.getByRole('alert')
await providerAlert.waitFor({ state: 'visible' })
assert(interceptedSearches === 3, 'Provider-error search did not use the deterministic NCES proxy fixture.')
assert((await providerAlert.textContent())?.includes('Nothing was selected or saved'), 'Provider failure does not state non-mutation behavior.')

await page.setViewportSize({ width: 390, height: 844 })
const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
assert(geometry.scroll <= geometry.width + 1, `School identity search overflowed at 390px (${geometry.scroll} > ${geometry.width}).`)
assert(runtimeErrors.length === 0, `School identity search runtime errors: ${runtimeErrors.join(' | ')}`)

await context.close()
await browser.close()
console.log('phase3 school identity search gate passed')
