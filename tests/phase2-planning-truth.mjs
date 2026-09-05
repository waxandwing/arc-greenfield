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

async function configureCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar' }).click()
}

async function createClasses(page) {
  await page.getByRole('button', { name: 'Set classes' }).click()
  await page.getByRole('button', { name: 'Add a course' }).click()
  await page.getByLabel('Course').fill('AP Art History')
  await page.getByRole('button', { name: 'Add a period or section' }).click()
  await page.getByLabel('Period or section').fill('Period 2')
  await page.getByRole('button', { name: 'Save classes' }).click()
}

async function createUnit(page) {
  await page.getByRole('button', { name: 'Add Units' }).click()
  await page.getByRole('button', { name: 'Add Unit' }).click()
  await page.getByLabel('Unit').fill('Ancient Egypt')
  await page.getByLabel('Start').fill('2026-09-14')
  await page.getByLabel('End').fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units' }).click()
}

async function addLesson(page, title, date) {
  await page.getByRole('button', { name: 'Add Lesson' }).click()
  await page.getByLabel('Lesson title').fill(title)
  await page.getByLabel('Planned date').fill(date)
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

  await page.getByRole('button', { name: 'Add Lessons' }).click()
  await addLesson(page, 'Temple lesson', '2026-09-16')
  await addLesson(page, 'Image comparison', '2026-09-16')
  await page.getByRole('button', { name: 'Save Lessons' }).click()

  assert(await page.getByText('Temple lesson', { exact: true }).count() > 0, 'Phase 2: Month lost the first saved Lesson.')
  assert(await page.getByText('Image comparison', { exact: true }).count() > 0, 'Phase 2: Month lost the second same-day Lesson.')

  await page.getByRole('button', { name: 'Week' }).click()
  await page.getByRole('button', { name: 'Next Week' }).click()
  await page.getByRole('button', { name: 'Next Week' }).click()
  assert(await page.getByText('Temple lesson', { exact: true }).count() > 0, 'Phase 2: Week projection disagrees with Month for Temple lesson.')
  assert(await page.getByText('Image comparison', { exact: true }).count() > 0, 'Phase 2: Week projection lost a same-day Lesson.')

  await page.getByRole('button', { name: 'Day' }).click()
  assert(await page.getByText('Temple lesson', { exact: true }).count() > 0, 'Phase 2: Day projection disagrees with Week for Temple lesson.')
  assert(await page.getByText('Image comparison', { exact: true }).count() > 0, 'Phase 2: Day projection lost a same-day Lesson.')

  await page.reload({ waitUntil: 'networkidle' })
  assert(await page.getByText('Temple lesson', { exact: true }).count() > 0, 'Phase 2: saved Lesson did not survive reload.')
  assert(await page.getByText('Image comparison', { exact: true }).count() > 0, 'Phase 2: second saved Lesson did not survive reload.')
  assert(await page.getByText('Ancient Egypt', { exact: true }).count() > 0, 'Phase 2: Unit placement did not survive reload.')
  assert(await page.getByText('Period 2', { exact: true }).count() > 0, 'Phase 2: Section did not survive reload.')

  await page.getByRole('button', { name: 'Edit Lessons' }).click()
  await page.getByRole('button', { name: /Temple lesson/ }).click()
  await page.getByLabel('Planned date').fill('2026-09-17')
  await page.getByRole('button', { name: 'Save Lessons' }).click()

  await page.getByRole('button', { name: 'Week' }).click()
  await page.getByRole('button', { name: 'Next Week' }).click()
  await page.getByRole('button', { name: 'Next Week' }).click()
  const movedSlot = page.locator('.planning-day-slot').filter({ hasText: 'Temple lesson' })
  const movedLabel = await movedSlot.getAttribute('aria-label')
  assert(movedLabel?.includes('September 17'), `Phase 2: moved Lesson did not project to September 17 (${movedLabel ?? 'missing slot label'}).`)
  assert(await page.getByText('Image comparison', { exact: true }).count() > 0, 'Phase 2: moving one Lesson disturbed its same-day neighbor.')

  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Week' }).click()
  await page.getByRole('button', { name: 'Next Week' }).click()
  await page.getByRole('button', { name: 'Next Week' }).click()
  const reloadedMovedSlot = page.locator('.planning-day-slot').filter({ hasText: 'Temple lesson' })
  const reloadedMovedLabel = await reloadedMovedSlot.getAttribute('aria-label')
  assert(reloadedMovedLabel?.includes('September 17'), 'Phase 2: moved Lesson placement did not survive reload.')

  assert(runtimeErrors.length === 0, `Phase 2 runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('Phase 2 rendered planning truth gate passed: create → same-day placement → Month/Week/Day continuity → reload → move → reload.')
} finally {
  await browser.close()
}
