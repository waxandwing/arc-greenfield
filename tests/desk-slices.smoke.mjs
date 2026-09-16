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
  assert(
    weekBg.includes('planner-edge-tab-active') || weekBg.includes('calendar-tab'),
    'Active WEEK tab must use active edge-tab raster (slice or Kelly calendar-tab).',
  )

  const dayTab = edgeTabs.getByRole('button', { name: 'DAY', exact: true })
  await dayTab.evaluate((el) => el.click())
  assert(await dayTab.getAttribute('aria-current') === 'page', 'DAY must be aria-current=page in Day view.')
  assert(await dayTab.evaluate((el) => el.classList.contains('arc-index-tab--desk-slice-active')), 'DAY must use --desk-slice-active in Day view.')
  const dayBg = await dayTab.evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(
    dayBg.includes('planner-edge-tab-active') || dayBg.includes('calendar-tab'),
    'Active DAY tab must use active edge-tab raster, not inactive crop.',
  )
  assert(!dayBg.includes('planner-edge-tab-day-inactive'), 'DAY must not keep inactive artwork when selected.')

  // One click on YEAR must enter Year Map immediately (not Week-then-Year).
  const yearTab = edgeTabs.getByRole('button', { name: 'YEAR', exact: true })
  await yearTab.evaluate((el) => el.click())
  assert(await yearTab.getAttribute('aria-current') === 'page', 'YEAR must be aria-current=page after one click.')
  assert(
    await page.locator('.b01-furniture-composition--desk').getAttribute('data-year-expanded') === 'true',
    'One YEAR click must expand the year desk stage (not land on Week first).',
  )
  const yearPlanHeader = await page.locator('.plan-state-header').getAttribute('data-plan-view')
  const yearPlanBody = await page.locator('[data-plan-view="Year Map"]').count()
  assert(yearPlanHeader === 'Year Map' || yearPlanBody >= 1, 'One YEAR click must set plan view to Year Map.')

  // DAY/WEEK/MONTH must still select cleanly after Year.
  await dayTab.evaluate((el) => el.click())
  assert(await dayTab.getAttribute('aria-current') === 'page', 'DAY must still select after Year.')
  const weekTabAfter = edgeTabs.getByRole('button', { name: 'WEEK', exact: true })
  await weekTabAfter.evaluate((el) => el.click())
  assert(await weekTabAfter.getAttribute('aria-current') === 'page', 'WEEK must still select after Year.')
  const monthTab = edgeTabs.getByRole('button', { name: 'MONTH', exact: true })
  await monthTab.evaluate((el) => el.click())
  assert(await monthTab.getAttribute('aria-current') === 'page', 'MONTH must still select after Year.')

  await page.getByTestId('calendar-enlarge').evaluate((el) => el.click())
  await page.getByTestId('desk-calendar-popout').waitFor({ state: 'visible' })
  await page.keyboard.press('Escape')
  await page.getByTestId('desk-calendar-popout').waitFor({ state: 'hidden' })

  console.log('desk-slices smoke passed')
} finally {
  await browser.close()
}
