import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const assert = (condition, message) => { if (!condition) throw new Error(message) }

const calendarInput = {
  id: 'calendar-drag-undo-audit', schoolYearLabel: '2026–27', firstDay: '2026-09-14', lastDay: '2027-05-28',
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
const staleShiftUndo = {
  operationId: 'older-shift-token',
  sectionId: 'section-p5',
  previousSectionOverrides: [],
  appliedSectionOverrides: [],
}
const shiftInput = { calendarId: calendarInput.id, overrides: [], undo: staleShiftUndo }
const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-14T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
  'arc.fridgeDoor.v1': JSON.stringify({ schemaVersion: 1, input: fridgeInput }),
  'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: shiftInput }),
}

async function storedInput(page, key) {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw).input ?? null : null
  }, key)
}
async function startDrag(page, locator) {
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
  await locator.dispatchEvent('dragstart', { dataTransfer })
  return dataTransfer
}
async function dropOn(target, dataTransfer) {
  await target.dispatchEvent('dragover', { dataTransfer })
  await target.dispatchEvent('drop', { dataTransfer })
  await dataTransfer.dispose()
}
function placement(input, ref) {
  return input.state.placements.find((item) => item.entityRef === ref)
}

async function auditViewport(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((entries) => {
    if (sessionStorage.getItem('arc.dragUndoAuditSeeded') === '1') return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    sessionStorage.setItem('arc.dragUndoAuditSeeded', '1')
  }, storage)
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  let fridge = page.getByRole('region', { name: 'Fridge Door' })
  const unit = fridge.locator('[data-fridge-ref="unit:unit-meso"]')
  assert(await unit.getAttribute('draggable') !== 'true', `${width}px: Unit became draggable without approved one-date Unit semantics.`)
  assert(await fridge.getByLabel('Position').count() > 0, `${width}px: non-drag Reposition route disappeared.`)
  assert(await fridge.getByRole('group', { name: 'Stack items' }).isVisible(), `${width}px: non-drag Stack route disappeared.`)
  assert(await page.getByRole('button', { name: 'Undo last Shift', exact: true }).isVisible(), `${width}px: valid existing Shift Undo was not available before a newer reversible action.`)

  await page.getByRole('button', { name: 'Month', exact: true }).click()
  let lesson = fridge.locator('[data-fridge-ref="lesson:lesson-drag"]')
  let transfer = await startDrag(page, lesson)
  assert(await page.getByRole('status').filter({ hasText: /Drop on a highlighted instructional date/i }).isVisible(), `${width}px: Lesson drag did not announce reversible targets.`)
  const dateTargets = page.locator('[data-drag-date-target]')
  const targetDates = await dateTargets.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-drag-date-target')).filter(Boolean))
  assert(targetDates.length === 10, `${width}px: Lesson drag exposed ${targetDates.length} dates instead of the 10 valid instructional dates in its Unit.`)
  assert(targetDates.includes('2026-09-14') && targetDates.includes('2026-09-25'), `${width}px: Lesson drag omitted valid Unit boundary dates.`)
  assert(!targetDates.includes('2026-09-19') && !targetDates.includes('2026-09-20'), `${width}px: Lesson drag exposed weekend dates.`)
  assert(await page.locator('.planning-day-slot[data-drag-date-target]').count() === 0, `${width}px: class/Period cell was advertised as generic Lesson Move target.`)

  await dropOn(page.locator('[data-drag-date-target="2026-09-14"]').first(), transfer)
  let lessonsStored = await storedInput(page, 'arc.lessons.v1')
  let fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  assert(lessonsStored.lessons.find((item) => item.id === 'lesson-drag')?.plannedDate === '2026-09-14', `${width}px: calendar drop did not use canonical Lesson Move.`)
  assert(!fridgeStored.state.placements.some((item) => item.entityRef === 'lesson:lesson-drag'), `${width}px: successful calendar Move left the Lesson on the Fridge.`)
  assert(await page.getByRole('button', { name: 'Undo Lesson move', exact: true }).isVisible(), `${width}px: Lesson drop did not replace the Undo slot.`)
  assert(await page.getByRole('button', { name: 'Undo last Shift', exact: true }).count() === 0, `${width}px: older Shift Undo remained visible after a newer Lesson move.`)

  await page.reload({ waitUntil: 'networkidle' })
  fridge = page.getByRole('region', { name: 'Fridge Door' })
  assert(await page.getByRole('button', { name: 'Undo Lesson move', exact: true }).isVisible(), `${width}px: Lesson Undo did not survive reload.`)
  assert(await page.getByRole('button', { name: 'Undo last Shift', exact: true }).count() === 0, `${width}px: older Shift Undo resurfaced after reload.`)
  lessonsStored = await storedInput(page, 'arc.lessons.v1')
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  assert(lessonsStored.lessons.find((item) => item.id === 'lesson-drag')?.plannedDate === '2026-09-14', `${width}px: moved Lesson did not survive reload before Undo.`)
  assert(!fridgeStored.state.placements.some((item) => item.entityRef === 'lesson:lesson-drag'), `${width}px: removed Fridge placement reappeared before Undo.`)

  await page.getByRole('button', { name: 'Undo Lesson move', exact: true }).click()
  lessonsStored = await storedInput(page, 'arc.lessons.v1')
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  const restoredLesson = lessonsStored.lessons.find((item) => item.id === 'lesson-drag')
  const restoredPlacement = placement(fridgeStored, 'lesson:lesson-drag')
  assert(restoredLesson?.plannedDate === null && restoredLesson?.datePolicy === 'flexible', `${width}px: Lesson Undo did not restore the prior canonical placement state.`)
  assert(restoredPlacement?.surface === 'door' && restoredPlacement.row === 0 && restoredPlacement.column === 1, `${width}px: Lesson Undo did not restore exact Fridge coordinates.`)
  assert(restoredPlacement?.priority === 'must' && restoredPlacement.stackId === null, `${width}px: Lesson Undo lost prior Fridge metadata.`)
  assert(await page.getByRole('button', { name: 'Undo last Shift', exact: true }).count() === 0, `${width}px: older Shift Undo resurfaced immediately after undoing the newer Lesson move.`)

  await page.reload({ waitUntil: 'networkidle' })
  fridge = page.getByRole('region', { name: 'Fridge Door' })
  assert(await page.getByRole('button', { name: 'Undo last Shift', exact: true }).count() === 0, `${width}px: older Shift Undo resurrected after the newer action was undone and the page reloaded.`)
  assert(await page.getByRole('button', { name: 'Undo Lesson move', exact: true }).count() === 0, `${width}px: completed Lesson Undo remained available after reload.`)

  let magnet = fridge.locator('[data-fridge-ref="magnet:magnet-loose"]')
  transfer = await startDrag(page, magnet)
  const freeCell = fridge.locator('[data-fridge-drag-target="1:1"]')
  assert(await freeCell.count() === 1, `${width}px: expected free Fridge destination was not reactive.`)
  await dropOn(freeCell, transfer)
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  let magnetPlacement = placement(fridgeStored, 'magnet:magnet-loose')
  assert(magnetPlacement?.row === 1 && magnetPlacement?.column === 1, `${width}px: Magnet drag did not use Fridge Reposition.`)
  assert(await page.getByRole('button', { name: 'Undo Fridge move', exact: true }).isVisible(), `${width}px: Magnet reposition did not expose Undo.`)
  await page.getByRole('button', { name: 'Undo Fridge move', exact: true }).click()
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  magnetPlacement = placement(fridgeStored, 'magnet:magnet-loose')
  assert(magnetPlacement?.row === 0 && magnetPlacement?.column === 2, `${width}px: Magnet Undo did not restore exact position.`)

  let stack = fridge.locator('[data-fridge-stack="stack-preview"]')
  transfer = await startDrag(page, stack)
  const stackCell = fridge.locator('[data-fridge-drag-target="2:3"]')
  assert(await stackCell.count() === 1, `${width}px: stack did not reveal a free Fridge target.`)
  await dropOn(stackCell, transfer)
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  let stackMembers = fridgeStored.state.placements.filter((item) => item.stackId === 'stack-preview')
  assert(stackMembers.length === 2 && stackMembers.every((item) => item.row === 2 && item.column === 3), `${width}px: stack drag did not move all members together.`)
  assert(await page.getByRole('button', { name: 'Undo Fridge stack move', exact: true }).isVisible(), `${width}px: stack reposition did not expose Undo.`)
  await page.getByRole('button', { name: 'Undo Fridge stack move', exact: true }).click()
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  stackMembers = fridgeStored.state.placements.filter((item) => item.stackId === 'stack-preview')
  assert(stackMembers.length === 2 && stackMembers.every((item) => item.row === 1 && item.column === 0), `${width}px: stack Undo did not restore exact shared position.`)

  magnet = fridge.locator('[data-fridge-ref="magnet:magnet-loose"]')
  transfer = await startDrag(page, magnet)
  const stackTarget = fridge.locator('[data-fridge-stack-target="stack-preview"]')
  assert(await stackTarget.count() === 1, `${width}px: compatible stack target did not react.`)
  await dropOn(stackTarget, transfer)
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  const stackedMagnet = placement(fridgeStored, 'magnet:magnet-loose')
  assert(stackedMagnet?.stackId === 'stack-preview', `${width}px: stack-target drop did not route through Fridge Stack.`)
  assert(await page.getByRole('button', { name: 'Undo Fridge stack change', exact: true }).isVisible(), `${width}px: stack membership change did not expose Undo.`)
  await page.getByRole('button', { name: 'Undo Fridge stack change', exact: true }).click()
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  magnetPlacement = placement(fridgeStored, 'magnet:magnet-loose')
  assert(magnetPlacement?.stackId === null && magnetPlacement?.row === 0 && magnetPlacement?.column === 2, `${width}px: stack-change Undo did not restore the loose Magnet exactly.`)
  stackMembers = fridgeStored.state.placements.filter((item) => item.stackId === 'stack-preview').sort((a, b) => a.stackOrder - b.stackOrder)
  assert(stackMembers.length === 2 && stackMembers[0].entityRef === 'lesson:lesson-stack' && stackMembers[1].entityRef === 'magnet:magnet-stack', `${width}px: stack-change Undo did not restore prior stack membership/order.`)

  await page.getByRole('button', { name: 'Week', exact: true }).click()
  lesson = fridge.locator('[data-fridge-ref="lesson:lesson-drag"]')
  transfer = await startDrag(page, lesson)
  assert(await page.locator('.planning-date-heading[data-drag-date-target]').count() === 5, `${width}px: Week did not expose exactly its valid date-header targets.`)
  assert(await page.locator('.planning-day-slot[data-drag-date-target]').count() === 0, `${width}px: Week class cells were falsely presented as Move targets.`)
  await lesson.dispatchEvent('dragend', { dataTransfer: transfer })
  await transfer.dispose()

  await page.getByRole('button', { name: 'Day', exact: true }).click()
  lesson = fridge.locator('[data-fridge-ref="lesson:lesson-drag"]')
  transfer = await startDrag(page, lesson)
  assert(await page.locator('.projection-section[data-drag-date-target="2026-09-14"]').count() === 1, `${width}px: Day did not expose the current valid date frame.`)
  await lesson.dispatchEvent('dragend', { dataTransfer: transfer })
  await transfer.dispose()

  const geometry = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: document.documentElement.clientWidth }))
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: reactive drag created horizontal document overflow.`)
  assert(runtimeErrors.length === 0, `${width}px: runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditViewport(browser, 1024, 900)
  await auditViewport(browser, 800, 900)
  await auditViewport(browser, 390, 844)
  await auditViewport(browser, 320, 800)
  console.log('Reactive drag + persistent unified Undo Chromium audit passed at 1024px, 800px, 390px, and 320px.')
} finally {
  await browser.close()
}
