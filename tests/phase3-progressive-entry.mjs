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

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
await context.addInitScript(() => localStorage.clear())
const page = await context.newPage()
const runtimeErrors = trackRuntimeErrors(page)

await page.goto(baseUrl, { waitUntil: 'networkidle' })

const explorer = page.getByRole('region', { name: 'Month workspace' }).getByText('You’re in Arc')
await explorer.waitFor({ state: 'visible' })
assert(await page.getByText('Look around before you finish setup.').count() === 1, 'Fresh Arc did not enter the calendar-centered progressive setup surface.')
assert(await page.getByText('These are ordinary calendar dates only.').count() >= 1, 'Pre-calendar surface did not disclose neutral civil-date semantics.')
assert(await page.evaluate(() => localStorage.getItem('arc.calendar.v1')) === null, 'Fresh progressive entry fabricated canonical calendar persistence.')

const weekView = page.getByRole('button', { name: 'Week', exact: true })
await weekView.focus()
await page.keyboard.press('Enter')
await page.getByRole('grid', { name: /neutral calendar week/ }).waitFor({ state: 'visible' })
assert(await page.getByText('School-day status not added yet.').count() === 0, 'Week exploration unexpectedly rendered school-day truth.')

const quarter = page.getByRole('button', { name: 'Quarter. Add school dates before using this school-year view.' })
assert(await quarter.getAttribute('aria-disabled') === 'true', 'Quarter did not remain unavailable before school dates exist.')
await quarter.click()
assert(await page.getByRole('grid', { name: /neutral calendar week/ }).count() === 1, 'Unavailable Quarter changed the safe pre-calendar view.')

const addDates = page.getByRole('button', { name: 'Add my school dates' })
await addDates.focus()
await page.keyboard.press('Enter')
await page.getByRole('heading', { name: 'Tell Arc which days are actually yours.' }).waitFor({ state: 'visible' })
assert(await page.evaluate(() => localStorage.getItem('arc.calendar.v1')) === null, 'Opening setup committed calendar truth.')

await page.getByLabel('School year').fill('2026–27 draft')
await page.getByLabel('First day').fill('2026-08-11')
await page.getByLabel('Last day').fill('2027-05-26')
await page.getByRole('button', { name: 'Add date' }).click()
await page.getByLabel('Exception 1 date').fill('2026-09-07')
await page.getByLabel('Exception 1 optional label').fill('Labor Day draft')

const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('arc.calendar-setup-draft.v1') ?? 'null'))
assert(draft?.schoolYearLabel === '2026–27 draft', 'Incomplete setup did not persist its separate resumable draft.')
assert(draft?.firstDay === '2026-08-11' && draft?.lastDay === '2027-05-26', 'Resumable draft lost entered date bounds.')
assert(draft?.exceptions?.[0]?.label === 'Labor Day draft', 'Resumable draft lost an incomplete exception.')
assert(await page.evaluate(() => localStorage.getItem('arc.calendar.v1')) === null, 'Incomplete setup leaked into canonical calendar storage.')

const closeSetup = page.getByRole('button', { name: 'Close setup' })
await closeSetup.focus()
await page.keyboard.press('Enter')
await page.getByText('Look around before you finish setup.').waitFor({ state: 'visible' })
assert(await page.getByRole('grid', { name: /neutral calendar week/ }).count() === 1, 'Closing setup did not return to the same safe calendar context.')

await page.getByRole('button', { name: 'Add my school dates' }).click()
assert(await page.getByLabel('School year').inputValue() === '2026–27 draft', 'Reopening setup lost the in-progress draft label.')
assert(await page.getByLabel('First day').inputValue() === '2026-08-11', 'Reopening setup lost the in-progress first day.')
assert(await page.getByLabel('Exception 1 optional label').inputValue() === 'Labor Day draft', 'Reopening setup lost the in-progress exception.')

await page.getByRole('button', { name: 'Close setup' }).click()
mkdirSync('artifacts/phase3-progressive-entry', { recursive: true })
await page.screenshot({ path: 'artifacts/phase3-progressive-entry/progressive-entry-1280.png', fullPage: true })

await page.reload({ waitUntil: 'networkidle' })
await page.getByText('Look around before you finish setup.').waitFor({ state: 'visible' })
assert(await page.evaluate(() => localStorage.getItem('arc.calendar.v1')) === null, 'Reload promoted incomplete setup into canonical calendar truth.')
await page.getByRole('button', { name: 'Add my school dates' }).click()
assert(await page.getByLabel('School year').inputValue() === '2026–27 draft', 'Reload lost the resumable setup draft.')
assert(await page.getByLabel('Last day').inputValue() === '2027-05-26', 'Reload lost the draft last day.')

await page.getByRole('button', { name: 'Close setup' }).click()
await page.setViewportSize({ width: 390, height: 844 })
const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
assert(geometry.scroll <= geometry.width + 1, `Progressive entry overflowed at 390px (${geometry.scroll} > ${geometry.width}).`)
assert(runtimeErrors.length === 0, `Progressive entry runtime errors: ${runtimeErrors.join(' | ')}`)

await context.close()
await browser.close()
console.log('phase3 progressive entry gate passed')
