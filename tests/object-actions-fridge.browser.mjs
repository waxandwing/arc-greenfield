import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-object-actions-audit',
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

const courseTitle = 'AP Art History — Ancient Mediterranean and Near Eastern Traditions'
const unitTitle = 'Ancient Mesopotamia: Power, Place, and Early Urban Systems'
const movableTitle = 'White Temple and its Ziggurat: Place, Power, and Procession'
const historyTitle = 'Standard of Ur: War, Peace, Register, and Royal Authority'

const planningInput = {
  calendarId: calendarInput.id,
  courses: [{ id: 'course-apah', title: courseTitle }],
  sections: [
    { id: 'section-p2', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 2' },
    { id: 'section-p5', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 5' },
    { id: 'section-p7', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 7' },
  ],
}

const unitsInput = {
  calendarId: calendarInput.id,
  units: [{
    id: 'unit-meso',
    calendarId: calendarInput.id,
    courseId: 'course-apah',
    title: unitTitle,
    placement: { startDate: '2026-09-14', endDate: '2026-09-25' },
  }],
}

const lessonsInput = {
  calendarId: calendarInput.id,
  lessons: [
    {
      id: 'lesson-movable', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso',
      title: movableTitle, sequence: 1, plannedDate: '2026-09-14', datePolicy: 'flexible',
    },
    {
      id: 'lesson-history', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso',
      title: historyTitle, sequence: 2, plannedDate: '2026-09-17', datePolicy: 'flexible',
    },
  ],
  deliveryStates: [
    { lessonId: 'lesson-history', sectionId: 'section-p5', status: 'completed', taughtDate: '2026-09-17', resumeNote: null },
  ],
}

const shiftInput = {
  calendarId: calendarInput.id,
  overrides: [
    { sectionId: 'section-p5', lessonId: 'lesson-movable', plannedDate: '2026-09-16' },
  ],
  undo: null,
}

const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-14T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
  'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: shiftInput }),
}

async function storedInput(page, key) {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    return JSON.parse(raw).input ?? null
  }, key)
}

async function openMonthLessonByKeyboard(page, title) {
  const signal = page.locator('.planning-month-signal').filter({ hasText: title }).first()
  await signal.focus()
  await page.keyboard.press('Enter')
  await page.locator('.object-focus-layer').waitFor()
}

async function auditViewport(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, storage)

  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  assert(await page.getByRole('heading', { name: 'Month' }).isVisible(), `${width}px: Arc did not restore into Month.`)
  assert(await page.getByText('Fridge Door', { exact: true }).count() === 0, `${width}px: Fridge Door showed a scheduled Lesson before Unplace.`)

  const openingTargets = await page.locator('.planning-object-openable').evaluateAll((nodes) => nodes.map((node) => ({
    height: node.getBoundingClientRect().height,
    text: node.textContent?.trim() ?? '',
  })))
  assert(openingTargets.length > 0, `${width}px: no calendar object opening targets rendered.`)
  for (const target of openingTargets) {
    assert(target.height >= 44, `${width}px: calendar object opening target fell below 44px (${target.height}px): ${target.text}`)
  }

  await openMonthLessonByKeyboard(page, movableTitle)
  const focus = page.locator('.object-focus-layer')
  const closeButton = focus.getByRole('button', { name: 'Close', exact: true })
  assert(await closeButton.evaluate((node) => document.activeElement === node), `${width}px: keyboard opening did not move focus into Unit Focus.`)
  assert(await focus.getByText('Unit Focus', { exact: true }).isVisible(), `${width}px: scheduled Lesson did not open Unit Focus.`)
  assert(await focus.getByText(movableTitle, { exact: true }).first().isVisible(), `${width}px: Unit Focus did not preserve selected Lesson context.`)

  const selected = focus.locator('.unit-focus-selected-lesson')
  const selectedActions = selected.locator('.object-action-bar')
  for (const label of ['Move', 'Edit', 'Unplace', 'Delete']) {
    assert(await selectedActions.getByRole('button', { name: label, exact: true }).isVisible(), `${width}px: selected Lesson is missing ${label}.`)
  }
  assert(await page.locator('[draggable="true"]').count() === 0, `${width}px: drag semantics appeared before the approved drag milestone.`)

  await selectedActions.getByRole('button', { name: 'Unplace', exact: true }).click()
  const unplaceReview = selected.getByRole('region', { name: 'Unplace Lesson' })
  assert(await unplaceReview.getByText(/identity, Unit relationship, curriculum content, and teaching history remain/i).isVisible(), `${width}px: Unplace did not explain preserved Lesson identity/history.`)
  assert(await unplaceReview.getByText('Section-specific placements also cleared', { exact: true }).isVisible(), `${width}px: Unplace did not disclose Section-specific placement cleanup.`)
  assert(await unplaceReview.getByText('Period 5 · 2026-09-16', { exact: true }).isVisible(), `${width}px: Unplace did not identify the affected Section placement.`)
  assert(await unplaceReview.getByText(/visible on the Fridge Door/i).isVisible(), `${width}px: Unplace did not explain the Fridge Door consequence.`)

  await unplaceReview.getByRole('button', { name: 'Unplace Lesson', exact: true }).click()
  await page.getByText('Fridge Door', { exact: true }).waitFor()
  assert(await page.getByRole('button', { name: new RegExp(movableTitle) }).isVisible(), `${width}px: Unplaced Lesson is not immediately findable on the Fridge Door.`)
  assert(await focus.getByText('Lesson', { exact: true }).first().isVisible(), `${width}px: Unplaced Lesson did not resolve to the lightweight Lesson editor.`)
  assert(await focus.getByRole('button', { name: 'Close', exact: true }).evaluate((node) => document.activeElement === node), `${width}px: switching to the lightweight Lesson editor did not establish an operable focus point.`)

  const afterUnplaceLessons = await storedInput(page, 'arc.lessons.v1')
  const afterUnplaceShift = await storedInput(page, 'arc.shift.v1')
  const unplacedLesson = afterUnplaceLessons?.lessons?.find((lesson) => lesson.id === 'lesson-movable')
  assert(unplacedLesson?.plannedDate === null, `${width}px: canonical Lesson did not become unplaced.`)
  assert(unplacedLesson?.datePolicy === 'flexible', `${width}px: canonical Lesson did not normalize to flexible when unplaced.`)
  assert(!afterUnplaceShift?.overrides?.some((override) => override.lessonId === 'lesson-movable'), `${width}px: Section-specific placement survived Lesson Unplace.`)
  assert(afterUnplaceLessons?.lessons?.filter((lesson) => lesson.id === 'lesson-movable').length === 1, `${width}px: Unplace duplicated the canonical Lesson.`)

  await focus.getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: new RegExp(movableTitle) }).click()
  await focus.waitFor()
  assert(await focus.getByText('Lesson', { exact: true }).first().isVisible(), `${width}px: Fridge Door did not reopen the lightweight Lesson editor.`)

  let lessonActions = focus.locator('.object-action-bar')
  await lessonActions.getByRole('button', { name: 'Move', exact: true }).click()
  const moveReview = focus.getByRole('region', { name: 'Move Lesson' })
  const destination = moveReview.getByLabel('Destination date')
  assert(await destination.locator('option[value="2026-09-19"]').count() === 0, `${width}px: non-instructional Saturday was offered by the Move chooser.`)
  await destination.selectOption('2026-09-18')
  assert(await moveReview.getByText(new RegExp(`Preview: .*2026-09-18`)).isVisible(), `${width}px: Move did not preview the destination.`)
  await moveReview.getByRole('button', { name: 'Move Lesson', exact: true }).click()

  const afterMoveLessons = await storedInput(page, 'arc.lessons.v1')
  const movedLesson = afterMoveLessons?.lessons?.find((lesson) => lesson.id === 'lesson-movable')
  assert(movedLesson?.plannedDate === '2026-09-18', `${width}px: Move did not persist through the canonical Lesson object.`)
  assert(await page.getByText('Fridge Door', { exact: true }).count() === 0, `${width}px: scheduled Lesson remained on the Fridge Door after Move.`)
  assert(await focus.isVisible(), `${width}px: successful Move unexpectedly closed the Lesson editor.`)

  lessonActions = focus.locator('.object-action-bar')
  await lessonActions.getByRole('button', { name: 'Move', exact: true }).click()
  const rejectedMove = focus.getByRole('region', { name: 'Move Lesson' })
  const hostileDestination = rejectedMove.getByLabel('Destination date')
  await hostileDestination.evaluate((node) => {
    if (!(node instanceof HTMLSelectElement)) throw new Error('Destination chooser is not a select.')
    const option = document.createElement('option')
    option.value = '2026-09-19'
    option.textContent = 'Injected invalid Saturday'
    node.append(option)
    node.value = option.value
    node.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await rejectedMove.getByRole('button', { name: 'Move Lesson', exact: true }).click()
  assert(await focus.getByRole('alert').getByText(/confirmed instructional day/i).isVisible(), `${width}px: hostile rejected Move did not surface the domain error in the open editor.`)
  const afterRejectedMove = await storedInput(page, 'arc.lessons.v1')
  assert(afterRejectedMove?.lessons?.find((lesson) => lesson.id === 'lesson-movable')?.plannedDate === '2026-09-18', `${width}px: hostile rejected Move mutated the Lesson.`)
  assert(await focus.isVisible(), `${width}px: rejected Move closed the editor.`)

  await focus.getByRole('button', { name: 'Close', exact: true }).click()
  await openMonthLessonByKeyboard(page, historyTitle)
  const historySelected = focus.locator('.unit-focus-selected-lesson')
  await historySelected.locator('.object-action-bar').getByRole('button', { name: 'Delete', exact: true }).click()
  const deleteLessonReview = historySelected.getByRole('region', { name: 'Delete Lesson' })
  assert(await deleteLessonReview.getByText(/No Undo is promised/i).isVisible(), `${width}px: destructive Lesson confirmation promised or omitted recovery semantics.`)
  await deleteLessonReview.getByRole('button', { name: 'Delete Lesson', exact: true }).click()
  assert(await historySelected.getByRole('alert').getByText(/teaching history/i).isVisible(), `${width}px: teaching-history Delete blocker was not surfaced.`)
  const afterBlockedDelete = await storedInput(page, 'arc.lessons.v1')
  assert(afterBlockedDelete?.lessons?.some((lesson) => lesson.id === 'lesson-history'), `${width}px: blocked Lesson Delete removed the object.`)

  const unitSurface = focus.locator('.object-focus-object .object-action-surface')
  await unitSurface.locator('.object-action-bar').getByRole('button', { name: 'Delete', exact: true }).click()
  const deleteUnitReview = unitSurface.getByRole('region', { name: 'Delete Unit' })
  await deleteUnitReview.getByRole('button', { name: 'Delete Unit', exact: true }).click()
  assert(await unitSurface.getByRole('alert').getByText(/Move or delete its Lessons first/i).isVisible(), `${width}px: Unit dependency Delete blocker was not surfaced.`)
  const afterBlockedUnitDelete = await storedInput(page, 'arc.units.v1')
  assert(afterBlockedUnitDelete?.units?.some((unit) => unit.id === 'unit-meso'), `${width}px: blocked Unit Delete removed the Unit.`)

  await unitSurface.locator('.object-action-bar').getByRole('button', { name: 'Unplace', exact: true }).click()
  const unplaceUnitReview = unitSurface.getByRole('region', { name: 'Unplace Unit' })
  await unplaceUnitReview.getByRole('button', { name: 'Unplace Unit', exact: true }).click()
  assert(await unitSurface.getByRole('alert').getByText(/scheduled Lessons first/i).isVisible(), `${width}px: Unit Unplace dependency blocker was not surfaced.`)
  const afterBlockedUnitUnplace = await storedInput(page, 'arc.units.v1')
  assert(afterBlockedUnitUnplace?.units?.find((unit) => unit.id === 'unit-meso')?.placement?.startDate === '2026-09-14', `${width}px: blocked Unit Unplace changed the Unit span.`)

  const targetSizes = await focus.locator('button').evaluateAll((nodes) => nodes.map((node) => ({
    text: node.textContent?.trim() ?? '',
    width: node.getBoundingClientRect().width,
    height: node.getBoundingClientRect().height,
  })))
  for (const target of targetSizes.filter((item) => ['Move', 'Edit', 'Unplace', 'Delete', 'Close'].includes(item.text))) {
    assert(target.height >= 44, `${width}px: ${target.text} control fell below the 44px target floor (${target.height}px).`)
  }

  const geometry = await page.evaluate(() => {
    const root = document.documentElement
    const panel = document.querySelector('.object-focus-layer')?.getBoundingClientRect() ?? null
    const rail = document.querySelector('.arc-view-rail')?.getBoundingClientRect() ?? null
    return {
      viewportWidth: root.clientWidth,
      documentWidth: root.scrollWidth,
      panel: panel ? { left: panel.left, right: panel.right, top: panel.top, bottom: panel.bottom } : null,
      rail: rail ? { top: rail.top, bottom: rail.bottom } : null,
      viewportHeight: window.innerHeight,
    }
  })
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: object interaction created horizontal document overflow.`)
  assert(geometry.panel, `${width}px: object focus panel has no rendered bounds.`)
  assert(geometry.panel.left >= -0.5 && geometry.panel.right <= width + 0.5, `${width}px: object focus panel escapes the viewport horizontally.`)
  assert(geometry.panel.top >= 0 && geometry.panel.bottom <= geometry.viewportHeight + 0.5, `${width}px: object focus panel escapes the viewport vertically.`)
  if (width <= 520 && geometry.rail) {
    assert(geometry.panel.bottom <= geometry.rail.top + 1, `${width}px: mobile bottom navigation covers the object focus panel.`)
  }

  assert(runtimeErrors.length === 0, `${width}px: runtime errors detected: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditViewport(browser, 1024, 900)
  await auditViewport(browser, 800, 900)
  await auditViewport(browser, 390, 844)
  await auditViewport(browser, 320, 800)
  console.log('Object actions + Fridge Door Chromium audit passed at 1024px desktop, 800px compact, 390px mobile, and 320px minimum reflow.')
} finally {
  await browser.close()
}
