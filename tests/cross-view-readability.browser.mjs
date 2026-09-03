import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-cross-view-audit',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-01',
  lastDay: '2026-12-18',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [
    { date: '2026-09-07', kind: 'holiday', label: 'Labor Day' },
    { date: '2026-10-12', kind: 'teacher-workday', label: 'Planning day' },
  ],
  quarters: [
    { id: 'q1', label: 'Quarter 1', startDate: '2026-09-01', endDate: '2026-10-30' },
    { id: 'q2', label: 'Quarter 2', startDate: '2026-11-02', endDate: '2026-12-18' },
  ],
  semesters: [
    { id: 's1', label: 'Semester 1', startDate: '2026-09-01', endDate: '2026-12-18' },
  ],
}

const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-01T12:00:00.000Z', input: calendarInput }),
}

async function activateView(page, view) {
  await page.evaluate((target) => {
    const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent?.trim() === target)
    if (!(button instanceof HTMLButtonElement)) throw new Error(`${target} navigation button not found.`)
    button.click()
  }, view)
  await page.getByRole('heading', { name: view, exact: true }).waitFor()
  const button = page.getByRole('button', { name: view, exact: true })
  assert(await button.getAttribute('aria-current') === 'page', `${view}: active navigation state was not preserved.`)
  return button
}

async function assertActiveVisible(button, width, view) {
  const box = await button.boundingBox()
  assert(box, `${width}px ${view}: active navigation has no rendered bounds.`)
  assert(box.x >= -0.5 && box.x + box.width <= width + 0.5, `${width}px ${view}: active navigation is not fully visible.`)
}

async function assertContained(page, width, view) {
  const geometry = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    canvasClientWidth: document.querySelector('.calendar-canvas')?.clientWidth ?? 0,
    canvasScrollWidth: document.querySelector('.calendar-canvas')?.scrollWidth ?? 0,
  }))
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px ${view}: broad projection leaks into document width (${geometry.documentWidth}px > ${geometry.viewportWidth}px).`)
  if (width <= 800) {
    assert(geometry.canvasScrollWidth > geometry.canvasClientWidth, `${width}px ${view}: wide projection should remain contained inside the calendar canvas.`)
  }
}

async function auditRangeView(page, width, view, expectedTitle) {
  const button = await activateView(page, view)
  await assertActiveVisible(button, width, view)
  assert(await page.getByText(expectedTitle, { exact: true }).isVisible(), `${width}px ${view}: range title disappeared.`)

  const date = page.locator('.projection-range .calendar-day-date').first()
  const dateSize = await date.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))
  assert(dateSize === 16, `${width}px ${view}: normal range dates must remain 16px; got ${dateSize}px.`)

  const holiday = page.locator('[data-date="2026-09-07"]')
  assert(await holiday.getByText('Labor Day', { exact: true }).isVisible(), `${width}px ${view}: non-instructional state is not visibly communicated.`)
  const statusSize = await holiday.locator('.calendar-day-status').evaluate((node) => parseFloat(getComputedStyle(node).fontSize))
  assert(statusSize === 14, `${width}px ${view}: non-instructional status must remain 14px; got ${statusSize}px.`)

  const subtitleSize = await page.locator('.projection-subtitle').evaluate((node) => parseFloat(getComputedStyle(node).fontSize))
  assert(subtitleSize === 14, `${width}px ${view}: range subtitle must remain 14px; got ${subtitleSize}px.`)
  await assertContained(page, width, view)
}

async function auditYearMap(page, width) {
  const button = await activateView(page, 'Year Map')
  await assertActiveVisible(button, width, 'Year Map')

  const compactDate = page.locator('.projection-range--compact .calendar-day-date').first()
  const size = await compactDate.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))
  assert(size === 14, `${width}px Year Map: compact date must remain at the 14px metadata floor; got ${size}px.`)

  const holiday = page.locator('.projection-range--compact [data-date="2026-09-07"]')
  assert(await holiday.locator('.calendar-day-status').count() === 0, `${width}px Year Map: compact state should not expand the visual cell.`)
  assert(await holiday.locator('.sr-only').getByText('Labor Day', { exact: true }).count() === 1, `${width}px Year Map: compact holiday state is not available to assistive technology.`)

  const termSizes = await page.locator('.term-context-item').evaluateAll((nodes) => nodes.map((node) => parseFloat(getComputedStyle(node).fontSize)))
  assert(termSizes.length > 0 && termSizes.every((value) => value === 14), `${width}px Year Map: term context drifted below 14px.`)
  await assertContained(page, width, 'Year Map')
}

async function auditViewport(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, storage)
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await auditRangeView(page, width, 'Quarter', 'Quarter 1')
  await auditRangeView(page, width, 'Semester', 'Semester 1')
  await auditYearMap(page, width)

  assert(runtimeErrors.length === 0, `${width}px: runtime errors detected: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditViewport(browser, 1024, 900)
  await auditViewport(browser, 800, 900)
  await auditViewport(browser, 390, 844)
  await auditViewport(browser, 320, 800)
  console.log('Cross-view readability Chromium audit passed at 1024px desktop, 800px compact, 390px mobile, and 320px minimum reflow.')
} finally {
  await browser.close()
}
