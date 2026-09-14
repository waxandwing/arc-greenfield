import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView, retreatToTeachingDayViaDayTab } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/plan-week/', import.meta.url).pathname
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
    await selectView(page, 'Week')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Week', 'Day → Week did not enter Week.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Day → Week did not preserve the anchor date.')
    assert(await page.locator('.planning-week').getAttribute('data-plan-date') === '2026-09-15', 'Week surface did not keep the selected instructional day.')
    assert(await page.locator('.planning-grid').getAttribute('data-focus-date') === '2026-09-15', 'Week did not emphasize the selected day.')
    assert(await page.getByText('This Week', { exact: true }).isVisible(), 'Week state header did not name This Week.')
    assert(/Sep\s*14.+18/.test((await page.locator('.plan-state-secondary').textContent()) ?? ''), 'Week state header did not name the week range.')
    await shot(page, '01-week-from-day.png')
    assert(runtimeErrors.length === 0, `Day → Week runtime errors: ${runtimeErrors.join(' | ')}`)
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await selectView(page, 'Week')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Week', 'Class → Week did not enter Week.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Class → Week did not preserve the date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Class → Week did not preserve Course.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-section') === 'section-p6', 'Class → Week did not preserve Section.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-lesson') === '', 'Class → Week invented Lesson focus.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).teachingBlockId === undefined, 'Class → Week kept teachingBlockId as hidden Week return state.')
    assert(await page.getByText('2D Art 1 · This Week', { exact: true }).isVisible(), 'Class → Week header did not keep Course in teaching context.')
    assert(await page.getByText('Shifted for this class', { exact: true }).count() > 0, 'Section divergence was lost on Week.')
    await shot(page, '02-week-from-class.png')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await selectView(page, 'Week')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Week', 'Lesson → Week did not enter Week.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Lesson → Week did not preserve the date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Lesson → Week dropped Course.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-section') === 'section-p6', 'Lesson → Week dropped Section.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-lesson'), 'Lesson → Week kept Lesson as active Week state.')
    const lessonWeek = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
    assert(lessonWeek.lessonId === undefined, 'Lesson → Week persisted a Lesson ID as Week state.')
    assert(lessonWeek.teachingBlockId === undefined, 'Lesson → Week kept teachingBlockId as hidden Week return state.')
    assert(lessonWeek.courseId === 'course-2d' && lessonWeek.sectionId === 'section-p6' && lessonWeek.unitId === 'unit-2d-2', 'Lesson → Week dropped a valid Course/Section/Unit.')
    assert(await page.locator('[data-lesson-focus]').count() === 0, 'Lesson → Week still rendered Lesson Focus.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await selectView(page, 'Week')
    await page.getByRole('button', { name: 'Open Day for Monday, September 14, 2026' }).click()
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Week → Day did not open Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-14', 'Week → Day did not use the selected date.')
    assert(await page.getByRole('heading', { level: 1, name: 'My Teaching Day' }).isVisible(), 'Week → Day did not open the Day rail.')
    await shot(page, '06-week-back-to-day.png')

    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'class', 'Week → Day → Class did not restore Class Focus.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-section') === 'section-p6', 'Week → Day → Class did not restore Section.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-14', 'Week → Day → Class moved the selected date.')
    assert(await page.getByText('Shifted for this class', { exact: true }).count() > 0, 'Section divergence was lost after Week → Day → Class.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await selectView(page, 'Week')
    const before = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
    await page.getByRole('button', { name: 'TRAY', exact: true }).click()
    assert(await page.getByRole('button', { name: 'TRAY', exact: true }).getAttribute('aria-expanded') === 'true', 'Week did not open Tray as an overlay.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-overlay') === 'workspace', 'Tray overlay was not reflected from Week.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Week', 'Opening Tray from Week mutated Plan view.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Opening Tray from Week mutated the date.')
    assert(await page.getByLabel('Tray furniture').getByText('Museum label mini-lesson', { exact: true }).isVisible(), 'Tray did not open over Week.')
    await shot(page, '04-week-workspace.png')
    await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-overlay') === 'none', 'Closing Tray from Week left overlay state.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Week', 'Closing Tray from Week did not restore Week.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Closing Tray from Week moved the date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Closing Tray from Week lost Course.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-section') === 'section-p6', 'Closing Tray from Week lost Section.')
    const after = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
    assert(JSON.stringify(after) === JSON.stringify(before), 'Tray overlay mutated persisted Plan context.')
    await shot(page, '05-week-after-workspace.png')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await selectView(page, 'Week')
    await retreatToTeachingDayViaDayTab(page)
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Week → Home did not land on Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Week → Home moved the anchored date.')
    assert(await page.getByRole('heading', { level: 1, name: 'My Teaching Day' }).isVisible(), 'Week → Home did not open the Day view.')
    assert(await page.getByText('My Teaching Day', { exact: true }).isVisible(), 'Week → Home did not restore the Teaching Day header.')
  })

  const weekContext = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Week', anchorDate: '2026-09-15',
    focus: 'day', courseId: 'course-2d', sectionId: 'section-p6', unitId: 'unit-2d-2', teachingBlockId: 'section-p6',
  }
  await withPage(browser, storageEntries(data, weekContext), async (page) => {
    await page.locator('.planning-week').waitFor({ timeout: 5000 })
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Week', 'Refresh did not restore Week view.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Refresh did not restore the Week anchor date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Refresh did not restore Week Course.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-section') === 'section-p6', 'Refresh did not restore Week Section.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-lesson'), 'Refresh restored a Lesson as active Week state.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).teachingBlockId === undefined, 'Week refresh resurrected teachingBlockId.')
    await shot(page, '03-week-selected-day.png')
  })

  const staleWeek = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Week', anchorDate: '2026-09-15',
    focus: 'lesson', courseId: 'course-2d', sectionId: 'section-p6', unitId: 'unit-2d-2',
    lessonId: 'lesson-missing', teachingBlockId: 'section-p6',
  }
  await withPage(browser, storageEntries(data, staleWeek), async (page) => {
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Week', 'Stale Week Lesson did not remain on Week.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-section') === 'section-p6', 'Stale Week Lesson lost the valid Section.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-lesson'), 'Stale Week Lesson kept Lesson focus.')
    assert(await page.locator('[data-lesson-focus]').count() === 0, 'Stale Week Lesson still rendered Lesson Focus.')
  })

  const staleWeekSection = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Week', anchorDate: '2026-09-15',
    focus: 'day', courseId: 'course-2d', sectionId: 'section-missing',
  }
  await withPage(browser, storageEntries(data, staleWeekSection), async (page) => {
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Week', 'Stale Week Section did not fall back to Week.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Stale Week Section moved the date.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-section'), 'Stale Week Section kept an invalid Section.')
  })

  await withPage(browser, liveSeed, async (page) => {
    await page.getByRole('button', { name: 'Plan View', exact: true }).click()
    const before = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await selectView(page, 'Week')
    await page.getByRole('button', { name: 'TRAY', exact: true }).click()
    await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
    await retreatToTeachingDayViaDayTab(page)
    const after = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    assert(before === after, 'Week navigation mutated ArcTable live state.')
    assert(JSON.parse(after).timer.remainingSeconds === live.timer.remainingSeconds, 'Week navigation changed the ArcTable timer.')
    assert(await page.getByRole('button', { name: /Return to ArcTable/ }).count() === 1, 'Week navigation dropped the live ArcTable session.')
  })

  console.log('Arc Plan Week context gate passed: Day/Class/Lesson entry, selected-date return, Tray overlay, Home, refresh, stale IDs, Section divergence, ArcTable isolation.')
} finally {
  await browser.close()
}
