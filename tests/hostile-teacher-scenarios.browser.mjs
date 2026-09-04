import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-hostile-teacher-audit',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-01',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [
    { date: '2026-09-07', kind: 'holiday', label: 'Labor Day', source: 'manual', confidence: 'confirmed' },
  ],
  quarters: [
    { id: 'q1', label: 'Quarter 1', startDate: '2026-09-01', endDate: '2026-10-30' },
    { id: 'q2', label: 'Quarter 2', startDate: '2026-11-02', endDate: '2027-01-15' },
    { id: 'q3', label: 'Quarter 3', startDate: '2027-01-18', endDate: '2027-03-26' },
    { id: 'q4', label: 'Quarter 4', startDate: '2027-03-29', endDate: '2027-05-28' },
  ],
  semesters: [
    { id: 's1', label: 'Semester 1', startDate: '2026-09-01', endDate: '2027-01-15' },
    { id: 's2', label: 'Semester 2', startDate: '2027-01-18', endDate: '2027-05-28' },
  ],
}

const planningInput = {
  calendarId: calendarInput.id,
  courses: [
    { id: 'course-apah', title: 'AP Art History' },
    { id: 'course-2d', title: '2D Art 1' },
  ],
  sections: [
    { id: 'section-p2', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 2' },
    { id: 'section-p5', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 5' },
    { id: 'section-p7', courseId: 'course-apah', calendarId: calendarInput.id, name: 'Period 7' },
    { id: 'section-p1', courseId: 'course-2d', calendarId: calendarInput.id, name: 'Period 1' },
    { id: 'section-p6', courseId: 'course-2d', calendarId: calendarInput.id, name: 'Period 6' },
  ],
}

const unitsInput = {
  calendarId: calendarInput.id,
  units: [
    {
      id: 'unit-meso', calendarId: calendarInput.id, courseId: 'course-apah',
      title: 'Ancient Mesopotamia', placement: { startDate: '2026-09-08', endDate: '2026-09-25' },
    },
    {
      id: 'unit-collage', calendarId: calendarInput.id, courseId: 'course-2d',
      title: 'Collage and Surface', placement: { startDate: '2026-09-21', endDate: '2026-10-02' },
    },
  ],
}

const lessonsInput = {
  calendarId: calendarInput.id,
  lessons: [
    { id: 'lesson-a', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'White Temple Visual Evidence', sequence: 1, plannedDate: '2026-09-16', datePolicy: 'flexible' },
    { id: 'lesson-b', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'Standard of Ur Comparison', sequence: 2, plannedDate: '2026-09-16', datePolicy: 'flexible' },
    { id: 'lesson-c', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'Hammurabi Authority Claims', sequence: 3, plannedDate: '2026-09-17', datePolicy: 'flexible' },
    { id: 'lesson-d', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: 'Post-Holiday Reentry', sequence: 4, plannedDate: '2026-09-08', datePolicy: 'fixed' },
    { id: 'lesson-e', calendarId: calendarInput.id, courseId: 'course-2d', unitId: 'unit-collage', title: 'Collage Surface Lab', sequence: 1, plannedDate: '2026-09-16', datePolicy: 'flexible' },
  ],
  deliveryStates: [
    { lessonId: 'lesson-a', sectionId: 'section-p2', status: 'completed', taughtDate: '2026-09-16', resumeNote: null },
    { lessonId: 'lesson-a', sectionId: 'section-p5', status: 'in-progress', taughtDate: '2026-09-16', resumeNote: 'Stopped after evidence round one.' },
  ],
}

const shiftInput = {
  calendarId: calendarInput.id,
  overrides: [
    { sectionId: 'section-p7', lessonId: 'lesson-c', plannedDate: '2026-09-18' },
  ],
  undo: null,
}

const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-16T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
  'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: shiftInput }),
}

async function activateView(page, view) {
  await page.getByRole('button', { name: view, exact: true }).click()
  await page.getByRole('heading', { name: view, exact: true }).waitFor()
}

async function seedContext(browser, options = {}) {
  const context = await browser.newContext(options)
  await context.addInitScript((entries) => {
    if (sessionStorage.getItem('arc.hostileSeeded') === '1') return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    sessionStorage.setItem('arc.hostileSeeded', '1')
  }, storage)
  return context
}

async function assertCanonicalScenario(page, label) {
  await activateView(page, 'Month')

  const sameDay = page.locator('.planning-month-day').filter({ has: page.locator('time[datetime="2026-09-16"]') })
  assert(await sameDay.getByText('White Temple Visual Evidence', { exact: true }).isVisible(), `${label}: first same-day APAH Lesson disappeared.`)
  assert(await sameDay.getByText('Standard of Ur Comparison', { exact: true }).isVisible(), `${label}: second same-day APAH Lesson disappeared.`)
  assert(await sameDay.getByText('Collage Surface Lab', { exact: true }).isVisible(), `${label}: different-course Lesson disappeared from the shared date.`)

  const originalShiftDate = page.locator('.planning-month-day').filter({ has: page.locator('time[datetime="2026-09-17"]') })
  const shiftedDate = page.locator('.planning-month-day').filter({ has: page.locator('time[datetime="2026-09-18"]') })
  assert(await originalShiftDate.getByText('Hammurabi Authority Claims', { exact: true }).isVisible(), `${label}: shared Lesson placement vanished when one Section fell behind.`)
  assert(await originalShiftDate.getByText('Period 2 · Period 5', { exact: false }).isVisible(), `${label}: unaffected Sections did not remain on the shared date.`)
  assert(await shiftedDate.getByText('Hammurabi Authority Claims', { exact: true }).isVisible(), `${label}: behind Section did not project to its effective date.`)
  assert(await shiftedDate.getByText('Shifted: Period 7', { exact: true }).isVisible(), `${label}: behind Section was not explicitly identified.`)

  await activateView(page, 'Quarter')
  const quarter = page.locator('.planning-long-range')
  assert(await quarter.locator('[data-unit-id="unit-meso"]').isVisible(), `${label}: multi-week APAH Unit disappeared from Quarter.`)
  assert(await quarter.locator('[data-unit-id="unit-collage"]').isVisible(), `${label}: multi-week 2D Unit disappeared from Quarter.`)
  assert(await quarter.locator('[data-date="2026-09-16"] [data-lesson-id="lesson-a"]').count() === 1, `${label}: Quarter lost canonical identity for first same-day Lesson.`)
  assert(await quarter.locator('[data-date="2026-09-16"] [data-lesson-id="lesson-b"]').count() === 1, `${label}: Quarter lost canonical identity for second same-day Lesson.`)
  assert(await quarter.locator('[data-date="2026-09-16"] [data-lesson-id="lesson-e"]').count() === 1, `${label}: Quarter lost different-course Lesson on shared date.`)
  assert(await quarter.locator('[data-date="2026-09-17"] [data-lesson-id="lesson-c"]').count() === 1, `${label}: Quarter lost unaffected Sections on original date.`)
  assert(await quarter.locator('[data-date="2026-09-18"] [data-lesson-id="lesson-c"]').count() === 1, `${label}: Quarter lost shifted Section effective date.`)
  assert(await quarter.locator('[data-date="2026-09-18"] [data-lesson-id="lesson-c"]').getByText('Shifted: Period 7', { exact: true }).isVisible(), `${label}: Quarter did not disclose the shifted Section.`)
  assert(await quarter.locator('[data-date="2026-09-07"] [data-lesson-id]').count() === 0, `${label}: a Lesson projected onto the configured no-school holiday.`)

  const keyboardLesson = quarter.locator('[data-date="2026-09-16"] [data-lesson-id="lesson-a"]')
  await keyboardLesson.focus()
  await page.keyboard.press('Enter')
  const focus = page.locator('.object-focus-layer')
  await focus.waitFor()
  assert(await focus.getByText('Unit Focus', { exact: true }).isVisible(), `${label}: keyboard activation did not preserve Unit Focus routing.`)
  assert(await focus.getByText('White Temple Visual Evidence', { exact: true }).first().isVisible(), `${label}: keyboard activation lost selected Lesson context.`)
  await focus.getByRole('button', { name: 'Close', exact: true }).click()

  await activateView(page, 'Year Map')
  const year = page.locator('.planning-long-range')
  assert(await year.locator('[data-unit-id="unit-meso"]').count() === 1, `${label}: Year duplicated or lost APAH Unit identity.`)
  assert(await year.locator('[data-unit-id="unit-collage"]').count() === 1, `${label}: Year duplicated or lost 2D Unit identity.`)
  assert(await year.locator('[data-date="2026-09-16"] [data-lesson-id="lesson-a"]').count() === 1, `${label}: Year lost first same-day Lesson.`)
  assert(await year.locator('[data-date="2026-09-16"] [data-lesson-id="lesson-b"]').count() === 1, `${label}: Year lost second same-day Lesson.`)
  assert(await year.locator('[data-date="2026-09-18"] [data-lesson-id="lesson-c"]').count() === 1, `${label}: Year lost shifted Section placement.`)

  const geometry = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
  }))
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${label}: long-range planning leaked into document-level horizontal overflow.`)
}

const browser = await chromium.launch({ headless: true })
try {
  const desktop = await seedContext(browser, { viewport: { width: 1024, height: 900 } })
  const desktopPage = await desktop.newPage()
  await desktopPage.goto(baseUrl, { waitUntil: 'networkidle' })
  await assertCanonicalScenario(desktopPage, 'desktop')

  const beforeReload = await desktopPage.evaluate(() => ({
    lessons: localStorage.getItem('arc.lessons.v1'),
    shift: localStorage.getItem('arc.shift.v1'),
  }))
  await desktopPage.reload({ waitUntil: 'networkidle' })
  const afterReload = await desktopPage.evaluate(() => ({
    lessons: localStorage.getItem('arc.lessons.v1'),
    shift: localStorage.getItem('arc.shift.v1'),
  }))
  assert(JSON.stringify(afterReload) === JSON.stringify(beforeReload), 'reload: canonical Lesson/Section shift persistence changed without user action.')
  await assertCanonicalScenario(desktopPage, 'reload')
  await desktop.close()

  const touch = await seedContext(browser, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const touchPage = await touch.newPage()
  await touchPage.goto(baseUrl, { waitUntil: 'networkidle' })
  await assertCanonicalScenario(touchPage, '390px touch')
  const touchTargets = await touchPage.locator('.planning-object-openable').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height))
  assert(touchTargets.length > 0 && touchTargets.every((height) => height >= 44), `390px touch: an object activation target fell below the 44px floor (${Math.min(...touchTargets)}px).`)
  await touch.close()

  console.log('Hostile teacher scenario audit passed: multiple same-day Lessons, multi-course truth, one Section behind, no-school protection, multi-week Units, Quarter/Year identity, keyboard routing, reload persistence, 390px touch containment.')
} finally {
  await browser.close()
}
