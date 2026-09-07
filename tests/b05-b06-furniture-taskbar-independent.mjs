import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function configureCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()
}

async function documentRect(locator, page) {
  const box = await locator.boundingBox()
  if (!box) return null
  const scroll = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))
  return { x: box.x + scroll.x, y: box.y + scroll.y, width: box.width, height: box.height }
}

function sameRect(a, b) {
  if (!a || !b) return false
  return ['x', 'y', 'width', 'height'].every((key) => Math.abs(a[key] - b[key]) <= 1)
}

async function capture(page, name) {
  mkdirSync('artifacts/b05-b06-independent', { recursive: true })
  await page.screenshot({ path: `artifacts/b05-b06-independent/${name}.png`, fullPage: true })
}

async function assertNoPageOverflow(page, label) {
  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `${label}: document overflow ${geometry.scroll} > ${geometry.width}.`)
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()) })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await configureCalendar(page)

  const calendar = page.locator('.calendar-canvas')
  const settings = page.getByRole('button', { name: 'Settings', exact: true })
  const fridge = page.getByRole('button', { name: 'Fridge', exact: true })
  const tasks = page.getByRole('button', { name: 'Tasks', exact: true })
  const baseline = await documentRect(calendar, page)

  await settings.focus()
  await page.keyboard.press('Space')
  await fridge.focus()
  await page.keyboard.press('Enter')
  await tasks.focus()
  await page.keyboard.press('Space')
  assert(await settings.getAttribute('aria-expanded') === 'true' && await fridge.getAttribute('aria-expanded') === 'true' && await tasks.getAttribute('aria-expanded') === 'true', 'Independent B05: keyboard did not open all three furniture owners.')
  assert(sameRect(baseline, await documentRect(calendar, page)), 'Independent B05: keyboard furniture opening changed calendar geometry.')
  await capture(page, '01-keyboard-all-open-1366')

  const couldLane = page.locator('.taskbar-lane--could')
  const addCould = couldLane.getByRole('button', { name: '+ Add task', exact: true })
  await addCould.focus()
  await page.keyboard.press('Enter')
  const addInput = page.getByRole('textbox', { name: 'Add Could task', exact: true })
  await addInput.fill('Print gallery labels')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  assert(await addCould.evaluate((node) => document.activeElement === node), 'Independent B06: pointer Add completion did not return focus to persistent trigger.')

  let row = couldLane.locator('.taskbar-task').filter({ hasText: 'Print gallery labels' })
  assert(await row.count() === 1, 'Independent B05: Could task was not created exactly once.')
  await row.getByRole('button', { name: 'Important', exact: true }).click()
  await row.getByRole('combobox', { name: 'Move Print gallery labels priority' }).selectOption('must')
  row = page.locator('.taskbar-lane--must .taskbar-task').filter({ hasText: 'Print gallery labels' })
  assert(await row.count() === 1, 'Independent B05: reprioritized task did not move to Must.')
  assert(await row.getByText('Important', { exact: true }).count() === 1, 'Independent B05: Important semantic label was lost during reprioritization.')

  const persistedBeforeClean = await page.evaluate(() => localStorage.getItem('arc.task-bar.v1'))
  await page.getByRole('button', { name: 'Clean Up', exact: true }).click()
  assert(await settings.getAttribute('aria-expanded') === 'false' && await fridge.getAttribute('aria-expanded') === 'false' && await tasks.getAttribute('aria-expanded') === 'false', 'Independent B05: Clean Up did not collapse every furniture owner.')
  assert(await page.locator('#calendar-stage').evaluate((node) => document.activeElement === node), 'Independent B06: Clean Up did not focus calendar stage.')
  assert(await page.evaluate(() => localStorage.getItem('arc.task-bar.v1')) === persistedBeforeClean, 'Independent B05: Clean Up mutated persisted Task Bar truth.')
  assert(sameRect(baseline, await documentRect(calendar, page)), 'Independent B05: Clean Up changed calendar geometry.')

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Tasks', exact: true }).click()
  assert(await page.locator('.taskbar-lane--must .taskbar-task').filter({ hasText: 'Print gallery labels' }).count() === 1, 'Independent B05: Task Bar state did not survive reload.')
  await capture(page, '02-reload-taskbar-1366')
  assert(runtimeErrors.length === 0, `Independent B05/B06 runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()

  const narrow = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const narrowPage = await narrow.newPage()
  const narrowErrors = []
  narrowPage.on('console', (message) => { if (message.type() === 'error') narrowErrors.push(message.text()) })
  narrowPage.on('pageerror', (error) => narrowErrors.push(error.message))
  await narrowPage.goto(baseUrl, { waitUntil: 'networkidle' })
  await narrowPage.getByRole('button', { name: 'Tasks', exact: true }).click()
  assert(await narrowPage.locator('.taskbar-panel').isVisible(), 'Independent B06: Task Bar became unavailable at 390px.')
  const narrowGrid = await narrowPage.locator('.taskbar-panel').evaluate((node) => getComputedStyle(node).gridTemplateColumns)
  assert(!narrowGrid.includes(' ') || narrowGrid.split(' ').length === 1, `Independent B06: narrow Task Bar did not reflow to one column (${narrowGrid}).`)
  const narrowTargets = await narrowPage.locator('.b01-task-surface button, .b01-task-surface input, .b01-task-surface select, .b01-task-tab').evaluateAll((nodes) => nodes.filter((node) => {
    const style = getComputedStyle(node)
    return style.visibility !== 'hidden' && style.display !== 'none'
  }).map((node) => ({ label: node.getAttribute('aria-label') || node.textContent?.trim() || node.tagName, height: node.getBoundingClientRect().height })))
  const narrowShort = narrowTargets.filter(({ height }) => height < 43.5)
  assert(narrowShort.length === 0, `Independent B06: narrow Task Bar controls below 44px: ${JSON.stringify(narrowShort)}`)
  await assertNoPageOverflow(narrowPage, 'Independent B06 390px')
  await capture(narrowPage, '03-taskbar-390x844')
  assert(narrowErrors.length === 0, `Independent B06 narrow runtime errors: ${narrowErrors.join(' | ')}`)
  await narrow.close()

  const zoom = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const zoomPage = await zoom.newPage()
  await zoomPage.goto(baseUrl, { waitUntil: 'networkidle' })
  await zoomPage.getByRole('button', { name: 'Tasks', exact: true }).click()
  await zoomPage.evaluate(() => { document.documentElement.style.zoom = '2' })
  await assertNoPageOverflow(zoomPage, 'Independent B06 200% zoom')
  assert(await zoomPage.getByRole('button', { name: 'Tasks', exact: true }).isVisible(), 'Independent B06: Task Bar trigger disappeared at 200% zoom.')
  await zoomPage.evaluate(() => { document.documentElement.style.zoom = '4' })
  await assertNoPageOverflow(zoomPage, 'Independent B06 400% zoom')
  assert(await zoomPage.getByRole('button', { name: 'Tasks', exact: true }).isVisible(), 'Independent B06: Task Bar trigger disappeared at 400% zoom.')
  await capture(zoomPage, '04-taskbar-400-percent-zoom')
  await zoom.close()

  console.log('B05/B06 independent gate passed: alternate keyboard/pointer path, persisted Task Bar truth, Clean Up non-mutation/focus, 390px reflow/targets, high zoom, geometry invariance, and runtime cleanliness.')
} finally {
  await browser.close()
}
