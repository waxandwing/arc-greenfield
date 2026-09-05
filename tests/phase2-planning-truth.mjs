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

async function settingsAction(page, text) {
  const drawer = page.getByRole('complementary', { name: 'Settings and setup' })
  if (!(await drawer.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
  }
  const button = page.getByRole('complementary', { name: 'Settings and setup' }).getByRole('button', { name: text, exact: true })
  assert(await button.count() === 1, `Phase 2: Settings did not expose exactly one ${text} action.`)
  return button
}

async function waitForCalendarAfterLessonSave(page, context) {
  try {
    await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible', timeout: 5000 })
  } catch {
    const alerts = await page.locator('[role="alert"]').allTextContents()
    const notices = await page.locator('.storage-notice').allTextContents()
    const body = (await page.locator('body').innerText()).slice(0, 3200)
    throw new Error(`Phase 2: ${context} did not return to calendar. Alerts: ${alerts.join(' | ') || 'none'}. Notices: ${notices.join(' | ') || 'none'}. Rendered text: ${body}`)
  }
}

async function configureCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()

  try {
    await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible', timeout: 5000 })
  } catch {
    const errors = await page.locator('[role="alert"]').allTextContents()
    const body = (await page.locator('body').innerText()).slice(0, 2500)
    throw new Error(`Phase 2: calendar save did not return to Month. Alerts: ${errors.join(' | ') || 'none'}. Rendered text: ${body}`)
  }
}

async function createClasses(page) {
  const setClasses = await settingsAction(page, 'Set courses & sections')
  await setClasses.click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('AP Art History')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 2')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()
}

async function createUnit(page) {
  await (await settingsAction(page, 'Add Units')).click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Ancient Egypt')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()
}

async function addLesson(page, title, date) {
  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill(title)
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill(date)
}

async function goToWeekContainingLessons(page) {
  await page.getByRole('button', { name: 'Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
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

  await (await settingsAction(page, 'Add Lessons')).click()
  await addLesson(page, 'Temple lesson', '2026-09-16')
  await addLesson(page, 'Image comparison', '2026-09-16')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
  await waitForCalendarAfterLessonSave(page, 'saving two same-day Lessons')

  assert(await page.getByText('Temple lesson', { exact: true }).count() > 0, 'Phase 2: Month lost the first saved Lesson.')
  assert(await page.getByText('Image comparison', { exact: true }).count() > 0, 'Phase 2: Month lost the second same-day Lesson.')

  await goToWeekContainingLessons(page)
  assert(await page.getByText('Temple lesson', { exact: true }).count() > 0, 'Phase 2: Week projection disagrees with Month for Temple lesson.')
  assert(await page.getByText('Image comparison', { exact: true }).count() > 0, 'Phase 2: Week projection lost a same-day Lesson.')

  await page.getByRole('button', { name: 'Day', exact: true }).click()
  assert(await page.getByText('Temple lesson', { exact: true }).count() > 0, 'Phase 2: Day projection disagrees with Week for Temple lesson.')
  assert(await page.getByText('Image comparison', { exact: true }).count() > 0, 'Phase 2: Day projection lost a same-day Lesson.')

  await page.reload({ waitUntil: 'networkidle' })
  assert(await page.getByText('Temple lesson', { exact: true }).count() > 0, 'Phase 2: saved Lesson did not survive reload.')
  assert(await page.getByText('Image comparison', { exact: true }).count() > 0, 'Phase 2: second saved Lesson did not survive reload.')
  assert(await page.getByText('Ancient Egypt', { exact: true }).count() > 0, 'Phase 2: Unit placement did not survive reload.')
  assert(await page.getByText('Period 2', { exact: true }).count() > 0, 'Phase 2: Section did not survive reload.')

  await (await settingsAction(page, 'Edit Lessons')).click()
  await page.getByRole('button', { name: /Temple lesson/ }).click()
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-17')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
  await waitForCalendarAfterLessonSave(page, 'moving Temple lesson to September 17')

  await goToWeekContainingLessons(page)
  const movedSlot = page.locator('.planning-day-slot').filter({ hasText: 'Temple lesson' })
  const movedLabel = await movedSlot.getAttribute('aria-label')
  assert(movedLabel?.includes('September 17'), `Phase 2: moved Lesson did not project to September 17 (${movedLabel ?? 'missing slot label'}).`)
  assert(await page.getByText('Image comparison', { exact: true }).count() > 0, 'Phase 2: moving one Lesson disturbed its same-day neighbor.')

  await page.reload({ waitUntil: 'networkidle' })
  await goToWeekContainingLessons(page)
  const reloadedMovedSlot = page.locator('.planning-day-slot').filter({ hasText: 'Temple lesson' })
  const reloadedMovedLabel = await reloadedMovedSlot.getAttribute('aria-label')
  assert(reloadedMovedLabel?.includes('September 17'), 'Phase 2: moved Lesson placement did not survive reload.')

  assert(runtimeErrors.length === 0, `Phase 2 runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('Phase 2 rendered planning truth gate passed: create → same-day placement → Month/Week/Day continuity → reload → move → reload.')
} finally {
  await browser.close()
}
