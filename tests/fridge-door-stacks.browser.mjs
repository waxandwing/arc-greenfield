import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-fridge-stack-audit',
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
  courses: [{ id: 'course-apah', title: 'AP Art History' }],
  sections: [{ id: 'section-p5', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 5' }],
}

const unitsInput = {
  calendarId: calendarInput.id,
  units: [{
    id: 'unit-meso',
    calendarId: calendarInput.id,
    courseId: 'course-apah',
    title: 'Ancient Mesopotamia',
    placement: { startDate: '2026-09-14', endDate: '2026-09-25' },
  }],
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
    magnets: [
      { id: 'magnet-a', title: 'Gallery walk idea' },
      { id: 'magnet-b', title: 'Comparison prompt' },
    ],
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

function placementFor(input, ref) {
  return input.state.placements.find((item) => item.entityRef === ref)
}

function stackMembers(input, stackId) {
  return input.state.placements
    .filter((item) => item.stackId === stackId)
    .sort((a, b) => (a.stackOrder ?? 0) - (b.stackOrder ?? 0))
}

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
  assert(await page.locator('[draggable="true"]').count() === 0, `${width}px: drag semantics appeared before non-drag stack behavior reached Green.`)

  const canonicalBefore = {
    units: await storedInput(page, 'arc.units.v1'),
    lessons: await storedInput(page, 'arc.lessons.v1'),
  }

  const anchor = builder.getByLabel('Anchor or stack')
  const member = builder.getByLabel('Add loose item')
  const anchorOptions = await anchor.locator('option').allTextContents()
  assert(!anchorOptions.some((text) => text.includes('Ancient Mesopotamia')), `${width}px: Unit was offered as a stack anchor/member.`)

  await anchor.selectOption('magnet:magnet-a')
  const memberOptions = await member.locator('option').allTextContents()
  assert(!memberOptions.some((text) => text.includes('Ancient Mesopotamia')), `${width}px: Unit was offered as a loose stack member.`)
  await member.selectOption('lesson:lesson-a')
  await builder.getByRole('button', { name: 'Stack', exact: true }).click()

  let fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  const first = placementFor(fridgeStored, 'magnet:magnet-a')
  const second = placementFor(fridgeStored, 'lesson:lesson-a')
  assert(first?.stackId && first.stackId === second?.stackId, `${width}px: two-item stack did not persist one stable stackId.`)
  const stackId = first.stackId
  let members = stackMembers(fridgeStored, stackId)
  assert(members.length === 2 && members[0].entityRef === 'magnet:magnet-a' && members[1].entityRef === 'lesson:lesson-a', `${width}px: initial stack order is wrong.`)
  assert(members.every((item) => item.row === first.row && item.column === first.column && item.surface === first.surface), `${width}px: initial stack members do not share one spatial anchor.`)

  await anchor.selectOption('magnet:magnet-a')
  await member.selectOption('lesson:lesson-b')
  await builder.getByRole('button', { name: 'Stack', exact: true }).click()
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  members = stackMembers(fridgeStored, stackId)
  assert(members.length === 3, `${width}px: adding a loose Lesson did not extend the existing stack.`)
  assert(members.map((item) => item.stackOrder).join(',') === '0,1,2', `${width}px: three-item stack orders are not unique and contiguous.`)
  assert(members.every((item) => !item.entityRef.startsWith('unit:')), `${width}px: Unit entered persisted stack membership.`)

  const stackCard = page.locator(`[data-fridge-stack="${stackId}"]`)
  assert(await stackCard.isVisible(), `${width}px: stack is not rendered as one grouped object.`)
  assert(await page.locator(`[data-fridge-stack="${stackId}"]`).count() === 1, `${width}px: one stack rendered as multiple stack containers.`)
  await stackCard.getByText('Open stack', { exact: true }).click()

  const lessonA = stackCard.locator('[data-fridge-ref="lesson:lesson-a"]')
  await lessonA.getByLabel('Priority').selectOption('must')
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  assert(placementFor(fridgeStored, 'lesson:lesson-a')?.priority === 'must', `${width}px: stack-member priority did not persist.`)

  const lessonB = stackCard.locator('[data-fridge-ref="lesson:lesson-b"]')
  await lessonB.getByRole('button', { name: 'Up', exact: true }).click()
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  members = stackMembers(fridgeStored, stackId)
  assert(members.map((item) => item.entityRef).join('|') === 'magnet:magnet-a|lesson:lesson-b|lesson:lesson-a', `${width}px: explicit stack reorder did not persist exact order.`)

  await stackCard.getByLabel('Stack position').selectOption('2:3')
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  members = stackMembers(fridgeStored, stackId)
  assert(members.length === 3 && members.every((item) => item.row === 2 && item.column === 3), `${width}px: stack-level reposition did not move every member together.`)
  assert(placementFor(fridgeStored, 'lesson:lesson-a')?.priority === 'must', `${width}px: stack reposition lost member priority.`)

  const canonicalAfterStack = {
    units: await storedInput(page, 'arc.units.v1'),
    lessons: await storedInput(page, 'arc.lessons.v1'),
  }
  assert(JSON.stringify(canonicalAfterStack.units) === JSON.stringify(canonicalBefore.units), `${width}px: spatial stacking mutated canonical Unit data.`)
  assert(JSON.stringify(canonicalAfterStack.lessons) === JSON.stringify(canonicalBefore.lessons), `${width}px: spatial stacking mutated canonical Lesson data.`)

  const beforeReload = await storedInput(page, 'arc.fridgeDoor.v1')
  await page.reload({ waitUntil: 'networkidle' })
  const afterReload = await storedInput(page, 'arc.fridgeDoor.v1')
  const reloadedMembers = stackMembers(afterReload, stackId)
  assert(reloadedMembers.length === 3, `${width}px: stack membership did not survive reload.`)
  assert(reloadedMembers.map((item) => item.entityRef).join('|') === 'magnet:magnet-a|lesson:lesson-b|lesson:lesson-a', `${width}px: stack order did not survive reload.`)
  assert(reloadedMembers.every((item) => item.row === 2 && item.column === 3), `${width}px: stack position did not survive reload.`)
  assert(placementFor(afterReload, 'lesson:lesson-a')?.priority === 'must', `${width}px: stack-member priority did not survive reload.`)
  assert(JSON.stringify(beforeReload.state.magnets) === JSON.stringify(afterReload.state.magnets), `${width}px: reload changed Fridge-owned Magnet identity.`)

  const reloadedStack = page.locator(`[data-fridge-stack="${stackId}"]`)
  await reloadedStack.getByText('Open stack', { exact: true }).click()

  const liveStackVisual = await reloadedStack.evaluate((stack) => {
    const label = stack.querySelector('.fridge-stack-heading strong')
    const meta = stack.querySelector('.fridge-stack-heading span')
    const controls = [...stack.querySelectorAll('button:not(:disabled), select:not(:disabled), summary')]
    return {
      labelSize: label ? parseFloat(getComputedStyle(label).fontSize) : 0,
      metaSize: meta ? parseFloat(getComputedStyle(meta).fontSize) : 0,
      minControlHeight: controls.length ? Math.min(...controls.map((node) => node.getBoundingClientRect().height)) : 0,
    }
  })
  assert(liveStackVisual.labelSize >= 16, `${width}px: live stack primary text fell below 16px.`)
  assert(liveStackVisual.metaSize >= 14, `${width}px: live stack metadata fell below 14px.`)
  assert(liveStackVisual.minControlHeight >= 44, `${width}px: live expanded stack control fell below 44px (${liveStackVisual.minControlHeight}px).`)

  const reloadedLessonA = reloadedStack.locator('[data-fridge-ref="lesson:lesson-a"]')
  const titleButton = reloadedLessonA.getByRole('button', { name: 'Cylinder Seal Comparison', exact: true })
  await titleButton.focus()
  await page.keyboard.press('Enter')
  assert(await page.locator('.object-focus-layer').getByText('Lesson', { exact: true }).first().isVisible(), `${width}px: keyboard activation inside expanded stack did not open Lesson editor.`)
  await page.locator('.object-focus-layer').getByRole('button', { name: 'Close', exact: true }).click()

  const stackAfterFocus = page.locator(`[data-fridge-stack="${stackId}"]`)
  if (!(await stackAfterFocus.locator('details').evaluate((node) => node.open))) await stackAfterFocus.getByText('Open stack', { exact: true }).click()
  const lessonAAfterFocus = stackAfterFocus.locator('[data-fridge-ref="lesson:lesson-a"]')
  await lessonAAfterFocus.getByLabel('Unstack Cylinder Seal Comparison to').selectOption('2:2')
  await lessonAAfterFocus.getByRole('button', { name: 'Unstack', exact: true }).click()
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  const unstackedA = placementFor(fridgeStored, 'lesson:lesson-a')
  assert(unstackedA?.stackId === null && unstackedA.stackOrder === null && unstackedA.row === 2 && unstackedA.column === 2, `${width}px: explicit Unstack did not move Lesson to chosen free slot.`)
  assert(unstackedA?.priority === 'must', `${width}px: Unstack lost member priority.`)
  members = stackMembers(fridgeStored, stackId)
  assert(members.length === 2, `${width}px: three-item stack did not remain a valid two-item stack after one Unstack.`)

  const twoMemberStack = page.locator(`[data-fridge-stack="${stackId}"]`)
  if (!(await twoMemberStack.locator('details').evaluate((node) => node.open))) await twoMemberStack.getByText('Open stack', { exact: true }).click()
  const lessonBRemaining = twoMemberStack.locator('[data-fridge-ref="lesson:lesson-b"]')
  await lessonBRemaining.getByLabel('Unstack Standard of Ur Registers to').selectOption('2:1')
  await lessonBRemaining.getByRole('button', { name: 'Unstack', exact: true }).click()
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  const unstackedB = placementFor(fridgeStored, 'lesson:lesson-b')
  const formerAnchor = placementFor(fridgeStored, 'magnet:magnet-a')
  assert(unstackedB?.stackId === null && unstackedB.row === 2 && unstackedB.column === 1, `${width}px: two-item stack Unstack did not place chosen member correctly.`)
  assert(formerAnchor?.stackId === null && formerAnchor.stackOrder === null, `${width}px: two-item stack left a phantom singleton stack.`)
  assert(fridgeStored.state.placements.every((item) => item.stackId !== stackId), `${width}px: dissolved stackId survived after the stack became a singleton.`)

  const canonicalAfterUnstack = {
    units: await storedInput(page, 'arc.units.v1'),
    lessons: await storedInput(page, 'arc.lessons.v1'),
  }
  assert(JSON.stringify(canonicalAfterUnstack.units) === JSON.stringify(canonicalBefore.units), `${width}px: unstacking mutated canonical Unit data.`)
  assert(JSON.stringify(canonicalAfterUnstack.lessons) === JSON.stringify(canonicalBefore.lessons), `${width}px: unstacking mutated canonical Lesson data.`)

  const geometry = await page.evaluate(() => {
    const root = document.documentElement
    const scroll = document.querySelector('.fridge-door-scroll')
    return {
      documentWidth: root.scrollWidth,
      viewportWidth: root.clientWidth,
      fridgeScrollWidth: scroll?.scrollWidth ?? 0,
      fridgeClientWidth: scroll?.clientWidth ?? 0,
    }
  })
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: stack controls leaked horizontal overflow into the document.`)
  if (width <= 520) assert(geometry.fridgeScrollWidth > geometry.fridgeClientWidth, `${width}px: mobile Fridge stopped preserving finite Door geometry through internal scrolling.`)
  assert(await page.locator('[draggable="true"]').count() === 0, `${width}px: drag semantics appeared during stack audit.`)
  assert(runtimeErrors.length === 0, `${width}px: runtime errors detected: ${runtimeErrors.join(' | ')}`)

  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditViewport(browser, 1024, 900)
  await auditViewport(browser, 800, 900)
  await auditViewport(browser, 390, 844)
  await auditViewport(browser, 320, 800)
  console.log('Fridge stack Chromium audit passed at 1024px, 800px, 390px, and 320px.')
} finally {
  await browser.close()
}
