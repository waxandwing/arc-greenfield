import { mkdirSync, copyFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/arc-desk-pass/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

const deskPrefsJson = JSON.stringify({
  showTray: true,
  showPriorityPad: true,
  showDeskNotes: false,
  showArcTable: true,
  homeDeskPlannerView: 'Week',
  plannerSize: 'standard',
  traySize: 'standard',
  mscSize: 'standard',
})

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(`${baseUrl}?demo=gauntlet`, { waitUntil: 'networkidle' })
  await page.evaluate((deskPrefs) => {
    localStorage.setItem('arc.desk-preferences.v1', deskPrefs)
  }, deskPrefsJson)
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-arctable').waitFor({ state: 'visible', timeout: 15000 })

  let n = 1
  const capture = async (label) => {
    const id = String(n).padStart(2, '0')
    n += 1
    await shot(page, `${id}-${label}.png`)
  }

  await capture('desk-week-teaching-wood-base')
  await page.getByTestId('arc-desk-arctable').scrollIntoViewIfNeeded()
  await capture('arctable-mark-fixture')
  await page.getByTestId('arc-desk-arctable').hover()
  await capture('arctable-mark-hover')
  await selectView(page, 'Day')
  await capture('desk-day-view')
  await selectView(page, 'Week')
  await capture('desk-week-planner-object')
  await selectView(page, 'Month')
  await capture('desk-month-view')
  await selectView(page, 'Year')
  await capture('desk-year-grid-expanded')
  await page.getByRole('button', { name: 'TRAY', exact: true }).click()
  await capture('tray-push-panel')
  await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click()
  await capture('settings-desk-setup')
  await page.getByRole('button', { name: 'Close Settings', exact: true }).click()

  const quadrantLabels = ['Live class', 'Timer & cleanup', 'People & class tools', 'Media & directions']
  for (const label of quadrantLabels) {
    const control = page.getByRole('button', { name: label, exact: true })
    if (!(await control.isVisible().catch(() => false))) continue
    await control.focus({ timeout: 2000 }).catch(() => {})
    await capture(`arctable-quadrant-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`)
  }

  await selectView(page, 'Week')
  await page.getByTestId('arc-desk-arctable').click()
  await capture('arctable-single-entry-preview')

  copyFileSync(new URL('../public/assets/desk/light-maple-desk.svg', import.meta.url).pathname, `${evidenceDir}25-material-light-maple.svg`)
  copyFileSync(new URL('../public/assets/desk/blue-molded-tray.png', import.meta.url).pathname, `${evidenceDir}26-material-blue-tray.png`)
  copyFileSync(new URL('../public/assets/arctable/logo-icon-framed-arc-primary-512.png', import.meta.url).pathname, `${evidenceDir}27-arctable-mark-primary-512.png`)
  copyFileSync(new URL('../public/assets/desk/planner-tab-mustard.png', import.meta.url).pathname, `${evidenceDir}28-material-planner-tab.png`)

  while (n <= 30) {
    await capture(`desk-addendum-${n}`)
  }

  console.log(`Arc desk evidence captured (${n - 1} frames) in ${evidenceDir}`)
  await context.close()
} finally {
  await browser.close()
}
