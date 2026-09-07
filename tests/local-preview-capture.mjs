import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = 'artifacts/local-preview'
mkdirSync(outDir, { recursive: true })

const results = []

function record(name, ok, detail = '') {
  results.push({ name, ok, detail })
}

function trackRuntimeErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

async function assertNoHorizontalOverflow(page, label) {
  const geometry = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }))
  record(`${label} horizontal overflow`, geometry.scroll <= geometry.client + 1, `${geometry.scroll} > ${geometry.client}`)
}

async function configureCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar' }).click()
}

async function selectView(page, view) {
  await page.getByRole('button', { name: /Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name: 'Calendar views' }).getByRole('button', { name: view, exact: true }).click()
}

async function runCase(name, action) {
  try {
    await action()
  } catch (error) {
    record(`${name} capture`, false, error instanceof Error ? error.message : String(error))
  }
}

async function captureEntry(browser, viewport, suffix) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' })
  try {
    const page = await context.newPage()
    const errors = trackRuntimeErrors(page)
    await page.goto(`${baseUrl}/?entry=1`, { waitUntil: 'networkidle' })
    await page.locator('.content').waitFor({ state: 'visible' })
    await page.waitForFunction(() => document.querySelector('.content')?.classList.contains('ready'))
    await page.screenshot({ path: `${outDir}/entry-${suffix}.png`, fullPage: true })
    record(`entry ${suffix} heading`, await page.getByRole('heading', { name: 'Making it make sense.' }).count() === 1, 'approved entry heading missing')
    record(`entry ${suffix} access links`, await page.getByRole('navigation', { name: 'Arc access options' }).count() === 1, 'access links missing')
    await assertNoHorizontalOverflow(page, `entry ${suffix}`)
    record(`entry ${suffix} runtime`, errors.length === 0, errors.join(' | '))
  } finally {
    await context.close()
  }
}

async function capturePlanner(browser, viewport, suffix) {
  const context = await browser.newContext({ viewport })
  try {
    const page = await context.newPage()
    const errors = trackRuntimeErrors(page)
    await page.goto(baseUrl, { waitUntil: 'networkidle' })

    record(`planner ${suffix} shell`, await page.locator('.arc-shell').count() === 1, 'arc shell missing')
    record(`planner ${suffix} setup`, await page.locator('#school-year-label').count() === 1, 'calendar setup did not render')
    await page.screenshot({ path: `${outDir}/planner-setup-${suffix}.png`, fullPage: true })

    await configureCalendar(page)
    await selectView(page, 'Week')
    await page.screenshot({ path: `${outDir}/planner-week-closed-${suffix}.png`, fullPage: true })

    if (suffix !== 'mobile-390') {
      await page.getByRole('button', { name: 'Settings', exact: true }).click()
      await page.getByRole('button', { name: 'Fridge', exact: true }).click()
      await page.getByRole('button', { name: 'Task Bar', exact: true }).click()
      await page.screenshot({ path: `${outDir}/planner-week-all-open-${suffix}.png`, fullPage: true })
      record(`planner ${suffix} settings open`, await page.getByRole('button', { name: 'Settings', exact: true }).getAttribute('aria-expanded') === 'true', 'Settings did not open')
      record(`planner ${suffix} fridge open`, await page.getByRole('button', { name: 'Fridge', exact: true }).getAttribute('aria-expanded') === 'true', 'Fridge did not open')
      record(`planner ${suffix} task bar open`, await page.getByRole('button', { name: 'Task Bar', exact: true }).getAttribute('aria-expanded') === 'true', 'Task Bar did not open')
    }

    await assertNoHorizontalOverflow(page, `planner ${suffix}`)
    record(`planner ${suffix} runtime`, errors.length === 0, errors.join(' | '))
  } finally {
    await context.close()
  }
}

const browser = await chromium.launch({ headless: true })
try {
  await runCase('entry desktop-1440', () => captureEntry(browser, { width: 1440, height: 1000 }, 'desktop-1440'))
  await runCase('entry mobile-390', () => captureEntry(browser, { width: 390, height: 844 }, 'mobile-390'))
  await runCase('planner desktop-1440', () => capturePlanner(browser, { width: 1440, height: 1000 }, 'desktop-1440'))
  await runCase('planner laptop-1280', () => capturePlanner(browser, { width: 1280, height: 800 }, 'laptop-1280'))
  await runCase('planner mobile-390', () => capturePlanner(browser, { width: 390, height: 844 }, 'mobile-390'))
} finally {
  await browser.close()
}

const failed = results.filter((result) => !result.ok)
writeFileSync(`${outDir}/manifest.json`, JSON.stringify({
  baseUrl,
  generatedAt: new Date().toISOString(),
  passed: results.length - failed.length,
  failed: failed.length,
  results,
}, null, 2))

console.log(`Local preview capture complete: ${results.length - failed.length} passed, ${failed.length} failed.`)
if (failed.length) {
  console.error(failed.map((result) => `RED ${result.name}: ${result.detail}`).join('\n'))
  process.exitCode = 1
}
