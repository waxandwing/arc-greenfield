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
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()

  await headerAction(page, 'Add Units').click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Color Unit')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

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

function sameRect(a, b) {
  if (!a || !b) return false
  return ['x', 'y', 'width', 'height'].every((key) => Math.abs(a[key] - b[key]) <= 1)
}

function assertOutside(calendar, surface, side, label) {
  assert(calendar && surface, `B05: ${label} geometry unavailable.`)
  const calendarRight = calendar.x + calendar.width
  const calendarBottom = calendar.y + calendar.height
  const surfaceRight = surface.x + surface.width
  const outside = side === 'left'
    ? surfaceRight <= calendar.x + 1
    : side === 'right'
      ? surface.x >= calendarRight - 1
      : surface.y >= calendarBottom - 1
  assert(outside, `B05: ${label} overlaps calendar. calendar=${JSON.stringify(calendar)} surface=${JSON.stringify(surface)}`)
}

async function capture(page, name) {
  mkdirSync('artifacts/b05-b06', { recursive: true })
  await page.screenshot({ path: `artifacts/b05-b06/${name}.png`, fullPage: true })
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

  const calendar = page.locator('.calendar-canvas')
  const settings = page.getByRole('button', { name: 'Settings', exact: true })
  const fridge = page.getByRole('button', { name: 'Fridge', exact: true })
  const tasks = page.getByRole('button', { name: 'Tasks', exact: true })
  const baseline = await documentRect(calendar, page)
  assert(baseline, 'B05: calendar geometry unavailable at baseline.')

  await tasks.click()
  assert(sameRect(baseline, await documentRect(calendar, page)), 'B05: opening Task Bar reflowed calendar.')
  await capture(page, '01-taskbar-empty-1440')

  const mustAdd = page.locator('.taskbar-lane--must').getByRole('button', { name: '+ Add task', exact: true })
  await mustAdd.click()
  const mustInput = page.getByRole('textbox', { name: 'Add Must task', exact: true })
  await mustInput.fill('Cancelled draft')
  await mustInput.press('Escape')
  assert(await mustAdd.evaluate((node) => document.activeElement === node), 'B06: cancelling task add did not restore focus to Add task trigger.')
  assert(await page.getByText('Cancelled draft', { exact: true }).count() === 0, 'B05: cancelled task draft was committed.')

  await mustAdd.click()
  await page.getByRole('textbox', { name: 'Add Must task', exact: true }).fill('Call parent')
  await page.getByRole('textbox', { name: 'Add Must task', exact: true }).press('Enter')
  assert(await mustAdd.evaluate((node) => document.activeElement === node), 'B06: successful task add did not restore focus to Add task trigger.')

  let task = page.locator('.taskbar-task').filter({ hasText: 'Call parent' })
  assert(await task.count() === 1, 'B05: created task is missing or duplicated.')
  const important = task.getByRole('button', { name: 'Important', exact: true })
  await important.click()
  task = page.locator('.taskbar-task').filter({ hasText: 'Call parent' })
  assert(await task.getByText('Important', { exact: true }).count() === 1, 'B05: Important state lacks visible non-color text.')
  assert(await task.getByRole('button', { name: /Important/ }).getAttribute('aria-pressed') === 'true', 'B06: Important toggle did not expose pressed state.')
  const ring = await task.evaluate((node) => {
    const style = getComputedStyle(node, '::after')
    return { content: style.content, border: style.borderTopWidth, pointerEvents: style.pointerEvents }
  })
  assert(ring.content !== 'none' && parseFloat(ring.border) >= 1, 'B05: Important task does not render visible ring emphasis.')
  assert(ring.pointerEvents === 'none', 'B05: Important ring intercepts interaction.')

  await task.getByRole('combobox', { name: 'Move Call parent priority' }).selectOption('should')
  task = page.locator('.taskbar-lane--should .taskbar-task').filter({ hasText: 'Call parent' })
  assert(await task.count() === 1, 'B05: task did not move to Should lane.')
  await task.getByRole('checkbox').check()
  assert(await task.evaluate((node) => node.classList.contains('taskbar-task--completed')), 'B05: completed task lacks completion treatment.')

  const editButton = task.getByRole('button', { name: 'Edit task Call parent', exact: true })
  await editButton.click()
  const editInput = task.getByRole('textbox', { name: 'Edit task Call parent', exact: true })
  await editInput.fill('Call parent before lunch')
  await editInput.press('Enter')
  const renamed = page.locator('.taskbar-lane--should .taskbar-task').filter({ hasText: 'Call parent before lunch' })
  assert(await renamed.count() === 1, 'B05: task rename did not commit.')
  assert(await renamed.getByRole('button', { name: 'Edit task Call parent before lunch', exact: true }).evaluate((node) => document.activeElement === node), 'B06: keyboard task edit did not restore focus to persistent edit trigger.')

  await capture(page, '02-taskbar-populated-1440')
  const savedTaskBar = await page.evaluate(() => localStorage.getItem('arc.task-bar.v1'))
  assert(savedTaskBar && savedTaskBar.includes('Call parent before lunch'), 'B05: Task Bar did not persist canonical local state.')

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Tasks', exact: true }).click()
  task = page.locator('.taskbar-lane--should .taskbar-task').filter({ hasText: 'Call parent before lunch' })
  assert(await task.count() === 1, 'B05: task did not survive reload in Should lane.')
  assert(await task.evaluate((node) => node.classList.contains('taskbar-task--completed') && node.classList.contains('taskbar-task--important')), 'B05: completion/Important state did not survive reload.')

  const reloadedBaseline = await documentRect(calendar, page)
  await settings.click()
  await fridge.click()
  assert(await tasks.getAttribute('aria-expanded') === 'true', 'B05: Task Bar unexpectedly closed before all-open test.')
  const allOpenCalendar = await documentRect(calendar, page)
  assert(sameRect(reloadedBaseline, allOpenCalendar), 'B05: all-open furniture reflowed calendar.')
  assertOutside(allOpenCalendar, await documentRect(page.locator('.b01-settings-surface'), page), 'left', 'Settings')
  assertOutside(allOpenCalendar, await documentRect(page.locator('.b01-fridge-surface'), page), 'right', 'Fridge')
  assertOutside(allOpenCalendar, await documentRect(page.locator('.b01-task-surface'), page), 'bottom', 'Task Bar')
  await capture(page, '03-all-open-1440')

  const taskStateBeforeCleanUp = await page.evaluate(() => localStorage.getItem('arc.task-bar.v1'))
  const cleanUp = page.getByRole('button', { name: 'Clean Up', exact: true })
  await cleanUp.focus()
  await page.keyboard.press('Enter')
  assert(await settings.getAttribute('aria-expanded') === 'false', 'B05: Clean Up did not close Settings.')
  assert(await fridge.getAttribute('aria-expanded') === 'false', 'B05: Clean Up did not close Fridge.')
  assert(await tasks.getAttribute('aria-expanded') === 'false', 'B05: Clean Up did not close Task Bar.')
  assert(await page.locator('#calendar-stage').evaluate((node) => document.activeElement === node), 'B06: Clean Up did not return focus to calendar.')
  assert(sameRect(reloadedBaseline, await documentRect(calendar, page)), 'B05: Clean Up changed calendar geometry.')
  assert(await page.evaluate(() => localStorage.getItem('arc.task-bar.v1')) === taskStateBeforeCleanUp, 'B05: Clean Up mutated Task Bar state.')
  await capture(page, '04-clean-up-1440')

  await page.setViewportSize({ width: 1280, height: 720 })
  await settings.click()
  await fridge.click()
  await tasks.click()
  const laptopCalendar = await documentRect(calendar, page)
  assertOutside(laptopCalendar, await documentRect(page.locator('.b01-settings-surface'), page), 'left', '1280 Settings')
  assertOutside(laptopCalendar, await documentRect(page.locator('.b01-fridge-surface'), page), 'right', '1280 Fridge')
  assertOutside(laptopCalendar, await documentRect(page.locator('.b01-task-surface'), page), 'bottom', '1280 Task Bar')
  const laptopGeometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(laptopGeometry.scroll <= laptopGeometry.width + 1, `B06: 1280 shell horizontal overflow (${laptopGeometry.scroll} > ${laptopGeometry.width}).`)
  const targets = await page.locator('.b01-task-surface button, .b01-task-surface input, .b01-task-surface select, .b05-clean-up').evaluateAll((nodes) => nodes.filter((node) => {
    const style = getComputedStyle(node)
    return style.visibility !== 'hidden' && style.display !== 'none'
  }).map((node) => ({ label: node.getAttribute('aria-label') || node.textContent?.trim() || node.tagName, rect: node.getBoundingClientRect().toJSON() })))
  const shortTargets = targets.filter(({ rect }) => rect.height < 43.5)
  assert(shortTargets.length === 0, `B06: Task Bar controls below 44px target baseline: ${JSON.stringify(shortTargets)}`)
  await capture(page, '05-all-open-1280x720')

  assert(runtimeErrors.length === 0, `B05/B06 runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()

  const reduced = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' })
  const reducedPage = await reduced.newPage()
  await reducedPage.goto(baseUrl, { waitUntil: 'networkidle' })
  const transition = await reducedPage.locator('.b01-task-surface').evaluate((node) => getComputedStyle(node).transitionDuration)
  assert(parseFloat(transition) <= 0.01, `B06: reduced-motion Task Bar transition remains active (${transition}).`)
  await reduced.close()

  console.log('B05/B06 primary gate passed: Task Bar CRUD/priority/Important/completion/persistence, focus lifecycle, Clean Up non-mutation, fixed furniture geometry, 1280 targets/overflow, reduced motion, and runtime cleanliness.')
} finally {
  await browser.close()
}
