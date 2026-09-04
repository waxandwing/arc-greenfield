import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const assert = (condition, message) => { if (!condition) throw new Error(message) }

const calendarInput = {
  id: 'calendar-fridge-stack-audit', schoolYearLabel: '2026–27', firstDay: '2026-09-14', lastDay: '2027-05-28',
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
    { id: 'lesson-a', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'Cylinder Seal Comparison', sequence: 1, plannedDate: null, datePolicy: 'flexible' },
    { id: 'lesson-b', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'Standard of Ur Registers', sequence: 2, plannedDate: null, datePolicy: 'flexible' },
    { id: 'lesson-c', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'Ziggurat Spatial Evidence', sequence: 3, plannedDate: null, datePolicy: 'flexible' },
  ],
  deliveryStates: [],
}
const fridgeInput = {
  calendarId: calendarInput.id,
  state: {
    magnets: [{ id: 'magnet-a', title: 'Gallery walk idea' }, { id: 'magnet-b', title: 'Comparison prompt' }],
    placements: [
      { entityRef: 'unit:unit-meso', surface: 'door', row: 0, column: 0, stackId: null, stackOrder: null, priority: null },
      { entityRef: 'magnet:magnet-a', surface: 'door', row: 0, column: 1, stackId: null, stackOrder: null, priority: null },
      { entityRef: 'magnet:magnet-b', surface: 'door', row: 0, column: 2, stackId: null, stackOrder: null, priority: null },
    ],
  },
}
const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-14T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
  'arc.fridgeDoor.v1': JSON.stringify({ schemaVersion: 1, input: fridgeInput }),
}

async function storedInput(page, key) {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw).input ?? null : null
  }, key)
}
const placementFor = (input, ref) => input.state.placements.find((item) => item.entityRef === ref)
const stackMembers = (input, stackId) => input.state.placements.filter((item) => item.stackId === stackId).sort((a, b) => (a.stackOrder ?? 0) - (b.stackOrder ?? 0))

async function auditViewport(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((entries) => {
    if (sessionStorage.getItem('arc.stackAuditSeeded') === '1') return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    sessionStorage.setItem('arc.stackAuditSeeded', '1')
  }, storage)
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const fridge = page.getByRole('region', { name: 'Fridge Door' })
  const builder = fridge.getByRole('group', { name: 'Stack items' })
  assert(await builder.isVisible(), `${width}px: explicit stack builder is not visible.`)
  assert(await fridge.locator('[data-fridge-ref^="unit:"][draggable="true"]').count() === 0, `${width}px: Unit drag appeared without approved Unit drop semantics.`)

  const canonicalBefore = { units: await storedInput(page, 'arc.units.v1'), lessons: await storedInput(page, 'arc.lessons.v1') }
  const anchor = builder.getByLabel('Anchor or stack')
  const member = builder.getByLabel('Add loose item')
  assert(!(await anchor.locator('option').allTextContents()).some((text) => text.includes('Ancient Mesopotamia')), `${width}px: Unit was offered as a stack anchor.`)
  await anchor.selectOption('magnet:magnet-a')
  assert(!(await member.locator('option').allTextContents()).some((text) => text.includes('Ancient Mesopotamia')), `${width}px: Unit was offered as a stack member.`)
  await member.selectOption('lesson:lesson-a')
  await builder.getByRole('button', { name: 'Stack', exact: true }).click()

  let stored = await storedInput(page, 'arc.fridgeDoor.v1')
  const first = placementFor(stored, 'magnet:magnet-a')
  const second = placementFor(stored, 'lesson:lesson-a')
  assert(first?.stackId && first.stackId === second?.stackId, `${width}px: two-item stack did not persist one stackId.`)
  const stackId = first.stackId
  let members = stackMembers(stored, stackId)
  assert(members.map((item) => item.entityRef).join('|') === 'magnet:magnet-a|lesson:lesson-a', `${width}px: initial stack order is wrong.`)
  assert(members.every((item) => item.row === first.row && item.column === first.column), `${width}px: stack members do not share one anchor.`)

  await anchor.selectOption('magnet:magnet-a')
  await member.selectOption('lesson:lesson-b')
  await builder.getByRole('button', { name: 'Stack', exact: true }).click()
  stored = await storedInput(page, 'arc.fridgeDoor.v1')
  members = stackMembers(stored, stackId)
  assert(members.length === 3 && members.map((item) => item.stackOrder).join(',') === '0,1,2', `${width}px: three-item stack order is invalid.`)
  assert(members.every((item) => !item.entityRef.startsWith('unit:')), `${width}px: Unit entered persisted stack membership.`)

  let stackCard = page.locator(`[data-fridge-stack="${stackId}"]`)
  assert(await stackCard.count() === 1, `${width}px: one stack did not render as one grouped object.`)
  assert(await stackCard.getAttribute('draggable') === 'true', `${width}px: approved whole-stack drag preview affordance is missing.`)
  await stackCard.getByText('Open stack', { exact: true }).click()
  await stackCard.locator('[data-fridge-ref="lesson:lesson-a"]').getByLabel('Priority').selectOption('must')
  await stackCard.locator('[data-fridge-ref="lesson:lesson-b"]').getByRole('button', { name: 'Up', exact: true }).click()
  stored = await storedInput(page, 'arc.fridgeDoor.v1')
  members = stackMembers(stored, stackId)
  assert(members.map((item) => item.entityRef).join('|') === 'magnet:magnet-a|lesson:lesson-b|lesson:lesson-a', `${width}px: stack reorder did not persist exact order.`)
  assert(placementFor(stored, 'lesson:lesson-a')?.priority === 'must', `${width}px: stack-member priority did not persist.`)

  await stackCard.getByLabel('Stack position').selectOption('2:3')
  stored = await storedInput(page, 'arc.fridgeDoor.v1')
  members = stackMembers(stored, stackId)
  assert(members.every((item) => item.row === 2 && item.column === 3), `${width}px: whole-stack reposition left a member behind.`)
  assert(placementFor(stored, 'lesson:lesson-a')?.priority === 'must', `${width}px: whole-stack reposition lost priority.`)
  assert(JSON.stringify(await storedInput(page, 'arc.units.v1')) === JSON.stringify(canonicalBefore.units), `${width}px: stacking mutated canonical Unit data.`)
  assert(JSON.stringify(await storedInput(page, 'arc.lessons.v1')) === JSON.stringify(canonicalBefore.lessons), `${width}px: stacking mutated canonical Lesson data.`)

  await page.reload({ waitUntil: 'networkidle' })
  stored = await storedInput(page, 'arc.fridgeDoor.v1')
  members = stackMembers(stored, stackId)
  assert(members.map((item) => item.entityRef).join('|') === 'magnet:magnet-a|lesson:lesson-b|lesson:lesson-a', `${width}px: stack order did not survive reload.`)
  assert(members.every((item) => item.row === 2 && item.column === 3), `${width}px: stack position did not survive reload.`)
  assert(placementFor(stored, 'lesson:lesson-a')?.priority === 'must', `${width}px: stack priority did not survive reload.`)

  stackCard = page.locator(`[data-fridge-stack="${stackId}"]`)
  await stackCard.getByText('Open stack', { exact: true }).click()
  const visual = await stackCard.evaluate((stack) => {
    const label = stack.querySelector('.fridge-stack-heading strong')
    const meta = stack.querySelector('.fridge-stack-heading span')
    const controls = [...stack.querySelectorAll('button:not(:disabled), select:not(:disabled), summary')]
    return {
      labelSize: label ? parseFloat(getComputedStyle(label).fontSize) : 0,
      metaSize: meta ? parseFloat(getComputedStyle(meta).fontSize) : 0,
      minControlHeight: Math.min(...controls.map((node) => node.getBoundingClientRect().height)),
    }
  })
  assert(visual.labelSize >= 16 && visual.metaSize >= 14, `${width}px: live stack typography fell below 16/14px.`)
  assert(visual.minControlHeight >= 44, `${width}px: live stack control fell below 44px.`)

  const lessonA = stackCard.locator('[data-fridge-ref="lesson:lesson-a"]')
  await lessonA.getByRole('button', { name: 'Cylinder Seal Comparison', exact: true }).focus()
  await page.keyboard.press('Enter')
  assert(await page.locator('.object-focus-layer').getByText('Lesson', { exact: true }).first().isVisible(), `${width}px: keyboard activation inside stack failed.`)
  await page.locator('.object-focus-layer').getByRole('button', { name: 'Close', exact: true }).click()

  stackCard = page.locator(`[data-fridge-stack="${stackId}"]`)
  if (!(await stackCard.locator('details').evaluate((node) => node.open))) await stackCard.getByText('Open stack', { exact: true }).click()
  const lessonAAfterFocus = stackCard.locator('[data-fridge-ref="lesson:lesson-a"]')
  await lessonAAfterFocus.getByLabel('Unstack Cylinder Seal Comparison to').selectOption('2:2')
  await lessonAAfterFocus.getByRole('button', { name: 'Unstack', exact: true }).click()
  stored = await storedInput(page, 'arc.fridgeDoor.v1')
  assert(placementFor(stored, 'lesson:lesson-a')?.stackId === null && placementFor(stored, 'lesson:lesson-a')?.row === 2 && placementFor(stored, 'lesson:lesson-a')?.column === 2, `${width}px: explicit Unstack failed.`)
  assert(placementFor(stored, 'lesson:lesson-a')?.priority === 'must', `${width}px: Unstack lost priority.`)
  assert(stackMembers(stored, stackId).length === 2, `${width}px: three-item stack did not remain valid after one Unstack.`)

  stackCard = page.locator(`[data-fridge-stack="${stackId}"]`)
  if (!(await stackCard.locator('details').evaluate((node) => node.open))) await stackCard.getByText('Open stack', { exact: true }).click()
  const lessonB = stackCard.locator('[data-fridge-ref="lesson:lesson-b"]')
  await lessonB.getByLabel('Unstack Standard of Ur Registers to').selectOption('2:1')
  await lessonB.getByRole('button', { name: 'Unstack', exact: true }).click()
  stored = await storedInput(page, 'arc.fridgeDoor.v1')
  assert(placementFor(stored, 'lesson:lesson-b')?.stackId === null && placementFor(stored, 'lesson:lesson-b')?.row === 2 && placementFor(stored, 'lesson:lesson-b')?.column === 1, `${width}px: two-item Unstack placed chosen member incorrectly.`)
  assert(placementFor(stored, 'magnet:magnet-a')?.stackId === null, `${width}px: two-item dissolution left a phantom singleton stack.`)
  assert(stored.state.placements.every((item) => item.stackId !== stackId), `${width}px: dissolved stackId survived.`)
  assert(JSON.stringify(await storedInput(page, 'arc.units.v1')) === JSON.stringify(canonicalBefore.units), `${width}px: unstacking mutated canonical Unit data.`)
  assert(JSON.stringify(await storedInput(page, 'arc.lessons.v1')) === JSON.stringify(canonicalBefore.lessons), `${width}px: unstacking mutated canonical Lesson data.`)

  const geometry = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: document.documentElement.clientWidth }))
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: stack controls leaked horizontal document overflow.`)
  assert(await fridge.getByRole('group', { name: 'Stack items' }).isVisible(), `${width}px: non-drag Stack route disappeared after drag preview appeared.`)
  assert(await fridge.locator('[data-fridge-ref^="unit:"][draggable="true"]').count() === 0, `${width}px: Unit became draggable.`)
  assert(runtimeErrors.length === 0, `${width}px: runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditViewport(browser, 1024, 900)
  await auditViewport(browser, 800, 900)
  await auditViewport(browser, 390, 844)
  await auditViewport(browser, 320, 800)
  console.log('Fridge stack Chromium audit passed at 1024px, 800px, 390px, and 320px with non-drag controls retained.')
} finally {
  await browser.close()
}
