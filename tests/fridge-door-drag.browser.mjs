import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-fridge-drag-audit',
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
  courses: [{ id: 'course-3d', title: '3D Art 1' }],
  sections: [{ id: 'section-p3', courseId: 'course-3d', calendarId: calendarInput.id, name: 'Period 3' }],
}

const unitsInput = { calendarId: calendarInput.id, units: [] }
const lessonsInput = { calendarId: calendarInput.id, lessons: [], deliveryStates: [] }

const magnets = [
  { id: 'move', title: 'Move me' },
  { id: 'blocker', title: 'Occupied target' },
  { id: 'drawer', title: 'Drawer thought' },
  { id: 'stack-a', title: 'Stack alpha' },
  { id: 'stack-b', title: 'Stack beta' },
]

const fridgeInput = {
  calendarId: calendarInput.id,
  state: {
    magnets,
    placements: [
      { entityRef: 'magnet:move', surface: 'door', row: 0, column: 0, stackId: null, stackOrder: null, priority: 'must' },
      { entityRef: 'magnet:blocker', surface: 'door', row: 0, column: 1, stackId: null, stackOrder: null, priority: null },
      { entityRef: 'magnet:drawer', surface: 'drawer', row: 0, column: 0, stackId: null, stackOrder: null, priority: 'should' },
      { entityRef: 'magnet:stack-a', surface: 'door', row: 1, column: 0, stackId: 'stack-audit', stackOrder: 0, priority: 'could' },
      { entityRef: 'magnet:stack-b', surface: 'door', row: 1, column: 0, stackId: 'stack-audit', stackOrder: 1, priority: 'must' },
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

async function storedFridge(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('arc.fridgeDoor.v1')
    return raw ? JSON.parse(raw).input.state : null
  })
}

async function rawFridge(page) {
  return page.evaluate(() => localStorage.getItem('arc.fridgeDoor.v1'))
}

async function dragBetween(page, handle, target, label) {
  const handleBox = await handle.boundingBox()
  const targetBox = await target.boundingBox()
  assert(handleBox, `${label}: drag handle has no rendered bounds.`)
  assert(targetBox, `${label}: drop target has no rendered bounds.`)
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(40)
}

async function dragWithVerticalAutoScroll(page, handle, target, direction, label) {
  const handleBox = await handle.boundingBox()
  assert(handleBox, `${label}: drag handle has no rendered bounds.`)
  const viewport = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }))
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + handleBox.width / 2, direction === 'down' ? viewport.height - 8 : 8, { steps: 5 })

  let targetBecameVisible = false
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await page.waitForTimeout(50)
    const box = await target.boundingBox()
    if (box && box.y >= 0 && box.y + box.height <= viewport.height) {
      targetBecameVisible = true
      break
    }
  }
  if (!targetBecameVisible) {
    await page.mouse.up()
    throw new Error(`${label}: edge auto-scroll never brought the drop target into the viewport.`)
  }

  // Leave the edge first so the product's auto-scroll loop has stopped before
  // this audit samples the final target geometry. Otherwise the test itself can
  // chase a stale rectangle and manufacture a wrong-cell result.
  await page.mouse.move(viewport.width / 2, viewport.height / 2, { steps: 3 })
  await page.waitForTimeout(100)
  const settledTarget = await target.boundingBox()
  assert(settledTarget, `${label}: drop target lost rendered bounds after auto-scroll settled.`)
  assert(settledTarget.y >= 0 && settledTarget.y + settledTarget.height <= viewport.height, `${label}: target left the viewport after auto-scroll settled.`)
  await page.mouse.move(settledTarget.x + settledTarget.width / 2, settledTarget.y + settledTarget.height / 2, { steps: 3 })
  await page.waitForTimeout(40)
  const finalTarget = await target.boundingBox()
  assert(finalTarget, `${label}: final live target bounds disappeared before release.`)
  await page.mouse.move(finalTarget.x + finalTarget.width / 2, finalTarget.y + finalTarget.height / 2)
  await page.mouse.up()
  await page.waitForTimeout(40)
}

function placement(state, ref) {
  return state.placements.find((item) => item.entityRef === ref)
}

function dragHandle(container) {
  return container.locator('.fridge-drag-handle')
}

async function seedContext(browser, viewport, marker) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript(({ entries, markerName }) => {
    if (sessionStorage.getItem(markerName) === '1') return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    sessionStorage.setItem(markerName, '1')
  }, { entries: storage, markerName: marker })
  return context
}

async function auditDesktop(browser) {
  const context = await seedContext(browser, { width: 1024, height: 900 }, 'arc.fridgeDrag.desktopSeeded')
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const fridge = page.getByRole('region', { name: 'Fridge Door' })
  assert(await fridge.isVisible(), 'desktop: Fridge Door is not visible.')
  assert(await page.locator('[draggable="true"]').count() === 0, 'desktop: native draggable semantics appeared; pointer drag should remain separate from HTML drag-and-drop.')

  const moveItem = page.locator('[data-fridge-ref="magnet:move"]')
  const moveHandle = dragHandle(moveItem)
  assert(await moveHandle.getAttribute('tabindex') === '-1', 'desktop: drag handle entered keyboard tab order instead of leaving Position as the non-drag route.')
  assert(await moveHandle.getAttribute('aria-label') === 'Drag Fridge item', 'desktop: item drag handle accessible name leaked object-title or control-label semantics.')
  assert(await moveItem.getByLabel('Position').isVisible(), 'desktop: explicit Position route disappeared after drag was added.')
  assert(await moveItem.getByRole('button', { name: 'Put away', exact: true }).isVisible(), 'desktop: explicit Put away route disappeared after drag was added.')

  const freeCell = page.locator('.fridge-door-cell[data-fridge-row="0"][data-fridge-column="2"]')
  await dragBetween(page, moveHandle, freeCell, 'desktop reposition')
  let state = await storedFridge(page)
  let move = placement(state, 'magnet:move')
  assert(move?.surface === 'door' && move.row === 0 && move.column === 2, 'desktop: Door-to-cell drag did not invoke exact Reposition semantics.')
  assert(move.priority === 'must', 'desktop: Door-to-cell drag lost Must priority.')

  const blocker = page.locator('[data-fridge-ref="magnet:blocker"]')
  const beforeOccupied = await rawFridge(page)
  await dragBetween(page, dragHandle(page.locator('[data-fridge-ref="magnet:move"]')), blocker, 'desktop occupied rejection')
  const afterOccupied = await rawFridge(page)
  assert(afterOccupied === beforeOccupied, 'desktop: occupied-cell rejection mutated persisted Fridge state.')
  assert(await fridge.getByRole('status').getByText(/already occupied/i).isVisible(), 'desktop: occupied-cell rejection was not explained visibly.')

  const drawerSummary = page.locator('.fridge-drawer > summary')
  await dragWithVerticalAutoScroll(page, dragHandle(page.locator('[data-fridge-ref="magnet:move"]')), drawerSummary, 'down', 'desktop put away with auto-scroll')
  state = await storedFridge(page)
  move = placement(state, 'magnet:move')
  assert(move?.surface === 'drawer', 'desktop: Door-to-Drawer drag did not invoke Put Away.')
  assert(move.priority === 'must', 'desktop: Put Away by drag lost Must priority.')

  const drawerMove = page.locator('.fridge-drawer-item[data-fridge-ref="magnet:move"]')
  const exactReturnCell = page.locator('.fridge-door-cell[data-fridge-row="2"][data-fridge-column="3"]')
  await dragWithVerticalAutoScroll(page, dragHandle(drawerMove), exactReturnCell, 'up', 'desktop exact drawer return with auto-scroll')
  state = await storedFridge(page)
  move = placement(state, 'magnet:move')
  assert(
    move?.surface === 'door' && move.row === 2 && move.column === 3,
    `desktop: Drawer-to-specific-cell drag ignored the teacher-selected coordinate; persisted ${move?.surface ?? 'missing'} ${move?.row ?? 'n/a'}:${move?.column ?? 'n/a'}.`,
  )
  assert(move.priority === 'must', 'desktop: exact Drawer return lost Must priority.')

  const stack = page.locator('[data-fridge-stack="stack-audit"]')
  const stackHandle = dragHandle(stack)
  assert(await stackHandle.getAttribute('aria-label') === 'Drag Fridge stack', 'desktop: stack drag handle accessible name leaked member-title or Position semantics.')
  const stackTarget = page.locator('.fridge-door-cell[data-fridge-row="1"][data-fridge-column="2"]')
  await dragBetween(page, stackHandle, stackTarget, 'desktop stack reposition')
  state = await storedFridge(page)
  const stackA = placement(state, 'magnet:stack-a')
  const stackB = placement(state, 'magnet:stack-b')
  assert(stackA?.row === 1 && stackA.column === 2 && stackB?.row === 1 && stackB.column === 2, 'desktop: stack drag did not move the whole stack atomically.')
  assert(stackA.stackId === 'stack-audit' && stackB.stackId === 'stack-audit', 'desktop: stack drag changed stack identity.')
  assert(stackA.stackOrder === 0 && stackB.stackOrder === 1, 'desktop: stack drag changed member order.')
  assert(stackA.priority === 'could' && stackB.priority === 'must', 'desktop: stack drag changed member priority.')

  const beforeStackDrawer = await rawFridge(page)
  await dragWithVerticalAutoScroll(page, dragHandle(page.locator('[data-fridge-stack="stack-audit"]')), drawerSummary, 'down', 'desktop stack drawer rejection with auto-scroll')
  const afterStackDrawer = await rawFridge(page)
  assert(afterStackDrawer === beforeStackDrawer, 'desktop: rejected stack-to-Drawer drag mutated persisted state.')
  assert(await fridge.getByRole('status').getByText(/Stacks stay together/i).isVisible(), 'desktop: rejected stack-to-Drawer drag was not explained.')

  await page.evaluate(() => window.scrollTo(0, 0))
  const beforeCancel = await rawFridge(page)
  const headerTarget = page.locator('.arc-header')
  await dragBetween(page, dragHandle(page.locator('[data-fridge-ref="magnet:blocker"]')), headerTarget, 'desktop outside cancel')
  const afterCancel = await rawFridge(page)
  assert(afterCancel === beforeCancel, 'desktop: releasing outside a Fridge target mutated state instead of cancelling.')

  const beforeReload = await rawFridge(page)
  await page.reload({ waitUntil: 'networkidle' })
  const afterReload = await rawFridge(page)
  assert(afterReload === beforeReload, 'desktop: Fridge drag persistence changed on reload without a user action.')
  state = await storedFridge(page)
  move = placement(state, 'magnet:move')
  assert(move?.row === 2 && move.column === 3 && move.priority === 'must', 'desktop: drag placement/priority did not survive reload.')
  assert(runtimeErrors.length === 0, `desktop: runtime errors detected: ${runtimeErrors.join(' | ')}`)

  await context.close()
}

async function auditScrolledMobile(browser) {
  const mobileFridge = {
    ...fridgeInput,
    state: {
      magnets: [
        { id: 'right-edge', title: 'Right edge item' },
        { id: 'left-anchor', title: 'Left anchor' },
      ],
      placements: [
        { entityRef: 'magnet:right-edge', surface: 'door', row: 0, column: 3, stackId: null, stackOrder: null, priority: 'should' },
        { entityRef: 'magnet:left-anchor', surface: 'door', row: 0, column: 0, stackId: null, stackOrder: null, priority: null },
      ],
    },
  }
  const mobileStorage = { ...storage, 'arc.fridgeDoor.v1': JSON.stringify({ schemaVersion: 1, input: mobileFridge }) }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.addInitScript((entries) => {
    if (sessionStorage.getItem('arc.fridgeDrag.mobileSeeded') === '1') return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    sessionStorage.setItem('arc.fridgeDrag.mobileSeeded', '1')
  }, mobileStorage)
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const scroll = page.locator('.fridge-door-scroll')
  const geometryBefore = await scroll.evaluate((node) => ({ clientWidth: node.clientWidth, scrollWidth: node.scrollWidth }))
  assert(geometryBefore.scrollWidth > geometryBefore.clientWidth, '390px: Fridge did not preserve its finite surface through internal scrolling.')
  await scroll.evaluate((node) => { node.scrollLeft = node.scrollWidth - node.clientWidth })
  await page.waitForTimeout(20)

  const source = page.locator('[data-fridge-ref="magnet:right-edge"]')
  const target = page.locator('.fridge-door-cell[data-fridge-row="1"][data-fridge-column="3"]')
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  assert(sourceBox && sourceBox.x < 390 && sourceBox.x + sourceBox.width > 0, '390px: manually scrolled source is not actually visible; audit would be invalid.')
  assert(targetBox && targetBox.x < 390 && targetBox.x + targetBox.width > 0, '390px: manually scrolled target is not actually visible; audit would be invalid.')

  await dragBetween(page, dragHandle(source), target, '390px scrolled drag')
  const state = await storedFridge(page)
  const moved = placement(state, 'magnet:right-edge')
  assert(moved?.row === 1 && moved.column === 3, '390px: drag used stale pre-scroll geometry instead of the live drop target.')
  assert(moved.priority === 'should', '390px: scrolled drag lost priority.')

  const docGeometry = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: document.documentElement.clientWidth }))
  assert(docGeometry.documentWidth <= docGeometry.viewportWidth + 1, `390px: Fridge drag leaked internal horizontal width into the document (${docGeometry.documentWidth} > ${docGeometry.viewportWidth}).`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditDesktop(browser)
  await auditScrolledMobile(browser)
  console.log('Fridge drag hostile audit passed: explicit non-drag routes preserved, exact Door reposition, atomic occupied-target rejection, vertical edge auto-scroll for Drawer access, Put Away, exact Drawer return, whole-stack movement, stack-to-Drawer rejection, outside cancel, reload persistence, and live post-scroll hit testing.')
} finally {
  await browser.close()
}
