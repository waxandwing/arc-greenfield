import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectCalendarView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function headerAction(page, text) {
  return page.locator('.calendar-context-actions button').filter({ hasText: text })
}

async function settingsAction(page, text) {
  const settings = page.getByRole('button', { name: 'SETTINGS', exact: true })
  if (await settings.getAttribute('aria-expanded') !== 'true') await settings.click()
  return page.locator('aside[aria-label="Settings furniture"]').getByRole('button', { name: text, exact: true })
}

async function seedReferenceWeek(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()

  await (await settingsAction(page, 'Set courses & sections')).click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('Studio Art')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 1')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).nth(1).fill('Period 4')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()

  await (await settingsAction(page, 'Add Units')).click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Color Unit')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

  await (await settingsAction(page, 'Add Lessons')).click()
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
  return documentRect(page.locator('.arc-planner-object'), page)
}

function sameRect(a, b) {
  if (!a || !b) return false
  return ['x', 'y', 'width', 'height'].every((key) => Math.abs(a[key] - b[key]) <= 1)
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

  assert(await page.getByRole('heading', { level: 1, name: 'Teaching week', exact: true }).count() === 1, 'B01: reference state did not reach Week teaching calendar.')
  assert(await page.getByText('Color Unit', { exact: true }).count() > 0, 'B01: representative continuous Unit truth is missing.')
  assert(await page.getByText('Color intro', { exact: true }).count() > 0, 'B01: representative Lesson truth is missing.')
  assert(await page.getByText('Period 1', { exact: true }).count() > 0, 'B01: representative Section row is missing.')

  const settings = page.getByRole('button', { name: 'SETTINGS', exact: true })
  const fridge = page.getByRole('button', { name: 'IDEAS', exact: true })
  const settingsSurface = page.locator('.b01-settings-surface')
  const fridgeSurface = page.locator('.b01-fridge-surface')
  const taskSurface = page.locator('.b01-task-surface')
  const baseline = await calendarRect(page)
  assert(baseline, 'B01: calendar geometry is unavailable.')
  assert(baseline.width >= 1180, `B01: planner object must keep dominant width beside index tabs (${baseline.width}px).`)
  const shellStyle = await page.locator('.b01-calendar-owner > .calendar-canvas').evaluate((node) => {
    const style = getComputedStyle(node)
    return { borderWidth: style.borderWidth, borderRadius: style.borderRadius, backgroundImage: style.backgroundImage, boxShadow: style.boxShadow }
  })
  assert(parseFloat(shellStyle.borderWidth) === 0 && parseFloat(shellStyle.borderRadius) === 0, `B01: legacy bounded notebook shell remains (${JSON.stringify(shellStyle)}).`)
  assert(shellStyle.backgroundImage === 'none' && shellStyle.boxShadow === 'none', `B01: legacy spine or page shadow remains (${JSON.stringify(shellStyle)}).`)
  assert(await taskSurface.evaluate((node) => getComputedStyle(node).visibility) === 'hidden', 'B01: closed Task surface is visibly leaking.')
  await capture(page, '01-all-closed-1440')

  await settings.click()
  assert(sameRect(baseline, await calendarRect(page)), 'B01: Settings opening reflowed the working territory.')
  assert((await settingsSurface.evaluate((node) => getComputedStyle(node).position)) === 'fixed', 'B01: Settings is not a contextual surface.')
  await capture(page, '02-settings-open-1440')
  await page.keyboard.press('Escape')
  assert(await settings.evaluate((node) => document.activeElement === node), 'B01: Escape did not return focus to Settings.')

  await fridge.click()
  assert(sameRect(baseline, await calendarRect(page)), 'B01: Workspace opening reflowed the working territory.')
  assert((await fridgeSurface.evaluate((node) => getComputedStyle(node).visibility)) === 'visible', 'B01: Workspace contextual surface did not open.')
  await capture(page, '03-workspace-open-1440')
  await fridge.click()

  await settings.click()
  await page.getByRole('button', { name: 'Task bar', exact: true }).click()
  assert(sameRect(baseline, await calendarRect(page)), 'B01: Tasks opening reflowed the working territory.')
  assert(await taskSurface.evaluate((node) => getComputedStyle(node).visibility) === 'visible', 'B01: open Task surface is not visible.')
  await capture(page, '04-tasks-open-1440')

  await settings.click()
  await fridge.click()
  const expanded = await Promise.all([settings, fridge].map(async (control) => (await control.getAttribute('aria-expanded')) === 'true'))
  assert(expanded.filter(Boolean).length === 1 && expanded[1], `B01: utility rail must allow one contextual expansion at a time (${expanded}).`)
  assert(sameRect(baseline, await calendarRect(page)), 'B01: contextual switching reflowed the working territory.')
  await capture(page, '05-context-switch-1440')

  await page.setViewportSize({ width: 1280, height: 720 })
  const laptop = await calendarRect(page)
  assert(laptop, 'B01: small-laptop calendar geometry is unavailable.')
  const workspaceRect = await documentRect(fridgeSurface, page)
  assert(workspaceRect && workspaceRect.x >= 0 && workspaceRect.x + workspaceRect.width <= 1280, `B01: contextual Workspace escaped the 1280px viewport (${JSON.stringify(workspaceRect)}).`)
  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `B01: 1280×720 shell overflowed horizontally (${geometry.scroll} > ${geometry.width}).`)
  await capture(page, '06-workspace-open-1280x720')

  assert(runtimeErrors.length === 0, `B01 runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()

  const reduced = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' })
  const reducedPage = await reduced.newPage()
  await reducedPage.goto(baseUrl, { waitUntil: 'networkidle' })
  const taskTransition = await reducedPage.locator('.b01-task-surface').evaluate((node) => getComputedStyle(node).transitionDuration)
  assert(parseFloat(taskTransition) <= 0.01, `B01: reduced-motion Task transition remains active (${taskTransition}).`)
  await reduced.close()

  console.log('B01 current-shell gate passed: representative Week hierarchy, dominant edge-to-edge territory, no notebook spine/page shell, exclusive contextual tools, Escape/focus, 1280×720 containment, reduced motion, and runtime cleanliness.')
} finally {
  await browser.close()
}
