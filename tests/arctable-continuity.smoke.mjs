import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

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
  { id: 'lesson-chartres', calendarId, courseId: 'course-apah', unitId: 'unit-apah', title: 'Gothic cathedrals: Chartres, light, engineering', sequence: 1, plannedDate: '2026-10-12', datePolicy: 'flexible', directions: ['Find one vertical line that pulls your eye upward.', 'Compare the west façade to the nave elevation.', 'Talk with your table: structure, light, or sculpture?'], materials: ['Workbook', 'Pencil'], phases: ['Look', 'Compare', 'Discuss', 'Reflect'], resources: [{ id: 'chartres-reference', title: 'Chartres reference image', kind: 'image', source: '/assets/arc/arc-mark.png' }] },
  { id: 'lesson-collage', calendarId, courseId: 'course-2d', unitId: 'unit-2d', title: 'Cover composition', sequence: 1, plannedDate: '2026-10-12', datePolicy: 'flexible' },
  { id: 'lesson-attachments', calendarId, courseId: 'course-3d', unitId: 'unit-3d', title: 'Cardboard attachment lab', sequence: 1, plannedDate: '2026-10-12', datePolicy: 'flexible' },
  { id: 'lesson-assessment', calendarId, courseId: 'course-3d', unitId: 'unit-3d', title: 'Attachment strength assessment', sequence: 2, plannedDate: '2026-10-16', datePolicy: 'fixed' },
]

function assert(condition, message) { if (!condition) throw new Error(message) }
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
  assert(Math.max(...widths) - Math.min(...widths) < 2, 'Week day columns must stay equal width (no focus/hover expand).')
  const weekFocusLesson = page
    .locator('[data-plan-calendar-surface="teaching-week"] .planning-day-slot--focus .planning-lesson')
    .filter({ hasText: 'Gothic cathedrals' })
    .first()
  await weekFocusLesson.click()
  await weekFocusLesson.getByRole('button', { name: 'Start class' }).click()
  assert(await page.getByRole('main').getAttribute('class').then((value) => value?.includes('arctable--teacher')), 'Teaching week must launch ArcTable from the focused day row without switching to Day.')
  await page.getByRole('button', { name: 'End Class' }).click()
  await page.getByRole('button', { name: 'Skip — lesson never started' }).click()
  assert(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')) === null, 'Week-row launch must respect the same End Class boundary as Day.')
  await selectView(page, 'Week')
  const trayTab = page.getByRole('button', { name: 'TRAY', exact: true })
  if (await trayTab.count()) {
    await trayTab.evaluate((element) => element.click())
    const quickCapture = page.getByRole('textbox', { name: 'Quick capture', exact: true })
    if (await quickCapture.count()) {
      assert(await quickCapture.count() === 1, 'Tray must expose real capture before Course placement.')
      assert(!(await page.locator('body').innerText()).includes('Fridge'), 'Visible product language must say Tray while internal fridge compatibility seams remain untouched.')
      await capture(page, '02-week-workspace.png')
      await trayTab.evaluate((element) => element.click())
    }
  }

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
  assert(await page.getByText('Find one vertical line that pulls your eye upward.', { exact: true }).count() === 1, 'Teacher Monitor must receive actual canonical Lesson directions instead of generic seeded copy.')
  assert(await page.getByText('Workbook · Pencil', { exact: true }).count() === 1, 'Teacher Monitor must receive actual canonical Lesson materials.')
  const teachingShare = await page.locator('.arctable-board').evaluate((board) => board.getBoundingClientRect().width / board.parentElement.getBoundingClientRect().width)
  assert(teachingShare > 0.7, 'The active teaching surface must hold the clear majority of Teacher Monitor width.')
  assert(await page.locator('.arctable-tool-panel').count() === 0, 'Closed classroom tools must not consume permanent workspace.')
  const roundedUtilityCards = await page.locator('.arctable-controls > section, .arctable-control-row, .arctable-control-field').evaluateAll((nodes) => nodes.filter((node) => { const style = getComputedStyle(node); return parseFloat(style.borderRadius) >= 10 && ['solid', 'double'].includes(style.borderTopStyle) && parseFloat(style.borderTopWidth) > 0 }).length)
  assert(roundedUtilityCards <= 1, 'Teacher Monitor must not read as an equal-weight stack of rounded SaaS cards.')
  const headerMark = page.getByTestId('arctable-header-mark')
  assert(await headerMark.count() === 1, 'Teacher Monitor must render the ArcTable AT-001 header mark.')
  assert(await headerMark.evaluate((img) => img.complete && img.naturalWidth > 0), 'Teacher Monitor header mark asset must load via publicAssetUrl.')
  const headerMarkSrc = await headerMark.getAttribute('src')
  assert(headerMarkSrc?.includes('assets/arctable/arctable-quadrant-mark.png'), 'Header mark must use Kelly ArcTable quadrant mark.')
  assert(await page.getByTestId('arctable-settings').count() === 1, 'Teacher Monitor must expose a Table settings control.')
  assert(await page.getByTestId('arctable-settings').innerText().then((text) => /table settings/i.test(text)), 'ArcTable control must say Table settings, not generic Settings.')
  const viewportFit = await page.evaluate(() => {
    const main = document.querySelector('.arctable--teacher')
    const board = document.querySelector('.arctable-board')
    if (!main || !board) return { ok: false, reason: 'missing-nodes' }
    const mainBox = main.getBoundingClientRect()
    const boardBox = board.getBoundingClientRect()
    const pageScrollable = document.documentElement.scrollHeight > window.innerHeight + 2
    const liveChip = getComputedStyle(document.querySelector('.arctable-live-chip'))
    const pineFill = liveChip.backgroundColor === 'rgb(31, 75, 58)'
    return {
      ok: mainBox.height <= window.innerHeight + 1 && boardBox.top >= 0 && boardBox.bottom <= window.innerHeight + 2 && !pageScrollable && !pineFill,
      mainHeight: mainBox.height,
      viewport: window.innerHeight,
      boardTop: boardBox.top,
      boardBottom: boardBox.bottom,
      pageScrollable,
      pineFill,
      liveChipBg: liveChip.backgroundColor,
    }
  })
  assert(viewportFit.ok, `Teacher Monitor must fit one desktop viewport without pine-fill chrome (${JSON.stringify(viewportFit)}).`)
  const timerFit = await page.locator('.arctable-timer-display').evaluate((el) => {
    const digits = el.querySelector('.arctable-timer-digits')
    if (!digits) return { ok: false, reason: 'missing-digits' }
    const ring = el.getBoundingClientRect()
    const textBox = digits.getBoundingClientRect()
    const maxWidth = ring.width * 0.62
    return {
      ok: textBox.width <= maxWidth + 1 && Boolean(digits.textContent?.includes(':')),
      label: digits.textContent,
      textWidth: textBox.width,
      maxWidth,
      ringSize: ring.width,
    }
  })
  assert(timerFit.ok, `Classroom timer digits must fit inside the green ring without clipping (${JSON.stringify(timerFit)}).`)
  await capture(page, '05-teacher-monitor.png')
  await page.keyboard.press('Tab')
  assert(await page.evaluate(() => document.activeElement?.matches(':focus-visible') && parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 3), 'ArcTable keyboard focus must remain visibly apparent.')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert(await page.locator('.arctable-progress span').evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration) <= 0.01), 'ArcTable must suppress motion when reduced motion is requested.')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const opened = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')))
  assert(opened.session.directions[0] === 'Find one vertical line that pulls your eye upward.' && opened.session.resources[0].id === 'chartres-reference', 'Live session must preserve the canonical Lesson content projection.')
  await page.getByLabel('Timer duration in minutes').fill('120')
  assert(await page.getByLabel('Timer duration in minutes').inputValue() === '120' && JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))).timer.durationSeconds === 7200, 'Timer UI and state must accept the shared maximum duration.')
  await page.getByLabel('Timer duration in minutes').fill('121')
  assert(await page.getByLabel('Timer duration in minutes').inputValue() === '120' && JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))).timer.durationSeconds === 7200, 'Timer values above the shared maximum must visibly constrain instead of silently disagreeing with state.')
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

  const lessonSourceBeforeTools = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('arc.lessons.v1')).input.lessons.find((lesson) => lesson.id === 'lesson-chartres')))
  await page.getByRole('button', { name: 'People picker' }).focus()
  await page.keyboard.press('Enter')
  assert(await page.getByText(/No roster yet\. Names added here are saved/).count() === 1, 'People picker must explain its reusable Section roster boundary.')
  await page.getByLabel('Student name').fill('Maya Chen')
  await page.getByLabel('Student name').press('Enter')
  await page.getByLabel('Student name').fill('Luis Rivera')
  await page.getByLabel('Student name').press('Enter')
  await page.getByLabel('Picker mode').selectOption('round-robin')
  await page.getByRole('button', { name: 'Pick next in rotation' }).focus()
  await page.keyboard.press('Space')
  assert(await page.getByRole('status').filter({ hasText: 'Selected: Maya Chen' }).count() === 1, 'People picker must announce the selected student accessibly.')
  await page.getByRole('button', { name: 'Project selected student' }).click()
  await capture(page, '08-people-picker.png')

  await page.getByRole('button', { name: 'Pass tools' }).click()
  await page.getByLabel('Hall pass person').selectOption({ label: 'Maya Chen' })
  await page.getByRole('button', { name: 'Request Hall pass' }).click()
  assert(await page.locator('.arctable-pass--requested').filter({ hasText: 'Maya Chen' }).count() === 1, 'Requested pass state must show ownership to the teacher.')
  await page.getByRole('button', { name: 'Activate Hall pass' }).focus()
  await page.keyboard.press('Enter')
  assert(await page.locator('.arctable-pass--active').filter({ hasText: 'Maya Chen' }).count() === 1, 'Pass controls must expose active Section-scoped ownership.')
  await page.getByRole('button', { name: 'Return Hall pass' }).click()
  assert(await page.locator('.arctable-pass--inactive').filter({ hasText: 'Hall pass' }).filter({ hasText: 'unassigned' }).count() === 1, 'Returning a pass must clear live ownership.')
  await page.getByRole('button', { name: 'Activate Hall pass' }).click()
  await capture(page, '09-pass-tools.png')
  await page.locator('.arctable-board').click({ position: { x: 24, y: 24 } })
  assert(await page.locator('.arctable-pass-panel').count() === 0, 'Pass tools must dismiss on outside click.')
  await page.getByRole('button', { name: 'Pass tools' }).click()
  await page.getByRole('button', { name: 'Activate Hall pass' }).click()
  await page.getByRole('button', { name: 'Plan View', exact: true }).click()
  await page.getByRole('button', { name: /Return to ArcTable/ }).click()
  assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))).passes.passes.some((pass) => pass.id === 'hall-pass' && pass.status === 'active'), 'Active pass state must survive Plan View.')

  await page.getByTestId('arctable-settings').click()
  assert(await page.getByTestId('arctable-table-settings-surface').count() === 1, 'Table settings must open an ArcTable classroom panel, not leave the live class.')
  assert(await page.locator('#b01-settings-surface').count() === 0, 'Table settings must not open plan #b01-settings-surface school-year furniture.')
  assert(await page.getByRole('heading', { name: 'Table settings', exact: true }).count() === 1, 'Table settings panel must own its own heading.')
  assert(await page.getByText(/School year, calendar, and courses stay in Plan/i).count() === 1, 'Table settings must explain the Plan SETTINGS ownership boundary.')
  assert(await page.getByRole('main').getAttribute('class').then((value) => value?.includes('arctable--teacher')), 'Opening Table settings must keep Teacher Monitor mounted.')
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  assert(await page.getByTestId('arctable-table-settings-surface').count() === 0, 'Closing Table settings must dismiss the classroom panel.')

  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Media', exact: true }).click()
  const mediaPanel = page.locator('.arctable-media-panel')
  await mediaPanel.getByLabel('Title').fill('Chartres west façade')
  await mediaPanel.getByLabel('Source URL or path').fill('/assets/arc/arc-mark.png')
  await mediaPanel.getByRole('button', { name: 'Add media' }).click()
  await mediaPanel.getByRole('button', { name: 'Project active media' }).click()
  assert(await page.getByRole('region', { name: 'Active media: Chartres west façade' }).count() === 1, 'Teacher Monitor must render selected media in the real media surface.')
  await capture(page, '10-media.png')
  await mediaPanel.getByLabel('Title').fill('Unsupported deck')
  await mediaPanel.getByLabel('Source URL or path').fill('https://example.com/deck')
  await mediaPanel.getByLabel('Type').selectOption('slides')
  await mediaPanel.getByRole('button', { name: 'Add media' }).click()
  assert(await mediaPanel.getByRole('alert').filter({ hasText: 'valid Google Slides' }).count() === 1 && await page.locator('iframe[title="Unsupported deck"]').count() === 0, 'Unsupported slide providers must fail clearly rather than render a blank frame.')
  await mediaPanel.getByLabel('Title').fill('Public design deck')
  await mediaPanel.getByLabel('Source URL or path').fill('https://docs.google.com/presentation/d/1NDNfwoWFSYbQaebMiiXE8GOW0ivDZii4We8I552AFgs/edit?usp=sharing')
  await mediaPanel.getByLabel('Type').selectOption('slides')
  await mediaPanel.getByRole('button', { name: 'Add media' }).click()
  assert(await page.locator('iframe[title="Public design deck"]').getAttribute('src').then((source) => source?.includes('/embed?start=false')), 'A real public Google Slides edit URL must normalize to a deliberate view-only embed.')
  await mediaPanel.getByRole('button', { name: 'Project active media' }).click()
  await page.waitForTimeout(1_000)
  assert(page.frames().some((frame) => frame.url().includes('docs.google.com/presentation/d/1NDNfwoWFSYbQaebMiiXE8GOW0ivDZii4We8I552AFgs/embed')), 'Teacher Monitor must initiate the real Google Slides embed frame.')
  await capture(page, '10b-google-slides.png')
  await page.getByRole('button', { name: 'Plan View', exact: true }).click()
  await page.getByRole('button', { name: /Return to ArcTable/ }).click()
  assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))).media.projected, 'Active media selection and projection must survive Plan View.')

  await page.getByRole('button', { name: /Student preview/ }).click()
  await page.waitForTimeout(1_000)
  assert(await page.getByText('Find one vertical line that pulls your eye upward.', { exact: true }).count() === 1, 'Student Surface must receive the projected canonical Lesson directions.')
  assert(await page.getByText('Workbook · Pencil', { exact: true }).count() === 1, 'Student Surface must receive the projected canonical Lesson materials.')
  assert(await page.getByText(/Class live/i).count() === 0, 'Student Surface must not expose teacher-only class elapsed metadata.')
  assert(await page.getByTestId('arctable-teacher-mode').count() === 1, 'Student Surface must expose Teacher mode to return to Teacher Monitor.')
  assert(await page.getByTestId('arctable-sync').count() === 1, 'Student Surface must expose Sync to follow teacher live state.')
  assert(await page.getByTestId('arctable-sync-status').count() === 1, 'Student Surface must show follow/sync status.')
  assert(await page.locator('iframe[title="Public design deck"]').count() === 1, 'Student Surface must project the selected Google Slides deck without editing controls.')
  await capture(page, '06-student-surface.png')
  await page.getByTestId('arctable-teacher-mode').click()
  assert(await page.getByText('Teacher controls', { exact: true }).count() === 1, 'Teacher mode must return to Teacher Monitor.')
  await page.getByRole('button', { name: /Student preview/ }).click()
  await page.evaluate(() => {
    const raw = localStorage.getItem('arc.arctable.live.v1')
    const live = JSON.parse(raw)
    live.phase = Math.min(live.phaseCount, live.phase + 1)
    live.voiceLevel = 3
    live.materials = 'Synced materials pack'
    localStorage.setItem('arc.arctable.live.v1', JSON.stringify(live))
  })
  assert(await page.getByText('Synced materials pack', { exact: true }).count() === 0, 'Student Surface should not pick up storage edits until Sync.')
  const partButtons = page.locator('[data-testid="arctable-student-parts"] button')
  if (await partButtons.count() > 1) {
    await partButtons.nth(1).click()
    assert(await page.getByText(/preview/i).count() >= 1, 'Browsing a lesson part must leave follow mode until Sync.')
  }
  await page.getByTestId('arctable-sync').click()
  assert(await page.getByText('Synced materials pack', { exact: true }).count() === 1, 'Sync must reload teacher live state (materials) from storage.')
  assert(await page.getByText('Voice 3', { exact: true }).count() === 1, 'Sync must reload teacher voice level from storage.')
  assert(await page.getByText(/Synced · following teacher/i).count() === 1, 'Sync must confirm follow status.')
  await page.keyboard.press('Escape')
  assert(await page.getByText('Teacher controls', { exact: true }).count() === 1, 'Escape must still return the teacher to Teacher Monitor.')

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
  await page.setViewportSize({ width: 390, height: 844 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Teacher Monitor must reflow without document overflow at 390px.')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: /Student preview/ }).click()
  assert(await page.getByRole('heading', { name: /Gothic cathedrals/ }).count() === 1, 'Projected Student Surface must contain the active instructional prompt.')
  assert(await page.getByText('Teacher controls', { exact: true }).count() === 0, 'Projected Student Surface must not expose teacher controls.')
  assert(await page.getByText('Hall pass', { exact: true }).count() === 0, 'Projected Student Surface must not expose private pass state.')
  assert(await page.getByText('Maya Chen, you’re up.', { exact: true }).count() === 1, 'People result must project only after deliberate teacher action.')
  assert(await page.getByRole('region', { name: 'Active media: Public design deck' }).count() === 1, 'Student Surface must display only deliberately projected media.')
  assert(await page.getByText('Cleanup now', { exact: true }).count() === 1, 'Student Surface must visibly transition to cleanup mode.')
  await capture(page, '12-cleanup-student.png')
  assert(await page.getByTestId('arctable-teacher-mode').count() === 1, 'Projected surface keeps Teacher mode chrome in the header.')
  assert(await page.getByTestId('arctable-sync').count() === 1, 'Projected surface keeps Sync chrome in the header.')
  assert(await page.getByTestId('arctable-student-parts').count() === 1, 'Lesson parts strip must remain on the student stage.')
  assert(await page.locator('.arctable-student-work button, .arctable-student-now button').count() === 0, 'Lesson work + now rail must stay free of teacher tool controls (header + parts strip only).')
  await page.setViewportSize({ width: 390, height: 844 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Projected Student Surface must reflow without document overflow at 390px.')
  await page.setViewportSize({ width: 1440, height: 1000 })
  assert(await page.evaluate((before) => JSON.stringify(JSON.parse(localStorage.getItem('arc.lessons.v1')).input.lessons.find((lesson) => lesson.id === 'lesson-chartres')) === before, lessonSourceBeforeTools), 'Live timer, people, pass, media, and cleanup state must not mutate canonical Lesson source content.')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'End Class' }).click()
  assert(await page.getByRole('button', { name: 'Skip — lesson never started' }).count() === 0, 'Skip must disappear after meaningful class progress.')
  await page.getByRole('button', { name: 'Save stop point' }).click()
  assert(await page.getByRole('dialog').count() === 1, 'Stop Here must remain blocked until a resume note is provided.')
  await page.getByLabel('Stop here + required resume note').fill('Resume with the rose-window comparison.')
  await page.getByRole('button', { name: 'Save stop point' }).click()
  assert(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')) === null, 'End Class must clear live state only after an explicit outcome.')
  await selectView(page, 'Day')
  await page.locator('.day-period-button').filter({ hasText: 'Period 4' }).click()
  await page.getByRole('button', { name: 'Resume in ArcTable' }).click()
  await page.getByRole('button', { name: 'People picker' }).click()
  assert(await page.getByText('2 students saved for Period 4.', { exact: true }).count() === 1, 'The same Section must load its reusable roster in a separate live session.')
  assert(await page.getByText('No student selected.', { exact: true }).count() === 1, 'Picker selection must remain transient when the reusable roster reloads.')
  await page.getByRole('button', { name: 'Pass tools' }).click()
  assert(await page.locator('.arctable-pass--inactive').count() === 2, 'Pass live status must clear when a new session starts while definitions persist.')
  await page.getByRole('button', { name: 'End Class' }).click()
  await page.getByRole('button', { name: 'Complete lesson' }).click()
  const savedLessons = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.lessons.v1')))
  assert(savedLessons.input.deliveryStates.some((state) => state.lessonId === 'lesson-chartres' && state.sectionId === 'section-p4' && state.status === 'completed'), 'End Class must record the outcome only for the active Section.')
  await page.locator('.day-period-button').filter({ hasText: 'Period 1' }).click()
  await page.getByRole('button', { name: 'Start class' }).click()
  await page.getByRole('button', { name: 'People picker' }).click()
  assert(await page.getByText(/No roster yet/).count() === 1, 'Another Section must not inherit Period 4’s roster.')
  await page.getByRole('button', { name: 'Pass tools' }).click()
  assert(await page.locator('.arctable-pass').filter({ hasText: 'Maya Chen' }).count() === 0, 'Another Section must not inherit pass ownership.')
  await page.getByRole('button', { name: 'End Class' }).click()
  await page.getByRole('button', { name: 'Skip — lesson never started' }).click()
  const actionableRuntimeErrors = runtimeErrors.filter((message) => !message.includes('ERR_UNKNOWN_URL_SCHEME'))
  assert(actionableRuntimeErrors.length === 0, `Runtime errors: ${actionableRuntimeErrors.join(' | ')}`)
  console.log('Arc multi-prep + ArcTable browser continuity gate passed')
} finally {
  await browser.close()
}
