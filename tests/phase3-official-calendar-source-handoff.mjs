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

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
const runtimeErrors = trackRuntimeErrors(page)
let ncesRequests = 0
let calendarSourceRequests = 0

await page.route((url) => url.hostname === 'nces.ed.gov' && url.pathname.endsWith('/MapServer/1/query'), async (route) => {
  ncesRequests += 1
  await route.fulfill({
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(schoolPayload),
  })
})
await page.route('https://district.example.invalid/**', async (route) => {
  calendarSourceRequests += 1
  await route.fulfill({ status: 200, contentType: 'text/plain', body: 'Calendar fixture should not be fetched in this slice.' })
})

await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.getByLabel('School name').fill('Oak Ridge')
await page.getByLabel('City').fill('Orlando')
await page.getByLabel('State').fill('FL')
await page.getByRole('button', { name: 'Find my school' }).click()
await page.getByText('One official record found.').waitFor({ state: 'visible' })
assert(ncesRequests === 1, `School identity lookup used ${ncesRequests} NCES requests, expected 1.`)

const choose = page.getByRole('button', { name: 'This is my school' })
await choose.focus()
await page.keyboard.press('Enter')
const sourceHeading = page.getByRole('heading', { name: 'Have the district or school calendar link?' })
await sourceHeading.waitFor({ state: 'visible' })
assert(await page.getByText('it will not invent, read, or save any dates from the link in this step.').count() === 1, 'Source handoff does not clearly separate source identity from date extraction.')

await page.getByRole('button', { name: 'Hold this source' }).click()
let sourceAlert = page.getByRole('alert')
await sourceAlert.waitFor({ state: 'visible' })
assert((await sourceAlert.textContent())?.includes('Confirm that this link comes from the official school or district'), 'Unconfirmed source was not rejected explicitly.')

await page.getByLabel('Official calendar link').fill('javascript:alert(1)')
await page.getByLabel('Published by').fill('Orange County Public Schools')
await page.getByLabel('Source label').fill('2026–27 school calendar')
await page.getByLabel('I confirm this link is published by the selected school or its district.').check()
await page.getByRole('button', { name: 'Hold this source' }).click()
sourceAlert = page.getByRole('alert')
await sourceAlert.waitFor({ state: 'visible' })
assert((await sourceAlert.textContent())?.includes('valid public HTTP(S) link'), 'Non-HTTP(S) calendar source did not fail closed.')

await page.getByLabel('Official calendar link').fill('https://district.example.invalid/2026-27-calendar.pdf#page=1')
await page.getByLabel('Source type').selectOption('district-calendar-document')
await page.getByRole('button', { name: 'Hold this source' }).focus()
await page.keyboard.press('Enter')
const held = page.getByRole('status', { name: 'Teacher-confirmed official calendar source' })
await held.waitFor({ state: 'visible' })
const heldText = await held.textContent()
assert(heldText?.includes('2026–27 school calendar'), 'Held source lost its teacher-provided label.')
assert(heldText?.includes('Orange County Public Schools'), 'Held source lost its teacher-confirmed publisher.')
assert(heldText?.includes('Arc still has no school-calendar dates from this source.'), 'Held source incorrectly implies dates were acquired.')
const sourceLink = held.getByRole('link', { name: 'Open the source in a new tab' })
assert(await sourceLink.getAttribute('href') === 'https://district.example.invalid/2026-27-calendar.pdf', 'Held source locator was not safely normalized.')
assert(calendarSourceRequests === 0, `Holding a source unexpectedly fetched it ${calendarSourceRequests} time(s).`)
assert(await page.evaluate(() => localStorage.getItem('arc.calendar.v1')) === null, 'Holding a calendar source incorrectly persisted canonical calendar state.')

mkdirSync('artifacts/phase3-calendar-source-handoff', { recursive: true })
await page.screenshot({ path: 'artifacts/phase3-calendar-source-handoff/calendar-source-handoff-1280.png', fullPage: true })

await page.getByLabel('Official calendar link').fill('https://district.example.invalid/revised-calendar.pdf')
assert(await page.getByRole('status', { name: 'Teacher-confirmed official calendar source' }).count() === 0, 'Editing source details did not invalidate the previously held source.')
assert(await page.evaluate(() => localStorage.getItem('arc.calendar.v1')) === null, 'Editing source details unexpectedly created calendar persistence.')

await page.setViewportSize({ width: 390, height: 844 })
const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
assert(geometry.scroll <= geometry.width + 1, `Official calendar source handoff overflowed at 390px (${geometry.scroll} > ${geometry.width}).`)
assert(runtimeErrors.length === 0, `Official calendar source handoff runtime errors: ${runtimeErrors.join(' | ')}`)

await context.close()
await browser.close()
console.log('phase3 official calendar source handoff gate passed')
