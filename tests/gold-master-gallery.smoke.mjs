import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/gold-master/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function assertNoDocumentOverflow(page, label) {
  const geometry = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.client + 2, `${label}: unexpected document horizontal overflow (${geometry.scroll} > ${geometry.client})`)
}

const views = ['week','day','month','quarter','year','unit','ideas','connections','arctable','pocket','settings','onboarding','trust']

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })

  await page.goto(`${baseUrl}/?gallery=gold-master`, { waitUntil: 'networkidle' })
  assert(await page.getByText('23.3 interface × Greenfield brain', { exact: true }).isVisible(), 'Gold Master QA index missing')
  assert(await page.getByText('Arc ≠ ArcTable identity', { exact: true }).isVisible(), 'Gold Master brand rule missing from QA index')
  await page.screenshot({ path: `${evidenceDir}index.png`, fullPage: true })

  for (const view of views) {
    await page.goto(`${baseUrl}/?gold=${view}`, { waitUntil: 'networkidle' })
    assert(await page.locator('.gm-app').count() === 1, `${view}: gold master shell did not render`)
    const qaNav = page.locator('.gm-qa-nav')
    assert(await qaNav.count() === 1, `${view}: QA navigator node missing from fixture`)
    assert(!(await qaNav.isVisible()), `${view}: internal QA navigation leaked into product UI`)
    assert(await page.locator(`.gm-view-${view}`).count() === 1, `${view}: expected view class missing`)
    await page.screenshot({ path: `${evidenceDir}${view}.png`, fullPage: true })
  }

  await page.goto(`${baseUrl}/?gold=week-edit`, { waitUntil: 'networkidle' })
  assert(await page.locator('.gm-inline-create').isVisible(), 'Selected lesson / inline-create state did not render')
  assert(await page.locator('input[value="Gallery Walk"]').isVisible(), 'Inline lesson title field missing')
  await page.screenshot({ path: `${evidenceDir}week-edit.png`, fullPage: true })

  await page.goto(`${baseUrl}/?gold=shift`, { waitUntil: 'networkidle' })
  assert(await page.locator('.gm-shift-panel').isVisible(), 'Shift consequence preview did not render')
  assert(await page.getByText('STAYS FIXED', { exact: true }).isVisible(), 'Shift preview does not expose fixed items')
  assert(await page.getByText('Nothing is overwritten. Taught history does not move.', { exact: false }).isVisible(), 'Shift preview does not communicate protected history')
  await page.screenshot({ path: `${evidenceDir}shift.png`, fullPage: true })

  await page.goto(`${baseUrl}/?gold=week`, { waitUntil: 'networkidle' })
  assert(await page.getByText('October 20 – 24, 2025', { exact: true }).isVisible(), 'Week date range missing')
  assert(await page.getByText('Renaissance Context', { exact: true }).first().isVisible(), 'Week fixture lesson missing')
  const sidepad = page.locator('.gm-sidepad')
  assert(await sidepad.isVisible(), 'Week utility rail missing')
  assert(await sidepad.getByText('TO-DO', { exact: true }).isVisible(), 'Week To-Do pad missing')
  assert(await sidepad.getByText('IDEAS', { exact: true }).isVisible(), 'Week Ideas pad missing')
  assert(await page.getByRole('button', { name: 'ArcTable', exact: false }).count() > 0, 'ArcTable access missing from Arc shell')

  await page.goto(`${baseUrl}/?gold=arctable`, { waitUntil: 'networkidle' })
  assert(await page.getByText('ARCTABLE · LIVE', { exact: true }).isVisible(), 'ArcTable live identity missing')
  assert(await page.getByText('Blind Contour Practice', { exact: true }).isVisible(), 'ArcTable lesson missing')

  await page.goto(`${baseUrl}/?gold=pocket`, { waitUntil: 'networkidle' })
  assert(await page.getByText('Arc Pocket', { exact: true }).isVisible(), 'Pocket title missing')
  assert(await page.getByText('Capture it before it leaves.', { exact: true }).isVisible(), 'Pocket capture state missing')

  assert(errors.length === 0, `Gold Master runtime errors: ${errors.join(' | ')}`)
  await context.close()

  const responsiveCases = [
    { name: 'small-laptop', width: 1280, height: 800, view: 'week' },
    { name: 'tablet', width: 1024, height: 768, view: 'week' },
    { name: 'mobile-today', width: 430, height: 900, view: 'day' },
    { name: 'mobile-pocket', width: 430, height: 900, view: 'pocket' },
  ]

  for (const responsive of responsiveCases) {
    const responsiveContext = await browser.newContext({ viewport: { width: responsive.width, height: responsive.height }, deviceScaleFactor: 1 })
    const responsivePage = await responsiveContext.newPage()
    const responsiveErrors = []
    responsivePage.on('pageerror', error => responsiveErrors.push(`pageerror: ${error.message}`))
    responsivePage.on('console', message => { if (message.type() === 'error') responsiveErrors.push(`console: ${message.text()}`) })
    await responsivePage.goto(`${baseUrl}/?gold=${responsive.view}`, { waitUntil: 'networkidle' })
    assert(await responsivePage.locator('.gm-app').count() === 1, `${responsive.name}: Gold Master did not render`)
    await assertNoDocumentOverflow(responsivePage, responsive.name)
    await responsivePage.screenshot({ path: `${evidenceDir}${responsive.name}.png`, fullPage: true })
    assert(responsiveErrors.length === 0, `${responsive.name}: runtime errors: ${responsiveErrors.join(' | ')}`)
    await responsiveContext.close()
  }
} finally {
  await browser.close()
}

console.log(`Gold Master smoke passed: ${views.length + 3} fixture views + 4 responsive states rendered.`)
