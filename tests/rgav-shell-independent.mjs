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

async function configureCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar' }).click()
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await configureCalendar(page)

  // Different path from the primary smoke gate: teacher configures preferences first,
  // uses a seven-day Week, navigates, returns Home, then reloads.
  await page.getByText('View options', { exact: true }).click()
  await page.getByLabel('Open Arc to').selectOption('last-used')
  await page.getByLabel('Show weekends in Week view').check()
  await page.getByRole('button', { name: 'Week' }).click()

  const weekRegion = page.locator('.projection-section').first()
  assert(await page.getByRole('heading', { level: 1, name: 'Week' }).count() === 1, 'RGAV-B: Week did not become the active workspace view.')
  const weekdayLabels = await weekRegion.locator('.calendar-day-weekday').allTextContents()
  assert(weekdayLabels.includes('Sat') && weekdayLabels.includes('Sun'), `RGAV-B: enabled weekends were not visible in Week (${weekdayLabels.join(', ')}).`)

  await page.getByRole('button', { name: 'Next Week' }).click()
  const nextRange = await weekRegion.getAttribute('aria-label')
  assert(Boolean(nextRange), 'RGAV-B: navigated Week lost its accessible range label.')

  await page.getByRole('button', { name: /Return to Week view/ }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'Week' }).count() === 1, 'RGAV-B: Arc wordmark did not honor Last used Week behavior.')

  await page.reload({ waitUntil: 'networkidle' })
  assert(await page.getByRole('heading', { level: 1, name: 'Week' }).count() === 1, 'RGAV-B: reload did not restore Last used Week behavior.')
  await page.getByText('View options', { exact: true }).click()
  assert(await page.getByLabel('Show weekends in Week view').isChecked(), 'RGAV-B: weekend preference did not persist across reload.')

  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `RGAV-B: shell overflowed horizontally at 1366×768 (${geometry.scroll} > ${geometry.width}).`)

  // Keyboard hostile pass after reload: the skip link must still be first and functional.
  await page.evaluate(() => document.activeElement?.blur())
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to calendar' })
  assert(await skip.evaluate((node) => document.activeElement === node), 'RGAV-B: Skip to calendar is not first in keyboard order.')
  await page.keyboard.press('Enter')
  assert(await page.locator('#calendar-stage').evaluate((node) => document.activeElement === node), 'RGAV-B: skip link failed to focus the calendar stage.')

  assert(runtimeErrors.length === 0, `RGAV-B runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('Independent RGAV shell pass B succeeded: Last used persistence, optional weekends, navigation/home/reload, 1366×768 overflow, keyboard skip path, and runtime-error checks.')
} finally {
  await browser.close()
}
