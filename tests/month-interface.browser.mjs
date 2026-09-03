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
const lesson19Title = 'Stele of Hammurabi: Law, Authority, Hierarchy, and Divine Legitimacy'

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
    { id: 'lesson-17', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: lesson17Title, sequence: 17, plannedDate: '2026-09-14', datePolicy: 'flexible' },
    { id: 'lesson-18', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: lesson18Title, sequence: 18, plannedDate: '2026-09-15', datePolicy: 'fixed' },
    { id: 'lesson-19', calendarId: calendarInput.id, courseId: 'course-apah', unitId: 'unit-meso', title: lesson19Title, sequence: 19, plannedDate: '2026-09-16', datePolicy: 'flexible' },
  ],
  deliveryStates: [
    { lessonId: 'lesson-17', sectionId: 'section-p2', status: 'completed', taughtDate: '2026-09-14', resumeNote: null },
    { lessonId: 'lesson-17', sectionId: 'section-p5', status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Stopped after the demo.' },
    { lessonId: 'lesson-17', sectionId: 'section-p7', status: 'skipped', taughtDate: null, resumeNote: null },
  ],
}

const shiftInput = {
  calendarId: calendarInput.id,
  overrides: [{ sectionId: 'section-p7', lessonId: 'lesson-19', plannedDate: '2026-09-17' }],
  undo: null,
}

const storage = {
  'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-14T12:00:00.000Z', input: calendarInput }),
  'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: planningInput }),
  'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: unitsInput }),
  'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: lessonsInput }),
  'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: shiftInput }),
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

  const month = page.locator('.planning-month')
  assert(await month.count() === 1, `${width}px: Month planning surface did not render.`)

  const monday = page.locator('time[datetime="2026-09-14"]').locator('..').locator('..')
  const tuesday = page.locator('time[datetime="2026-09-15"]').locator('..').locator('..')
  const wednesday = page.locator('time[datetime="2026-09-16"]').locator('..').locator('..')
  const thursday = page.locator('time[datetime="2026-09-17"]').locator('..').locator('..')

  assert(await monday.getByText(lesson17Title, { exact: true }).isVisible(), `${width}px: mixed-status Lesson disappeared from its scheduled date.`)
  assert(await monday.getByText('1 in progress · 1 completed · 1 skipped', { exact: true }).isVisible(), `${width}px: mixed Section state summary is not legible at Month scale.`)

  assert(await tuesday.getByText(lesson18Title, { exact: true }).isVisible(), `${width}px: fixed Lesson disappeared from Month.`)
  assert(await tuesday.getByText('Fixed', { exact: true }).isVisible(), `${width}px: fixed-date treatment disappeared from Month.`)

  assert(await wednesday.getByText(lesson19Title, { exact: true }).isVisible(), `${width}px: shared Lesson placement disappeared after a Section shift.`)
  assert(await wednesday.getByText('Period 2 · Period 5', { exact: false }).isVisible(), `${width}px: shared Sections are not visible on the original Lesson date.`)
  assert(await thursday.getByText(lesson19Title, { exact: true }).isVisible(), `${width}px: shifted Section Lesson did not move to its effective date.`)
  assert(await thursday.getByText('Shifted: Period 7', { exact: true }).isVisible(), `${width}px: shifted Section is not explicitly identified.`)

  const signal = monday.locator('.planning-month-signal').first()
  const signalVisual = await signal.evaluate((node) => {
    const style = getComputedStyle(node)
    const title = node.querySelector('.planning-month-signal-title')
    const context = node.querySelector('.planning-month-signal-context')
    const status = node.querySelector('.planning-month-status-summary')
    return {
      background: style.backgroundColor,
      radius: parseFloat(style.borderTopLeftRadius),
      borderLeftWidth: parseFloat(style.borderLeftWidth),
      borderLeftColor: style.borderLeftColor,
      titleSize: title ? parseFloat(getComputedStyle(title).fontSize) : 0,
      contextSize: context ? parseFloat(getComputedStyle(context).fontSize) : 0,
      statusSize: status ? parseFloat(getComputedStyle(status).fontSize) : 0,
    }
  })
  assert(signalVisual.background === 'rgba(0, 0, 0, 0)' && signalVisual.radius === 0, `${width}px: Month Lesson signal drifted back into card styling.`)
  assert(signalVisual.borderLeftWidth === 3 && signalVisual.borderLeftColor === 'rgb(124, 156, 173)', `${width}px: standard Month Lesson orientation rule drifted.`)
  assert(signalVisual.titleSize === 16 && signalVisual.contextSize === 14 && signalVisual.statusSize === 14, `${width}px: Month Lesson type hierarchy drifted.`)

  const fixedVisual = await tuesday.locator('.planning-month-signal--fixed').first().evaluate((node) => {
    const style = getComputedStyle(node)
    return { borderLeftColor: style.borderLeftColor, borderLeftWidth: parseFloat(style.borderLeftWidth) }
  })
  assert(fixedVisual.borderLeftWidth === 3 && fixedVisual.borderLeftColor === 'rgb(201, 104, 69)', `${width}px: fixed Month Lesson lost canonical terracotta orientation.`)

  const unitBand = page.locator('.planning-month-unit-band').first()
  assert(await unitBand.getByText(unitTitle, { exact: true }).isVisible(), `${width}px: Unit pacing band disappeared.`)
  const unitVisual = await unitBand.evaluate((node) => ({
    titleSize: parseFloat(getComputedStyle(node.querySelector('.planning-month-unit-title')).fontSize),
    courseSize: parseFloat(getComputedStyle(node.querySelector('.planning-month-unit-course')).fontSize),
    borderLeftWidth: parseFloat(getComputedStyle(node).borderLeftWidth),
  }))
  assert(unitVisual.titleSize === 16 && unitVisual.courseSize === 14 && unitVisual.borderLeftWidth === 4, `${width}px: Month Unit pacing hierarchy drifted.`)

  const geometry = await page.evaluate(() => {
    const frame = document.querySelector('.planning-scroll-frame')
    return {
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      frameClientWidth: frame?.clientWidth ?? 0,
      frameScrollWidth: frame?.scrollWidth ?? 0,
    }
  })
  assert(geometry.documentWidth <= geometry.viewportWidth + 1, `${width}px: Month creates horizontal document overflow (${geometry.documentWidth}px > ${geometry.viewportWidth}px).`)
  if (width <= 900) {
    assert(geometry.frameScrollWidth > geometry.frameClientWidth, `${width}px: compact Month should contain its wide calendar inside the planning scroll frame.`)
  }

  if (width <= 520) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const overlap = await page.evaluate(() => {
      const rail = document.querySelector('.arc-view-rail')?.getBoundingClientRect()
      const month = document.querySelector('.planning-month')?.getBoundingClientRect()
      return { railY: rail?.y ?? null, monthBottom: month?.bottom ?? null }
    })
    assert(overlap.railY !== null && overlap.monthBottom !== null, `${width}px: could not measure Month against mobile navigation.`)
    assert(overlap.monthBottom <= overlap.railY + 1, `${width}px: fixed mobile navigation covers Month content at maximum document scroll.`)
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
  console.log('Month interface Chromium audit passed at 1024px desktop, 800px compact, 390px mobile, and 320px minimum reflow.')
} finally {
  await browser.close()
}
