import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/plan-move-shift/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function fixture() {
  const calendarId = 'arc-plan-gauntlet-2026'
  const courses = [{ id: 'course-apah', title: 'AP Art History' }, { id: 'course-2d', title: '2D Art 1' }]
  const sections = [
    ['section-p1', 'course-apah', 'Period 1'], ['section-p4', 'course-apah', 'Period 4'], ['section-p6', 'course-2d', 'Period 6'],
  ].map(([id, courseId, name]) => ({ id, courseId, calendarId, name }))
  const units = [
    { id: 'unit-apah-2', calendarId, courseId: 'course-apah', title: 'Power & Place', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } },
    { id: 'unit-2d-2', calendarId, courseId: 'course-2d', title: 'Value & Form', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } },
  ]
  const lessons = [
    { id: 'lesson-apah-5', calendarId, courseId: 'course-apah', unitId: 'unit-apah-2', title: 'Temple threshold', sequence: 5, plannedDate: '2026-09-14', datePolicy: 'flexible', directions: ['Look'], materials: ['Sketchbook'], phases: ['Look'], resources: [] },
    { id: 'lesson-apah-6', calendarId, courseId: 'course-apah', unitId: 'unit-apah-2', title: 'Patron and audience', sequence: 6, plannedDate: '2026-09-15', datePolicy: 'flexible', directions: ['Look'], materials: ['Sketchbook'], phases: ['Look'], resources: [] },
    { id: 'lesson-apah-8', calendarId, courseId: 'course-apah', unitId: 'unit-apah-2', title: 'Fixed visual analysis assessment', sequence: 8, plannedDate: '2026-09-18', datePolicy: 'fixed', directions: ['Look'], materials: ['Sketchbook'], phases: ['Look'], resources: [] },
    { id: 'lesson-2d-5', calendarId, courseId: 'course-2d', unitId: 'unit-2d-2', title: 'Value scale', sequence: 5, plannedDate: '2026-09-14', datePolicy: 'flexible', directions: ['Look'], materials: ['Sketchbook'], phases: ['Look'], resources: [] },
  ]
  const planning = { calendarId, courses, sections, notes: [] }
  const deliveryStates = [
    { lessonId: 'lesson-apah-5', sectionId: 'section-p4', status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Stopped after the threshold comparison.' },
    { lessonId: 'lesson-apah-6', sectionId: 'section-p1', status: 'completed', taughtDate: '2026-09-15', resumeNote: null },
  ]
  const overrides = [{ sectionId: 'section-p6', lessonId: 'lesson-2d-5', plannedDate: '2026-09-15' }]
  const calendarInput = {
    id: calendarId, schoolYearLabel: '2026–27', firstDay: '2026-09-01', lastDay: '2027-05-28', instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed',
    exceptions: [], quarters: [], semesters: [], provenance: [],
  }
  return { calendarId, calendarInput, planning, units, lessons, deliveryStates, overrides }
}

function storageEntries(data, context) {
  return {
    'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-15T12:00:00.000Z', input: data.calendarInput }),
    'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: data.planning }),
    'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, units: data.units } }),
    'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, lessons: data.lessons, deliveryStates: data.deliveryStates } }),
    'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, overrides: data.overrides, undo: null } }),
    'arc.planning-context.v1': JSON.stringify(context),
    'arc.view-preferences.v1': JSON.stringify({ home: { mode: 'fixed', view: 'Day' }, lastUsedView: 'Day', showWeekends: false }),
  }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

async function selectView(page, name) {
  await page.getByRole('button', { name: /Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name: 'Calendar views' }).getByRole('button', { name, exact: true }).click()
}

const dayContext = {
  schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Day', anchorDate: '2026-09-15', focus: 'day',
}

const browser = await chromium.launch({ headless: true })
try {
  const data = fixture()
  await pageFlow(browser, data, dayContext)
} finally {
  await browser.close()
}

async function pageFlow(browser, data, context) {
  const pageContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await pageContext.newPage()
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))

  await page.addInitScript((entries) => {
    if (localStorage.getItem('arc.calendar.v1') !== null) return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, storageEntries(data, context))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
  await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
  await shot(page, '01-move-from-lesson.png')
  await page.getByRole('button', { name: 'Move', exact: true }).first().click()
  assert(await page.locator('.plan-move-panel').isVisible(), 'Lesson Focus did not open governed Move panel.')
  await shot(page, '02-move-destination.png')
  await page.locator('.plan-move-destination input').fill('2026-09-16')
  await page.getByRole('button', { name: 'Preview move', exact: true }).click()
  assert(await page.getByRole('heading', { name: 'Consequence preview' }).isVisible(), 'Move preview must show consequences before apply.')
  await shot(page, '03-move-preview.png')
  await page.getByRole('button', { name: 'Confirm move', exact: true }).click()
  assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.lessons.v1'))).input.lessons.find((lesson) => lesson.id === 'lesson-2d-5')?.plannedDate === '2026-09-16', 'Move did not persist shared Lesson date.')
  await shot(page, '04-move-applied.png')

  if (await page.getByRole('button', { name: 'Back to class', exact: true }).count()) {
    await page.getByRole('button', { name: 'Back to class', exact: true }).click()
  }
  if (await page.getByRole('button', { name: 'Back to Teaching Day', exact: true }).count()) {
    await page.getByRole('button', { name: 'Back to Teaching Day', exact: true }).click()
  }
  await page.getByRole('button', { name: /Period 4 AP Art History/ }).click()
  await shot(page, '05-week-shift-entry.png')
  await page.getByRole('button', { name: 'Review Shift', exact: true }).first().click()
  assert(await page.getByRole('heading', { name: 'Arc held the stopping point.' }).isVisible(), 'Shift must reuse RecoveryReview shell.')
  await shot(page, '06-recovery-preview.png')
  const recoveryCard = page.locator('.recovery-card').filter({ hasText: 'Period 4' })
  for (const select of await recoveryCard.getByRole('combobox', { name: 'Move to', exact: true }).all()) {
    const values = await select.locator('option').evaluateAll((options) => options.map((option) => option.value).filter(Boolean))
    if (values[0]) await select.selectOption(values[0])
  }
  const apply = recoveryCard.getByRole('button', { name: 'Apply Shift', exact: true })
  if (await apply.isEnabled()) await apply.click()
  else await page.getByRole('button', { name: 'Back to calendar', exact: true }).click()
  if (await page.getByRole('button', { name: 'Back to calendar', exact: true }).count()) {
    await page.getByRole('button', { name: 'Back to calendar', exact: true }).click()
  }
  await shot(page, '07-shift-applied.png')

  await selectView(page, 'Week')
  assert(await page.locator('.planning-week').isVisible(), 'Week view must remain valid Class context after Shift.')
  await selectView(page, 'Month')
  await shot(page, '08-month-move-context.png')
  assert(await page.getByText('Fixed visual analysis assessment', { exact: true }).count() > 0, 'Fixed date protection lost after Move/Shift.')
  await page.getByRole('button', { name: 'Review recovery (1)', exact: false }).click()
  await shot(page, '09-recovery-return.png')
  await page.getByRole('button', { name: 'Back to calendar', exact: true }).click()

  const p5 = page.locator('.planning-period-item[data-attention-kind="section-behind"]').first()
  if (await p5.count()) {
    await p5.click()
    assert(await page.locator('.planning-week').count() === 1, 'P5 section-behind must deep link to Week, not apply Shift.')
  }

  assert(runtimeErrors.length === 0, `plan-move-shift runtime errors: ${runtimeErrors.join(' | ')}`)
  await pageContext.close()
}

console.log('plan-move-shift smoke passed')
