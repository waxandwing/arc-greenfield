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

async function configureCalendar(page, { label = '2026–27', first = '2026-09-02', last = '2027-05-28' } = {}) {
  await page.locator('#school-year-label').fill(label)
  await page.locator('#first-school-day').fill(first)
  await page.locator('#last-school-day').fill(last)
  await page.getByRole('button', { name: 'Use this calendar' }).click()
}

async function selectCalendarView(page, view) {
  await page.getByRole('button', { name: /Change calendar view, current/ }).click()
  const navigation = page.getByRole('navigation', { name: 'Calendar views' })
  assert(await navigation.isVisible(), 'Calendar views: current-view control did not reveal the view choices.')
  await navigation.getByRole('button', { name: view, exact: true }).click()
}

async function openSettingsAction(page, name) {
  const settings = page.getByRole('button', { name: 'Settings', exact: true })
  if (await settings.getAttribute('aria-expanded') !== 'true') await settings.click()
  return page.locator('aside[aria-label="Settings furniture"]').getByRole('button', { name, exact: true })
}

async function auditDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  assert(await page.getByRole('main').count() === 1, 'Desktop: expected exactly one main landmark.')
  assert(await page.getByRole('navigation', { name: 'Calendar views' }).count() === 0, 'Desktop: view choices must not appear as permanent navigation during setup.')
  assert(await page.getByRole('heading', { name: 'Tell Arc which days are actually yours.' }).count() === 1, 'Desktop: calendar setup heading is missing or duplicated.')

  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: /Skip to (calendar|setup)/ })
  assert(await skip.evaluate((node) => document.activeElement === node), 'Keyboard: first Tab must reach the skip link.')
  await page.keyboard.press('Enter')
  assert(await page.locator('#onboarding-stage, #calendar-stage').evaluate((node) => document.activeElement === node), 'Keyboard: skip link must move focus to the active main stage.')

  const save = page.getByRole('button', { name: 'Use this calendar' })
  await save.click()
  const alert = page.getByRole('alert', { name: 'Calendar setup issues' })
  assert(await alert.isVisible(), 'Validation: failed calendar submit must expose an alert summary.')
  assert((await alert.textContent())?.includes('Check these before saving'), 'Validation: alert summary copy missing.')
  assert(await alert.evaluate((node) => document.activeElement === node), 'Validation: failed submit must move focus to the error summary.')

  const schoolYear = page.locator('#school-year-label')
  const firstDay = page.locator('#first-school-day')
  const lastDay = page.locator('#last-school-day')
  for (const [name, field] of [['school year', schoolYear], ['first day', firstDay], ['last day', lastDay]]) {
    assert(await field.getAttribute('aria-invalid') === 'true', `Validation: ${name} is not exposed as invalid.`)
    assert(await field.getAttribute('aria-describedby') === 'calendar-setup-errors', `Validation: ${name} is not connected to the error summary.`)
  }

  await page.getByRole('button', { name: 'Add date' }).click()
  assert(await page.getByLabel('Exception 1 date').count() === 1, 'Dynamic rows: exception date needs contextual accessible naming.')
  assert(await page.getByLabel('Exception 1 type').count() === 1, 'Dynamic rows: exception type needs contextual accessible naming.')
  assert(await page.getByRole('button', { name: 'Remove exception 1' }).count() === 1, 'Dynamic rows: remove action needs contextual accessible naming.')

  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `Desktop: unexpected document horizontal overflow (${geometry.scroll} > ${geometry.width}).`)
  assert(runtimeErrors.length === 0, `Desktop runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditShellHierarchyAndZoom(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await configureCalendar(page)

  assert(await page.getByRole('heading', { level: 1, name: 'Month' }).count() === 1, 'Shell hierarchy: Month must be the single level-one workspace heading.')
  assert(await page.locator('h1').count() === 1, 'Shell hierarchy: expected exactly one h1 after calendar setup.')
  assert(await page.getByRole('button', { name: 'Change calendar view, current Month' }).count() === 1, 'Shell navigation: current view name must be the single always-reachable view switch control.')
  assert(await page.getByRole('group', { name: 'Month date navigation' }).count() === 1, 'Shell semantics: date navigation must be an explicit named control group.')
  assert(await page.getByRole('region', { name: /calendar grid$/ }).count() === 1, 'Shell semantics: Month grid must expose a named region.')
  assert(await page.locator('div[aria-label]:not([role])').count() === 0, 'Shell semantics: generic divs must not rely on aria-label without a semantic role.')

  const switcher = page.getByRole('button', { name: 'Change calendar view, current Month' })
  await switcher.click()
  const viewNavigation = page.getByRole('navigation', { name: 'Calendar views' })
  assert(await viewNavigation.isVisible(), 'Shell navigation: activating current view name must reveal calendar views.')
  const viewNames = await viewNavigation.getByRole('button').allTextContents()
  assert(JSON.stringify(viewNames) === JSON.stringify(['Day', 'Week', 'Month', 'Year']), `Shell navigation: visible product law must be Day/Week/Month/Year (${viewNames.join(', ')}).`)
  await page.keyboard.press('Escape')
  assert(await viewNavigation.count() === 0, 'Shell navigation: Escape must close the view choices.')
  assert(await switcher.evaluate((node) => document.activeElement === node), 'Shell navigation: Escape must restore focus to the current-view control.')

  const options = page.getByText('View options', { exact: true })
  assert(await options.count() === 1, 'Shell hierarchy: View options disclosure is missing or duplicated.')

  await selectCalendarView(page, 'Week')
  assert(await page.getByRole('heading', { level: 1, name: 'Week' }).count() === 1, 'B01 evidence: exact shell artifact must render Week as the level-one workspace heading.')
  assert(await page.getByRole('button', { name: 'Change calendar view, current Week' }).count() === 1, 'B01 evidence: Week must retain the always-reachable current-view switch control.')
  assert(await page.getByRole('group', { name: 'Week date navigation' }).count() === 1, 'B01 evidence: Week date navigation must remain explicitly named.')

  mkdirSync('artifacts', { recursive: true })
  await page.screenshot({ path: 'artifacts/phase1-shell-1280.png', fullPage: true })

  await selectCalendarView(page, 'Month')
  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  const zoom200 = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(zoom200.scroll <= zoom200.width + 1, `200% zoom: document overflowed horizontally (${zoom200.scroll} > ${zoom200.width}).`)
  assert(await page.getByRole('heading', { level: 1, name: 'Month' }).isVisible(), '200% zoom: primary workspace heading became unavailable.')
  assert(await page.getByRole('button', { name: 'Change calendar view, current Month' }).isVisible(), '200% zoom: current-view navigation control became unavailable.')

  await page.evaluate(() => { document.documentElement.style.zoom = '4' })
  const zoom400 = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(zoom400.scroll <= zoom400.width + 1, `400% zoom: document overflowed horizontally (${zoom400.scroll} > ${zoom400.width}).`)
  assert(await page.getByRole('heading', { level: 1, name: 'Month' }).isVisible(), '400% zoom: primary workspace heading became unavailable.')
  assert(await page.getByRole('button', { name: 'Change calendar view, current Month' }).isVisible(), '400% zoom: current-view navigation control became unavailable.')

  assert(runtimeErrors.length === 0, `Shell hierarchy/zoom runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditCalendarEditPreservesContext(browser) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await configureCalendar(page)

  await selectCalendarView(page, 'Week')
  await page.getByRole('button', { name: 'Next Week' }).click()
  const beforeRange = await page.locator('.projection-section').first().getAttribute('aria-label')
  assert(Boolean(beforeRange), 'Calendar edit continuity: Week range did not expose its current anchored range.')

  await (await openSettingsAction(page, 'Calendar dates')).click()
  await page.locator('#last-school-day').fill('2027-06-01')
  await page.getByRole('button', { name: 'Use this calendar' }).click()

  assert(await page.getByRole('heading', { level: 1, name: 'Week' }).count() === 1, 'Calendar edit continuity: saving calendar dates reset the active view instead of preserving Week.')
  const afterRange = await page.locator('.projection-section').first().getAttribute('aria-label')
  assert(afterRange === beforeRange, `Calendar edit continuity: saving calendar dates moved the current Week anchor (${beforeRange} → ${afterRange}).`)
  assert(runtimeErrors.length === 0, `Calendar edit continuity runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditTouchAndReflow(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const save = page.getByRole('button', { name: 'Use this calendar' })
  const box = await save.boundingBox()
  assert(box && box.width >= 44 && box.height >= 44, `Touch: primary setup action is smaller than 44px (${box?.width}×${box?.height}).`)

  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `390px: document overflowed horizontally (${geometry.scroll} > ${geometry.width}).`)
  assert(runtimeErrors.length === 0, `390px runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditMinimumWidth(browser) {
  const context = await browser.newContext({ viewport: { width: 320, height: 700 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `320px: document overflowed horizontally (${geometry.scroll} > ${geometry.width}).`)
  assert(runtimeErrors.length === 0, `320px runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditReducedMotion(browser) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'Reduced motion preference was not exposed to Arc.')
  const timing = await page.getByRole('button', { name: 'Use this calendar' }).evaluate((node) => {
    const style = getComputedStyle(node)
    const max = (value) => Math.max(...value.split(',').map((item) => parseFloat(item) || 0))
    return { animation: max(style.animationDuration), transition: max(style.transitionDuration) }
  })
  assert(timing.animation <= 0.01 && timing.transition <= 0.01, `Reduced motion was not effectively suppressed (${JSON.stringify(timing)}).`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditDesktop(browser)
  await auditShellHierarchyAndZoom(browser)
  await auditCalendarEditPreservesContext(browser)
  await auditTouchAndReflow(browser)
  await auditMinimumWidth(browser)
  await auditReducedMotion(browser)
  console.log('Arc browser accessibility smoke gate passed: landmarks, Day/Week/Month/Year product navigation, exact B01 Week shell evidence, shell hierarchy/semantics, calendar-edit context continuity, initial keyboard order, skip link, validation focus/field semantics, dynamic row names, 200/400% zoom stress, 44px touch target, 320/390 reflow, reduced motion, overflow, and runtime errors.')
} finally {
  await browser.close()
}
