import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-hostile-schedule-persistence',
  schoolYearLabel: '2026–27',
  firstDay: '2026-10-05',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [
    { date: '2026-10-12', kind: 'teacher-workday', label: 'Planning day', source: 'manual', confidence: 'confirmed' },
  ],
  quarters: [
    { id: 'q1', label: 'Quarter 1', startDate: '2026-10-05', endDate: '2026-10-09' },
    { id: 'q2', label: 'Quarter 2', startDate: '2026-10-13', endDate: '2026-12-18' },
    { id: 'q3', label: 'Quarter 3', startDate: '2027-01-04', endDate: '2027-03-12' },
    { id: 'q4', label: 'Quarter 4', startDate: '2027-03-15', endDate: '2027-05-28' },
  ],
  semesters: [
    { id: 's1', label: 'Semester 1', startDate: '2026-10-05', endDate: '2026-12-18' },
    { id: 's2', label: 'Semester 2', startDate: '2027-01-04', endDate: '2027-05-28' },
  ],
}

const planningInput = {
  calendarId: calendarInput.id,
  courses: [{ id: 'course-3d', title: '3D Art 1' }],
  sections: [
    { id: 'section-p3', courseId: 'course-3d', calendarId: calendarInput.id, name: 'Period 3' },
    { id: 'section-p6', courseId: 'course-3d', calendarId: calendarInput.id, name: 'Period 6' },
  ],
}

const unitsInput = {
  calendarId: calendarInput.id,
  units: [{
    id: 'unit-recycled-fashion',
    calendarId: calendarInput.id,
    courseId: 'course-3d',
    title: 'Recycled Fashion Structures',
    placement: { startDate: '2026-10-05', endDate: '2026-10-16' },
  }],
}

const lessonsInput = {
  calendarId: calendarInput.id,
  lessons: [
    { id: 'lesson-armature', calendarId: calendarInput.id, courseId: 'course-3d', unitId: 'unit-recycled-fashion', title: 'Armature Build', sequence: 1, plannedDate: '2026-10-06', datePolicy: 'flexible' },
    { id: 'lesson-surface', calendarId: calendarInput.id, courseId: 'course-3d', unitId: 'unit-recycled-fashion', title: 'Surface and Attachment Lab', sequence: 2, plannedDate: '2026-10-06', datePolicy: 'flexible' },
    { id: 'lesson-fit', calendarId: calendarInput.id, courseId: 'course-3d', unitId: 'unit-recycled-fashion', title: 'Fit and Stability Check', sequence: 3, plannedDate: '2026-10-07', datePolicy: 'flexible' },
    { id: 'lesson-critique', calendarId: calendarInput.id, courseId: 'course-3d', unitId: 'unit-recycled-fashion', title: 'Midpoint Critique', sequence: 4, plannedDate: '2026-10-08', datePolicy: 'fixed' },
  ],
  deliveryStates: [
    { lessonId: 'lesson-armature', sectionId: 'section-p3', status: 'completed', taughtDate: '2026-10-06', resumeNote: null },
  ],
}

const shiftInput = {
  calendarId: calendarInput.id,
  overrides: [
    { sectionId: 'section-p6', lessonId: 'lesson-fit', plannedDate: '2026-10-09' },
  ],
  sameDayApprovals: [
    { sectionId: 'section-p6', date: '2026-10-06', lessonIds: ['lesson-armature', 'lesson-surface'] },
  ],
  undo: null,
}

const seededStorage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-10-06T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
  'arc.shift.v1': JSON.stringify({ schemaVersion: 2, input: shiftInput }),
}

async function activateView(page, view) {
  await page.getByRole('button', { name: view, exact: true }).click()
  await page.getByRole('heading', { name: view, exact: true }).waitFor()
}

async function seedContext(browser, viewport) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript((entries) => {
    if (sessionStorage.getItem('arc.independentAuditSeeded') === '1') return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    sessionStorage.setItem('arc.independentAuditSeeded', '1')
  }, seededStorage)
  return context
}

async function assertPersistedShift(page, label) {
  const stored = await page.evaluate(() => localStorage.getItem('arc.shift.v1'))
  assert(stored, `${label}: Shift persistence disappeared.`)
  const parsed = JSON.parse(stored)
  assert(parsed.schemaVersion === 2, `${label}: Shift persistence regressed from schema v2.`)
  assert(parsed.input.overrides.length === 1, `${label}: Section override count changed.`)
  assert(parsed.input.overrides[0].sectionId === 'section-p6' && parsed.input.overrides[0].lessonId === 'lesson-fit' && parsed.input.overrides[0].plannedDate === '2026-10-09', `${label}: Section override identity/date changed.`)
  assert(parsed.input.sameDayApprovals.length === 1, `${label}: explicit same-day approval disappeared or duplicated.`)
  const approval = parsed.input.sameDayApprovals[0]
  assert(approval.sectionId === 'section-p6' && approval.date === '2026-10-06', `${label}: same-day approval scope changed.`)
  assert(approval.lessonIds.join(',') === 'lesson-armature,lesson-surface', `${label}: approved Lesson identity set changed.`)
}

async function assertScenario(page, label) {
  await activateView(page, 'Week')
  assert(await page.getByText('Armature Build', { exact: true }).first().isVisible(), `${label}: first same-day Lesson missing from Week.`)
  assert(await page.getByText('Surface and Attachment Lab', { exact: true }).first().isVisible(), `${label}: second same-day Lesson missing from Week.`)
  assert(await page.getByText('Fit and Stability Check', { exact: true }).first().isVisible(), `${label}: class-specific shifted Lesson missing from Week.`)

  await activateView(page, 'Month')
  const original = page.locator('.planning-month-day').filter({ has: page.locator('time[datetime="2026-10-07"]') })
  const shifted = page.locator('.planning-month-day').filter({ has: page.locator('time[datetime="2026-10-09"]') })
  assert(await original.getByText('Fit and Stability Check', { exact: true }).isVisible(), `${label}: unaffected Period 3 placement vanished from Month.`)
  assert(await original.getByText('Period 3', { exact: false }).isVisible(), `${label}: original-date Section scope is not visible.`)
  assert(await shifted.getByText('Fit and Stability Check', { exact: true }).isVisible(), `${label}: Period 6 shifted placement vanished from Month.`)
  assert(await shifted.getByText('Shifted: Period 6', { exact: true }).isVisible(), `${label}: shifted Section disclosure vanished from Month.`)

  await activateView(page, 'Quarter')
  const quarter = page.locator('.planning-long-range')
  assert(await quarter.locator('[data-unit-id="unit-recycled-fashion"]').count() === 1, `${label}: Unit identity duplicated or disappeared in Quarter.`)
  assert(await quarter.locator('[data-date="2026-10-06"] [data-lesson-id="lesson-armature"]').count() === 1, `${label}: first approved same-day Lesson lost in Quarter.`)
  assert(await quarter.locator('[data-date="2026-10-06"] [data-lesson-id="lesson-surface"]').count() === 1, `${label}: second approved same-day Lesson lost in Quarter.`)
  assert(await quarter.locator('[data-date="2026-10-09"] [data-lesson-id="lesson-fit"]').count() === 1, `${label}: shifted Lesson lost in Quarter.`)
  assert(await quarter.locator('[data-date="2026-10-12"] [data-lesson-id]').count() === 0, `${label}: Lesson appeared on teacher workday.`)

  await activateView(page, 'Year Map')
  const year = page.locator('.planning-long-range')
  assert(await year.locator('[data-unit-id="unit-recycled-fashion"]').count() === 1, `${label}: Unit identity duplicated or disappeared in Year.`)
  assert(await year.locator('[data-date="2026-10-09"] [data-lesson-id="lesson-fit"]').count() === 1, `${label}: shifted Lesson lost in Year.`)

  await assertPersistedShift(page, label)
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await seedContext(browser, { width: 800, height: 900 })
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await assertScenario(page, 'initial 800px')

  const rawBefore = await page.evaluate(() => localStorage.getItem('arc.shift.v1'))
  await page.reload({ waitUntil: 'networkidle' })
  const rawAfter = await page.evaluate(() => localStorage.getItem('arc.shift.v1'))
  assert(rawAfter === rawBefore, 'reload: Shift persistence changed without a user action.')
  await assertScenario(page, 'reload 800px')

  await activateView(page, 'Quarter')
  const keyboardTarget = page.locator('[data-date="2026-10-09"] [data-lesson-id="lesson-fit"]')
  await keyboardTarget.focus()
  await page.keyboard.press('Enter')
  const focus = page.locator('.object-focus-layer')
  await focus.waitFor()
  assert(await focus.getByText('Unit Focus', { exact: true }).isVisible(), 'keyboard: shifted Lesson did not route to Unit Focus.')
  assert(await focus.getByText('Fit and Stability Check', { exact: true }).first().isVisible(), 'keyboard: selected shifted Lesson context was lost.')
  await focus.getByRole('button', { name: 'Close', exact: true }).click()

  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }))
  assert(geometry.document <= geometry.viewport + 1, `800px: long-range content leaked into document width (${geometry.document} > ${geometry.viewport}).`)

  await context.close()
  console.log('Independent hostile schedule persistence audit passed: schema-v2 approval durability, class-specific Shift, Week/Month/Quarter/Year truth, teacher-workday protection, reload without reseed, keyboard routing, and 800px containment.')
} finally {
  await browser.close()
}
