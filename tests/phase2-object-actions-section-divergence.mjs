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

async function settingsAction(page, text) {
  const drawer = page.getByRole('complementary', { name: 'Settings and setup' })
  if (!(await drawer.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
  }
  const button = page.getByRole('complementary', { name: 'Settings and setup' }).getByRole('button', { name: text, exact: true })
  assert(await button.count() === 1, `Object-action gate: Settings did not expose exactly one ${text} action.`)
  return button
}

async function configureCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
}

async function createClasses(page) {
  await (await settingsAction(page, 'Set courses & sections')).click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('AP Art History')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 2')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  const sectionFields = page.getByRole('textbox', { name: 'Period or section', exact: true })
  await sectionFields.nth(1).fill('Period 5')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()
}

async function createUnits(page) {
  await (await settingsAction(page, 'Add Units')).click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  const unitFields = page.getByRole('textbox', { name: 'Unit', exact: true })
  const startFields = page.getByRole('textbox', { name: 'Start', exact: true })
  const endFields = page.getByRole('textbox', { name: 'End', exact: true })
  await unitFields.nth(0).fill('Action Unit')
  await startFields.nth(0).fill('2026-09-14')
  await endFields.nth(0).fill('2026-09-18')

  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await unitFields.nth(1).fill('Progress Unit')
  await startFields.nth(1).fill('2026-09-21')
  await endFields.nth(1).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()
}

async function addLesson(page, title, unitName, date) {
  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill(title)
  await page.getByRole('combobox', { name: 'Unit', exact: true }).selectOption({ label: unitName })
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill(date)
}

async function createLessons(page) {
  await (await settingsAction(page, 'Add Lessons')).click()
  await addLesson(page, 'Action lesson', 'Action Unit', '2026-09-16')
  await addLesson(page, 'Progress lesson', 'Progress Unit', '2026-09-21')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
}

async function selectLesson(page, title) {
  await page.getByRole('button', { name: new RegExp(`^${title}`) }).click()
}

async function unitRow(page, title) {
  const rows = page.locator('.unit-editor-row')
  for (let index = 0; index < await rows.count(); index += 1) {
    const row = rows.nth(index)
    const value = await row.getByRole('textbox', { name: 'Unit', exact: true }).inputValue()
    if (value === title) return row
  }
  return null
}

async function describeUnitRow(row) {
  if (!row) return { count: 0, text: [], starts: [], ends: [], buttons: [] }
  return {
    count: await row.count(),
    text: await row.allInnerTexts(),
    starts: [await row.getByRole('textbox', { name: 'Start', exact: true }).inputValue()],
    ends: [await row.getByRole('textbox', { name: 'End', exact: true }).inputValue()],
    buttons: await row.getByRole('button').allTextContents(),
  }
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await configureCalendar(page)
  await createClasses(page)
  await createUnits(page)
  await createLessons(page)

  await (await settingsAction(page, 'Edit Units')).click()
  let actionUnit = await unitRow(page, 'Action Unit')
  const initialActionUnit = await describeUnitRow(actionUnit)
  assert(initialActionUnit.count === 1, `Phase 2 object actions: expected one Action Unit row, found ${JSON.stringify(initialActionUnit)}.`)
  assert(initialActionUnit.starts[0] === '2026-09-14' && initialActionUnit.ends[0] === '2026-09-18', `Phase 2 object actions: Action Unit placement was not preserved before guard test: ${JSON.stringify(initialActionUnit)}.`)
  assert(initialActionUnit.buttons.includes('Unplace'), `Phase 2 object actions: placed Action Unit did not expose Unplace: ${JSON.stringify(initialActionUnit)}.`)
  await actionUnit.getByRole('button', { name: 'Unplace', exact: true }).click()
  assert((await page.getByRole('alert').innerText()).includes('scheduled Lessons'), 'Phase 2 object actions: Unit Unplace did not fail closed while a scheduled child Lesson existed.')
  await actionUnit.getByRole('button', { name: 'Delete', exact: true }).click()
  assert((await page.getByRole('alert').innerText()).includes('Lessons first'), 'Phase 2 object actions: Unit Delete did not fail closed while a child Lesson existed.')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()

  await (await settingsAction(page, 'Edit Lessons')).click()
  await selectLesson(page, 'Progress lesson')
  const p2 = page.locator('.delivery-row').filter({ hasText: 'Period 2' })
  const p5 = page.locator('.delivery-row').filter({ hasText: 'Period 5' })
  await p2.getByRole('combobox', { name: 'Status', exact: true }).selectOption('in-progress')
  await p2.getByRole('textbox', { name: 'Actual date', exact: true }).fill('2026-09-21')
  await p2.getByRole('textbox', { name: 'Pick up here', exact: true }).fill('Continue with guided comparison.')
  assert(await p5.getByRole('combobox', { name: 'Status', exact: true }).inputValue() === 'not-started', 'Phase 2 divergence: changing Period 2 leaked into Period 5 before save.')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()

  await page.reload({ waitUntil: 'networkidle' })
  await (await settingsAction(page, 'Edit Lessons')).click()
  await selectLesson(page, 'Progress lesson')
  const reloadedP2 = page.locator('.delivery-row').filter({ hasText: 'Period 2' })
  const reloadedP5 = page.locator('.delivery-row').filter({ hasText: 'Period 5' })
  assert(await reloadedP2.getByRole('combobox', { name: 'Status', exact: true }).inputValue() === 'in-progress', 'Phase 2 divergence: Period 2 status did not survive reload.')
  assert(await reloadedP2.getByRole('textbox', { name: 'Actual date', exact: true }).inputValue() === '2026-09-21', 'Phase 2 divergence: Period 2 actual date did not survive reload.')
  assert(await reloadedP2.getByRole('textbox', { name: 'Pick up here', exact: true }).inputValue() === 'Continue with guided comparison.', 'Phase 2 divergence: Period 2 resume note did not survive reload.')
  assert(await reloadedP5.getByRole('combobox', { name: 'Status', exact: true }).inputValue() === 'not-started', 'Phase 2 divergence: Period 5 inherited Period 2 state after reload.')

  await selectLesson(page, 'Action lesson')
  await page.getByRole('button', { name: 'Unplace', exact: true }).click()
  assert((await page.getByRole('status').innerText()).includes('teaching history were preserved'), 'Phase 2 object actions: Lesson Unplace did not report preservation semantics.')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()

  await page.reload({ waitUntil: 'networkidle' })
  await (await settingsAction(page, 'Edit Lessons')).click()
  await selectLesson(page, 'Action lesson')
  assert(await page.getByRole('textbox', { name: 'Planned date', exact: true }).inputValue() === '', 'Phase 2 object actions: unplaced Lesson regained a date after reload.')

  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  assert((await page.getByRole('status').innerText()).includes('Lesson deleted'), 'Phase 2 object actions: safe Lesson Delete did not report success.')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()

  await page.reload({ waitUntil: 'networkidle' })
  await (await settingsAction(page, 'Edit Lessons')).click()
  assert(await page.getByRole('button', { name: /^Action lesson/ }).count() === 0, 'Phase 2 object actions: deleted Lesson returned after reload.')
  assert(await page.getByRole('button', { name: /^Progress lesson/ }).count() === 1, 'Phase 2 object actions: deleting Action lesson disturbed Progress lesson.')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()

  await (await settingsAction(page, 'Edit Units')).click()
  actionUnit = await unitRow(page, 'Action Unit')
  assert(actionUnit, 'Phase 2 object actions: Action Unit disappeared before safe Unplace.')
  await actionUnit.getByRole('button', { name: 'Unplace', exact: true }).click()
  assert(await actionUnit.getByRole('textbox', { name: 'Start', exact: true }).inputValue() === '', 'Phase 2 object actions: Unit Unplace did not clear start placement.')
  assert(await actionUnit.getByRole('textbox', { name: 'End', exact: true }).inputValue() === '', 'Phase 2 object actions: Unit Unplace did not clear end placement.')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

  await page.reload({ waitUntil: 'networkidle' })
  await (await settingsAction(page, 'Edit Units')).click()
  actionUnit = await unitRow(page, 'Action Unit')
  assert(actionUnit, 'Phase 2 object actions: unplaced Unit did not survive reload.')
  assert(await actionUnit.getByRole('textbox', { name: 'Start', exact: true }).inputValue() === '', 'Phase 2 object actions: unplaced Unit start date returned after reload.')
  await actionUnit.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

  await page.reload({ waitUntil: 'networkidle' })
  await (await settingsAction(page, 'Edit Units')).click()
  assert(!(await unitRow(page, 'Action Unit')), 'Phase 2 object actions: deleted Unit returned after reload.')
  assert(await unitRow(page, 'Progress Unit'), 'Phase 2 object actions: deleting Action Unit disturbed Progress Unit.')

  assert(runtimeErrors.length === 0, `Phase 2 object-action runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('Phase 2 object-action + Section-divergence gate passed: guarded Unit actions → Section-specific progress isolation/reload → Lesson Unplace/reload/Delete/reload → Unit Unplace/reload/Delete/reload.')
} finally {
  await browser.close()
}
