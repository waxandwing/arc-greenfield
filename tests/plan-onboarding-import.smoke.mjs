import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/plan-onboarding-import/', import.meta.url).pathname
const reuseDir = new URL('../docs/overnight/evidence/import-onboarding/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

function reuseShot(name) {
  const source = `${reuseDir}${name}`
  const target = `${evidenceDir}${name}`
  if (existsSync(source) && !existsSync(target)) copyFileSync(source, target)
}

async function openSettings(page) {
  const button = page.getByRole('button', { name: 'SETTINGS', exact: true })
  if (await button.getAttribute('aria-expanded') !== 'true') await button.click()
}

const csv = 'Course,Order,Unit,Unit Length,Item Type,Title,Item Length,Content/Resources,Homework/Next Up,Important Notes\nAP Art History,1,Looking & Meaning,2 weeks,Lesson,Reading images,45 min,https://example.com/images,Compare two works,Model evidence first\nAP Art History,2,Looking & Meaning,2 weeks,Lesson,Formal analysis relay,45 min,,Bring notes,Use partner talk'

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  // 1 — onboarding composed in Arc Plan shell (not isolated onboarding-shell)
  assert(await page.locator('.onboarding-shell').count() === 0, 'First run must use the shared Arc Plan shell, not a separate onboarding shell.')
  assert(await page.locator('#calendar-stage').count() === 1, 'Onboarding must live inside #calendar-stage.')
  assert(await page.getByRole('heading', { level: 1, name: 'Welcome' }).isVisible(), 'Shell header must name the Welcome step.')
  assert(await page.getByRole('heading', { name: 'Arc is where your plan lives when the plan changes.' }).isVisible(), 'Welcome editorial must remain visible in the composed canvas.')

  // 2 — welcome actions
  assert(await page.getByRole('button', { name: 'Set up my teaching day' }).isVisible(), 'Guided setup entry missing.')
  assert(await page.getByRole('button', { name: 'Import what I already have' }).isVisible(), 'Import entry missing on welcome.')
  await shot(page, '01-welcome.png')

  await page.getByRole('button', { name: 'Set up my teaching day' }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'School year' }).isVisible(), 'School year step must use Plan shell header.')

  // 3 — school year
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-01')
  await page.locator('#last-school-day').fill('2027-05-28')
  await shot(page, '02-school-year.png')
  await page.getByRole('button', { name: 'Use this calendar' }).click()

  assert(await page.getByRole('heading', { level: 1, name: 'Courses & sections' }).isVisible(), 'Classes step must use Plan shell header.')

  // 4 — repeated Sections under one Course
  await page.getByRole('button', { name: 'Add a course' }).click()
  await page.locator('.class-course-title input').fill('AP Art History')
  await page.waitForTimeout(50)
  await page.reload({ waitUntil: 'networkidle' })
  assert(await page.locator('.class-course-title input').inputValue() === 'AP Art History', 'Unconfirmed onboarding typing did not survive refresh.')
  await page.getByRole('button', { name: 'Add a period or section' }).click()
  await page.getByRole('button', { name: 'Add a period or section' }).click()
  const sectionInputs = page.locator('.class-section-row input')
  await sectionInputs.nth(0).fill('Period 1')
  await sectionInputs.nth(1).fill('Period 4')
  assert(await page.locator('.class-course').count() === 1 && (await sectionInputs.count()) === 2, 'Repeated Sections did not stay under one Course.')
  await shot(page, '03-courses-sections.png')
  await page.getByRole('button', { name: 'Save classes' }).click()

  assert(await page.getByRole('heading', { level: 1, name: 'Build my day' }).isVisible(), 'Teaching-day step must use Plan shell header.')

  // 5 — explicit Planning block
  await page.getByRole('button', { name: 'Add planning' }).click()
  const planningBlock = page.locator('.teaching-day-block--planning')
  await planningBlock.getByRole('button', { name: /Move Planning earlier/ }).click()
  assert(await planningBlock.isVisible(), 'Planning was not represented as an explicit block.')
  await shot(page, '04-build-my-day.png')

  // 6 — optional bell times held as ambiguity
  await planningBlock.getByLabel('Starts (optional)').fill('09:00')
  await page.getByRole('button', { name: 'Use this teaching day' }).click()
  assert(await page.getByText(/needs both a start and end time/).isVisible(), 'Partial bell times were not held as an ambiguity.')
  await shot(page, '05-bell-time-ambiguity.png')
  await planningBlock.getByLabel('Starts (optional)').fill('')
  await page.getByRole('button', { name: 'Use this teaching day' }).click()

  // 7 — Teaching Day v2 spine landing
  assert(await page.getByRole('heading', { level: 1, name: 'My Teaching Day' }).isVisible(), 'Onboarding did not land in the real Day view.')
  assert(await page.getByText('Teaching Day', { exact: true }).first().isVisible(), 'Plan state header must show Teaching Day on first landing.')
  assert(await page.getByRole('button', { name: 'Planning, planning time' }).count() === 1, 'Day did not project the explicit Planning block.')
  assert(await page.getByTestId('global-capture-trigger').isVisible(), 'Global + Capture must appear after onboarding lands in Day.')
  assert(await page.getByText('Try Capture', { exact: true }).count() === 0, 'Permanent Try Capture banner must not return on Day.')
  await shot(page, '06-first-day.png')

  // 8 — first Capture via global affordance persists without opening Workspace
  await page.getByTestId('global-capture-trigger').click()
  await page.locator('.arc-capture-dialog input').fill('Pull comparison prints for P4')
  await page.locator('.arc-capture-dialog button.primary-button').click()
  await page.getByText('Captured.', { exact: true }).waitFor({ timeout: 3000 })
  const captures = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.captures.v1')))
  assert(captures.workspace.captures.some((capture) => capture.text === 'Pull comparison prints for P4'), 'First Capture did not persist immediately.')
  assert(await page.getByRole('button', { name: 'WORKSPACE', exact: true }).getAttribute('aria-expanded') !== 'true', 'Capture save must not open Workspace.')
  await shot(page, '07-first-capture.png')
  if (await page.getByTestId('capture-coach-mark').isVisible()) {
    await page.getByRole('button', { name: 'Got it' }).click()
  }

  // 9 — Settings import uses shared pipeline; parse is no-write
  await openSettings(page)
  await page.getByRole('button', { name: 'Import curriculum' }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'Import curriculum' }).isVisible(), 'Import must open inside Plan shell header.')
  const before = await page.evaluate(() => ({
    planning: localStorage.getItem('arc.planningWorkspace.v1'),
    units: localStorage.getItem('arc.units.v1'),
    lessons: localStorage.getItem('arc.lessons.v1'),
  }))
  await page.getByLabel('Choose a CSV file').setInputFiles({ name: 'apah-2026.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await page.getByText('2 source rows ready for review.').waitFor()
  const afterParse = await page.evaluate(() => ({
    planning: localStorage.getItem('arc.planningWorkspace.v1'),
    units: localStorage.getItem('arc.units.v1'),
    lessons: localStorage.getItem('arc.lessons.v1'),
  }))
  assert(JSON.stringify(before) === JSON.stringify(afterParse), 'Parsing mutated canonical planning truth.')
  await shot(page, '08-import-source.png')
  await shot(page, '09-parse-result.png')

  // 10 — cancel preserves truth
  await page.getByRole('button', { name: 'Cancel' }).click()
  const afterCancel = await page.evaluate(() => ({
    planning: localStorage.getItem('arc.planningWorkspace.v1'),
    units: localStorage.getItem('arc.units.v1'),
    lessons: localStorage.getItem('arc.lessons.v1'),
  }))
  assert(JSON.stringify(before) === JSON.stringify(afterCancel), 'Cancelling import changed canonical setup or planning truth.')

  // 11 — ambiguity review
  await openSettings(page)
  await page.getByRole('button', { name: 'Import curriculum' }).click()
  const ambiguousCsv = csv.replace(',Lesson,Reading images,', ',,Reading images,')
  await page.getByLabel('Source name').fill('apah-2026.csv')
  await page.getByLabel('CSV content').fill(ambiguousCsv)
  await page.getByRole('button', { name: 'Review proposal' }).click()
  assert(await page.getByText('Choose whether this row is a Unit or Lesson.').count() > 0, 'Missing Item Type did not enter ambiguity review.')
  await shot(page, '10-ambiguity-review.png')
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByLabel('CSV content').fill(csv)
  await page.getByRole('button', { name: 'Review proposal' }).click()
  const afterReview = await page.evaluate(() => ({
    planning: localStorage.getItem('arc.planningWorkspace.v1'),
    units: localStorage.getItem('arc.units.v1'),
    lessons: localStorage.getItem('arc.lessons.v1'),
  }))
  assert(JSON.stringify(before) === JSON.stringify(afterReview), 'Review mutated canonical planning truth.')
  assert(await page.getByText('2 Lessons · unscheduled', { exact: true }).isVisible(), 'Review did not show unscheduled canonical Lesson proposal.')
  await shot(page, '11-proposed-structure.png')

  // 12 — confirm import and return to Teaching Day
  await page.getByLabel('Potential existing Course').selectOption({ label: 'Match AP Art History' })
  await page.getByRole('button', { name: 'Confirm import' }).click()
  assert(await page.getByRole('heading', { name: 'The confirmed curriculum is now in Arc.' }).isVisible(), 'Confirmed import did not produce a receipt.')
  await page.getByRole('button', { name: 'Return to Day' }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'My Teaching Day' }).isVisible(), 'Return to Day did not restore Teaching Day.')
  assert(await page.getByText('Teaching Day', { exact: true }).first().isVisible(), 'Return to Arc must restore Plan Teaching Day spine.')
  await shot(page, '12-return-to-arc.png')

  const committed = await page.evaluate(() => ({
    planning: JSON.parse(localStorage.getItem('arc.planningWorkspace.v1')).input,
    units: JSON.parse(localStorage.getItem('arc.units.v1')).input,
    lessons: JSON.parse(localStorage.getItem('arc.lessons.v1')).input,
  }))
  assert(committed.planning.courses.length === 1, 'Explicit Course match created a duplicate Course.')
  assert(committed.units.units.length === 1 && committed.lessons.lessons.length === 2, 'Confirmed import did not commit the reviewed Unit and Lessons.')

  // 13 — returning teacher bypass
  await page.reload({ waitUntil: 'networkidle' })
  assert(await page.getByRole('heading', { name: 'Arc is where your plan lives when the plan changes.' }).count() === 0, 'Returning teacher was forced back through onboarding.')

  // 14 — settings teaching-day exact return
  await openSettings(page)
  await page.getByRole('button', { name: 'Teaching day & planning' }).click()
  assert(await page.locator('.teaching-day-block--planning').isVisible(), 'Explicit Planning block did not survive refresh.')
  await page.getByRole('button', { name: 'Cancel' }).click()

  // 15 — identical re-import unchanged
  await openSettings(page)
  await page.getByRole('button', { name: 'Import curriculum' }).click()
  await page.getByLabel('Choose a CSV file').setInputFiles({ name: 'apah-2026.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await page.getByRole('button', { name: 'Review proposal' }).click()
  await page.getByLabel('Potential existing Course').selectOption({ label: 'Match AP Art History' })
  assert(await page.getByText('No write needed').count() === 3, 'Identical re-import was not recognized as unchanged.')
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await page.getByRole('button', { name: 'Return to Day' }).click()

  // 16 — responsive onboarding in composed shell
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => {
    localStorage.removeItem('arc.onboarding.v1')
    localStorage.removeItem('arc.calendar.v1')
    localStorage.removeItem('arc.planningWorkspace.v1')
  })
  await page.reload({ waitUntil: 'networkidle' })
  const narrowOnboarding = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(narrowOnboarding.scroll <= narrowOnboarding.width + 1, `390px composed onboarding overflowed (${narrowOnboarding.scroll} > ${narrowOnboarding.width}).`)
  assert(await page.getByRole('heading', { level: 1, name: 'Welcome' }).isVisible(), '390px welcome must remain in Plan shell.')

  assert(runtimeErrors.length === 0, `Plan onboarding/import runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()

  for (const name of ['01-welcome.png', '02-school-year.png', '03-courses-sections.png', '04-build-my-day.png', '05-bell-time-ambiguity.png', '06-first-day.png', '07-first-capture.png', '08-import-source.png', '09-parse-result.png', '10-ambiguity-review.png', '11-proposed-structure.png']) {
    reuseShot(name)
  }

  console.log('Arc Plan onboarding + import composition gate passed: shell-integrated welcome → school year → classes → build my day → Teaching Day spine → Capture → shared import parse/review/confirm → return to Day → refresh bypass → 390px shell.')
} finally {
  await browser.close()
}
