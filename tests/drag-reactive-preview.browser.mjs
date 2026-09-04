import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const assert = (condition, message) => { if (!condition) throw new Error(message) }

const calendarInput = {
  id: 'calendar-drag-preview-audit', schoolYearLabel: '2026–27', firstDay: '2026-09-14', lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [],
}
const planningInput = {
  calendarId: calendarInput.id,
  courses: [{ id: 'course-apah', title: 'AP Art History' }],
  sections: [{ id: 'section-p5', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 5' }],
}
const unitsInput = {
  calendarId: calendarInput.id,
  units: [{ id: 'unit-meso', calendarId: calendarInput.id, courseId: 'course-apah', title: 'Ancient Mesopotamia', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } }],
}
const lessonsInput = {
  calendarId: calendarInput.id,
  lessons: [
    { id: 'lesson-drag', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'Cylinder Seal Comparison', sequence: 1, plannedDate: null, datePolicy: 'flexible' },
    { id: 'lesson-stack', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'Standard of Ur Registers', sequence: 2, plannedDate: null, datePolicy: 'flexible' },
  ],
  deliveryStates: [],
}
const fridgeInput = {
  calendarId: calendarInput.id,
  state: {
    magnets: [{ id: 'magnet-loose', title: 'Gallery walk idea' }, { id: 'magnet-stack', title: 'Comparison prompt' }],
    placements: [
      { entityRef: 'unit:unit-meso', surface: 'door', row: 0, column: 0, stackId: null, stackOrder: null, priority: null },
      { entityRef: 'lesson:lesson-drag', surface: 'door', row: 0, column: 1, stackId: null, stackOrder: null, priority: 'must' },
      { entityRef: 'magnet:magnet-loose', surface: 'door', row: 0, column: 2, stackId: null, stackOrder: null, priority: null },
      { entityRef: 'lesson:lesson-stack', surface: 'door', row: 1, column: 0, stackId: 'stack-preview', stackOrder: 0, priority: null },
      { entityRef: 'magnet:magnet-stack', surface: 'door', row: 1, column: 0, stackId: 'stack-preview', stackOrder: 1, priority: 'could' },
    ],
  },
}
const shiftInput = { calendarId: calendarInput.id, overrides: [], undo: null }
const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-14T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
  'arc.fridgeDoor.v1': JSON.stringify({ schemaVersion: 1, input: fridgeInput }),
  'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: shiftInput }),
}
const guardedKeys = ['arc.units.v1', 'arc.lessons.v1', 'arc.fridgeDoor.v1', 'arc.shift.v1']

async function snapshot(page) {
  return page.evaluate((keys) => Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)])), guardedKeys)
}
async function startDrag(page, locator) {
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
  await locator.dispatchEvent('dragstart', { dataTransfer })
  return dataTransfer
}
async function endDrag(locator, dataTransfer) {
  await locator.dispatchEvent('dragend', { dataTransfer })
  await dataTransfer.dispose()
}
async function assertUnchanged(page, before, label) {
  const after = await snapshot(page)
  assert(JSON.stringify(after) === JSON.stringify(before), `${label}: drag preview changed persisted planning/Fridge/Shift state.`)
}

async function auditViewport(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((entries) => {
    if (sessionStorage.getItem('arc.dragPreviewAuditSeeded') === '1') return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    sessionStorage.setItem('arc.dragPreviewAuditSeeded', '1')
  }, storage)
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const fridge = page.getByRole('region', { name: 'Fridge Door' })
  const unit = fridge.locator('[data-fridge-ref="unit:unit-meso"]')
  const lesson = fridge.locator('[data-fridge-ref="lesson:lesson-drag"]')
  const magnet = fridge.locator('[data-fridge-ref="magnet:magnet-loose"]')
  const stack = fridge.locator('[data-fridge-stack="stack-preview"]')
  assert(await unit.getAttribute('draggable') !== 'true', `${width}px: Unit became draggable without approved one-date Unit semantics.`)
  assert(await lesson.getAttribute('draggable') === 'true', `${width}px: loose Lesson drag-preview affordance is missing.`)
  assert(await magnet.getAttribute('draggable') === 'true', `${width}px: loose Magnet drag-preview affordance is missing.`)
  assert(await stack.getAttribute('draggable') === 'true', `${width}px: whole-stack drag-preview affordance is missing.`)
  assert(await fridge.getByLabel('Position').count() > 0, `${width}px: non-drag Reposition route disappeared.`)
  assert(await fridge.getByRole('group', { name: 'Stack items' }).isVisible(), `${width}px: non-drag Stack route disappeared.`)

  const before = await snapshot(page)
  await page.getByRole('button', { name: 'Month', exact: true }).click()
  const lessonMonth = fridge.locator('[data-fridge-ref="lesson:lesson-drag"]')
  let transfer = await startDrag(page, lessonMonth)
  assert(await page.getByRole('status').filter({ hasText: /Drag preview: valid Lesson dates/i }).isVisible(), `${width}px: Lesson preview did not announce reactive target mode.`)
  const dateTargets = page.locator('[data-drag-date-target]')
  const targetDates = await dateTargets.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-drag-date-target')).filter(Boolean))
  assert(targetDates.length === 10, `${width}px: Lesson preview exposed ${targetDates.length} date targets instead of the 10 valid instructional dates in its Unit.`)
  assert(targetDates.includes('2026-09-14') && targetDates.includes('2026-09-25'), `${width}px: Lesson preview omitted valid Unit boundary dates.`)
  assert(!targetDates.includes('2026-09-19') && !targetDates.includes('2026-09-20'), `${width}px: Lesson preview exposed weekend dates.`)
  assert(await page.locator('.planning-day-slot[data-drag-date-target]').count() === 0, `${width}px: class/Period cell was advertised as generic Lesson Move target.`)
  assert(await fridge.locator('[data-fridge-drag-target]').count() > 0, `${width}px: free Fridge positions did not react during Lesson drag.`)
  assert(await fridge.locator('[data-fridge-stack-target="stack-preview"]').count() === 1, `${width}px: compatible explicit stack target did not react during Lesson drag.`)
  const firstDateTarget = dateTargets.first()
  await firstDateTarget.dispatchEvent('dragover', { dataTransfer: transfer })
  await firstDateTarget.dispatchEvent('drop', { dataTransfer: transfer })
  await assertUnchanged(page, before, `${width}px Lesson calendar drop preview`)
  await endDrag(lessonMonth, transfer)
  assert(await page.locator('[data-drag-date-target]').count() === 0, `${width}px: calendar targets remained after Lesson drag ended.`)
  assert(await fridge.locator('[data-fridge-drag-target]').count() === 0, `${width}px: Fridge targets remained after Lesson drag ended.`)
  await assertUnchanged(page, before, `${width}px Lesson drag end`)

  const magnetMonth = fridge.locator('[data-fridge-ref="magnet:magnet-loose"]')
  transfer = await startDrag(page, magnetMonth)
  assert(await page.getByRole('status').filter({ hasText: /valid Fridge positions and stack targets/i }).isVisible(), `${width}px: Magnet preview status is missing.`)
  assert(await page.locator('[data-drag-date-target]').count() === 0, `${width}px: Magnet incorrectly revealed calendar date targets.`)
  const freeCell = fridge.locator('[data-fridge-drag-target]').first()
  assert(await freeCell.count() === 1, `${width}px: Magnet did not reveal a free Fridge target.`)
  assert(await fridge.locator('[data-fridge-stack-target="stack-preview"]').count() === 1, `${width}px: Magnet did not reveal compatible stack target.`)
  await freeCell.dispatchEvent('dragover', { dataTransfer: transfer })
  await freeCell.dispatchEvent('drop', { dataTransfer: transfer })
  await assertUnchanged(page, before, `${width}px Magnet Fridge drop preview`)
  await endDrag(magnetMonth, transfer)
  await assertUnchanged(page, before, `${width}px Magnet drag end`)

  const stackMonth = fridge.locator('[data-fridge-stack="stack-preview"]')
  transfer = await startDrag(page, stackMonth)
  assert(await page.getByRole('status').filter({ hasText: /valid Fridge positions are highlighted/i }).isVisible(), `${width}px: stack preview status is missing.`)
  assert(await page.locator('[data-drag-date-target]').count() === 0, `${width}px: stack incorrectly revealed calendar targets.`)
  assert(await fridge.locator('[data-fridge-drag-target]').count() > 0, `${width}px: stack did not reveal free Fridge positions.`)
  assert(await fridge.locator('[data-fridge-stack-target]').count() === 0, `${width}px: stack preview incorrectly advertised stack-on-stack target.`)
  await endDrag(stackMonth, transfer)
  await assertUnchanged(page, before, `${width}px stack drag end`)

  await page.getByRole('button', { name: 'Week', exact: true }).click()
  const lessonWeek = fridge.locator('[data-fridge-ref="lesson:lesson-drag"]')
  transfer = await startDrag(page, lessonWeek)
  assert(await page.locator('.planning-date-heading[data-drag-date-target]').count() === 5, `${width}px: Week did not expose exactly the valid date-header targets.`)
  assert(await page.locator('.planning-day-slot[data-drag-date-target]').count() === 0, `${width}px: Week class cells were falsely presented as Move targets.`)
  await endDrag(lessonWeek, transfer)
  await assertUnchanged(page, before, `${width}px Week preview`)

  await page.getByRole('button', { name: 'Day', exact: true }).click()
  const lessonDay = fridge.locator('[data-fridge-ref="lesson:lesson-drag"]')
  transfer = await startDrag(page, lessonDay)
  assert(await page.locator('.projection-section[data-drag-date-target="2026-09-14"]').count() === 1, `${width}px: Day did not expose the current valid date frame.`)
  await endDrag(lessonDay, transfer)
  await assertUnchanged(page, before, `${width}px Day preview`)

  const geometry = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: document.documentElement.clientWidth }))
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: reactive preview created horizontal document overflow.`)
  assert(runtimeErrors.length === 0, `${width}px: runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditViewport(browser, 1024, 900)
  await auditViewport(browser, 800, 900)
  await auditViewport(browser, 390, 844)
  await auditViewport(browser, 320, 800)
  console.log('Reactive drag preview Chromium audit passed at 1024px, 800px, 390px, and 320px with zero persisted mutation.')
} finally {
  await browser.close()
}
