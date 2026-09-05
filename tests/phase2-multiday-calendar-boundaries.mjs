import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function headerAction(page, text) {
  return page.locator('.calendar-context-actions button').filter({ hasText: text })
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
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
}

async function createCourse(page) {
  await headerAction(page, 'Set classes').click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('AP Art History')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 2')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()
}

async function createMultidayUnit(page) {
  await headerAction(page, 'Add Units').click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Weekend span')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-11')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-14')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await configureCalendar(page)
  await createCourse(page)
  await createMultidayUnit(page)

  // A Unit may span weekend days as long as the range contains confirmed instructional truth.
  await page.reload({ waitUntil: 'networkidle' })
  await headerAction(page, 'Edit Units').click()
  const unitName = page.getByDisplayValue('Weekend span')
  const unitRow = unitName.locator('xpath=ancestor::*[contains(@class,"unit-editor-row")]')
  assert(await unitRow.count() === 1, 'Phase 2 calendar boundaries: multi-day Unit did not survive reload.')
  assert(await unitRow.getByRole('textbox', { name: 'Start', exact: true }).inputValue() === '2026-09-11', 'Phase 2 calendar boundaries: Unit start changed after reload.')
  assert(await unitRow.getByRole('textbox', { name: 'End', exact: true }).inputValue() === '2026-09-14', 'Phase 2 calendar boundaries: Unit end changed after reload.')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()

  // A Lesson may be placed on a confirmed instructional day within that multi-day Unit.
  await headerAction(page, 'Add Lessons').click()
  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Boundary lesson')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-11')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
  await page.reload({ waitUntil: 'networkidle' })
  await headerAction(page, 'Edit Lessons').click()
  await page.getByRole('button', { name: /^Boundary lesson/ }).click()
  const plannedDate = page.getByRole('textbox', { name: 'Planned date', exact: true })
  assert(await plannedDate.inputValue() === '2026-09-11', 'Phase 2 calendar boundaries: valid instructional Lesson placement did not survive reload.')

  // Weekend placement must fail closed and preserve the last valid Lesson date.
  await plannedDate.fill('2026-09-12')
  const weekendAlert = await page.getByRole('alert').innerText()
  assert(weekendAlert.includes('confirmed instructional day'), `Phase 2 calendar boundaries: weekend Lesson placement did not fail closed with instructional-day guidance. Alert: ${weekendAlert}`)
  assert(await plannedDate.inputValue() === '2026-09-11', 'Phase 2 calendar boundaries: rejected weekend move corrupted the last valid Lesson placement.')

  // Sunday must fail the same way; rejection must not silently unplace or rewrite the Lesson.
  await plannedDate.fill('2026-09-13')
  const sundayAlert = await page.getByRole('alert').innerText()
  assert(sundayAlert.includes('confirmed instructional day'), `Phase 2 calendar boundaries: Sunday Lesson placement did not fail closed. Alert: ${sundayAlert}`)
  assert(await plannedDate.inputValue() === '2026-09-11', 'Phase 2 calendar boundaries: rejected Sunday move changed canonical Lesson placement.')

  // A valid instructional move across the weekend is allowed and remains canonical after reload.
  await plannedDate.fill('2026-09-14')
  assert(await plannedDate.inputValue() === '2026-09-14', 'Phase 2 calendar boundaries: valid Monday move was not accepted.')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
  await page.reload({ waitUntil: 'networkidle' })
  await headerAction(page, 'Edit Lessons').click()
  await page.getByRole('button', { name: /^Boundary lesson/ }).click()
  assert(await page.getByRole('textbox', { name: 'Planned date', exact: true }).inputValue() === '2026-09-14', 'Phase 2 calendar boundaries: valid move across weekend did not survive reload.')

  assert(runtimeErrors.length === 0, `Phase 2 calendar-boundary runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('Phase 2 multi-day + calendar-boundary gate passed: multi-day Unit crosses weekend → valid Lesson placement/reload → weekend/Sunday moves fail closed without corruption → valid Monday move/reload.')
} finally {
  await browser.close()
}
