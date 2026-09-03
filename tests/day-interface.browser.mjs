import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const calendarInput = {
  id: 'calendar-browser-audit',
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
const lesson17Title = 'Ziggurat of Ur: Monumentality, Ritual, and Civic Power'
const lesson18Title = 'Standard of Ur: War, Peace, Register, and Royal Authority'
const resumeNote = 'Stopped after the reconstruction demo; students still need the visual-evidence comparison before moving on.'

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
      id: 'lesson-17', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso',
      title: lesson17Title, sequence: 17, plannedDate: '2026-09-14', datePolicy: 'flexible',
    },
    {
      id: 'lesson-18', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso',
      title: lesson18Title, sequence: 18, plannedDate: '2026-09-15', datePolicy: 'fixed',
    },
  ],
  deliveryStates: [
    { lessonId: 'lesson-17', sectionId: 'section-p2', status: 'completed', taughtDate: '2026-09-14', resumeNote: null },
    { lessonId: 'lesson-17', sectionId: 'section-p5', status: 'in-progress', taughtDate: '2026-09-14', resumeNote },
    { lessonId: 'lesson-17', sectionId: 'section-p7', status: 'skipped', taughtDate: null, resumeNote: null },
  ],
}

const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-14T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
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

  const dayButton = page.getByRole('button', { name: 'Day', exact: true })
  await dayButton.click()
  await page.getByRole('heading', { name: 'Day' }).waitFor()
  assert(await dayButton.getAttribute('aria-current') === 'page', `${width}px: Day did not become the active calendar view.`)

  const dayBox = await dayButton.boundingBox()
  assert(dayBox, `${width}px: active Day button has no rendered bounds.`)
  assert(dayBox.x >= -0.5 && dayBox.x + dayBox.width <= width + 0.5, `${width}px: active Day button is not fully visible in the mobile horizon rail.`)

  // Pointer selection should stay visually quiet; keyboard travel away and back must reveal focus.
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  assert(await dayButton.evaluate((node) => document.activeElement === node), `${width}px: keyboard navigation did not return focus to active Day.`)
  const focus = await dayButton.evaluate((node) => {
    const style = getComputedStyle(node)
    return { outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth || '0') }
  })
  assert(focus.outlineStyle !== 'none' && focus.outlineWidth >= 3, `${width}px: keyboard focus is not visibly strong enough.`)

  const mobileNavFontSize = await dayButton.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))
  assert(mobileNavFontSize >= 16, `${width}px: primary calendar navigation fell below 16px (${mobileNavFontSize}px).`)

  await page.getByRole('button', { name: 'Next Day' }).click()

  assert(await page.getByText('Arc is holding your place', { exact: true }).isVisible(), `${width}px: unfinished carryover is not visibly separated.`)
  assert(await page.getByText('Planned today', { exact: true }).isVisible(), `${width}px: today's conflicting plan is not visibly separated.`)
  assert(await page.getByText(resumeNote, { exact: true }).isVisible(), `${width}px: resume note disappeared.`)
  assert(await page.getByText(lesson17Title, { exact: true }).isVisible(), `${width}px: long carryover Lesson title is not visible.`)
  assert(await page.getByText(lesson18Title, { exact: true }).first().isVisible(), `${width}px: long planned Lesson title is not visible.`)

  const geometry = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    stageWidth: document.querySelector('.arc-calendar-stage')?.scrollWidth ?? 0,
    stageClientWidth: document.querySelector('.arc-calendar-stage')?.clientWidth ?? 0,
  }))
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: page creates horizontal document overflow (${geometry.documentWidth}px > ${geometry.viewportWidth}px).`)
  assert(geometry.stageWidth <= geometry.stageClientWidth + 1, `${width}px: Day stage creates horizontal overflow (${geometry.stageWidth}px > ${geometry.stageClientWidth}px).`)

  const canvas = page.locator('.calendar-canvas')
  await canvas.evaluate((node) => { node.scrollTop = node.scrollHeight })
  const railBox = await page.locator('.arc-view-rail').boundingBox()
  const lastBox = await page.locator('.day-continuity-section').last().boundingBox()
  assert(railBox && lastBox, `${width}px: could not measure final content against the mobile rail.`)
  assert(lastBox.bottom <= railBox.y + 1, `${width}px: fixed mobile navigation covers the final Day Section when scrolled to the bottom.`)

  assert(runtimeErrors.length === 0, `${width}px: runtime errors detected: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditViewport(browser, 390, 844)
  await auditViewport(browser, 320, 800)
  console.log('Day interface Chromium audit passed at 390px and 320px-equivalent reflow.')
} finally {
  await browser.close()
}
