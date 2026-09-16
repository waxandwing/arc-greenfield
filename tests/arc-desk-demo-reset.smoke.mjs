import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/arc-desk-pass/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(`${baseUrl}/?demo=1&demoReset=1`, { waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible', timeout: 30000 })
  await page.getByTestId('desk-planner-head-row').waitFor({ state: 'visible', timeout: 30000 })
  const primaryTitle = page.locator('.desk-planner-head-row .plan-state-primary')
  await primaryTitle.waitFor({ state: 'visible', timeout: 30000 })

  assert(await page.locator('.arc-shell--desk').count() === 1, 'Demo reset must mount the desk shell.')
  assert((await primaryTitle.textContent())?.trim() === 'Teaching week', 'Demo reset must land on Teaching week (Week view), not Month.')
  const kicker = ((await page.getByTestId('desk-planner-week-kicker').count()) ? await page.getByTestId('desk-planner-week-kicker').textContent() : await page.locator('.plan-state-secondary').first().textContent())?.trim()
  assert(kicker === 'SEPTEMBER 7 - 11 • WEEK 4', `Kelly demo week kicker must match comp (got ${kicker ?? 'missing'}).`)
  const shellWood = await page.locator('.arc-shell--desk').evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(shellWood.includes('wood-background-light'), 'Desk shell must use Kelly wood-background-light after demo reset.')
  const planShellPattern = await page.locator('.arc-shell').first().evaluate((el) => getComputedStyle(el).backgroundImage.includes('pattern'))
  assert(!planShellPattern, 'Legacy cream plan shell pattern must not show after demo reset.')

  await page.screenshot({ path: `${evidenceDir}00-demo-reset-desk-shell.png`, fullPage: true })

  await page.evaluate(() => {
    localStorage.setItem(
      'arc.planning-context.v1',
      JSON.stringify({
        schemaVersion: 2,
        calendarId: 'arc-plan-gauntlet-2026',
        view: 'Month',
        anchorDate: '2026-08-07',
        focus: 'day',
      }),
    )
    localStorage.setItem(
      'arc.desk-preferences.v1',
      JSON.stringify({
        showTray: true,
        showPriorityPad: true,
        showDeskNotes: false,
        showArcTable: true,
        homeDeskPlannerView: 'Month',
        plannerSize: 'standard',
        traySize: 'standard',
        mscSize: 'standard',
      }),
    )
  })
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
  await page.getByTestId('desk-planner-head-row').locator('.plan-state-primary').waitFor({ timeout: 15000 })
  assert((await page.locator('.desk-planner-head-row .plan-state-primary').textContent())?.trim() === 'Teaching week')
  const afterStale = ((await page.getByTestId('desk-planner-week-kicker').count()) ? await page.getByTestId('desk-planner-week-kicker').textContent() : await page.locator('.plan-state-secondary').first().textContent())?.trim()
  assert(
    afterStale === 'SEPTEMBER 7 - 11 • WEEK 4',
    `Stale Month/August storage must normalize to Kelly demo week on desk (got ${afterStale ?? 'missing'}).`,
  )

  console.log('Arc desk demo reset smoke passed: ?demo=1&demoReset=1 mounts wood desk shell.')
  await context.close()
} finally {
  await browser.close()
}
