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

async function selectCalendarView(page, view) {
  await page.getByRole('button', { name: /Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name: 'Calendar views' }).getByRole('button', { name: view, exact: true }).click()
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
  await selectCalendarView(page, 'Week')

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
  assert(await page.getByRole('button', { name: 'Change calendar view, current Week' }).count() === 1, 'RGAV-B: title-based view navigation did not survive reload.')
  await page.getByText('View options', { exact: true }).click()
  assert(await page.getByLabel('Show weekends in Week view').isChecked(), 'RGAV-B: weekend preference did not persist across reload.')

  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `RGAV-B: shell overflowed horizontally at 1366×768 (${geometry.scroll} > ${geometry.width}).`)

  // Fresh page, same browser context: local Arc state persists while sequential keyboard focus
  // starts legitimately from the beginning of the new document.
  const keyboardPage = await context.newPage()
  const keyboardRuntimeErrors = trackRuntimeErrors(keyboardPage)
  await keyboardPage.goto(baseUrl, { waitUntil: 'networkidle' })
  assert(await keyboardPage.getByRole('heading', { level: 1, name: 'Week' }).count() === 1, 'RGAV-B: persisted Last used Week did not survive a fresh page in the same browser context.')
  await keyboardPage.keyboard.press('Tab')
  const skip = keyboardPage.getByRole('link', { name: 'Skip to calendar' })
  assert(await skip.evaluate((node) => document.activeElement === node), 'RGAV-B: Skip to calendar is not first in keyboard order on a fresh page.')
  await keyboardPage.keyboard.press('Enter')
  assert(await keyboardPage.locator('#calendar-stage').evaluate((node) => document.activeElement === node), 'RGAV-B: skip link failed to focus the calendar stage.')

  assert(runtimeErrors.length === 0, `RGAV-B runtime errors: ${runtimeErrors.join(' | ')}`)
  assert(keyboardRuntimeErrors.length === 0, `RGAV-B fresh-page keyboard runtime errors: ${keyboardRuntimeErrors.join(' | ')}`)
  await keyboardPage.close()
  await context.close()
  console.log('Independent RGAV shell pass B succeeded: title-based view switching, Last used persistence, optional weekends, navigation/home/reload, fresh-page keyboard skip, 1366×768 overflow, and runtime-error checks.')
} finally {
  await browser.close()
}
