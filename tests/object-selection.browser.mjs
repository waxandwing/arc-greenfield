import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-selection-audit',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-14',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [{ id: 'q1', label: 'Quarter 1', startDate: '2026-09-14', endDate: '2026-10-30' }],
  semesters: [{ id: 's1', label: 'Semester 1', startDate: '2026-09-14', endDate: '2027-01-08' }],
}

const unitTitle = 'Ancient Mesopotamia: Power, Place, and Early Urban Systems'
const lessonTitle = 'Standard of Ur: War, Peace, Register, and Royal Authority'

const planningInput = {
  calendarId: calendarInput.id,
  courses: [{ id: 'course-apah', title: 'AP Art History' }],
  sections: [
    { id: 'section-p2', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 2' },
    { id: 'section-p5', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 5' },
  ],
}

const unitsInput = {
  calendarId: calendarInput.id,
  units: [{
    id: 'unit-meso',
    calendarId: calendarInput.id,
    courseId: 'course-apah',
    title: unitTitle,
    placement: { startDate: '2026-09-14', endDate: '2026-09-25' },
  }],
}

const lessonsInput = {
  calendarId: calendarInput.id,
  lessons: [{
    id: 'lesson-18',
    calendarId: calendarInput.id,
    courseId: 'course-apah',
    unitId: 'unit-meso',
    title: lessonTitle,
    sequence: 18,
    plannedDate: '2026-09-14',
    datePolicy: 'fixed',
  }],
  deliveryStates: [],
}

const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-14T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
}

async function clickView(page, name) {
  await page.getByRole('button', { name, exact: true }).click()
  await page.getByRole('heading', { name, exact: true }).waitFor()
}

async function assertNoActionSurface(page, width) {
  const forbiddenText = ['Move', 'Unplace', 'Delete']
  for (const label of forbiddenText) {
    assert(await page.getByRole('button', { name: label, exact: true }).count() === 0, `${width}px: selection-only pass exposed a ${label} action.`)
  }
  const draggableCount = await page.locator('[draggable="true"]').count()
  assert(draggableCount === 0, `${width}px: selection-only pass introduced ${draggableCount} draggable object(s).`)
}

async function auditViewport(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, storage)
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await clickView(page, 'Day')
  await assertNoActionSurface(page, width)

  const dayLesson = page.getByRole('button', { name: new RegExp(lessonTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()
  assert(await dayLesson.isVisible(), `${width}px: selectable Day Lesson is not visible.`)
  await dayLesson.focus()
  await page.keyboard.press('Enter')
  assert(await dayLesson.getAttribute('aria-pressed') === 'true', `${width}px: keyboard activation did not select the Day Lesson.`)
  const selectedOutline = await dayLesson.evaluate((node) => {
    const style = getComputedStyle(node)
    return { width: parseFloat(style.outlineWidth || '0'), style: style.outlineStyle }
  })
  assert(selectedOutline.style !== 'none' && selectedOutline.width >= 2, `${width}px: selected Lesson has no visible selection treatment.`)

  const dayRepresentations = page.locator('.day-continuity-lesson[aria-pressed="true"]')
  assert(await dayRepresentations.count() === 2, `${width}px: selecting one Lesson did not select both Section representations of the same object.`)

  await clickView(page, 'Week')
  const weekSelectedLesson = page.locator('.planning-lesson-select[aria-pressed="true"]')
  assert(await weekSelectedLesson.count() === 2, `${width}px: Lesson selection did not survive Day → Week for both Section representations.`)
  await assertNoActionSurface(page, width)

  await clickView(page, 'Month')
  const monthSelectedLesson = page.locator('.planning-month-signal-select[aria-pressed="true"]')
  assert(await monthSelectedLesson.count() === 1, `${width}px: Lesson selection did not survive Week → Month as one aggregated Lesson object.`)

  const unitButton = page.getByRole('button', { name: new RegExp(unitTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()
  await unitButton.click()
  assert(await unitButton.getAttribute('aria-pressed') === 'true', `${width}px: Month Unit could not be selected.`)
  assert(await monthSelectedLesson.count() === 0, `${width}px: selecting a Unit did not replace the prior Lesson selection.`)

  await clickView(page, 'Week')
  assert(await page.locator('.planning-unit-select[aria-pressed="true"]').count() >= 1, `${width}px: Unit selection did not survive Month → Week.`)
  await clickView(page, 'Day')
  assert(await page.locator('.day-continuity-unit-select[aria-pressed="true"]').count() >= 1, `${width}px: Unit selection did not survive Week → Day.`)

  const selectedDayUnit = page.locator('.day-continuity-unit-select[aria-pressed="true"]').first()
  await selectedDayUnit.click()
  assert(await page.locator('.calendar-object-select[aria-pressed="true"]').count() === 0, `${width}px: clicking the selected object again did not clear selection.`)

  const geometry = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: selection treatment created horizontal document overflow.`)
  await assertNoActionSurface(page, width)
  assert(runtimeErrors.length === 0, `${width}px: runtime errors detected: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditViewport(browser, 1024, 900)
  await auditViewport(browser, 800, 900)
  await auditViewport(browser, 390, 844)
  await auditViewport(browser, 320, 800)
  console.log('Object selection Chromium audit passed at 1024px, 800px, 390px, and 320px with no object-action or drag behavior exposed.')
} finally {
  await browser.close()
}
