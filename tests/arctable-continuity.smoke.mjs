import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const calendarId = 'calendar-multiprep'
const courses = [
  { id: 'course-apah', title: 'AP Art History' },
  { id: 'course-2d', title: '2D Art 1' },
  { id: 'course-3d', title: '3D Art 1' },
]
const sections = [
  { id: 'section-p1', courseId: 'course-apah', calendarId, name: 'Period 1' },
  { id: 'section-p2', courseId: 'course-2d', calendarId, name: 'Period 2' },
  { id: 'section-p3', courseId: 'course-3d', calendarId, name: 'Period 3' },
  { id: 'section-p4', courseId: 'course-apah', calendarId, name: 'Period 4' },
  { id: 'section-p6', courseId: 'course-2d', calendarId, name: 'Period 6' },
  { id: 'section-p7', courseId: 'course-3d', calendarId, name: 'Period 7' },
]
const units = [
  { id: 'unit-apah', calendarId, courseId: 'course-apah', title: 'Early Europe + Colonial Americas', placement: { startDate: '2026-10-12', endDate: '2026-11-06' } },
  { id: 'unit-2d', calendarId, courseId: 'course-2d', title: 'Journal Covers + Collage', placement: { startDate: '2026-10-12', endDate: '2026-11-13' } },
  { id: 'unit-3d', calendarId, courseId: 'course-3d', title: 'Secure Attachments', placement: { startDate: '2026-10-12', endDate: '2026-11-20' } },
]
const lessons = [
  { id: 'lesson-chartres', calendarId, courseId: 'course-apah', unitId: 'unit-apah', title: 'Gothic cathedrals: Chartres, light, engineering', sequence: 1, plannedDate: '2026-10-12', datePolicy: 'flexible' },
  { id: 'lesson-collage', calendarId, courseId: 'course-2d', unitId: 'unit-2d', title: 'Cover composition', sequence: 1, plannedDate: '2026-10-12', datePolicy: 'flexible' },
  { id: 'lesson-attachments', calendarId, courseId: 'course-3d', unitId: 'unit-3d', title: 'Cardboard attachment lab', sequence: 1, plannedDate: '2026-10-12', datePolicy: 'flexible' },
]

function assert(condition, message) { if (!condition) throw new Error(message) }
async function selectView(page, name) {
  await page.getByRole('button', { name: /Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name: 'Calendar views' }).getByRole('button', { name, exact: true }).click()
}
async function capture(page, name) {
  mkdirSync('artifacts/arc-multiprep', { recursive: true })
  await page.screenshot({ path: `artifacts/arc-multiprep/${name}`, fullPage: true })
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()) })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  await page.addInitScript(({ calendarId, courses, sections, units, lessons }) => {
    const calendarInput = { id: calendarId, schoolYearLabel: '2026–27', firstDay: '2026-10-12', lastDay: '2027-05-28', instructionalWeekdays: [1,2,3,4,5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [] }
    localStorage.setItem('arc.calendar.v1', JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), input: calendarInput }))
    localStorage.setItem('arc.planningWorkspace.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, courses, sections, notes: [] } }))
    localStorage.setItem('arc.units.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, units } }))
    localStorage.setItem('arc.lessons.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, lessons, deliveryStates: [] } }))
    localStorage.setItem('arc.shift.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, overrides: [], undo: null } }))
  }, { calendarId, courses, sections, units, lessons })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  await selectView(page, 'Day')
  assert(await page.locator('.day-period-button').count() === 6, 'Day must expose the complete repeated multi-prep teaching sequence.')
  await capture(page, '01-day-multiprep.png')

  await selectView(page, 'Week')
  const widths = await page.locator('.planning-date-heading').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
  assert(Math.max(...widths) > Math.min(...widths) * 1.25, 'Week must expand the selected instructional day instead of using equal columns.')
  await page.getByRole('button', { name: 'Workspace', exact: true }).click()
  assert(await page.getByText('Capture without choosing a Course first', { exact: false }).count() === 1, 'Workspace must support capture before Course placement.')
  await capture(page, '02-week-workspace.png')
  await page.getByRole('button', { name: 'Workspace', exact: true }).click()

  await selectView(page, 'Month')
  assert(await page.locator('.planning-month-day').count() > 0, 'Month must remain a continuity lens over the instructional calendar.')
  await capture(page, '03-month-continuity.png')

  await selectView(page, 'Year')
  assert(await page.locator('.planning-year-course').count() === 3, 'Year must show all three Courses at Unit resolution.')
  assert(await page.locator('.planning-year-underlay').count() === 3, 'Year must preserve a structural underlay behind every Course sequence.')
  await capture(page, '03-year-horizon.png')

  await selectView(page, 'Day')
  await page.locator('.day-period-button').filter({ hasText: 'Period 4' }).click()
  await page.getByRole('button', { name: 'Start class' }).click()
  assert(await page.getByRole('main').getAttribute('class').then((value) => value?.includes('arctable--teacher')), 'Starting a class must enter the ArcTable Teacher Monitor.')
  const opened = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')))
  await page.getByRole('button', { name: 'Next phase' }).click()
  await page.getByRole('button', { name: 'Plan View', exact: true }).click()
  assert(await page.getByRole('button', { name: /Return to ArcTable/ }).count() === 1, 'Plan View must keep an explicit return to the live class.')
  const held = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')))
  assert(held.startedAt === opened.startedAt && held.session.lessonId === opened.session.lessonId && held.phase === 2, 'Plan View must preserve timer origin, Lesson identity, and active phase.')
  await capture(page, '04-plan-while-live.png')
  await page.getByRole('button', { name: /Return to ArcTable/ }).click()
  await capture(page, '05-teacher-monitor.png')
  await page.getByRole('button', { name: /Student preview/ }).click()
  assert(await page.getByRole('heading', { name: /Gothic cathedrals/ }).count() === 1, 'Projected Student Surface must contain the active instructional prompt.')
  assert(await page.getByText('Teacher controls', { exact: true }).count() === 0, 'Projected Student Surface must not expose teacher controls.')
  await capture(page, '06-student-surface.png')
  await page.getByRole('button', { name: 'Return to Teacher Monitor' }).evaluate((node) => node.click())
  await page.getByRole('button', { name: 'End Class' }).click()
  await page.getByRole('button', { name: 'Complete lesson' }).click()
  assert(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')) === null, 'End Class must clear live state only after an explicit outcome.')
  const savedLessons = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.lessons.v1')))
  assert(savedLessons.input.deliveryStates.some((state) => state.lessonId === 'lesson-chartres' && state.sectionId === 'section-p4' && state.status === 'completed'), 'End Class must record the outcome only for the active Section.')
  assert(runtimeErrors.length === 0, `Runtime errors: ${runtimeErrors.join(' | ')}`)
  console.log('Arc multi-prep + ArcTable browser continuity gate passed')
} finally {
  await browser.close()
}
