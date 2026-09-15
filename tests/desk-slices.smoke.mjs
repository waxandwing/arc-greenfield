import { existsSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const manifest = JSON.parse(
  readFileSync(new URL('../public/assets/desk/slices/manifest.json', import.meta.url), 'utf8'),
)

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

for (const slice of manifest.slices) {
  const path = new URL(`../public/assets/desk/slices/${slice.file}`, import.meta.url).pathname
  assert(existsSync(path), `Missing slice asset: ${slice.file}`)
}

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${baseUrl}?demo=1&demoReset=1&deskSlices=1`, { waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tabletop').waitFor({ state: 'visible', timeout: 30000 })

  await page.getByTestId('desk-slice-ideas-drawer').waitFor({ state: 'attached' })
  await page.getByTestId('desk-slice-todos-body').waitFor({ state: 'attached' })
  await page.getByTestId('desk-planner-frame-slices').waitFor({ state: 'attached' })
  await page.getByTestId('desk-slice-start-class-frame').waitFor({ state: 'attached' })

  const edgeTabs = page.locator('.arc-planner-physical-tabs--desk-edge[data-desk-slices="true"]')
  assert(await edgeTabs.count() === 1, 'Planner edge tabs must use slice stack when enabled.')
  const weekTab = edgeTabs.getByRole('button', { name: 'WEEK' })
  const weekBg = await weekTab.evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(weekBg.includes('planner-edge-tab-active'), 'Active WEEK tab must use active slice raster.')

  await page.getByTestId('calendar-enlarge').evaluate((el) => el.click())
  await page.getByTestId('desk-calendar-popout').waitFor({ state: 'visible' })
  await page.keyboard.press('Escape')
  await page.getByTestId('desk-calendar-popout').waitFor({ state: 'hidden' })

  console.log('desk-slices smoke passed')
} finally {
  await browser.close()
}
