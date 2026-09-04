import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-legacy-setup-audit',
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
    id: 'lesson-ur',
    calendarId: calendarInput.id,
    courseId: 'course-apah',
    unitId: 'unit-meso',
    title: 'Ziggurat of Ur',
    sequence: 1,
    plannedDate: '2026-09-15',
    datePolicy: 'flexible',
  }],
  deliveryStates: [{ lessonId: 'lesson-ur', sectionId: 'section-p5', status: 'in-progress', taughtDate: '2026-09-15', resumeNote: 'Stopped after the demo.' }],
}

const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-14T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
}

async function storedInput(page, key) {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw).input ?? null : null
  }, key)
}

async function forceValue(page, locator, value) {
  await locator.evaluate((node, nextValue) => {
    if (!(node instanceof HTMLInputElement || node instanceof HTMLSelectElement)) throw new Error('Expected form control.')
    node.disabled = false
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value')?.set
    setter?.call(node, nextValue)
    node.dispatchEvent(new Event('input', { bubbles: true }))
    node.dispatchEvent(new Event('change', { bubbles: true }))
  }, value)
}

async function auditViewport(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, storage)
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  assert(await page.getByRole('button', { name: 'Unit setup', exact: true }).isVisible(), `${width}px: Unit setup is not explicitly named.`)
  assert(await page.getByRole('button', { name: 'Lesson setup', exact: true }).isVisible(), `${width}px: Lesson setup is not explicitly named.`)
  assert(await page.getByRole('button', { name: 'Edit Units', exact: true }).count() === 0, `${width}px: legacy Edit Units label returned.`)
  assert(await page.getByRole('button', { name: 'Edit Lessons', exact: true }).count() === 0, `${width}px: legacy Edit Lessons label returned.`)

  await page.getByRole('button', { name: 'Unit setup', exact: true }).click()
  assert(await page.getByText('Existing Unit. Use Unit Focus for Move, Edit, Unplace, or Delete.', { exact: true }).isVisible(), `${width}px: persisted Unit ownership is not explicit.`)
  assert(await page.getByRole('button', { name: 'Remove', exact: true }).count() === 0, `${width}px: ambiguous Unit Remove action returned.`)
  assert(await page.getByRole('button', { name: 'Discard draft', exact: true }).count() === 0, `${width}px: persisted Unit is being treated as a discardable draft.`)

  const unitRow = page.locator('.unit-editor-row').first()
  const unitTitle = unitRow.getByLabel('Unit')
  const unitCourse = unitRow.getByLabel('Course')
  const unitStart = unitRow.getByLabel('Start')
  const unitEnd = unitRow.getByLabel('End')
  for (const control of [unitTitle, unitCourse, unitStart, unitEnd]) {
    assert(await control.isDisabled(), `${width}px: persisted Unit structural field is still editable in setup.`)
  }

  await forceValue(page, unitTitle, 'Mutated outside Unit Focus')
  await forceValue(page, unitStart, '2026-09-21')
  await page.getByRole('button', { name: 'Save Unit setup', exact: true }).click()
  const storedUnits = await storedInput(page, 'arc.units.v1')
  const persistedUnit = storedUnits?.units?.find((unit) => unit.id === 'unit-meso')
  assert(persistedUnit?.title === 'Ancient Mesopotamia', `${width}px: hostile DOM mutation changed persisted Unit title through setup.`)
  assert(persistedUnit?.placement?.startDate === '2026-09-14', `${width}px: hostile DOM mutation moved persisted Unit through setup.`)

  await page.getByRole('button', { name: 'Unit setup', exact: true }).click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  assert(await page.getByRole('button', { name: 'Discard draft', exact: true }).isVisible(), `${width}px: new Unit draft cannot be explicitly discarded.`)
  const draftUnitRow = page.locator('.unit-editor-row').last()
  assert(!(await draftUnitRow.getByLabel('Unit').isDisabled()), `${width}px: new Unit draft title is not editable.`)
  assert(!(await draftUnitRow.getByLabel('Start').isDisabled()), `${width}px: new Unit draft placement is not editable.`)
  await page.getByRole('button', { name: 'Discard draft', exact: true }).click()
  assert(await page.locator('.unit-editor-row').count() === 1, `${width}px: Unit draft discard did not remove only the draft.`)
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()

  await page.getByRole('button', { name: 'Lesson setup', exact: true }).click()
  assert(await page.getByText('Existing Lesson', { exact: true }).isVisible(), `${width}px: persisted Lesson ownership is not explicit.`)
  assert(await page.getByRole('button', { name: 'Remove Lesson', exact: true }).count() === 0, `${width}px: ambiguous Remove Lesson action returned.`)

  const title = page.getByLabel('Lesson title')
  const unit = page.getByLabel('Unit')
  const order = page.getByLabel('Order')
  const plannedDate = page.getByLabel('Planned date')
  const dateBehavior = page.getByLabel('Date behavior')
  assert(await title.isDisabled(), `${width}px: persisted Lesson title is still editable in setup.`)
  assert(await unit.isDisabled(), `${width}px: persisted Lesson Unit relationship is still editable in setup.`)
  assert(await plannedDate.isDisabled(), `${width}px: persisted Lesson calendar placement is still editable in setup.`)
  assert(await dateBehavior.isDisabled(), `${width}px: persisted Lesson date policy is still editable in setup.`)
  assert(!(await order.isDisabled()), `${width}px: approved batch Lesson order control was accidentally removed.`)
  assert(!(await page.getByLabel('Status').isDisabled()), `${width}px: approved class-progress correction was accidentally removed.`)

  await forceValue(page, title, 'Mutated outside Lesson editor')
  await forceValue(page, plannedDate, '2026-09-18')
  await page.getByRole('button', { name: 'Save Lesson setup', exact: true }).click()
  const storedLessons = await storedInput(page, 'arc.lessons.v1')
  const persistedLesson = storedLessons?.lessons?.find((lesson) => lesson.id === 'lesson-ur')
  assert(persistedLesson?.title === 'Ziggurat of Ur', `${width}px: hostile DOM mutation changed persisted Lesson title through setup.`)
  assert(persistedLesson?.plannedDate === '2026-09-15', `${width}px: hostile DOM mutation moved persisted Lesson through setup.`)

  await page.getByRole('button', { name: 'Lesson setup', exact: true }).click()
  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  assert(await page.getByRole('button', { name: 'Discard draft', exact: true }).isVisible(), `${width}px: new Lesson draft cannot be explicitly discarded.`)
  assert(!(await page.getByLabel('Lesson title').isDisabled()), `${width}px: new Lesson draft title is not editable.`)
  assert(!(await page.getByLabel('Unit').isDisabled()), `${width}px: new Lesson draft Unit assignment is not editable.`)
  await page.getByRole('button', { name: 'Discard draft', exact: true }).click()
  assert(await page.locator('.lesson-list-item').count() === 1, `${width}px: Lesson draft discard did not remove only the draft.`)
  await page.locator('.lesson-list-item').first().click()

  const typeSizes = await page.evaluate(() => ({
    listTitle: parseFloat(getComputedStyle(document.querySelector('.lesson-list-item strong')).fontSize),
    listMeta: parseFloat(getComputedStyle(document.querySelector('.lesson-list-item span')).fontSize),
    fieldMeta: parseFloat(getComputedStyle(document.querySelector('.lesson-field-grid label > span')).fontSize),
  }))
  assert(typeSizes.listTitle >= 16, `${width}px: Lesson setup primary list text fell below 16px.`)
  assert(typeSizes.listMeta >= 14 && typeSizes.fieldMeta >= 14, `${width}px: Lesson setup metadata fell below 14px.`)

  const geometry = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: setup retirement created horizontal document overflow.`)
  assert(await page.locator('[draggable="true"]').count() === 0, `${width}px: drag semantics appeared in setup retirement.`)
  assert(runtimeErrors.length === 0, `${width}px: runtime errors detected: ${runtimeErrors.join(' | ')}`)

  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditViewport(browser, 1024, 900)
  await auditViewport(browser, 800, 900)
  await auditViewport(browser, 390, 844)
  await auditViewport(browser, 320, 800)
  console.log('Legacy Unit/Lesson setup retirement audit passed at 1024px, 800px, 390px, and 320px.')
} finally {
  await browser.close()
}
