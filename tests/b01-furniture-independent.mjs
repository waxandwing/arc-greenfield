import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function headerAction(page, text) {
  return page.locator('.calendar-context-actions button').filter({ hasText: text })
}

async function selectView(page, view) {
  const switcher = page.getByRole('button', { name: /Change calendar view, current/ })
  await switcher.focus()
  await switcher.press('Enter')
  const choice = page.getByRole('navigation', { name: 'Calendar views' }).getByRole('button', { name: view, exact: true })
  await choice.focus()
  await choice.press('Enter')
}

async function seed(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()

  await headerAction(page, 'Set classes').click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('AP Art History')
  for (const period of ['Period 2', 'Period 5']) {
    await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
    await page.getByRole('textbox', { name: 'Period or section', exact: true }).last().fill(period)
  }
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()

  await headerAction(page, 'Add Units').click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Ancient Egypt')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

  await headerAction(page, 'Add Lessons').click()
  const add = page.getByRole('button', { name: 'Add Lesson', exact: true })
  await add.click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Temple lesson')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-15')
  await add.click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Image comparison')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-17')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()

  await selectView(page, 'Week')
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()) })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await seed(page)

  assert(await page.getByText('Ancient Egypt', { exact: true }).count() > 0, 'B01-B: Unit truth missing from alternate Week.')
  assert(await page.getByText('Temple lesson', { exact: true }).count() > 0, 'B01-B: Lesson truth missing from alternate Week.')
  assert(await page.getByText('Period 5', { exact: true }).count() > 0, 'B01-B: second Section row missing from alternate Week.')

  const calendarBefore = await page.locator('.calendar-canvas').boundingBox()
  const settings = page.getByRole('button', { name: 'Settings', exact: true })
  const fridge = page.getByRole('button', { name: 'Fridge', exact: true })
  const tasks = page.getByRole('button', { name: 'Tasks', exact: true })

  for (const control of [tasks, fridge, settings]) {
    const box = await control.boundingBox()
    assert(box && box.width >= 44 && box.height >= 44, `B01-B: furniture trigger is below 44px target (${box?.width ?? 0}×${box?.height ?? 0}).`)
    await control.focus()
    await control.press('Enter')
    assert(await control.getAttribute('aria-expanded') === 'true', 'B01-B: keyboard did not open a furniture owner.')
  }

  const calendarAfter = await page.locator('.calendar-canvas').boundingBox()
  assert(calendarBefore && calendarAfter && Math.abs(calendarBefore.x - calendarAfter.x) <= 1 && Math.abs(calendarBefore.y - calendarAfter.y) <= 1 && Math.abs(calendarBefore.width - calendarAfter.width) <= 1 && Math.abs(calendarBefore.height - calendarAfter.height) <= 1, 'B01-B: alternate all-open path changed calendar geometry.')

  const doc = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(doc.scroll <= doc.width + 1, `B01-B: 1366×768 all-open path overflowed (${doc.scroll} > ${doc.width}).`)

  mkdirSync('artifacts/b01-furniture-independent', { recursive: true })
  await page.screenshot({ path: 'artifacts/b01-furniture-independent/all-open-1366x768.png', fullPage: true })

  await page.keyboard.press('Escape')
  assert(await settings.getAttribute('aria-expanded') === 'false', 'B01-B: Escape did not close the last-open Settings owner.')
  assert(await settings.evaluate((node) => document.activeElement === node), 'B01-B: Escape did not return focus to the last-open owner.')
  assert(runtimeErrors.length === 0, `B01-B runtime errors: ${runtimeErrors.join(' | ')}`)

  await context.close()
  console.log('Independent B01 audit B passed: alternate AP Art History Week, reverse-order keyboard furniture opening, 44px targets, fixed calendar geometry, 1366×768 overflow, Escape/focus, and runtime cleanliness.')
} finally {
  await browser.close()
}
