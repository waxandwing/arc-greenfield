import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-hostile-audit',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-14',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
}

const planningInput = {
  calendarId: calendarInput.id,
  courses: [{ id: 'course-apah', title: 'AP Art History — Ancient Mediterranean and Near Eastern Traditions' }],
  sections: [
    { id: 'section-p2', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 2' },
    { id: 'section-p5', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 5' },
    { id: 'section-p7', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 7' },
  ],
}

const unitsInput = {
  calendarId: calendarInput.id,
  units: [{ id: 'unit-meso', calendarId: calendarInput.id, courseId: 'course-apah', title: 'Ancient Mesopotamia: Power, Place, and Early Urban Systems', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } }],
}

const lessonsInput = {
  calendarId: calendarInput.id,
  lessons: [
    { id: 'lesson-17', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'Ziggurat of Ur: Monumentality, Ritual, and Civic Power', sequence: 17, plannedDate: '2026-09-14', datePolicy: 'flexible' },
    { id: 'lesson-18', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'Standard of Ur: War, Peace, Register, and Royal Authority', sequence: 18, plannedDate: '2026-09-15', datePolicy: 'fixed' },
  ],
  deliveryStates: [
    { lessonId: 'lesson-17', sectionId: 'section-p2', status: 'completed', taughtDate: '2026-09-14', resumeNote: null },
    { lessonId: 'lesson-17', sectionId: 'section-p5', status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Stopped after the reconstruction demo; students still need the visual-evidence comparison before moving on.' },
    { lessonId: 'lesson-17', sectionId: 'section-p7', status: 'skipped', taughtDate: null, resumeNote: null },
  ],
}

const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-14T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
}

async function seededContext(browser, options) {
  const context = await browser.newContext(options)
  await context.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, storage)
  return context
}

function trackRuntimeErrors(page) {
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
  return runtimeErrors
}

async function openDay(context) {
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const day = page.getByRole('button', { name: 'Day', exact: true })
  await day.click()
  await page.getByRole('heading', { name: 'Day' }).waitFor()
  return { page, runtimeErrors }
}

async function auditDesktop(browser) {
  const context = await seededContext(browser, { viewport: { width: 1440, height: 900 } })
  const { page, runtimeErrors } = await openDay(context)
  assert(await page.getByRole('navigation', { name: 'Calendar views' }).count() === 1, '1440px: calendar view navigation lost its accessible name.')
  assert(await page.locator('main#calendar-stage').count() === 1, '1440px: main calendar landmark is missing or duplicated.')
  const sectionColumns = await page.locator('.day-continuity-section').first().evaluate((node) => getComputedStyle(node).gridTemplateColumns)
  assert(sectionColumns.includes(' '), `1440px: Day should use the approved two-column layout, got ${sectionColumns}.`)
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }))
  assert(geometry.document <= geometry.viewport + 1, `1440px: document overflowed horizontally (${geometry.document} > ${geometry.viewport}).`)
  assert(runtimeErrors.length === 0, `1440px: runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditZoomEquivalent(browser) {
  const context = await seededContext(browser, { viewport: { width: 720, height: 450 } })
  const { page, runtimeErrors } = await openDay(context)
  const sectionColumns = await page.locator('.day-continuity-section').first().evaluate((node) => getComputedStyle(node).gridTemplateColumns)
  assert(!sectionColumns.includes(' '), `200%-zoom equivalent: Day did not collapse to one column (${sectionColumns}).`)
  const geometry = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth, stage: document.querySelector('.arc-calendar-stage')?.scrollWidth ?? 0, stageClient: document.querySelector('.arc-calendar-stage')?.clientWidth ?? 0 }))
  assert(geometry.document <= geometry.viewport + 1, `200%-zoom equivalent: document overflowed (${geometry.document} > ${geometry.viewport}).`)
  assert(geometry.stage <= geometry.stageClient + 1, `200%-zoom equivalent: calendar stage overflowed (${geometry.stage} > ${geometry.stageClient}).`)
  assert(runtimeErrors.length === 0, `200%-zoom equivalent: runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditKeyboard(browser) {
  const context = await seededContext(browser, { viewport: { width: 1024, height: 900 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const skip = page.locator('.skip-link')
  const before = await page.evaluate(() => ({ tag: document.activeElement?.tagName, cls: document.activeElement?.className || '', text: document.activeElement?.textContent?.trim() || '' }))
  const skipState = await skip.evaluate((node) => {
    const style = getComputedStyle(node)
    const rect = node.getBoundingClientRect()
    return { tabIndex: node.tabIndex, display: style.display, visibility: style.visibility, pointerEvents: style.pointerEvents, width: rect.width, height: rect.height, x: rect.x, y: rect.y }
  })
  await page.keyboard.press('Tab')
  const after = await page.evaluate(() => {
    const el = document.activeElement
    return { tag: el?.tagName, cls: el?.className || '', text: el?.textContent?.trim() || '', aria: el?.getAttribute?.('aria-label') || '' }
  })
  assert(await skip.evaluate((node) => document.activeElement === node), `Keyboard: first Tab does not reach Skip to calendar. before=${JSON.stringify(before)} skip=${JSON.stringify(skipState)} after=${JSON.stringify(after)}`)
  const focus = await skip.evaluate((node) => { const style = getComputedStyle(node); return { outline: style.outlineStyle, width: parseFloat(style.outlineWidth || '0') } })
  assert(focus.outline !== 'none' && focus.width >= 3, 'Keyboard: skip-link focus is not visibly strong enough.')
  await page.keyboard.press('Enter')
  assert(await page.locator('#calendar-stage').evaluate((node) => document.activeElement === node), 'Keyboard: activating Skip to calendar does not move focus to the main stage.')
  const week = page.getByRole('button', { name: 'Week', exact: true })
  const day = page.getByRole('button', { name: 'Day', exact: true })
  await week.focus()
  await page.keyboard.press('Tab')
  assert(await day.evaluate((node) => document.activeElement === node), 'Keyboard: Tab from Week does not advance to Day.')
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: 'Day' }).waitFor()
  assert(await day.getAttribute('aria-current') === 'page', 'Keyboard: Enter on Day does not activate Day view.')
  assert(runtimeErrors.length === 0, `Keyboard: runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditTouch(browser) {
  const context = await seededContext(browser, { viewport: { width: 390, height: 844 }, hasTouch: true })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const day = page.getByRole('button', { name: 'Day', exact: true })
  const dayBox = await day.boundingBox()
  assert(dayBox && dayBox.height >= 44 && dayBox.width >= 44, `Touch: Day target is smaller than 44px (${dayBox?.width}×${dayBox?.height}).`)
  await day.tap()
  await page.getByRole('heading', { name: 'Day' }).waitFor()
  const next = page.getByRole('button', { name: 'Next Day' })
  const nextBox = await next.boundingBox()
  assert(nextBox && nextBox.height >= 44 && nextBox.width >= 44, `Touch: Next Day target is smaller than 44px (${nextBox?.width}×${nextBox?.height}).`)
  await next.tap()
  assert(await page.getByText('Arc is holding your place', { exact: true }).isVisible(), 'Touch: tapping Next Day did not preserve carryover continuity.')
  assert(runtimeErrors.length === 0, `Touch: runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditReducedMotion(browser) {
  const context = await seededContext(browser, { viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' })
  const { page, runtimeErrors } = await openDay(context)
  assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'Reduced motion: Chromium context did not expose the requested preference.')
  const timing = await page.locator('.view-nav-item').first().evaluate((node) => { const style = getComputedStyle(node); const parse = (value) => value.split(',').map((item) => parseFloat(item) || 0); return { animation: Math.max(...parse(style.animationDuration)), transition: Math.max(...parse(style.transitionDuration)) } })
  assert(timing.animation <= 0.01 && timing.transition <= 0.01, `Reduced motion: motion was not effectively suppressed (${JSON.stringify(timing)}).`)
  assert(runtimeErrors.length === 0, `Reduced motion: runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditDesktop(browser)
  await auditZoomEquivalent(browser)
  await auditKeyboard(browser)
  await auditTouch(browser)
  await auditReducedMotion(browser)
  console.log('Hostile Day browser audit passed: 1440 desktop, 200%-zoom equivalent, keyboard, touch, reduced-motion, landmarks, target sizes, overflow, and runtime errors.')
} finally {
  await browser.close()
}
