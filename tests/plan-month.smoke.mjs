import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView, retreatToTeachingDayViaDayTab } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/plan-month/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function fixture() {
  const calendarId = 'arc-plan-gauntlet-2026'
  const courses = [
    { id: 'course-apah', title: 'AP Art History' },
    { id: 'course-2d', title: '2D Art 1' },
    { id: 'course-3d', title: '3D Art 1' },
  ]
  const sections = [
    ['section-p1', 'course-apah', 'Period 1'], ['section-p2', 'course-2d', 'Period 2'], ['section-p3', 'course-3d', 'Period 3'],
    ['section-p4', 'course-apah', 'Period 4'], ['section-p6', 'course-2d', 'Period 6'], ['section-p7', 'course-3d', 'Period 7'],
  ].map(([id, courseId, name]) => ({ id, courseId, calendarId, name }))
  const unitSpecs = {
    'course-apah': ['Looking & Meaning', 'Power & Place', 'Ritual & Memory'],
    'course-2d': ['Line as Language', 'Value & Form', 'Color Systems'],
    'course-3d': ['Mass & Balance', 'Joinery & Structure', 'Site & Scale'],
  }
  const spans = [['2026-09-01', '2026-09-11'], ['2026-09-14', '2026-09-25'], ['2026-09-28', '2026-10-09']]
  const units = []
  for (const course of courses) unitSpecs[course.id].forEach((title, index) => units.push({ id: `unit-${course.id.slice(7)}-${index + 1}`, calendarId, courseId: course.id, title, placement: { startDate: spans[index][0], endDate: spans[index][1] } }))
  const dates = [
    ['2026-09-02', '2026-09-03', '2026-09-04', '2026-09-08'],
    ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-18'],
    ['2026-09-28', '2026-09-29', '2026-10-01', '2026-10-06'],
  ]
  const titles = {
    'course-apah': ['Reading an image', 'Formal analysis relay', 'Context evidence', 'Comparative claim', 'Temple threshold', 'Power in public space', 'Patron and audience', 'Fixed visual analysis assessment', 'Ritual sequence', 'Memory and monument', 'Comparison studio', 'Unit synthesis'],
    'course-2d': ['Blind contour', 'Line quality lab', 'Gesture sequence', 'Critique language', 'Value scale', 'Multi-day still life', 'Edge hierarchy', 'Value checkpoint', 'Color mixing map', 'Limited palette study', 'Color critique', 'Portfolio reflection'],
    'course-3d': ['Balance tests', 'Mass and void', 'Armature lab', 'Material behavior', 'Joinery sampler', 'Load and span', 'Structure critique', 'Prototype checkpoint', 'Site reading', 'Scale intervention', 'Installation plan', 'Gallery walk'],
  }
  const lessons = []
  for (const course of courses) {
    let sequence = 0
    for (let unitIndex = 0; unitIndex < 3; unitIndex += 1) {
      for (let lessonIndex = 0; lessonIndex < 4; lessonIndex += 1) {
        sequence += 1
        lessons.push({
          id: `${course.id.replace('course-', 'lesson-')}-${sequence}`,
          calendarId, courseId: course.id, unitId: `unit-${course.id.slice(7)}-${unitIndex + 1}`,
          title: titles[course.id][sequence - 1], sequence, plannedDate: dates[unitIndex][lessonIndex],
          datePolicy: course.id === 'course-apah' && sequence === 8 ? 'fixed' : 'flexible',
          directions: [`Open with ${titles[course.id][sequence - 1].toLowerCase()}.`],
          materials: ['Sketchbook'], phases: ['Look', 'Make'], resources: [],
        })
      }
    }
  }
  const planning = { calendarId, courses, sections, notes: [] }
  const deliveryStates = [{ lessonId: 'lesson-apah-5', sectionId: 'section-p4', status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Stopped after the threshold comparison. Resume with patron evidence.' }]
  const overrides = [
    { sectionId: 'section-p6', lessonId: 'lesson-2d-5', plannedDate: '2026-09-15' },
    { sectionId: 'section-p6', lessonId: 'lesson-2d-6', plannedDate: '2026-09-14' },
  ]
  const calendarInput = {
    id: calendarId, schoolYearLabel: '2026–27', firstDay: '2026-09-01', lastDay: '2027-05-28', instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed',
    exceptions: [], quarters: [], semesters: [], provenance: [],
  }
  return { calendarId, calendarInput, planning, units, lessons, deliveryStates, overrides }
}

function storageEntries(data, context) {
  return {
    'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-15T12:00:00.000Z', input: data.calendarInput }),
    'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: data.planning }),
    'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, units: data.units } }),
    'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, lessons: data.lessons, deliveryStates: data.deliveryStates } }),
    'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, overrides: data.overrides, undo: null } }),
    'arc.captures.v1': JSON.stringify({ schemaVersion: 1, workspace: { calendarId: data.calendarId, captures: [{ id: 'capture-seed-1', calendarId: data.calendarId, text: 'Museum label mini-lesson', createdAt: '2026-09-01T12:00:00.000Z' }] } }),
    'arc.planning-context.v1': JSON.stringify(context),
    'arc.view-preferences.v1': JSON.stringify({ home: { mode: 'fixed', view: 'Month' }, lastUsedView: 'Month', showWeekends: false }),
  }
}

function liveState() {
  return {
    version: 2,
    session: {
      date: '2026-09-15', courseId: 'course-2d', courseTitle: '2D Art 1',
      sectionId: 'section-p6', sectionName: 'Period 6', lessonId: 'lesson-2d-5',
      lessonTitle: 'Value scale', unitId: 'unit-2d-2', unitTitle: 'Value & Form',
      source: 'scheduled', datePolicy: 'flexible', sharedPlannedDate: '2026-09-14',
      effectiveDate: '2026-09-15', isSectionOverride: true, deliveryStatus: 'not-started',
      taughtDate: null, resumeNote: null,
      directions: ['Open with value scale.'], materials: ['Sketchbook'], phases: ['Look', 'Make'], resources: [],
    },
    startedAt: '2026-09-15T14:00:00.000Z',
    phase: 1, phaseCount: 2, directions: ['Open with value scale.'], materials: 'Sketchbook',
    voiceLevel: 2, boardLocked: true,
    timer: { status: 'paused', durationSeconds: 600, remainingSeconds: 540, runStartedAt: null },
    cleanupTimer: { status: 'idle', durationSeconds: 300, remainingSeconds: 300, runStartedAt: null },
    people: { sectionId: 'section-p6', roster: [{ id: 'maya', name: 'Maya Chen' }], selectedId: null, projected: false, mode: 'random' },
    passes: { sectionId: 'section-p6', passes: [{ id: 'hall-pass', label: 'Hall', status: 'inactive', personId: null }] },
    media: { sectionId: 'section-p6', items: [], activeId: null, projected: false },
  }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

async function withPage(browser, seed, run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  await page.addInitScript((entries) => {
    if (localStorage.getItem('arc.calendar.v1') !== null) return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, seed)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await run(page, runtimeErrors)
  await context.close()
}

const dayContext = { schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Day', anchorDate: '2026-09-15', focus: 'day' }

const browser = await chromium.launch({ headless: true })
try {
  const data = fixture()
  const live = liveState()
  const liveSeed = {
    ...storageEntries(data, dayContext),
    'arc.arctable.live.v1': JSON.stringify(live),
  }

  await withPage(browser, storageEntries(data, dayContext), async (page, runtimeErrors) => {
    await selectView(page, 'Month')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Month', 'Day → Month did not enter Month.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Day → Month did not preserve the anchor date.')
    assert(await page.locator('.planning-month-stage').getAttribute('data-plan-date') === '2026-09-15', 'Month surface did not keep the selected instructional day.')
    assert(await page.locator('.planning-month').getAttribute('data-focus-date') === '2026-09-15', 'Month did not emphasize the selected day.')
    assert(await page.getByText('This Month', { exact: true }).isVisible(), 'Month state header did not name This Month.')
    assert(/September/.test((await page.locator('.plan-state-secondary').textContent()) ?? ''), 'Month state header did not name the month.')
    await shot(page, '01-month-from-day.png')
    assert(runtimeErrors.length === 0, `Day → Month runtime errors: ${runtimeErrors.join(' | ')}`)
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await selectView(page, 'Month')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Month', 'Class → Month did not enter Month.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Class → Month did not preserve the date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Class → Month did not preserve Course.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-section') === 'section-p6', 'Class → Month did not preserve a still-valid Section.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-lesson') === '', 'Class → Month invented Lesson focus.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).teachingBlockId === undefined, 'Class → Month kept teachingBlockId as hidden Month return state.')
    assert(await page.getByText('2D Art 1 · This Month', { exact: true }).isVisible(), 'Class → Month header replaced Course with a Period name.')
    assert(await page.getByText('Shifted: Period 6', { exact: true }).count() > 0, 'Section divergence was lost on Month.')
    await shot(page, '02-month-from-class.png')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await selectView(page, 'Month')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Month', 'Lesson → Month did not enter Month.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Lesson → Month did not preserve the date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Lesson → Month dropped Course.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-lesson'), 'Lesson → Month kept Lesson as active Month state.')
    const lessonMonth = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
    assert(lessonMonth.lessonId === undefined, 'Lesson → Month persisted a Lesson ID as Month state.')
    assert(lessonMonth.teachingBlockId === undefined, 'Lesson → Month kept teachingBlockId as hidden Month return state.')
    assert(lessonMonth.courseId === 'course-2d' && lessonMonth.unitId === 'unit-2d-2', 'Lesson → Month dropped a useful Course/Unit.')
    assert(await page.locator('[data-lesson-focus]').count() === 0, 'Lesson → Month still rendered Lesson Focus.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await selectView(page, 'Month')
    await page.getByRole('button', { name: 'Open Day for Monday, September 14, 2026' }).click()
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Month → Day did not open Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-14', 'Month → Day did not use the selected date.')
    assert(await page.getByRole('heading', { level: 1, name: 'My Teaching Day' }).isVisible(), 'Month → Day did not open the Day rail.')
    await shot(page, '06-month-back-to-day.png')

    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'class', 'Month → Day → Class did not restore Class Focus.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-section') === 'section-p6', 'Month → Day → Class did not restore Section.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-14', 'Month → Day → Class moved the selected date.')
    assert(await page.getByText('Shifted for this class', { exact: true }).count() > 0, 'Section divergence was lost after Month → Day → Class.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await selectView(page, 'Month')
    const before = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
    await page.getByRole('button', { name: 'TRAY', exact: true }).click()
    assert(await page.getByRole('button', { name: 'TRAY', exact: true }).getAttribute('aria-expanded') === 'true', 'Month did not open Tray as an overlay.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-overlay') === 'workspace', 'Tray overlay was not reflected from Month.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Month', 'Opening Tray from Month mutated Plan view.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Opening Tray from Month mutated the date.')
    assert(await page.getByLabel('Tray furniture').getByText('Museum label mini-lesson', { exact: true }).isVisible(), 'Tray did not open over Month.')
    await shot(page, '04-month-workspace.png')
    await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-overlay') === 'none', 'Closing Tray from Month left overlay state.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Month', 'Closing Tray from Month did not restore Month.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Closing Tray from Month moved the date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Closing Tray from Month lost Course.')
    const after = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
    assert(JSON.stringify(after) === JSON.stringify(before), 'Tray overlay mutated persisted Plan context.')
    await shot(page, '05-month-after-workspace.png')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await selectView(page, 'Month')
    await retreatToTeachingDayViaDayTab(page)
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Month → Home did not land on Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Month → Home moved the anchored date.')
    assert(await page.getByRole('heading', { level: 1, name: 'My Teaching Day' }).isVisible(), 'Month → Home did not open the Day view.')
    assert(await page.getByText('My Teaching Day', { exact: true }).isVisible(), 'Month → Home did not restore the Teaching Day header.')
  })

  const monthContext = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Month', anchorDate: '2026-09-15',
    focus: 'day', courseId: 'course-2d', sectionId: 'section-p6', unitId: 'unit-2d-2', teachingBlockId: 'section-p6',
  }
  await withPage(browser, storageEntries(data, monthContext), async (page) => {
    await page.locator('.planning-month').waitFor({ timeout: 5000 })
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Month', 'Refresh did not restore Month view.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Refresh did not restore the Month anchor date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Refresh did not restore Month Course.')
    assert(await page.locator('.planning-month-day--focus').count() === 1, 'Refresh did not keep the selected instructional day in Month.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-lesson'), 'Refresh restored a Lesson as active Month state.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).teachingBlockId === undefined, 'Month refresh resurrected teachingBlockId.')
    await shot(page, '03-month-selected.png')
  })

  const staleMonth = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Month', anchorDate: '2026-09-15',
    focus: 'lesson', courseId: 'course-2d', sectionId: 'section-p6', unitId: 'unit-2d-2',
    lessonId: 'lesson-missing', teachingBlockId: 'section-p6',
  }
  await withPage(browser, storageEntries(data, staleMonth), async (page) => {
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Month', 'Stale Month Lesson did not remain on Month.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Stale Month Lesson lost the valid Course.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-lesson'), 'Stale Month Lesson kept Lesson focus.')
    assert(await page.locator('[data-lesson-focus]').count() === 0, 'Stale Month Lesson still rendered Lesson Focus.')
  })

  const staleMonthSection = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Month', anchorDate: '2026-09-15',
    focus: 'day', courseId: 'course-2d', sectionId: 'section-missing',
  }
  await withPage(browser, storageEntries(data, staleMonthSection), async (page) => {
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Month', 'Stale Month Section did not fall back to Month.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Stale Month Section moved the date.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-section'), 'Stale Month Section kept an invalid Section.')
  })

  await withPage(browser, liveSeed, async (page) => {
    await page.getByRole('button', { name: 'Plan View', exact: true }).click()
    const before = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await selectView(page, 'Month')
    await page.getByRole('button', { name: 'TRAY', exact: true }).click()
    await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
    await retreatToTeachingDayViaDayTab(page)
    const after = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    assert(before === after, 'Month navigation mutated ArcTable live state.')
    assert(JSON.parse(after).timer.remainingSeconds === live.timer.remainingSeconds, 'Month navigation changed the ArcTable timer.')
    assert(await page.getByRole('button', { name: /Return to ArcTable/ }).count() === 1, 'Month navigation dropped the live ArcTable session.')
  })

  console.log('Arc Plan Month context gate passed: Day/Class/Lesson entry, selected-date return, Tray overlay, Home, refresh, stale IDs, Section divergence, ArcTable isolation.')
} finally {
  await browser.close()
}
