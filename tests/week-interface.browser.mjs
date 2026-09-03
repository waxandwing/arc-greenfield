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

  const weekButton = page.getByRole('button', { name: 'Week', exact: true })
  await page.evaluate(() => {
    const week = [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Week')
    if (!(week instanceof HTMLButtonElement)) throw new Error('Week navigation button not found.')
    week.click()
  })
  await page.getByRole('heading', { name: 'Week' }).waitFor()
  assert(await weekButton.getAttribute('aria-current') === 'page', `${width}px: Week did not become the active calendar view.`)

  const weekBox = await weekButton.boundingBox()
  assert(weekBox, `${width}px: active Week button has no rendered bounds.`)
  assert(weekBox.x >= -0.5 && weekBox.x + weekBox.width <= width + 0.5, `${width}px: Arc did not keep active Week fully visible.`)

  const mondayP5 = page.locator('[aria-label="Period 5, Monday, September 14, 2026"]')
  const tuesdayP5 = page.locator('[aria-label="Period 5, Tuesday, September 15, 2026"]')
  const tuesdayP2 = page.locator('[aria-label="Period 2, Tuesday, September 15, 2026"]')
  const tuesdayP7 = page.locator('[aria-label="Period 7, Tuesday, September 15, 2026"]')

  assert(await mondayP5.count() === 1 && await tuesdayP5.count() === 1, `${width}px: Week class/day cells were not rendered with stable date labels.`)
  assert(await mondayP5.locator('.planning-lesson--carryover').count() === 0, `${width}px: scheduled Monday Lesson was duplicated as carryover.`)
  assert(await mondayP5.getByText(lesson17Title, { exact: true }).isVisible(), `${width}px: Monday scheduled Lesson disappeared.`)

  assert(await tuesdayP5.locator('.planning-lesson--carryover').count() === 1, `${width}px: Tuesday did not hold unfinished Period 5 teaching.`)
  assert(await tuesdayP5.getByText('Continue', { exact: true }).isVisible(), `${width}px: Week carryover is not explicitly labeled Continue.`)
  assert(await tuesdayP5.getByText(lesson17Title, { exact: true }).isVisible(), `${width}px: unfinished Lesson title disappeared from Tuesday.`)
  assert(await tuesdayP5.getByText(resumeNote, { exact: true }).isVisible(), `${width}px: resume note disappeared from Week carryover.`)
  assert(await tuesdayP5.getByText(lesson18Title, { exact: true }).isVisible(), `${width}px: Tuesday planned Lesson disappeared when carryover was added.`)
  assert(await tuesdayP5.getByText('Fixed', { exact: true }).isVisible(), `${width}px: fixed-date signal disappeared from Tuesday plan.`)

  assert(await tuesdayP2.locator('.planning-lesson--carryover').count() === 0, `${width}px: completed Period 2 work was falsely carried forward.`)
  assert(await tuesdayP7.locator('.planning-lesson--carryover').count() === 0, `${width}px: skipped Period 7 work was falsely carried forward.`)
  assert(await page.locator('.planning-lesson--carryover').count() === 4, `${width}px: Week should hold unfinished Period 5 work on Tue–Fri only.`)

  const visual = await tuesdayP5.locator('.planning-lesson--carryover').evaluate((node) => {
    const style = getComputedStyle(node)
    const label = node.querySelector('.planning-continuity-label')
    const title = node.querySelector('.planning-lesson-title')
    const resume = node.querySelector('.planning-resume-note')
    return {
      borderWidth: parseFloat(style.borderLeftWidth),
      borderColor: style.borderLeftColor,
      labelSize: label ? parseFloat(getComputedStyle(label).fontSize) : 0,
      titleSize: title ? parseFloat(getComputedStyle(title).fontSize) : 0,
      resumeSize: resume ? parseFloat(getComputedStyle(resume).fontSize) : 0,
    }
  })
  assert(visual.borderWidth === 4 && visual.borderColor === 'rgb(201, 104, 69)', `${width}px: Week carryover orientation drifted from canonical terracotta/4px.`)
  assert(visual.labelSize === 14 && visual.titleSize === 16 && visual.resumeSize === 16, `${width}px: Week continuity type hierarchy drifted.`)

  const geometry = await page.evaluate(() => {
    const frame = document.querySelector('.planning-scroll-frame')
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      frameClientWidth: frame?.clientWidth ?? 0,
      frameScrollWidth: frame?.scrollWidth ?? 0,
    }
  })
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: Week creates horizontal document overflow (${geometry.documentWidth}px > ${geometry.viewportWidth}px).`)
  if (width <= 900) {
    assert(geometry.frameScrollWidth > geometry.frameClientWidth, `${width}px: compact Week should contain horizontal overflow inside its planning frame.`)
  }

  if (width <= 520) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const overlap = await page.evaluate(() => {
      const rail = document.querySelector('.arc-view-rail')?.getBoundingClientRect()
      const rows = document.querySelectorAll('.planning-section-row')
      const last = rows.length ? rows[rows.length - 1].getBoundingClientRect() : null
      return { railY: rail?.y ?? null, lastBottom: last?.bottom ?? null }
    })
    assert(overlap.railY !== null && overlap.lastBottom !== null, `${width}px: could not measure Week content against mobile navigation.`)
    assert(overlap.lastBottom <= overlap.railY + 1, `${width}px: fixed mobile navigation covers the final Week row.`)
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
  console.log('Week continuity Chromium audit passed at 1024px desktop, 800px compact, 390px mobile, and 320px minimum reflow.')
} finally {
  await browser.close()
}
