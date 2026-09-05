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

async function keyboardActivate(locator, key = 'Enter') {
  await locator.focus()
  assert(await locator.evaluate((node) => document.activeElement === node), `Keyboard parity: ${await locator.innerText()} did not receive focus.`)
  await locator.press(key)
}

async function settingsAction(page, text) {
  const drawer = page.getByRole('complementary', { name: 'Settings and setup' })
  if (!(await drawer.isVisible().catch(() => false))) {
    await keyboardActivate(page.getByRole('button', { name: 'Settings', exact: true }))
  }
  const button = page.getByRole('complementary', { name: 'Settings and setup' }).getByRole('button', { name: text, exact: true })
  assert(await button.count() === 1, `Keyboard parity: Settings did not expose exactly one ${text} action.`)
  return button
}

async function configureCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
}

async function seedPlanningState(page) {
  await (await settingsAction(page, 'Set courses & sections')).click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('AP Art History')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 2')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()

  await (await settingsAction(page, 'Add Units')).click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Keyboard Unit')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

  await (await settingsAction(page, 'Add Lessons')).click()
  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Move me')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-16')

  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Delete me')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-17')

  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Recovery lesson')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-18')
  const p2 = page.locator('.delivery-row').filter({ hasText: 'Period 2' })
  await p2.getByRole('combobox', { name: 'Status', exact: true }).selectOption('in-progress')
  await p2.getByRole('textbox', { name: 'Actual date', exact: true }).fill('2026-09-18')
  await p2.getByRole('textbox', { name: 'Pick up here', exact: true }).fill('Resume with evidence review.')

  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Recovery follow-up')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-21')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
}

async function selectLessonByKeyboard(page, title) {
  const button = page.getByRole('button', { name: new RegExp(`^${title}`) })
  await keyboardActivate(button)
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).waitFor({ state: 'visible' })
  assert(await page.getByRole('textbox', { name: 'Lesson title', exact: true }).inputValue() === title, `Keyboard parity: Enter did not select ${title}.`)
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await configureCalendar(page)
  await seedPlanningState(page)
  mkdirSync('artifacts/phase2-behavior', { recursive: true })

  assert(await page.locator('[draggable="true"]').count() === 0, 'Keyboard parity: current planning surface unexpectedly exposes a draggable-only planning control.')

  await keyboardActivate(await settingsAction(page, 'Edit Lessons'))
  await selectLessonByKeyboard(page, 'Recovery lesson')
  await page.screenshot({ path: 'artifacts/phase2-behavior/lesson-editor-1366.png', fullPage: true })
  await selectLessonByKeyboard(page, 'Move me')
  const plannedDate = page.getByRole('textbox', { name: 'Planned date', exact: true })
  await plannedDate.focus()
  await plannedDate.fill('2026-09-22')
  assert(await plannedDate.inputValue() === '2026-09-22', 'Keyboard parity: focused date input could not move a Lesson.')
  await keyboardActivate(page.getByRole('button', { name: 'Save Lessons', exact: true }))

  await page.reload({ waitUntil: 'networkidle' })
  await keyboardActivate(await settingsAction(page, 'Edit Lessons'))
  await selectLessonByKeyboard(page, 'Move me')
  assert(await page.getByRole('textbox', { name: 'Planned date', exact: true }).inputValue() === '2026-09-22', 'Keyboard parity: keyboard-driven Lesson move did not survive reload.')

  await keyboardActivate(page.getByRole('button', { name: 'Unplace', exact: true }))
  assert(await page.getByRole('textbox', { name: 'Planned date', exact: true }).inputValue() === '', 'Keyboard parity: keyboard Unplace did not clear Lesson placement.')
  await keyboardActivate(page.getByRole('button', { name: 'Save Lessons', exact: true }))

  await page.reload({ waitUntil: 'networkidle' })
  await keyboardActivate(await settingsAction(page, 'Edit Lessons'))
  await selectLessonByKeyboard(page, 'Move me')
  assert(await page.getByRole('textbox', { name: 'Planned date', exact: true }).inputValue() === '', 'Keyboard parity: keyboard Unplace did not survive reload.')

  await selectLessonByKeyboard(page, 'Delete me')
  await keyboardActivate(page.getByRole('button', { name: 'Unplace', exact: true }))
  await keyboardActivate(page.getByRole('button', { name: 'Delete', exact: true }))
  assert((await page.getByRole('status').innerText()).includes('Lesson deleted'), 'Keyboard parity: keyboard Delete did not report success.')
  await keyboardActivate(page.getByRole('button', { name: 'Save Lessons', exact: true }))

  await page.reload({ waitUntil: 'networkidle' })
  await keyboardActivate(await settingsAction(page, 'Edit Lessons'))
  assert(await page.getByRole('button', { name: /^Delete me/ }).count() === 0, 'Keyboard parity: keyboard-deleted Lesson returned after reload.')
  await keyboardActivate(page.getByRole('button', { name: 'Cancel', exact: true }))

  await keyboardActivate(await settingsAction(page, 'Review recovery (1)'))
  const recoveryCard = page.locator('.recovery-card').filter({ hasText: 'Recovery lesson' })
  assert(await recoveryCard.count() === 1, 'Keyboard parity: keyboard Recovery review did not expose the interrupted Lesson.')
  await page.screenshot({ path: 'artifacts/phase2-behavior/recovery-review-1366.png', fullPage: true })
  const moveSelect = recoveryCard.getByRole('combobox', { name: 'Move to', exact: true })
  await moveSelect.focus()
  const destination = await moveSelect.locator('option:not([disabled])').evaluateAll((nodes) => nodes.map((node) => node.value).find(Boolean) ?? '')
  assert(Boolean(destination), 'Keyboard parity: Recovery offered no keyboard-selectable destination.')
  await moveSelect.selectOption(destination)
  await keyboardActivate(recoveryCard.getByRole('button', { name: 'Apply Shift', exact: true }))
  assert(await (await settingsAction(page, 'Undo last Shift')).count() === 1, 'Keyboard parity: keyboard Apply did not expose Undo.')
  await keyboardActivate(page.getByRole('complementary', { name: 'Settings and setup' }).getByRole('button', { name: 'Undo last Shift', exact: true }))
  await keyboardActivate(page.getByRole('button', { name: 'Settings', exact: true }))
  assert(await page.getByRole('button', { name: 'Undo last Shift', exact: true }).count() === 0, 'Keyboard parity: keyboard Undo did not consume the Undo token.')
  await keyboardActivate(page.getByRole('button', { name: 'Close Settings', exact: true }))

  await page.reload({ waitUntil: 'networkidle' })
  await keyboardActivate(page.getByRole('button', { name: 'Settings', exact: true }))
  assert(await page.getByRole('button', { name: 'Undo last Shift', exact: true }).count() === 0, 'Keyboard parity: consumed keyboard Undo returned after reload.')
  assert(runtimeErrors.length === 0, `Phase 2 keyboard/non-drag runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('Phase 2 non-drag keyboard parity gate passed: current planner has no drag-required mutation route; keyboard focus/activation supports Lesson move, Unplace, Delete, Recovery Apply, Undo, reload persistence, and exact behavior-surface screenshots.')
} finally {
  await browser.close()
}
