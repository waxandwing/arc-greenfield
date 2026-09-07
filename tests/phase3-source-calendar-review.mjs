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

const sourceInput = {
  id: 'district-fixture-calendar',
  schoolYearLabel: '2026–27 fixture',
  firstDay: '2026-09-02',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'district-source',
  patternConfidence: 'mixed',
  exceptions: [
    {
      date: '2026-09-07',
      kind: 'holiday',
      label: 'Fixture closure',
      source: 'district-source',
      confidence: 'inferred',
    },
    {
      date: '2026-09-11',
      kind: 'teacher-workday',
      label: 'Fixture workday',
      source: 'district-source',
      confidence: 'confirmed',
    },
  ],
  quarters: [],
  semesters: [],
  provenance: [
    {
      id: 'fixture-evidence-1',
      source: 'district-source',
      label: 'Automated browser fixture — not real district data',
      locator: 'fixture://phase3/source-calendar-review',
      capturedAt: '2026-09-05T12:00:00-04:00',
    },
  ],
}

const envelope = {
  schemaVersion: 1,
  savedAt: '2026-09-05T12:00:00-04:00',
  input: sourceInput,
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
const runtimeErrors = trackRuntimeErrors(page)

await page.addInitScript((value) => {
  localStorage.setItem('arc.calendar.v1', JSON.stringify(value))
}, envelope)

await page.goto(baseUrl, { waitUntil: 'networkidle' })
assert(await page.getByRole('heading', { level: 1, name: 'Month' }).count() === 1, 'Source review: seeded source-backed calendar did not restore into the planner.')

await page.getByRole('button', { name: 'Edit dates' }).click()
const review = page.getByRole('region', { name: 'Check the school-year truth before you change it.' })
assert(await review.count() === 1, 'Source review: source-backed calendar review region is missing.')
assert((await review.textContent())?.includes('District source'), 'Source review: source classification is not visible.')
assert((await review.textContent())?.includes('Mixed'), 'Source review: confidence is not visible.')
assert((await review.textContent())?.includes('Automated browser fixture — not real district data'), 'Source review: provenance label is not visible.')
assert((await review.textContent())?.includes('fixture://phase3/source-calendar-review'), 'Source review: provenance locator is not visible.')
assert((await review.textContent())?.includes('Mini calendar'), 'Source review: miniature calendar proof is missing.')

const mini = page.getByLabel('Miniature school calendar preview')
assert(await mini.count() === 1, 'Source review: miniature calendar region is missing.')
const uncertain = mini.locator('[aria-label*="2026-09-07"]')
assert(await uncertain.count() === 1, 'Source review: uncertain fixture date is missing from miniature calendar.')
const uncertainLabel = await uncertain.getAttribute('aria-label')
assert(uncertainLabel?.includes('inferred'), `Source review: uncertain date does not expose confidence (${uncertainLabel}).`)
const uncertainMarker = await uncertain.evaluate((node) => getComputedStyle(node, '::after').content)
assert(uncertainMarker.includes('?'), 'Source review: uncertain truth relies on color because the visible non-color marker is missing.')

const gridColumns = await mini.locator('.source-calendar-grid').evaluate((grid) => {
  const children = Array.from(grid.children)
  const columnFor = (date) => {
    const index = children.findIndex((node) => node.getAttribute('aria-label')?.startsWith(date))
    return index < 0 ? null : (index % 7) + 1
  }
  return { wednesday: columnFor('2026-09-02'), monday: columnFor('2026-09-07') }
})
assert(gridColumns.wednesday === 3, `Source review: Wednesday fixture start rendered in column ${gridColumns.wednesday}, expected 3.`)
assert(gridColumns.monday === 1, `Source review: Monday rendered in column ${gridColumns.monday}, expected 1.`)

mkdirSync('artifacts/phase3-source-review', { recursive: true })
await page.screenshot({ path: 'artifacts/phase3-source-review/source-calendar-review-1280.png', fullPage: true })

await page.getByLabel('Exception 1 optional label').fill('Teacher corrected fixture closure')
await page.getByRole('button', { name: 'Use this calendar' }).click()
assert(await page.getByRole('heading', { level: 1, name: 'Month' }).count() === 1, 'Source review: saving a reviewed calendar edit did not return to Month.')

const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('arc.calendar.v1') ?? 'null'))
assert(persisted?.input?.patternSource === 'district-source', `Source review: edit rewrote pattern source to ${persisted?.input?.patternSource}.`)
assert(persisted?.input?.patternConfidence === 'mixed', `Source review: edit rewrote pattern confidence to ${persisted?.input?.patternConfidence}.`)
assert(persisted?.input?.provenance?.[0]?.locator === 'fixture://phase3/source-calendar-review', 'Source review: edit dropped provenance locator.')
const editedException = persisted?.input?.exceptions?.find((item) => item.date === '2026-09-07')
assert(editedException?.source === 'manual', `Source review: teacher-edited exception did not become manual (${editedException?.source}).`)
assert(editedException?.confidence === 'confirmed', `Source review: teacher-edited exception did not become confirmed (${editedException?.confidence}).`)

await page.reload({ waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Edit dates' }).click()
const reloadedReview = page.getByRole('region', { name: 'Check the school-year truth before you change it.' })
assert(await reloadedReview.count() === 1, 'Source review: provenance review surface disappeared after save/reload.')
assert((await reloadedReview.textContent())?.includes('fixture://phase3/source-calendar-review'), 'Source review: provenance evidence did not survive save/reload.')

const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
assert(geometry.scroll <= geometry.width + 1, `Source review: 1280px surface overflowed horizontally (${geometry.scroll} > ${geometry.width}).`)
assert(runtimeErrors.length === 0, `Source review runtime errors: ${runtimeErrors.join(' | ')}`)

await context.close()
await browser.close()
console.log('phase3 source calendar review gate passed')
