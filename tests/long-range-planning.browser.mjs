import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
function assert(condition, message) { if (!condition) throw new Error(message) }

const calendarInput = {
  id: 'calendar-long-range-audit', schoolYearLabel: '2026–27', firstDay: '2026-09-01', lastDay: '2026-12-18',
  instructionalWeekdays: [1,2,3,4,5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [],
  quarters: [
    { id: 'q1', label: 'Quarter 1', startDate: '2026-09-01', endDate: '2026-10-30' },
    { id: 'q2', label: 'Quarter 2', startDate: '2026-11-02', endDate: '2026-12-18' },
  ],
  semesters: [{ id: 's1', label: 'Semester 1', startDate: '2026-09-01', endDate: '2026-12-18' }],
}
const planningInput = {
  calendarId: calendarInput.id,
  courses: [{ id: 'course-apah', title: 'AP Art History' }],
  sections: [
    { id: 'p2', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 2' },
    { id: 'p5', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 5' },
  ],
}
const unitsInput = {
  calendarId: calendarInput.id,
  units: [{ id: 'unit-egypt', calendarId: calendarInput.id, courseId: 'course-apah', title: 'Egypt', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } }],
}
const lessonsInput = {
  calendarId: calendarInput.id,
  lessons: [
    { id: 'lesson-temples', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-egypt', title: 'Temple complexes', sequence: 1, plannedDate: '2026-09-17', datePolicy: 'flexible' },
  ],
  deliveryStates: [],
}
const shiftInput = { calendarId: calendarInput.id, overrides: [{ sectionId: 'p5', lessonId: 'lesson-temples', plannedDate: '2026-09-21' }], undo: null }
const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-14T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
  'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: shiftInput }),
}

async function activate(page, view) {
  await page.getByRole('button', { name: view, exact: true }).click()
  await page.getByRole('heading', { name: view, exact: true }).waitFor()
}

async function assertPlanningTruth(page, view) {
  await activate(page, view)
  assert(await page.locator('[data-unit-id="unit-egypt"]').count() === 1, `${view}: Unit identity disappeared.`)
  const shared = page.locator('[data-date="2026-09-17"] [data-lesson-id="lesson-temples"]')
  const shifted = page.locator('[data-date="2026-09-21"] [data-lesson-id="lesson-temples"]')
  assert(await shared.count() === 1, `${view}: shared Lesson placement disappeared.`)
  assert(await shared.getByText('Period 2', { exact: false }).count() === 1, `${view}: shared Section scope disappeared.`)
  assert(await shifted.count() === 1, `${view}: shifted Lesson placement disappeared.`)
  assert(await shifted.getByText('Shifted: Period 5', { exact: true }).count() === 1, `${view}: shifted Section identity disappeared.`)
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.addInitScript((entries) => { for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value) }, storage)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  for (const view of ['Quarter', 'Semester', 'Year Map']) await assertPlanningTruth(page, view)
  assert(errors.length === 0, `Runtime errors: ${errors.join(' | ')}`)
  console.log('Long-range planning truth audit passed for Quarter, Semester, and Year Map.')
  await context.close()
} finally {
  await browser.close()
}
