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
  await page.evaluate(() => {
    const day = [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Day')
    if (!(day instanceof HTMLButtonElement)) throw new Error('Day navigation button not found.')
    day.click()
  })
  await page.getByRole('heading', { name: 'Day' }).waitFor()
  assert(await dayButton.getAttribute('aria-current') === 'page', `${width}px: Day did not become the active calendar view.`)

  const dayBox = await dayButton.boundingBox()
  assert(dayBox, `${width}px: active Day button has no rendered bounds.`)
  assert(dayBox.x >= -0.5 && dayBox.x + dayBox.width <= width + 0.5, `${width}px: Arc did not keep active Day fully visible without Playwright pre-scrolling it.`)

  const weekButton = page.getByRole('button', { name: 'Week', exact: true })
  await weekButton.focus()
  await page.keyboard.press('Tab')
  assert(await dayButton.evaluate((node) => document.activeElement === node), `${width}px: keyboard navigation did not move from Week to Day.`)
  const focus = await dayButton.evaluate((node) => {
    const style = getComputedStyle(node)
    return { outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth || '0') }
  })
  assert(focus.outlineStyle !== 'none' && focus.outlineWidth >= 3, `${width}px: keyboard focus is not visibly strong enough.`)

  const navFontSize = await dayButton.evaluate((node) => parseFloat(getComputedStyle(node).fontSize))
  assert(navFontSize >= 16, `${width}px: primary calendar navigation fell below 16px (${navFontSize}px).`)

  const sectionColumns = await page.locator('.day-continuity-section').first().evaluate((node) => getComputedStyle(node).gridTemplateColumns)
  const expectedStacked = width <= 900
  assert(
    expectedStacked ? !sectionColumns.includes(' ') : sectionColumns.includes(' '),
    `${width}px: Day Section layout did not match the approved ${expectedStacked ? 'stacked' : 'two-column'} responsive mode (${sectionColumns}).`,
  )

  await page.getByRole('button', { name: 'Next Day' }).click()

  assert(await page.getByText('Arc is holding your place', { exact: true }).isVisible(), `${width}px: unfinished carryover is not visibly separated.`)
  assert(await page.getByText('Planned today', { exact: true }).isVisible(), `${width}px: today's conflicting plan is not visibly separated.`)
  assert(await page.getByText(resumeNote, { exact: true }).isVisible(), `${width}px: resume note disappeared.`)
  assert(await page.getByText(lesson17Title, { exact: true }).isVisible(), `${width}px: long carryover Lesson title is not visible.`)
  assert(await page.getByText(lesson18Title, { exact: true }).first().isVisible(), `${width}px: long planned Lesson title is not visible.`)

  const visual = await page.evaluate(() => {
    const firstSection = document.querySelector('.day-continuity-section')
    const held = document.querySelector('.day-continuity-held')
    const heldTitle = held?.querySelector('.day-continuity-lesson-heading strong')
    const plannedAfterHeld = document.querySelector('.day-continuity-held + .day-continuity-planned .day-continuity-lesson-heading strong')
    const normalTitle = document.querySelector('.day-continuity-section:first-child .day-continuity-lesson-heading strong')
    const metadata = document.querySelector('.day-continuity-lesson-meta')
    const resume = document.querySelector('.day-continuity-resume')
    if (!firstSection || !held || !heldTitle || !plannedAfterHeld || !normalTitle || !metadata || !resume) return null
    const sectionStyle = getComputedStyle(firstSection)
    const heldStyle = getComputedStyle(held)
    return {
      sectionPaddingTop: parseFloat(sectionStyle.paddingTop),
      sectionBackground: sectionStyle.backgroundColor,
      sectionRadius: parseFloat(sectionStyle.borderTopLeftRadius),
      heldBorderWidth: parseFloat(heldStyle.borderLeftWidth),
      heldBorderColor: heldStyle.borderLeftColor,
      heldPaddingLeft: parseFloat(heldStyle.paddingLeft),
      heldTitleSize: parseFloat(getComputedStyle(heldTitle).fontSize),
      plannedAfterHeldSize: parseFloat(getComputedStyle(plannedAfterHeld).fontSize),
      normalTitleSize: parseFloat(getComputedStyle(normalTitle).fontSize),
      metadataSize: parseFloat(getComputedStyle(metadata).fontSize),
      resumeSize: parseFloat(getComputedStyle(resume).fontSize),
    }
  })
  assert(visual, `${width}px: Day perceptual-contract elements were not all rendered.`)
  assert(visual.sectionPaddingTop === (width <= 900 ? 16 : 24), `${width}px: Section vertical spacing drifted (${visual.sectionPaddingTop}px).`)
  assert(visual.sectionBackground === 'rgba(0, 0, 0, 0)' && visual.sectionRadius === 0, `${width}px: Section drifted into card styling.`)
  assert(visual.heldBorderWidth === 4 && visual.heldBorderColor === 'rgb(201, 104, 69)', `${width}px: carryover orientation rule drifted from canonical terracotta/4px.`)
  assert(visual.heldPaddingLeft === (width <= 680 ? 12 : 16), `${width}px: carryover inset drifted (${visual.heldPaddingLeft}px).`)
  assert(visual.heldTitleSize === 18 && visual.normalTitleSize === 18 && visual.plannedAfterHeldSize === 16, `${width}px: Day teaching-position title hierarchy drifted.`)
  assert(visual.metadataSize === 14 && visual.resumeSize === 16, `${width}px: Day metadata/body type floor drifted.`)

  const geometry = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    stageWidth: document.querySelector('.arc-calendar-stage')?.scrollWidth ?? 0,
    stageClientWidth: document.querySelector('.arc-calendar-stage')?.clientWidth ?? 0,
  }))
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: page creates horizontal document overflow (${geometry.documentWidth}px > ${geometry.viewportWidth}px).`)
  assert(geometry.stageWidth <= geometry.stageClientWidth + 1, `${width}px: Day stage creates horizontal overflow (${geometry.stageWidth}px > ${geometry.stageClientWidth}px).`)

  if (width <= 520) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const overlapGeometry = await page.evaluate(() => {
      const rail = document.querySelector('.arc-view-rail')?.getBoundingClientRect()
      const sections = document.querySelectorAll('.day-continuity-section')
      const last = sections.length ? sections[sections.length - 1].getBoundingClientRect() : null
      const root = document.documentElement
      return {
        railY: rail?.y ?? null,
        railHeight: rail?.height ?? null,
        lastBottom: last?.bottom ?? null,
        viewportHeight: window.innerHeight,
        documentHeight: root.scrollHeight,
        scrollY: window.scrollY,
        maxScrollY: Math.max(0, root.scrollHeight - window.innerHeight),
      }
    })
    assert(overlapGeometry.railY !== null && overlapGeometry.lastBottom !== null, `${width}px: could not measure final content against the mobile rail.`)
    assert(
      overlapGeometry.lastBottom <= overlapGeometry.railY + 1,
      `${width}px: fixed mobile navigation covers the final Day Section. railY=${overlapGeometry.railY}, railHeight=${overlapGeometry.railHeight}, lastBottom=${overlapGeometry.lastBottom}, viewportHeight=${overlapGeometry.viewportHeight}, documentHeight=${overlapGeometry.documentHeight}, scrollY=${overlapGeometry.scrollY}, maxScrollY=${overlapGeometry.maxScrollY}.`,
    )
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
  console.log('Day interface Chromium audit passed at 1024px desktop, 800px compact, 390px mobile, and 320px minimum reflow.')
} finally {
  await browser.close()
}
