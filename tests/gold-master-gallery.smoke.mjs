import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/gold-master/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const views = ['week','day','month','quarter','year','unit','ideas','connections','arctable','pocket','settings','onboarding','trust']

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })

  for (const view of views) {
    await page.goto(`${baseUrl}/?gold=${view}`, { waitUntil: 'networkidle' })
    assert(await page.locator('.gm-app').count() === 1, `${view}: gold master shell did not render`)
    assert(await page.locator('.gm-qa-nav').count() === 1, `${view}: QA route navigator missing`)
    assert(await page.locator(`.gm-view-${view}`).count() === 1, `${view}: expected view class missing`)
    await page.screenshot({ path: `${evidenceDir}${view}.png`, fullPage: true })
  }

  await page.goto(`${baseUrl}/?gold=week`, { waitUntil: 'networkidle' })
  assert(await page.getByText('October 20 – 24, 2025', { exact: true }).isVisible(), 'Week date range missing')
  assert(await page.getByText('Renaissance Context', { exact: true }).first().isVisible(), 'Week fixture lesson missing')
  assert(await page.getByText('TO-DO', { exact: true }).isVisible(), 'Week To-Do pad missing')
  assert(await page.getByText('IDEAS', { exact: true }).isVisible(), 'Week Ideas pad missing')
  assert(await page.getByRole('button', { name: 'ArcTable', exact: false }).count() > 0, 'ArcTable access missing from Arc shell')

  await page.goto(`${baseUrl}/?gold=arctable`, { waitUntil: 'networkidle' })
  assert(await page.getByText('ARCTABLE · LIVE', { exact: true }).isVisible(), 'ArcTable live identity missing')
  assert(await page.getByText('Blind Contour Practice', { exact: true }).isVisible(), 'ArcTable lesson missing')

  await page.goto(`${baseUrl}/?gold=pocket`, { waitUntil: 'networkidle' })
  assert(await page.getByText('Arc Pocket', { exact: true }).isVisible(), 'Pocket title missing')
  assert(await page.getByText('Capture it before it leaves.', { exact: true }).isVisible(), 'Pocket capture state missing')

  assert(errors.length === 0, `Gold Master runtime errors: ${errors.join(' | ')}`)
  await context.close()
} finally {
  await browser.close()
}

console.log(`Gold Master smoke passed: ${views.length} fixture views rendered.`)
