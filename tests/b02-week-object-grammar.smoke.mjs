import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = 'artifacts/b02-week-object-grammar'

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

async function selectCalendarView(page, view) {
  await page.getByRole('button', { name: /Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name: 'Calendar views' }).getByRole('button', { name: view, exact: true }).click()
}

async function configureCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
}

async function createPlanningTruth(page) {
  await headerAction(page, 'Set classes').click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('AP Art History')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 2')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).last().fill('Period 5')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()

  await headerAction(page, 'Add Units').click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Ancient Egypt')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

  await headerAction(page, 'Add Lessons').click()
  for (const title of ['Temple lesson', 'Image comparison']) {
    await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
    await page.getByRole('textbox', { name: 'Lesson title', exact: true }).last().fill(title)
    await page.getByRole('textbox', { name: 'Planned date', exact: true }).last().fill('2026-09-16')
  }
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
}

async function seedCanonicalNotes(page) {
  await page.evaluate(() => {
    const key = 'arc.planningWorkspace.v1'
    const raw = localStorage.getItem(key)
    if (!raw) throw new Error('B02 seed: planning workspace persistence is missing.')
    const stored = JSON.parse(raw)
    stored.input.notes = [
      {
        id: 'note-freeform',
        calendarId: stored.input.calendarId,
        date: '2026-09-16',
        text: 'Bring image set\nCompare scale + material',
        placement: 'calendar',
        important: false,
      },
      {
        id: 'note-after-school',
        calendarId: stored.input.calendarId,
        date: '2026-09-17',
        text: 'Museum club pickup',
        placement: 'after-school',
        important: true,
        sourceLabel: 'District activities calendar',
        sourceLocator: 'district://activities/2026-09-17',
      },
    ]
    localStorage.setItem(key, JSON.stringify(stored))
  })
  await page.reload({ waitUntil: 'networkidle' })
}

async function goToTargetWeek(page) {
  await selectCalendarView(page, 'Week')
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
}

async function assertB02Grammar(page) {
  assert(await page.getByRole('heading', { level: 1, name: 'Week', exact: true }).count() === 1, 'B02: Week must retain exactly one H1.')
  assert(await page.getByRole('heading', { level: 2, name: 'AP Art History', exact: true }).count() === 1, 'B02: Course must own the teaching hierarchy once.')

  const p2Row = page.locator('.planning-section-row').filter({ hasText: 'Period 2' })
  const p5Row = page.locator('.planning-section-row').filter({ hasText: 'Period 5' })
  assert(await p2Row.count() === 1 && await p5Row.count() === 1, 'B02: at least two distinct Section rows must remain visible under one Course.')

  const unit = page.locator('.planning-unit-span').filter({ hasText: 'Ancient Egypt' })
  assert(await unit.count() === 1, 'B02: Unit must render once as a continuous Course span, not once per day/Section.')
  const unitBox = await unit.boundingBox()
  assert(unitBox && unitBox.width > 300, `B02: Unit span must visibly cross multiple day columns (width ${unitBox?.width ?? 0}).`)

  const p2LessonSlot = p2Row.locator('.planning-day-slot').filter({ hasText: 'Temple lesson' })
  const p5LessonSlot = p5Row.locator('.planning-day-slot').filter({ hasText: 'Temple lesson' })
  assert(await p2LessonSlot.count() === 1 && await p5LessonSlot.count() === 1, 'B02: shared Course Lessons must project into both Section rows without duplicating canonical Lesson identity.')
  assert(await p2LessonSlot.getByText('Image comparison', { exact: true }).count() === 1, 'B02: multiple same-day Lessons must coexist in the same canonical Section/day slot.')
  assert(await p2LessonSlot.getByText('Ancient Egypt', { exact: true }).count() === 2, 'B02: each same-day Lesson must retain its explicit parent Unit cue.')

  const notesLane = page.getByRole('region', { name: 'Notes', exact: true })
  assert(await notesLane.count() === 1, 'B02: calendar Notes must own one independent Notes lane.')
  assert(await notesLane.getByText('Bring image set\nCompare scale + material', { exact: true }).count() === 1, 'B02: freeform Note text and line breaks must survive into Week.')

  const afterSchool = page.getByRole('region', { name: 'After School', exact: true })
  assert(await afterSchool.count() === 1, 'B02: After School must render as a subordinate non-plan lane.')
  assert(await afterSchool.getByText('Museum club pickup', { exact: true }).count() === 1, 'B02: After School content must stay out of Lesson hierarchy.')
  assert(await afterSchool.getByText('Source: District activities calendar', { exact: true }).count() === 1, 'B02: source-backed Note provenance must be visible without changing ownership.')

  const important = afterSchool.getByLabel('Important', { exact: true })
  assert(await important.count() >= 1, 'B02: Important must expose explicit accessible semantics, not color alone.')
  const importantNote = afterSchool.locator('.planning-note--important')
  assert(await importantNote.count() === 1, 'B02: Important must belong to the Note itself rather than a separate status object.')
  const circle = await importantNote.evaluate((element) => {
    const style = getComputedStyle(element, '::after')
    return { borderStyle: style.borderTopStyle, borderWidth: Number.parseFloat(style.borderTopWidth), content: style.content }
  })
  assert(circle.borderStyle === 'solid' && circle.borderWidth >= 2 && circle.content !== 'none', 'B02: Important must use the canonical visible red-circle treatment around the paper object.')

  const noteTextSize = Number.parseFloat(await notesLane.locator('.planning-note-text').first().evaluate((element) => getComputedStyle(element).fontSize))
  const noteSourceSize = Number.parseFloat(await afterSchool.locator('.planning-note-source').evaluate((element) => getComputedStyle(element).fontSize))
  const lessonParentSize = Number.parseFloat(await p2LessonSlot.locator('.planning-lesson-parent').first().evaluate((element) => getComputedStyle(element).fontSize))
  assert(noteTextSize >= 16, `B02: Note body text must meet the canonical 16px body floor (got ${noteTextSize}px).`)
  assert(noteSourceSize >= 14 && lessonParentSize >= 14, `B02: secondary metadata must meet the canonical 14px floor (source ${noteSourceSize}px, Unit cue ${lessonParentSize}px).`)

  const notesBox = await notesLane.boundingBox()
  const courseBox = await page.locator('.planning-course').first().boundingBox()
  const afterBox = await afterSchool.boundingBox()
  assert(notesBox && courseBox && afterBox && notesBox.y < courseBox.y && courseBox.y < afterBox.y, 'B02: Notes → teaching plan → After School spatial ownership order must remain explicit.')

  const viewport = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
  assert(viewport.scrollWidth <= viewport.width + 1, `B02: shell must not create page-level horizontal overflow (${viewport.scrollWidth} > ${viewport.width}).`)
}

await fs.mkdir(outDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await configureCalendar(page)
  await createPlanningTruth(page)
  await seedCanonicalNotes(page)
  await goToTargetWeek(page)
  await assertB02Grammar(page)
  await page.screenshot({ path: `${outDir}/week-1440.png`, fullPage: true })

  await page.setViewportSize({ width: 1280, height: 720 })
  await assertB02Grammar(page)
  await page.screenshot({ path: `${outDir}/week-1280x720.png`, fullPage: true })

  assert(runtimeErrors.length === 0, `B02 runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('B02 rendered Week object grammar gate passed at 1440 and 1280x720.')
} finally {
  await browser.close()
}
