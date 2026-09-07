import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

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

async function seedReferenceWeek(page) {
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

async function documentRect(locator, page) {
  const box = await locator.boundingBox()
  if (!box) return null
  const scroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))
  return { x: box.x + scroll.x, y: box.y + scroll.y, width: box.width, height: box.height }
}

async function calendarRect(page) {
  return documentRect(page.locator('.calendar-canvas'), page)
}

function sameRect(a, b) {
  if (!a || !b) return false
  return ['x', 'y', 'width', 'height'].every((key) => Math.abs(a[key] - b[key]) <= 1)
}

function assertOutside(calendar, surface, side, label) {
  assert(calendar && surface, `B01: ${label} geometry is unavailable.`)
  const calendarRight = calendar.x + calendar.width
  const calendarBottom = calendar.y + calendar.height
  const surfaceRight = surface.x + surface.width
  const outside = side === 'left'
    ? surfaceRight <= calendar.x + 1
    : side === 'right'
      ? surface.x >= calendarRight - 1
      : surface.y >= calendarBottom - 1
  assert(outside, `B01: ${label} overlaps the Calendar Shell. calendar=${JSON.stringify(calendar)} surface=${JSON.stringify(surface)}`)
}

async function capture(page, name) {
  mkdirSync('artifacts/b01-furniture', { recursive: true })
  await page.screenshot({ path: `artifacts/b01-furniture/${name}.png`, fullPage: true })
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()) })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await seedReferenceWeek(page)

  assert(await page.getByRole('heading', { level: 1, name: 'Week', exact: true }).count() === 1, 'B01: reference state did not reach Week.')
  assert(await page.getByText('Color Unit', { exact: true }).count() > 0, 'B01: representative continuous Unit truth is missing.')
  assert(await page.getByText('Color intro', { exact: true }).count() > 0, 'B01: representative Lesson truth is missing.')
  assert(await page.getByText('Period 1', { exact: true }).count() > 0, 'B01: representative Section row is missing.')

  const settings = page.getByRole('button', { name: 'Settings', exact: true })
  const fridge = page.getByRole('button', { name: 'Fridge', exact: true })
  const tasks = page.getByRole('button', { name: 'Tasks', exact: true })
  const settingsSurface = page.locator('.b01-settings-surface')
  const fridgeSurface = page.locator('.b01-fridge-surface')
  const taskSurface = page.locator('.b01-task-surface')
  const baseline = await calendarRect(page)
  assert(baseline, 'B01: calendar geometry is unavailable.')
  assert(await taskSurface.evaluate((node) => getComputedStyle(node).visibility) === 'hidden', 'B01: closed Task surface is visibly leaking.')
  await capture(page, '01-all-closed-1440')

  await settings.click()
  assert(sameRect(baseline, await calendarRect(page)), 'B01: Settings opening reflowed the Calendar Shell.')
  assertOutside(await calendarRect(page), await documentRect(settingsSurface, page), 'left', 'Settings surface')
  await capture(page, '02-settings-open-1440')
  await page.keyboard.press('Escape')
  assert(await settings.evaluate((node) => document.activeElement === node), 'B01: Escape did not return focus to Settings.')

  await fridge.click()
  assert(sameRect(baseline, await calendarRect(page)), 'B01: Fridge opening reflowed the Calendar Shell.')
  assertOutside(await calendarRect(page), await documentRect(fridgeSurface, page), 'right', 'Fridge surface')
  await capture(page, '03-fridge-open-1440')
  await fridge.click()

  await tasks.click()
  assert(sameRect(baseline, await calendarRect(page)), 'B01: Task Bar opening reflowed the Calendar Shell.')
  assert(await taskSurface.evaluate((node) => getComputedStyle(node).visibility) === 'visible', 'B01: open Task surface is not visible.')
  assertOutside(await calendarRect(page), await documentRect(taskSurface, page), 'bottom', 'Task Bar surface')
  await capture(page, '04-tasks-open-1440')

  await settings.click()
  await fridge.click()
  const allOpenCalendar = await calendarRect(page)
  assert(sameRect(baseline, allOpenCalendar), 'B01: all-open furniture reflowed the Calendar Shell.')
  assertOutside(allOpenCalendar, await documentRect(settingsSurface, page), 'left', 'all-open Settings surface')
  assertOutside(allOpenCalendar, await documentRect(fridgeSurface, page), 'right', 'all-open Fridge surface')
  assertOutside(allOpenCalendar, await documentRect(taskSurface, page), 'bottom', 'all-open Task Bar surface')
  await capture(page, '05-all-open-1440')

  await page.setViewportSize({ width: 1280, height: 720 })
  const laptop = await calendarRect(page)
  assert(laptop, 'B01: small-laptop calendar geometry is unavailable.')
  assertOutside(laptop, await documentRect(settingsSurface, page), 'left', '1280 Settings surface')
  assertOutside(laptop, await documentRect(fridgeSurface, page), 'right', '1280 Fridge surface')
  assertOutside(laptop, await documentRect(taskSurface, page), 'bottom', '1280 Task Bar surface')
  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `B01: 1280×720 shell overflowed horizontally (${geometry.scroll} > ${geometry.width}).`)
  await capture(page, '06-all-open-1280x720')

  assert(runtimeErrors.length === 0, `B01 runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()

  const reduced = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' })
  const reducedPage = await reduced.newPage()
  await reducedPage.goto(baseUrl, { waitUntil: 'networkidle' })
  const taskTransition = await reducedPage.locator('.b01-task-surface').evaluate((node) => getComputedStyle(node).transitionDuration)
  assert(parseFloat(taskTransition) <= 0.01, `B01: reduced-motion Task transition remains active (${taskTransition}).`)
  await reduced.close()

  console.log('B01 furniture gate passed: representative Week hierarchy, fixed calendar geometry, explicit non-overlap for all furniture states, closed Task containment, Escape/focus, 1280×720 overflow, reduced motion, and runtime cleanliness.')
} finally {
  await browser.close()
}
