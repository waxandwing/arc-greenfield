import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { retreatToTeachingDayViaDayTab, selectPlanView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/repair-pass-3/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function fixture() {
  const calendarId = 'arc-plan-gauntlet-2026'
  const courses = [
    { id: 'course-apah', title: 'AP Art History' },
    { id: 'course-2d', title: '2D Art 1' },
  ]
  const sections = [
    ['section-p1', 'course-apah', 'Period 1'],
    ['section-p4', 'course-apah', 'Period 4'],
    ['section-p6', 'course-2d', 'Period 6'],
  ].map(([id, courseId, name]) => ({ id, courseId, calendarId, name }))
  const planning = {
    calendarId,
    courses,
    sections,
    teachingDay: {
      blocks: [
        { id: 'b1', label: 'Period 1', type: 'teaching', order: 1, sectionId: 'section-p1', startTime: null, endTime: null },
        { id: 'b2', label: 'Planning', type: 'planning', order: 2, sectionId: null, startTime: null, endTime: null },
        { id: 'b3', label: 'Period 4', type: 'teaching', order: 3, sectionId: 'section-p4', startTime: null, endTime: null },
      ],
    },
    notes: [],
  }
  const calendarInput = {
    id: calendarId,
    schoolYearLabel: '2026–27',
    firstDay: '2026-09-01',
    lastDay: '2027-05-28',
    instructionalWeekdays: [1, 2, 3, 4, 5],
    patternSource: 'manual',
    patternConfidence: 'confirmed',
    exceptions: [],
    quarters: [],
    semesters: [],
    provenance: [],
  }
  return { calendarId, calendarInput, planning }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

const browser = await chromium.launch({ headless: true })
try {
  const data = fixture()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(({ storage }) => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value)
  }, {
    storage: {
      'arc.onboarding.v1': JSON.stringify({ schemaVersion: 1, draft: { stage: 'landed', dismissed: true, firstCapturePromptDismissed: true } }),
      'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-15T12:00:00.000Z', input: data.calendarInput }),
      'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: data.planning }),
      'arc.planning-context.v1': JSON.stringify({
        schemaVersion: 2,
        calendarId: data.calendarId,
        view: 'Day',
        anchorDate: '2026-09-15',
        focus: 'day',
      }),
    },
  })
  await page.reload({ waitUntil: 'networkidle' })

  assert(await page.locator('.arc-header').count() === 0, 'Full-width app header must be removed.')

  // Planner shell wordmark appears in setup modes (desk hides the in-planner chrome).
  const settings = page.getByRole('button', { name: 'SETTINGS', exact: true })
  if ((await settings.getAttribute('aria-expanded')) !== 'true') await settings.click()
  await page.getByRole('button', { name: 'Calendar dates', exact: true }).click()
  await page.getByTestId('planner-shell-bar').waitFor({ timeout: 5000 })
  assert(await page.getByTestId('global-capture-trigger').count() === 0, '+ Capture must be hidden on login/setup planner shell.')

  const logo = page.locator('[data-testid="arc-mark-logo"]')
  assert(await logo.count() === 1, 'Canonical Arc mark must render inside planner shell.')
  assert((await logo.getAttribute('src'))?.includes('/assets/arc/arc-mark-stacked.png'), 'Logo must use Kelly original Arc stacked mark.')
  // Pages base path: src may be `/arc-greenfield/assets/...` or `/assets/...`
  assert((await logo.getAttribute('src'))?.endsWith('/assets/arc/arc-mark-stacked.png'), 'Logo src must stay base-aware for GitHub Pages.')
  const filter = await logo.evaluate((img) => getComputedStyle(img).filter)
  assert(!filter.includes('invert'), 'Canonical mark must not use inverted white substitute.')
  const logoBox = await logo.boundingBox()
  assert(logoBox && logoBox.width >= 56 && logoBox.height >= 56, 'Planner mark must render larger than the prior 48×48 chrome.')
  const slogan = page.getByTestId('arc-mark-slogan')
  assert(await slogan.isVisible(), 'Planner wordmark must include the slogan.')
  assert((await slogan.textContent())?.trim() === 'for plans that change', 'Slogan must be “for plans that change”.')
  await page.getByRole('button', { name: 'Main desk home' }).click()
  await page.getByRole('navigation', { name: 'Planner index' }).waitFor({ timeout: 5000 })
  assert(await page.getByTestId('planner-shell-bar').locator('.arc-wordmark').count() === 0, 'Main desk home must leave setup chrome for the desk table.')
  const afterHome = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
  assert(afterHome.view === 'Week' || afterHome.view === 'Day' || afterHome.view === 'Month', 'Wordmark must land on the home desk planner view.')
  assert(afterHome.view === 'Week', 'Default main desk home must be Teaching week (main table).')

  await selectPlanView(page, 'Day')
  await shot(page, '01-day-no-dark-header.png')

  assert(await page.getByTestId('global-capture-trigger').count() === 0, '+ Capture must stay off planner shell / desk (Quick Capture sticky only).')
  assert(await page.getByTestId('arc-desk-quick-capture-note').isVisible(), 'Desk Quick Capture sticky must be visible on Day.')
  assert(await page.getByText('Try Capture', { exact: true }).count() === 0, 'Permanent Try Capture banner must be removed.')
  const dayTab = page.getByRole('navigation', { name: 'Planner index' }).getByRole('button', { name: 'DAY', exact: true })
  assert(await dayTab.getAttribute('aria-current') === 'page', 'DAY edge tab must be aria-current on Day view.')

  await selectPlanView(page, 'Week')
  await shot(page, '02-week-no-banner.png')
  assert(await page.getByTestId('global-capture-trigger').count() === 0, '+ Capture must stay hidden on Week shell.')
  assert(await page.getByTestId('arc-desk-quick-capture-note').isVisible(), 'Desk Quick Capture sticky must remain on Week.')

  await selectPlanView(page, 'Month')
  await shot(page, '03-month.png')
  await selectPlanView(page, 'Year')
  await shot(page, '04-year.png')

  await selectPlanView(page, 'Day')
  await page.getByRole('button', { name: 'Planning, planning time' }).click()
  await shot(page, '05-planning-period.png')
  assert(await page.getByTestId('global-capture-trigger').count() === 0, '+ Capture must stay hidden on Planning period.')
  const dayTabOnPlanning = page.getByRole('navigation', { name: 'Planner index' }).getByRole('button', { name: 'DAY', exact: true })
  assert(await dayTabOnPlanning.getAttribute('aria-current') === 'page', 'DAY tab must stay aria-current while viewing Day/Planning depth.')

  const qc = page.getByTestId('arc-desk-quick-capture-note')
  await qc.click()
  await qc.fill('Repair pass 3 capture metadata')
  await qc.press('Enter')
  await page.getByTestId('arc-desk-quick-capture-notice').waitFor({ timeout: 3000 })
  const captures = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.captures.v1')))
  const saved = captures.workspace.captures.find((c) => c.text === 'Repair pass 3 capture metadata')
  assert(saved, 'Desk Quick Capture must persist text.')
  await shot(page, '06-capture-success.png')

  await page.getByRole('button', { name: 'IDEAS', exact: true }).evaluate((el) => el.click())
  await shot(page, '07-workspace-captures-first.png')
  await page.getByRole('button', { name: 'Close IDEAS' }).evaluate((el) => el.click())

  await page.evaluate(() => {
    localStorage.removeItem('arc.onboarding.v1')
    localStorage.removeItem('arc.calendar.v1')
    localStorage.removeItem('arc.planningWorkspace.v1')
    localStorage.removeItem('arc.captures.v1')
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Set up my school year' }).click()
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-01')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar' }).click()
  await page.getByRole('button', { name: 'Add a course' }).click()
  await page.locator('.class-course-title input').fill('Studio Art')
  await page.getByRole('button', { name: 'Add a period or section' }).click()
  await page.locator('.class-section-row input').fill('Period 1')
  await page.getByRole('button', { name: 'Save classes' }).click()
  await page.evaluate(() => {
    const raw = localStorage.getItem('arc.onboarding.v1')
    if (!raw) return
    const parsed = JSON.parse(raw)
    parsed.draft.schoolNcesId = 'nces:120144001406'
    localStorage.setItem('arc.onboarding.v1', JSON.stringify(parsed))
  })
  await page.reload({ waitUntil: 'networkidle' })
  assert(await page.getByText(/bell schedule|Build your day manually/).count() > 0, 'School schedule lookup must surface proposal or manual fallback.')
  await shot(page, '08-bell-schedule-lookup.png')

  await page.getByRole('button', { name: 'Add planning' }).click()
  await page.getByRole('button', { name: 'Use this teaching day' }).click()
  await page.getByRole('navigation', { name: 'Planner index' }).waitFor({ timeout: 5000 })
  assert(await page.getByTestId('global-capture-trigger').count() === 0, '+ Capture must stay hidden after onboarding lands on desk.')
  assert(await page.getByTestId('arc-desk-quick-capture-note').isVisible(), 'Desk Quick Capture sticky must be available after onboarding.')
  await shot(page, '09-onboarding-land-day.png')

  await page.evaluate(({ storage }) => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value)
  }, {
    storage: {
      'arc.onboarding.v1': JSON.stringify({ schemaVersion: 1, draft: { stage: 'welcome', dismissed: false, firstCapturePromptDismissed: true } }),
      'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-15T12:00:00.000Z', input: data.calendarInput }),
      'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: data.planning }),
    },
  })
  await page.reload({ waitUntil: 'networkidle' })
  assert(await page.getByRole('heading', { name: 'Arc is where your plan lives when the plan changes.' }).count() === 0, 'Returning user must skip onboarding.')
  await shot(page, '11-returning-user-day.png')

  await retreatToTeachingDayViaDayTab(page)
  await shot(page, '10-class-depth.png')

  await context.close()
  console.log('Repair pass 3 smoke passed.')
} finally {
  await browser.close()
}
