import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const out = 'artifacts/group5-review-pack'
mkdirSync(out, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function headerAction(page, text) {
  return page.locator('.calendar-context-actions button').filter({ hasText: text })
}

async function selectCalendarView(page, view) {
  await page.getByRole('button', { name: /Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name: 'Calendar views' }).getByRole('button', { name: view, exact: true }).click()
}

async function seedPopulatedWeek(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()

  await headerAction(page, 'Set classes').click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('Studio Art')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 1')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).nth(1).fill('Period 4')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()

  await headerAction(page, 'Add Units').click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Color Unit')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

  await headerAction(page, 'Add Lessons').click()
  const add = page.getByRole('button', { name: 'Add Lesson', exact: true })
  await add.click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Color intro')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-15')
  await add.click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Mixing lab')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-16')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()

  await selectCalendarView(page, 'Week')
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
}

async function captureViewport(browser, width, height, label) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width <= 390 })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()) })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await seedPopulatedWeek(page)
  assert(await page.getByRole('heading', { level: 1, name: 'Week', exact: true }).count() === 1, `${label}: populated Week did not render.`)
  assert(await page.getByText('Color Unit', { exact: true }).count() > 0, `${label}: Unit truth missing.`)
  assert(await page.getByText('Color intro', { exact: true }).count() > 0, `${label}: Lesson truth missing.`)

  const calendar = page.locator('.calendar-canvas')
  const baseline = await calendar.boundingBox()
  assert(baseline, `${label}: calendar geometry unavailable.`)

  await page.screenshot({ path: `${out}/${label}-week-closed.png`, fullPage: true })

  const settings = page.getByRole('button', { name: 'Settings', exact: true })
  const fridge = page.getByRole('button', { name: 'Fridge', exact: true })
  const tasks = page.getByRole('button', { name: 'Task Bar', exact: true })
  await settings.click()
  await fridge.click()
  await tasks.click()

  const opened = await calendar.boundingBox()
  assert(opened, `${label}: calendar geometry unavailable after opening furniture.`)
  for (const key of ['x', 'y', 'width', 'height']) {
    assert(Math.abs(baseline[key] - opened[key]) <= 1, `${label}: furniture opening reflowed calendar ${key}.`)
  }

  const geometry = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }))
  assert(geometry.scrollWidth <= geometry.clientWidth + 1, `${label}: horizontal overflow ${geometry.scrollWidth} > ${geometry.clientWidth}.`)
  assert(runtimeErrors.length === 0, `${label}: runtime errors: ${runtimeErrors.join(' | ')}`)

  await page.screenshot({ path: `${out}/${label}-week-all-open.png`, fullPage: true })
  await context.close()
}

const report = {
  exact_head: process.env.GITHUB_SHA ?? 'local',
  automated_status: 'GREEN',
  overall_status: 'RED',
  overall_reason: 'Visual review of the captured review pack is mandatory; automation alone cannot certify Arc Green.',
  classifications: {
    functional_red: [],
    infrastructure_red: [],
    visual_red: ['Pending human comparison to canonical Arc architecture and approved asset references.'],
  },
  captures: [
    '1440x900-week-closed.png', '1440x900-week-all-open.png',
    '1280x720-week-closed.png', '1280x720-week-all-open.png',
    '390x844-week-closed.png', '390x844-week-all-open.png',
  ],
}

let browser
try {
  browser = await chromium.launch({ headless: true })
  await captureViewport(browser, 1440, 900, '1440x900')
  await captureViewport(browser, 1280, 720, '1280x720')
  await captureViewport(browser, 390, 844, '390x844')
  console.log('Group 5 review pack automated gates passed. Overall status remains RED until visual review of the exact-head captures is completed.')
} catch (error) {
  report.automated_status = 'RED'
  report.classifications.functional_red.push(error instanceof Error ? error.message : String(error))
  console.error(error)
  process.exitCode = 1
} finally {
  if (browser) await browser.close()
  writeFileSync(`${out}/qa-status.json`, `${JSON.stringify(report, null, 2)}\n`)
}
