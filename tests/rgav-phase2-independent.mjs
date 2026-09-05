import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function headerAction(page, text) {
  return page.locator('.calendar-context-actions button').filter({ hasText: text })
}

function trackRuntimeErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

async function press(locator, key = 'Enter') {
  await locator.focus()
  assert(await locator.evaluate((node) => document.activeElement === node), 'RGAV B: intended control did not receive keyboard focus.')
  await locator.press(key)
}

async function configure(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })

  await page.getByText('View options', { exact: true }).click()
  const weekends = page.getByRole('checkbox', { name: /weekends/i })
  if (await weekends.count()) await weekends.check()
}

async function makeClasses(page) {
  await headerAction(page, 'Set classes').click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('Studio Art')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 1')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).nth(1).fill('Period 4')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()
}

async function makePlan(page) {
  await headerAction(page, 'Add Units').click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Color Unit')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

  await headerAction(page, 'Add Lessons').click()
  const add = page.getByRole('button', { name: 'Add Lesson', exact: true })
  await add.click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Color intro')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-15')

  await add.click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Mixing lab')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-16')

  await add.click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Critique checkpoint')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-23')
  await page.getByRole('combobox', { name: 'Date behavior', exact: true }).selectOption('fixed')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
}

async function moveToTargetWeek(page) {
  await page.getByRole('button', { name: 'Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
}

async function titlesInRow(page, sectionName) {
  const row = page.locator('.planning-section-row').filter({ has: page.locator('.planning-row-label strong', { hasText: sectionName }) })
  assert(await row.count() === 1, `RGAV B: expected one ${sectionName} row.`)
  return row.locator('.planning-lesson-title').allTextContents()
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  await configure(page)
  await makeClasses(page)
  await makePlan(page)

  // Prove one source of truth across horizons before introducing divergence.
  assert((await page.locator('body').innerText()).includes('Color intro'), 'RGAV B: Month did not project saved Lesson truth.')
  await moveToTargetWeek(page)
  assert((await titlesInRow(page, 'Period 1')).includes('Color intro'), 'RGAV B: Week lost Color intro for Period 1.')
  assert((await titlesInRow(page, 'Period 4')).includes('Mixing lab'), 'RGAV B: Week lost Mixing lab for Period 4.')
  await page.getByRole('button', { name: 'Day', exact: true }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'Day', exact: true }).count() === 1, 'RGAV B: Day projection did not open.')

  // Mutate the shared plan by keyboard, then prove reload persistence.
  await press(headerAction(page, 'Edit Lessons'))
  await press(page.getByRole('button', { name: /^Mixing lab/ }))
  const plannedDate = page.getByRole('textbox', { name: 'Planned date', exact: true })
  await plannedDate.fill('2026-09-17')
  await press(page.getByRole('button', { name: 'Save Lessons', exact: true }))
  await page.reload({ waitUntil: 'networkidle' })
  await press(headerAction(page, 'Edit Lessons'))
  await press(page.getByRole('button', { name: /^Mixing lab/ }))
  assert(await page.getByRole('textbox', { name: 'Planned date', exact: true }).inputValue() === '2026-09-17', 'RGAV B: shared Lesson move did not survive reload.')

  // Create Section divergence on Period 4 only.
  await press(page.getByRole('button', { name: /^Color intro/ }))
  const p4 = page.locator('.delivery-row').filter({ hasText: 'Period 4' })
  await p4.getByRole('combobox', { name: 'Status', exact: true }).selectOption('in-progress')
  await p4.getByRole('textbox', { name: 'Actual date', exact: true }).fill('2026-09-15')
  await p4.getByRole('textbox', { name: 'Pick up here', exact: true }).fill('Stopped before independent practice.')
  const p1 = page.locator('.delivery-row').filter({ hasText: 'Period 1' })
  assert(await p1.getByRole('combobox', { name: 'Status', exact: true }).inputValue() === 'not-started', 'RGAV B: Period 4 progress leaked into Period 1.')
  await press(page.getByRole('button', { name: 'Save Lessons', exact: true }))

  await page.reload({ waitUntil: 'networkidle' })
  assert(await headerAction(page, 'Review recovery').count() === 1, 'RGAV B: reload lost recovery trigger for Period 4 divergence.')
  await press(headerAction(page, 'Review recovery'))
  const recovery = page.locator('.recovery-card').filter({ hasText: 'Period 4' }).filter({ hasText: 'Color intro' })
  assert(await recovery.count() === 1, 'RGAV B: recovery review did not isolate Period 4.')
  assert((await recovery.innerText()).includes('Stopped before independent practice.'), 'RGAV B: recovery lost exact resume note.')
  assert((await recovery.innerText()).includes('Critique checkpoint'), 'RGAV B: recovery did not expose fixed anchor context.')

  const moveSelect = recovery.getByRole('combobox', { name: 'Move to', exact: true })
  const safeDestination = await moveSelect.locator('option:not([disabled])').evaluateAll((nodes) => nodes.map((node) => node.value).find((value) => Boolean(value)) ?? '')
  assert(Boolean(safeDestination), 'RGAV B: no safe Recovery destination was offered.')
  await moveSelect.selectOption(safeDestination)
  await press(recovery.getByRole('button', { name: 'Apply Shift', exact: true }))
  assert(await headerAction(page, 'Undo last Shift').count() === 1, 'RGAV B: Apply Shift did not expose Undo.')

  // Check Section isolation after recovery, then consume Undo and prove it stays consumed.
  await page.getByRole('button', { name: 'Week', exact: true }).click()
  const p1Titles = await titlesInRow(page, 'Period 1')
  const p4Titles = await titlesInRow(page, 'Period 4')
  assert(p1Titles.includes('Color intro'), 'RGAV B: Section recovery mutated Period 1 shared plan.')
  assert(p4Titles.includes('Color intro'), 'RGAV B: Period 4 recovery lost the interrupted Lesson instead of moving it.')

  await press(headerAction(page, 'Undo last Shift'))
  assert(await headerAction(page, 'Undo last Shift').count() === 0, 'RGAV B: Undo token was not consumed.')
  await page.reload({ waitUntil: 'networkidle' })
  assert(await headerAction(page, 'Undo last Shift').count() === 0, 'RGAV B: consumed Undo token returned after reload.')

  // No drag-only mutation route and no page overflow/runtime breakage.
  assert(await page.locator('[draggable="true"]').count() === 0, 'RGAV B: a drag-required planning mutation route appeared.')
  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `RGAV B: document overflowed horizontally (${geometry.scroll} > ${geometry.width}).`)
  assert(runtimeErrors.length === 0, `RGAV B runtime errors: ${runtimeErrors.join(' | ')}`)

  await context.close()
  console.log('Independent Phase 2 RGAV B passed: alternate teacher story/viewport verified cross-view truth, keyboard move + reload, Section divergence, recovery/fixed-anchor context, Section isolation, Apply/Undo persistence, no drag-only route, overflow, and runtime cleanliness.')
} finally {
  await browser.close()
}
