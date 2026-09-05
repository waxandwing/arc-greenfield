import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function trackRuntimeErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

function headerAction(page, text) {
  return page.locator('.calendar-context-actions button').filter({ hasText: text })
}

async function configureCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
}

async function createClasses(page) {
  await headerAction(page, 'Set classes').click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('AP Art History')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 2')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).nth(1).fill('Period 5')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()
}

async function createUnit(page) {
  await headerAction(page, 'Add Units').click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Recovery Unit')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()
}

async function addLesson(page, title, date, fixed = false) {
  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill(title)
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill(date)
  if (fixed) await page.getByRole('combobox', { name: 'Date behavior', exact: true }).selectOption('fixed')
}

async function createRecoveryLessons(page) {
  await headerAction(page, 'Add Lessons').click()
  await addLesson(page, 'Interrupted lesson', '2026-09-16')
  await addLesson(page, 'Flexible follow-up', '2026-09-17')
  await addLesson(page, 'Fixed checkpoint', '2026-09-23', true)

  await page.getByRole('button', { name: /^Interrupted lesson/ }).click()
  const p2 = page.locator('.delivery-row').filter({ hasText: 'Period 2' })
  await p2.getByRole('combobox', { name: 'Status', exact: true }).selectOption('in-progress')
  await p2.getByRole('textbox', { name: 'Actual date', exact: true }).fill('2026-09-16')
  await p2.getByRole('textbox', { name: 'Pick up here', exact: true }).fill('Stopped after image one. Resume with comparison.')

  const p5 = page.locator('.delivery-row').filter({ hasText: 'Period 5' })
  assert(await p5.getByRole('combobox', { name: 'Status', exact: true }).inputValue() === 'not-started', 'Recovery setup leaked Period 2 delivery state into Period 5.')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
}

async function moveToWeekOfSeptember14(page) {
  await page.getByRole('button', { name: 'Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
}

function sectionRow(page, name) {
  return page.locator('.planning-section-row').filter({ has: page.locator('.planning-row-label strong', { hasText: name }) })
}

async function lessonTitlesByDate(page, sectionName) {
  const row = sectionRow(page, sectionName)
  assert(await row.count() === 1, `Expected exactly one ${sectionName} planning row.`)
  const slots = row.locator('.planning-day-slot')
  const result = {}
  for (let index = 0; index < await slots.count(); index += 1) {
    const slot = slots.nth(index)
    const label = await slot.getAttribute('aria-label')
    const titles = await slot.locator('.planning-lesson-title').allTextContents()
    result[label] = titles
  }
  return result
}

function titlesForDate(map, isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const target = new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const key = Object.keys(map).find((label) => label?.includes(target))
  return key ? map[key] : []
}

async function assertShiftedWeek(page) {
  const p2 = await lessonTitlesByDate(page, 'Period 2')
  const p5 = await lessonTitlesByDate(page, 'Period 5')

  assert(!titlesForDate(p2, '2026-09-16').includes('Interrupted lesson'), 'Recovery Apply left Period 2 interrupted Lesson on the shared Wednesday.')
  assert(titlesForDate(p2, '2026-09-17').includes('Interrupted lesson'), 'Recovery Apply did not move Period 2 interrupted Lesson to Thursday resume date.')
  assert(titlesForDate(p2, '2026-09-18').includes('Flexible follow-up'), 'Recovery Apply did not move Period 2 flexible follow-up to Friday.')

  assert(titlesForDate(p5, '2026-09-16').includes('Interrupted lesson'), 'Recovery Apply mutated Period 5 shared Wednesday placement.')
  assert(titlesForDate(p5, '2026-09-17').includes('Flexible follow-up'), 'Recovery Apply mutated Period 5 shared Thursday placement.')
}

async function assertRestoredWeek(page) {
  const p2 = await lessonTitlesByDate(page, 'Period 2')
  const p5 = await lessonTitlesByDate(page, 'Period 5')

  assert(titlesForDate(p2, '2026-09-16').includes('Interrupted lesson'), 'Undo did not restore Period 2 interrupted Lesson to Wednesday.')
  assert(titlesForDate(p2, '2026-09-17').includes('Flexible follow-up'), 'Undo did not restore Period 2 flexible follow-up to Thursday.')
  assert(!titlesForDate(p2, '2026-09-18').includes('Flexible follow-up'), 'Undo left the Period 2 follow-up on its shifted Friday.')
  assert(titlesForDate(p5, '2026-09-16').includes('Interrupted lesson'), 'Undo disturbed Period 5 Wednesday placement.')
  assert(titlesForDate(p5, '2026-09-17').includes('Flexible follow-up'), 'Undo disturbed Period 5 Thursday placement.')
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  await configureCalendar(page)
  await createClasses(page)
  await createUnit(page)
  await createRecoveryLessons(page)

  const recoveryTrigger = headerAction(page, 'Review recovery')
  assert(await recoveryTrigger.count() === 1, 'In-progress Period 2 Lesson did not surface exactly one Recovery review trigger.')
  assert((await recoveryTrigger.innerText()).includes('(1)'), 'Recovery count did not reflect the single in-progress Section/Lesson state.')
  await recoveryTrigger.click()

  await page.getByRole('heading', { level: 2, name: 'Arc held the stopping point.', exact: true }).waitFor({ state: 'visible' })
  const card = page.locator('.recovery-card').filter({ hasText: 'Period 2' }).filter({ hasText: 'Interrupted lesson' })
  assert(await card.count() === 1, 'Recovery review did not isolate the interrupted Period 2 Lesson.')
  assert((await card.innerText()).includes('Thu, Sep 17'), 'Recovery preview did not propose the next confirmed instructional day as the resume date.')
  assert((await card.innerText()).includes('Flexible follow-up'), 'Recovery preview did not surface the flexible Lesson affected by the resume collision.')
  assert((await card.innerText()).includes('Fixed checkpoint'), 'Recovery preview did not surface the later fixed anchor.')
  assert((await card.innerText()).includes('stays fixed'), 'Recovery preview did not explicitly protect the fixed anchor.')
  assert((await card.innerText()).includes('Stopped after image one. Resume with comparison.'), 'Recovery preview lost the exact resume note.')

  const moveSelect = card.getByRole('combobox', { name: 'Move to', exact: true })
  const options = await moveSelect.locator('option').evaluateAll((nodes) => nodes.map((node) => ({ value: node.value, text: node.textContent })))
  const friday = options.find((option) => option.value === '2026-09-18')
  assert(friday, `Recovery review did not offer Friday Sep 18 as a safe destination. Options: ${JSON.stringify(options)}`)
  await moveSelect.selectOption('2026-09-18')
  await card.getByRole('button', { name: 'Apply Shift', exact: true }).click()

  assert(await headerAction(page, 'Undo last Shift').count() === 1, 'Applying Recovery Shift did not expose Undo.')
  const appliedNotice = await page.locator('.storage-notice').innerText()
  assert(appliedNotice.includes('Shift applied to Period 2. Undo is available.'), `Recovery Apply did not report Section-specific success. Notice: ${appliedNotice}`)

  await moveToWeekOfSeptember14(page)
  await assertShiftedWeek(page)
  const fixedTiles = page.getByRole('article', { name: /Fixed checkpoint.*fixed date/ })
  assert(await fixedTiles.count() === 0, 'Fixed checkpoint should remain outside the Sep 14 Week rather than being pulled into recovery movement.')

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
  assert(await headerAction(page, 'Undo last Shift').count() === 1, 'Reload lost the persisted Recovery Undo token.')
  await moveToWeekOfSeptember14(page)
  await assertShiftedWeek(page)

  // Undo from the actual teacher-facing header and prove the restored schedule persists.
  await headerAction(page, 'Undo last Shift').click()
  const undoNotice = await page.locator('.storage-notice').innerText()
  assert(undoNotice.includes('Undid the last Shift for Period 2.'), `Undo did not report the restored Section. Notice: ${undoNotice}`)
  assert(await headerAction(page, 'Undo last Shift').count() === 0, 'Undo token remained available after being consumed.')
  await assertRestoredWeek(page)

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
  assert(await headerAction(page, 'Undo last Shift').count() === 0, 'Consumed Undo token returned after reload.')
  await moveToWeekOfSeptember14(page)
  await assertRestoredWeek(page)

  assert(runtimeErrors.length === 0, `Phase 2 recovery/Undo runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('Phase 2 recovery/Undo continuity gate passed: in-progress Section → preview with fixed anchor → explicit Shift → Section-isolated Week truth → reload → Undo → restored Week truth → reload.')
} finally {
  await browser.close()
}
