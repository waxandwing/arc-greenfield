import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView } from '../tests/helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/green-folders-drawer/', import.meta.url).pathname
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

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(`${baseUrl}?demo=gauntlet`, { waitUntil: 'networkidle' })
  await page.evaluate((deskPrefs) => {
    localStorage.setItem('arc.desk-preferences.v1', deskPrefs)
  }, deskPrefsJson)
  await page.reload({ waitUntil: 'networkidle' })
  await selectView(page, 'Week')
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible', timeout: 20000 })

  await page.getByTestId('arc-desk-folders-tab').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${evidenceDir}01-drawer-retracted.png`, fullPage: true })

  await page.getByTestId('arc-desk-folders-tab').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${evidenceDir}02-drawer-extended.png`, fullPage: true })

  await page.getByRole('button', { name: 'TRAY', exact: true }).click()
  await page.locator('.b01-fridge-owner[data-state="open"]').waitFor({ state: 'attached' })
  await page.screenshot({ path: `${evidenceDir}03-tray-side-panel.png`, fullPage: true })

  console.log(`Green folders drawer evidence in ${evidenceDir}`)
  await context.close()
} finally {
  await browser.close()
}
