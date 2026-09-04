import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-fridge-nondrag-audit',
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
  lessons: [{
    id: 'lesson-unplaced',
    calendarId: calendarInput.id,
    courseId: 'course-apah',
    unitId: 'unit-meso',
    title: 'Cylinder Seal Comparison',
    sequence: 1,
    plannedDate: null,
    datePolicy: 'flexible',
  }],
  deliveryStates: [],
}

const seededMagnets = Array.from({ length: 10 }, (_, index) => ({ id: `seed-${index}`, title: `Seed thought ${index + 1}` }))
const seededPlacements = seededMagnets.map((magnet, index) => ({
  entityRef: `magnet:${magnet.id}`,
  surface: 'door',
  row: Math.floor(index / 4),
  column: index % 4,
  stackId: null,
  stackOrder: null,
  priority: null,
}))

const fridgeInput = {
  calendarId: calendarInput.id,
  state: { magnets: seededMagnets, placements: seededPlacements },
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

async function capture(page, value) {
  const field = page.getByLabel('Quick capture')
  await field.fill(value)
  await page.getByRole('button', { name: 'Capture', exact: true }).click()
}

async function auditViewport(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((entries) => {
    const marker = 'arc.fridgeDoor.auditSeeded'
    if (sessionStorage.getItem(marker) === '1') return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    sessionStorage.setItem(marker, '1')
  }, storage)
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const fridge = page.getByRole('region', { name: 'Fridge Door' })
  assert(await fridge.isVisible(), `${width}px: persistent Fridge Door is not visible.`)
  assert(await page.locator('[draggable="true"]').count() === 0, `${width}px: drag semantics appeared before non-drag Fridge reached Green.`)

  const unplaced = page.locator('[data-fridge-ref="lesson:lesson-unplaced"]')
  assert(await unplaced.isVisible(), `${width}px: canonical unplaced Lesson did not reconcile onto the Door.`)
  assert(await fridge.getByText('11 on Door', { exact: true }).isVisible(), `${width}px: reconciled Door count is wrong.`)
  assert(await fridge.getByText('0 in Drawer', { exact: true }).isVisible(), `${width}px: initial Drawer count is wrong.`)

  await unplaced.getByRole('button', { name: 'Cylinder Seal Comparison', exact: true }).click()
  const focus = page.locator('.object-focus-layer')
  assert(await focus.getByText('Lesson', { exact: true }).first().isVisible(), `${width}px: Fridge Lesson did not open lightweight Lesson editor.`)
  await focus.getByRole('button', { name: 'Close', exact: true }).click()

  await capture(page, 'M Gallery walk idea')
  let fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  const galleryMagnet = fridgeStored?.state?.magnets?.find((magnet) => magnet.title === 'Gallery walk idea')
  assert(galleryMagnet, `${width}px: M capture did not persist a Magnet.`)
  assert(fridgeStored.state.placements.filter((item) => item.entityRef === `magnet:${galleryMagnet.id}`).length === 1, `${width}px: M capture duplicated its Fridge reference.`)
  assert(fridgeStored.state.placements.find((item) => item.entityRef === `magnet:${galleryMagnet.id}`)?.surface === 'door', `${width}px: final free Door slot was not used by M capture.`)

  await capture(page, 'Sticky thought without a prefix')
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  const stickyMagnet = fridgeStored?.state?.magnets?.find((magnet) => magnet.title === 'Sticky thought without a prefix')
  assert(stickyMagnet, `${width}px: unprefixed capture did not default to Magnet.`)
  const stickyRef = `magnet:${stickyMagnet.id}`
  assert(fridgeStored.state.placements.find((item) => item.entityRef === stickyRef)?.surface === 'drawer', `${width}px: full Door did not route capture to Drawer.`)
  assert(fridgeStored.state.placements.filter((item) => item.surface === 'door').length === 12, `${width}px: overflow capture evicted or overfilled the finite Door.`)

  const stickyDrawer = page.locator('.fridge-drawer-item').filter({ hasText: 'Sticky thought without a prefix' })
  await stickyDrawer.getByLabel('Priority').selectOption('must')
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  assert(fridgeStored.state.placements.find((item) => item.entityRef === stickyRef)?.priority === 'must', `${width}px: Drawer priority did not persist.`)

  await stickyDrawer.getByRole('button', { name: 'Bring back', exact: true }).click()
  assert(await fridge.getByRole('status').getByText(/Fridge Door is full/i).isVisible(), `${width}px: full-door Bring Back did not fail visibly.`)
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  assert(fridgeStored.state.placements.find((item) => item.entityRef === stickyRef)?.surface === 'drawer', `${width}px: failed Bring Back removed item from Drawer.`)

  const seedZero = page.locator('[data-fridge-ref="magnet:seed-0"]')
  await seedZero.getByRole('button', { name: 'Put away', exact: true }).click()
  await stickyDrawer.getByRole('button', { name: 'Bring back', exact: true }).click()
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  let stickyPlacement = fridgeStored.state.placements.find((item) => item.entityRef === stickyRef)
  assert(stickyPlacement?.surface === 'door', `${width}px: Bring Back did not use the freed Door slot.`)
  assert(stickyPlacement?.priority === 'must', `${width}px: Bring Back lost Must priority.`)

  const seedOne = page.locator('[data-fridge-ref="magnet:seed-1"]')
  await seedOne.getByRole('button', { name: 'Put away', exact: true }).click()
  const stickyDoor = page.locator(`[data-fridge-ref="${stickyRef}"]`)
  await stickyDoor.getByLabel('Position').selectOption('0:1')
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  stickyPlacement = fridgeStored.state.placements.find((item) => item.entityRef === stickyRef)
  assert(stickyPlacement?.row === 0 && stickyPlacement?.column === 1, `${width}px: explicit Reposition did not persist exact grid coordinates.`)
  assert(stickyPlacement?.priority === 'must', `${width}px: Reposition lost Must priority.`)

  await capture(page, 'U Renaissance')
  const unitContext = fridge.getByRole('group', { name: 'Unit capture context' })
  assert(await unitContext.isVisible(), `${width}px: U capture skipped explicit Course context.`)
  let unitsStored = await storedInput(page, 'arc.units.v1')
  assert(!unitsStored.units.some((unit) => unit.title === 'Renaissance'), `${width}px: U capture created canonical Unit before context confirmation.`)
  await unitContext.getByLabel('Course').selectOption('course-apah')
  await unitContext.getByRole('button', { name: 'Create Unit', exact: true }).click()
  unitsStored = await storedInput(page, 'arc.units.v1')
  const renaissance = unitsStored.units.find((unit) => unit.title === 'Renaissance')
  assert(renaissance?.placement === null, `${width}px: U capture scheduled a Unit instead of leaving it unscheduled.`)
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  assert(fridgeStored.state.placements.filter((item) => item.entityRef === `unit:${renaissance.id}`).length === 1, `${width}px: U capture did not create exactly one canonical Unit reference.`)

  await capture(page, 'L Fresco comparison')
  const lessonContext = fridge.getByRole('group', { name: 'Lesson capture context' })
  assert(await lessonContext.isVisible(), `${width}px: L capture skipped explicit Unit context.`)
  let lessonsStored = await storedInput(page, 'arc.lessons.v1')
  assert(!lessonsStored.lessons.some((lesson) => lesson.title === 'Fresco comparison'), `${width}px: L capture created canonical Lesson before context confirmation.`)
  await lessonContext.getByLabel('Unit').selectOption(renaissance.id)
  await lessonContext.getByRole('button', { name: 'Create Lesson', exact: true }).click()
  lessonsStored = await storedInput(page, 'arc.lessons.v1')
  const fresco = lessonsStored.lessons.find((lesson) => lesson.title === 'Fresco comparison')
  assert(fresco?.unitId === renaissance.id, `${width}px: L capture ignored explicit Unit context.`)
  assert(fresco?.plannedDate === null && fresco?.datePolicy === 'flexible', `${width}px: L capture silently scheduled or fixed the Lesson.`)
  fridgeStored = await storedInput(page, 'arc.fridgeDoor.v1')
  assert(fridgeStored.state.placements.filter((item) => item.entityRef === `lesson:${fresco.id}`).length === 1, `${width}px: L capture did not create exactly one canonical Lesson reference.`)

  const beforeReloadSticky = fridgeStored.state.placements.find((item) => item.entityRef === stickyRef)
  await page.reload({ waitUntil: 'networkidle' })
  const afterReload = await storedInput(page, 'arc.fridgeDoor.v1')
  const afterReloadSticky = afterReload.state.placements.find((item) => item.entityRef === stickyRef)
  assert(afterReloadSticky?.row === beforeReloadSticky?.row && afterReloadSticky?.column === beforeReloadSticky?.column, `${width}px: Reposition did not survive reload.`)
  assert(afterReloadSticky?.priority === 'must', `${width}px: priority did not survive reload.`)
  assert(afterReload.state.placements.some((item) => item.entityRef === `unit:${renaissance.id}`), `${width}px: Unit Fridge reference disappeared after reload.`)
  assert(afterReload.state.placements.some((item) => item.entityRef === `lesson:${fresco.id}`), `${width}px: Lesson Fridge reference disappeared after reload.`)

  const renaissanceItem = page.locator(`[data-fridge-ref="unit:${renaissance.id}"]`)
  if (await renaissanceItem.count()) {
    await renaissanceItem.getByRole('button', { name: 'Renaissance', exact: true }).click()
    assert(await page.locator('.object-focus-layer').getByText('Unit Focus', { exact: true }).isVisible(), `${width}px: Fridge Unit did not open Unit Focus.`)
    await page.locator('.object-focus-layer').getByRole('button', { name: 'Close', exact: true }).click()
  }

  const frescoItem = page.locator(`[data-fridge-ref="lesson:${fresco.id}"]`)
  if (await frescoItem.count()) {
    await frescoItem.getByRole('button', { name: 'Fresco comparison', exact: true }).click()
  } else {
    const frescoDrawer = page.locator('.fridge-drawer-item').filter({ hasText: 'Fresco comparison' })
    await frescoDrawer.getByRole('button', { name: 'Fresco comparison', exact: true }).click()
  }
  assert(await page.locator('.object-focus-layer').getByText('Lesson', { exact: true }).first().isVisible(), `${width}px: Fridge Lesson did not open lightweight Lesson editor.`)
  await page.locator('.object-focus-layer').getByRole('button', { name: 'Close', exact: true }).click()

  const visual = await page.evaluate(() => {
    const itemTitle = document.querySelector('.fridge-item-copy strong, .fridge-item-title')
    const itemMeta = document.querySelector('.fridge-item-copy > span, .fridge-item-copy small')
    const controls = [...document.querySelectorAll('.fridge-door button:not(:disabled), .fridge-door select:not(:disabled), .fridge-door input:not(:disabled)')]
    const root = document.documentElement
    const scroll = document.querySelector('.fridge-door-scroll')
    return {
      titleSize: itemTitle ? parseFloat(getComputedStyle(itemTitle).fontSize) : 0,
      metaSize: itemMeta ? parseFloat(getComputedStyle(itemMeta).fontSize) : 0,
      minControlHeight: controls.length ? Math.min(...controls.map((node) => node.getBoundingClientRect().height)) : 0,
      documentWidth: root.scrollWidth,
      viewportWidth: root.clientWidth,
      fridgeScrollWidth: scroll?.scrollWidth ?? 0,
      fridgeClientWidth: scroll?.clientWidth ?? 0,
    }
  })
  assert(visual.titleSize >= 16, `${width}px: Fridge primary item text fell below 16px.`)
  assert(visual.metaSize >= 14, `${width}px: Fridge metadata fell below 14px.`)
  assert(visual.minControlHeight >= 44, `${width}px: Fridge interactive target fell below 44px (${visual.minControlHeight}px).`)
  assert(visual.documentWidth <= visual.viewportWidth + 1, `${width}px: finite Fridge surface leaked horizontal overflow into the document.`)
  if (width <= 520) assert(visual.fridgeScrollWidth > visual.fridgeClientWidth, `${width}px: mobile Fridge did not preserve the finite surface through internal scrolling.`)
  assert(await page.locator('[draggable="true"]').count() === 0, `${width}px: drag semantics appeared during non-drag audit.`)
  assert(runtimeErrors.length === 0, `${width}px: runtime errors detected: ${runtimeErrors.join(' | ')}`)

  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditViewport(browser, 1024, 900)
  await auditViewport(browser, 800, 900)
  await auditViewport(browser, 390, 844)
  await auditViewport(browser, 320, 800)
  console.log('Non-drag Fridge Door Chromium audit passed at 1024px, 800px, 390px, and 320px.')
} finally {
  await browser.close()
}
