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
  { id: 'lesson-assessment', calendarId, courseId: 'course-3d', unitId: 'unit-3d', title: 'Attachment strength assessment', sequence: 2, plannedDate: '2026-10-16', datePolicy: 'fixed' },
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
    localStorage.setItem('arc.shift.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, overrides: [{ sectionId: 'section-p6', lessonId: 'lesson-collage', plannedDate: '2026-10-13' }], undo: null } }))
  }, { calendarId, courses, sections, units, lessons })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  await selectView(page, 'Day')
  assert(await page.locator('.day-period-button').count() === 6, 'Day must expose the complete repeated multi-prep teaching sequence.')
  assert(await page.locator('.day-period-gap').filter({ hasText: 'Period 5' }).filter({ hasText: 'Planning time' }).count() === 1, 'Day must represent the intentional Period 5 planning block instead of making it disappear.')
  await capture(page, '01-day-multiprep.png')

  await selectView(page, 'Week')
  const widths = await page.locator('.planning-date-heading').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
  assert(Math.max(...widths) > Math.min(...widths) * 1.25, 'Week must expand the selected instructional day instead of using equal columns.')
  await page.getByRole('button', { name: 'Workspace', exact: true }).click()
  assert(await page.getByText('Capture without choosing a Course first', { exact: false }).count() === 1, 'Workspace must support capture before Course placement.')
  assert(!(await page.locator('body').innerText()).includes('Fridge'), 'Visible product language must say Workspace while internal fridge compatibility seams remain untouched.')
  await capture(page, '02-week-workspace.png')
  await page.getByRole('button', { name: 'Workspace', exact: true }).click()

  await selectView(page, 'Month')
  assert(await page.locator('.planning-month-day').count() > 0, 'Month must remain a continuity lens over the instructional calendar.')
  assert(await page.locator('.planning-month-signal--fixed').filter({ hasText: 'Attachment strength assessment' }).count() === 1, 'Month must distinguish fixed assessments without expanding every Lesson into a full card.')
  assert(await page.getByText('Shifted: Period 6', { exact: true }).count() === 1, 'Month must expose meaningful Section drift.')
  assert(await page.locator('.planning-month-unit-band').count() > 3, 'Month must preserve Unit continuity across week boundaries and visible gaps.')
  await capture(page, '03-month-continuity.png')

  await selectView(page, 'Year')
  assert(await page.locator('.planning-year-course').count() === 3, 'Year must show all three Courses at Unit resolution.')
  assert(await page.locator('.planning-year-underlay').count() === 3, 'Year must preserve a structural underlay behind every Course sequence.')
  await capture(page, '03-year-horizon.png')

  await selectView(page, 'Day')
  await page.locator('.day-period-button').filter({ hasText: 'Period 4' }).click()
  await page.getByRole('button', { name: 'Start class' }).click()
  assert(await page.getByRole('main').getAttribute('class').then((value) => value?.includes('arctable--teacher')), 'Starting a class must enter the ArcTable Teacher Monitor.')
  assert(await page.locator('h1').count() === 1, 'Teacher Monitor must retain one semantic primary heading.')
  await page.keyboard.press('Tab')
  assert(await page.evaluate(() => document.activeElement?.matches(':focus-visible') && parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 3), 'ArcTable keyboard focus must remain visibly apparent.')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert(await page.locator('.arctable-progress span').evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration) <= 0.01), 'ArcTable must suppress motion when reduced motion is requested.')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const opened = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')))
  await page.getByRole('button', { name: 'Next phase' }).click()
  await page.getByLabel('Timer duration in minutes').fill('1')
  await page.getByRole('button', { name: 'Start Timer' }).click()
  await page.waitForTimeout(1_100)
  const running = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')))
  assert(running.timer.status === 'running' && running.timer.runStartedAt && running.timer.durationSeconds === 60, 'Classroom timer must start from its own durable timer origin.')
  await capture(page, '07-timer-running.png')
  await page.getByRole('button', { name: 'Plan View', exact: true }).click()
  assert(await page.getByRole('button', { name: /Return to ArcTable/ }).count() === 1, 'Plan View must keep an explicit return to the live class.')
  const held = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')))
  assert(held.startedAt === opened.startedAt && held.session.lessonId === opened.session.lessonId && held.phase === 2 && held.timer.runStartedAt === running.timer.runStartedAt, 'Plan View must preserve class origin, Lesson identity, active phase, and classroom timer origin.')
  await capture(page, '04-plan-while-live.png')
  await page.getByRole('button', { name: /Return to ArcTable/ }).click()

  await page.reload({ waitUntil: 'networkidle' })
  const refreshedRunning = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')))
  assert(refreshedRunning.timer.status === 'running' && refreshedRunning.timer.runStartedAt === running.timer.runStartedAt, 'Running timer must survive a browser refresh.')
  await page.getByRole('button', { name: 'Pause Timer' }).click()
  const paused = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')))
  await page.getByRole('button', { name: 'Plan View', exact: true }).click()
  await page.getByRole('button', { name: /Return to ArcTable/ }).click()
  const restoredPaused = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')))
  assert(restoredPaused.timer.status === 'paused' && restoredPaused.timer.remainingSeconds === paused.timer.remainingSeconds, 'Paused timer must remain paused through Plan View.')

  const planningBeforeTools = await page.evaluate(() => localStorage.getItem('arc.planningWorkspace.v1'))
  await page.getByRole('button', { name: 'People picker' }).focus()
  await page.keyboard.press('Enter')
  assert(await page.getByText('No roster yet. Add names for this live Section.').count() === 1, 'People picker must have an intentional empty state.')
  await page.getByLabel('Student name').fill('Maya Chen')
  await page.getByLabel('Student name').press('Enter')
  await page.getByLabel('Student name').fill('Luis Rivera')
  await page.getByLabel('Student name').press('Enter')
  await page.getByRole('button', { name: 'Pick next student' }).focus()
  await page.keyboard.press('Space')
  assert(await page.getByRole('status').filter({ hasText: 'Selected: Maya Chen' }).count() === 1, 'People picker must announce the selected student accessibly.')
  await page.getByRole('button', { name: 'Project selected student' }).click()
  await capture(page, '08-people-picker.png')

  await page.getByRole('button', { name: 'Pass tools' }).click()
  await page.getByRole('button', { name: 'Activate Hall pass' }).focus()
  await page.keyboard.press('Enter')
  assert(await page.locator('.arctable-pass--active').filter({ hasText: 'Hall pass' }).count() === 1, 'Pass controls must expose active Section-scoped state.')
  await capture(page, '09-pass-tools.png')
  await page.getByRole('button', { name: 'Plan View', exact: true }).click()
  await page.getByRole('button', { name: /Return to ArcTable/ }).click()
  assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))).passes.passes.some((pass) => pass.id === 'hall-pass' && pass.status === 'active'), 'Active pass state must survive Plan View.')

  await page.getByRole('button', { name: 'Media', exact: true }).click()
  const mediaPanel = page.locator('.arctable-media-panel')
  await mediaPanel.getByLabel('Title').fill('Chartres west façade')
  await mediaPanel.getByLabel('Source URL or path').fill('/assets/arc/arc-mark.png')
  await mediaPanel.getByRole('button', { name: 'Add media' }).click()
  await mediaPanel.getByRole('button', { name: 'Project active media' }).click()
  assert(await page.getByRole('region', { name: 'Active media: Chartres west façade' }).count() === 1, 'Teacher Monitor must render selected media in the real media surface.')
  await capture(page, '10-media.png')
  await page.getByRole('button', { name: 'Plan View', exact: true }).click()
  await page.getByRole('button', { name: /Return to ArcTable/ }).click()
  assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))).media.projected, 'Active media selection and projection must survive Plan View.')

  await page.getByLabel('Cleanup duration in minutes').fill('1')
  await page.getByRole('button', { name: 'Start cleanup' }).click()
  const cleaning = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')))
  assert(cleaning.cleanupTimer.status === 'running' && cleaning.cleanupTimer.runStartedAt && cleaning.session.sectionId === 'section-p4', 'Cleanup must enter a real Section-scoped countdown without ending class.')
  await page.getByRole('button', { name: 'Cancel cleanup' }).click()
  assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))).cleanupTimer.status === 'idle', 'Cleanup must be cancellable without ending class.')
  await page.getByRole('button', { name: 'Start cleanup' }).click()
  await page.getByRole('button', { name: 'Plan View', exact: true }).click()
  await page.getByRole('button', { name: /Return to ArcTable/ }).click()
  assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))).cleanupTimer.status === 'running', 'Cleanup countdown must survive Plan View.')
  await capture(page, '11-cleanup-teacher.png')
  await capture(page, '05-teacher-monitor.png')
  await page.setViewportSize({ width: 390, height: 844 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Teacher Monitor must reflow without document overflow at 390px.')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: /Student preview/ }).click()
  assert(await page.getByRole('heading', { name: /Gothic cathedrals/ }).count() === 1, 'Projected Student Surface must contain the active instructional prompt.')
  assert(await page.getByText('Teacher controls', { exact: true }).count() === 0, 'Projected Student Surface must not expose teacher controls.')
  assert(await page.getByText('Hall pass', { exact: true }).count() === 0, 'Projected Student Surface must not expose private pass state.')
  assert(await page.getByText('Maya Chen, you’re up.', { exact: true }).count() === 1, 'People result must project only after deliberate teacher action.')
  assert(await page.getByRole('region', { name: 'Active media: Chartres west façade' }).count() === 1, 'Student Surface must display only deliberately projected media.')
  assert(await page.getByText('Cleanup now', { exact: true }).count() === 1, 'Student Surface must visibly transition to cleanup mode.')
  await capture(page, '06-student-surface.png')
  await capture(page, '12-cleanup-student.png')
  assert(await page.locator('.arctable--student button').count() === 1 && await page.getByRole('button', { name: 'Exit projection' }).isVisible(), 'Projected surface must contain no hidden keyboard-reachable teacher controls.')
  await page.setViewportSize({ width: 390, height: 844 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Projected Student Surface must reflow without document overflow at 390px.')
  await page.setViewportSize({ width: 1440, height: 1000 })
  assert(await page.evaluate((before) => localStorage.getItem('arc.planningWorkspace.v1') === before, planningBeforeTools), 'Live people, pass, and media tools must not mutate canonical Lesson planning data.')
  await page.getByRole('button', { name: 'Exit projection' }).click()
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
