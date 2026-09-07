import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function trackRuntimeErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`))
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

function headerAction(page, text) {
  return page.locator('.calendar-context-actions button').filter({ hasText: text })
}

async function selectCalendarView(page, view) {
  await page.getByRole('button', { name: /Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name: 'Calendar views' }).getByRole('button', { name: view, exact: true }).click()
}

async function configureCalendarWithEdges(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')

  await page.getByRole('button', { name: 'Add date', exact: true }).click()
  await page.getByRole('textbox', { name: 'Exception 1 date', exact: true }).fill('2026-09-16')
  await page.getByRole('combobox', { name: 'Exception 1 type', exact: true }).selectOption('no-school')
  await page.getByRole('textbox', { name: 'Exception 1 optional label', exact: true }).fill('Faculty meeting')

  await page.getByRole('button', { name: 'Add date', exact: true }).click()
  await page.getByRole('textbox', { name: 'Exception 2 date', exact: true }).fill('2026-09-19')
  await page.getByRole('combobox', { name: 'Exception 2 type', exact: true }).selectOption('instructional')
  await page.getByRole('textbox', { name: 'Exception 2 optional label', exact: true }).fill('Saturday studio')

  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
}

async function createClass(page) {
  await headerAction(page, 'Set classes').click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('Studio Art')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 3')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()
}

async function createAndProbeUnits(page) {
  await headerAction(page, 'Add Units').click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  const unitFields = page.getByRole('textbox', { name: 'Unit', exact: true })
  const startFields = page.getByRole('textbox', { name: 'Start', exact: true })
  const endFields = page.getByRole('textbox', { name: 'End', exact: true })

  await unitFields.nth(0).fill('Span Unit')
  await startFields.nth(0).fill('2026-09-14')
  await endFields.nth(0).fill('2026-09-21')
  assert(await startFields.nth(0).inputValue() === '2026-09-14', 'Phase 2 calendar edge: multi-day Unit start was not accepted.')
  assert(await endFields.nth(0).inputValue() === '2026-09-21', 'Phase 2 calendar edge: multi-day Unit end was not accepted across no-school/weekend dates.')

  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await unitFields.nth(1).fill('Weekend-only Unit')
  await startFields.nth(1).fill('2026-09-20')
  const unitError = await page.getByRole('alert').innerText()
  assert(unitError.includes('at least one confirmed instructional day'), `Phase 2 calendar edge: non-instructional-only Unit placement did not fail closed. Alert: ${unitError}`)
  assert(await startFields.nth(1).inputValue() === '', 'Phase 2 calendar edge: rejected non-instructional Unit placement leaked into draft state.')
  await page.locator('.unit-editor-row').nth(1).getByRole('button', { name: 'Delete', exact: true }).click()

  await page.getByRole('button', { name: 'Save Units', exact: true }).click()
}

async function createAndProbeLessons(page) {
  await headerAction(page, 'Add Lessons').click()

  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('No-school lesson')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-16')
  const lessonError = await page.getByRole('alert').innerText()
  assert(lessonError.includes('confirmed instructional day'), `Phase 2 calendar edge: Lesson on no-school exception did not fail closed. Alert: ${lessonError}`)
  assert(await page.getByRole('textbox', { name: 'Planned date', exact: true }).inputValue() === '', 'Phase 2 calendar edge: rejected no-school Lesson date leaked into draft state.')
  await page.getByRole('button', { name: 'Delete', exact: true }).click()

  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Saturday studio lesson')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-19')
  assert(await page.getByRole('textbox', { name: 'Planned date', exact: true }).inputValue() === '2026-09-19', 'Phase 2 calendar edge: confirmed instructional Saturday was rejected for Lesson placement.')

  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Monday follow-up')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-21')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
}

async function moveToWeekOfSeptember14(page) {
  await selectCalendarView(page, 'Week')
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  await configureCalendarWithEdges(page)
  await createClass(page)
  await createAndProbeUnits(page)
  await createAndProbeLessons(page)

  assert(await page.locator('.planning-month-unit-band').filter({ hasText: 'Span Unit' }).count() >= 1, 'Phase 2 calendar edge: multi-day Unit did not project into Month.')
  assert(await page.locator('.planning-month-day').filter({ hasText: 'Faculty meeting' }).count() === 1, 'Phase 2 calendar edge: no-school exception did not remain visible in Month.')
  assert(await page.locator('.planning-month-signal').filter({ hasText: 'Saturday studio lesson' }).count() === 1, 'Phase 2 calendar edge: instructional Saturday Lesson did not project into Month.')

  await moveToWeekOfSeptember14(page)

  assert(await page.locator('.planning-date-heading').count() === 5, 'Phase 2 calendar edge: default Week did not remain Monday–Friday.')
  assert(await page.getByText('Saturday studio lesson', { exact: true }).count() === 0, 'Phase 2 calendar edge: Saturday Lesson leaked into Week while weekends were hidden.')

  await page.getByText('View options', { exact: true }).click()
  const weekendToggle = page.getByRole('checkbox', { name: 'Show weekends in Week view', exact: true })
  await weekendToggle.check()
  assert(await page.locator('.planning-date-heading').count() === 7, 'Phase 2 calendar edge: Week did not expand to seven days when weekends were enabled.')
  assert(await page.getByText('Saturday studio lesson', { exact: true }).count() === 1, 'Phase 2 calendar edge: confirmed Saturday Lesson was not restored when weekends were shown.')

  await weekendToggle.uncheck()
  assert(await page.getByText('Saturday studio lesson', { exact: true }).count() === 0, 'Phase 2 calendar edge: Saturday Lesson remained visible after weekends were hidden again.')
  await weekendToggle.check()
  assert(await page.getByText('Saturday studio lesson', { exact: true }).count() === 1, 'Phase 2 calendar edge: hiding weekends mutated/deleted Saturday planning data.')

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
  assert(await page.locator('.planning-month-unit-band').filter({ hasText: 'Span Unit' }).count() >= 1, 'Phase 2 calendar edge: multi-day Unit did not survive reload.')
  assert(await page.locator('.planning-month-day').filter({ hasText: 'Faculty meeting' }).count() === 1, 'Phase 2 calendar edge: no-school exception did not survive reload.')
  assert(await page.locator('.planning-month-signal').filter({ hasText: 'Saturday studio lesson' }).count() === 1, 'Phase 2 calendar edge: Saturday Lesson did not survive reload.')
  assert(await page.locator('.planning-month-signal').filter({ hasText: 'No-school lesson' }).count() === 0, 'Phase 2 calendar edge: rejected no-school Lesson appeared after reload.')

  assert(runtimeErrors.length === 0, `Phase 2 calendar-edge runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('Phase 2 calendar-edge planning truth gate passed: multi-day Unit across no-school/weekend → invalid non-instructional-only placement fails closed → no-school Lesson rejected → instructional Saturday accepted → title-based Week hide/show preserves data → reload preserves truth.')
} finally {
  await browser.close()
}
