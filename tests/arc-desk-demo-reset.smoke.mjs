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
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible', timeout: 20000 })

  assert(await page.locator('.arc-shell--desk').count() === 1, 'Demo reset must mount the desk shell.')
  const shellWood = await page.locator('.arc-shell--desk').evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(shellWood.includes('texture-wood'), 'Desk shell must use icarus texture-wood after demo reset.')
  const planShellPattern = await page.locator('.arc-shell').first().evaluate((el) => getComputedStyle(el).backgroundImage.includes('pattern'))
  assert(!planShellPattern, 'Legacy cream plan shell pattern must not show after demo reset.')

  await page.screenshot({ path: `${evidenceDir}00-demo-reset-desk-shell.png`, fullPage: true })
  console.log('Arc desk demo reset smoke passed: ?demo=1&demoReset=1 mounts wood desk shell.')
  await context.close()
} finally {
  await browser.close()
}
