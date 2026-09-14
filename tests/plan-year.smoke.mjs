import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/plan-year/', import.meta.url).pathname
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
    await selectView(page, 'Year')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Year Map', 'Day → Year did not enter Year.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Day → Year did not preserve the anchor date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-focus') === 'day', 'Day → Year invented Class focus.')
    assert(await page.locator('.planning-year').count() === 1, 'Year surface did not render PlanningYearView.')
    assert(await page.getByText('School Year · All Courses', { exact: true }).isVisible(), 'Year state header did not name School Year · All Courses.')
    assert(/2026–27/.test((await page.locator('.plan-state-secondary').textContent()) ?? ''), 'Year state header did not name the school year.')
    await shot(page, '01-year-from-day.png')
    assert(runtimeErrors.length === 0, `Day → Year runtime errors: ${runtimeErrors.join(' | ')}`)
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await selectView(page, 'Year')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Year Map', 'Class → Year did not enter Year.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Class → Year did not preserve the date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Class → Year did not preserve Course.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-section'), 'Class → Year kept Section at Year depth.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-lesson') === '', 'Class → Year invented Lesson focus.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).teachingBlockId === undefined, 'Class → Year kept teachingBlockId as hidden Year return state.')
    assert(await page.getByText('2D Art 1 · School Year', { exact: true }).isVisible(), 'Class → Year header did not keep Course at Year depth.')
    await shot(page, '03-year-course-context.png')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await selectView(page, 'Month')
    await selectView(page, 'Year')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Month → Year did not preserve Course.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).unitId === 'unit-2d-2', 'Month → Year did not preserve Unit.')
    await shot(page, '02-year-from-month.png')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await selectView(page, 'Year')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Year Map', 'Lesson → Year did not enter Year.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Lesson → Year did not preserve the date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Lesson → Year dropped Course.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-section'), 'Lesson → Year kept Section at Year depth.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-lesson'), 'Lesson → Year kept Lesson as active Year state.')
    const lessonYear = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
    assert(lessonYear.lessonId === undefined, 'Lesson → Year persisted a Lesson ID as Year state.')
    assert(lessonYear.teachingBlockId === undefined, 'Lesson → Year kept teachingBlockId as hidden Year return state.')
    assert(lessonYear.courseId === 'course-2d' && lessonYear.unitId === 'unit-2d-2', 'Lesson → Year dropped a useful Course/Unit.')
    assert(await page.locator('[data-lesson-focus]').count() === 0, 'Lesson → Year still rendered Lesson Focus.')
    await shot(page, '04-year-unit-context.png')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await selectView(page, 'Week')
    await selectView(page, 'Year')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Year Map', 'Week → Year did not enter Year.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Week → Year did not preserve the anchor date.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await selectView(page, 'Month')
    await selectView(page, 'Year')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Year Map', 'Month → Year did not enter Year.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Month → Year did not preserve the anchor date.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await selectView(page, 'Year')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Lesson → Year did not keep Course for Unit deep link.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).unitId === 'unit-2d-2', 'Lesson → Year did not keep Unit for deep link.')
    await page.getByRole('button', { name: 'Open Value & Form in Month' }).click()
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Month', 'Year → Month did not open Month.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-14', 'Year → Month did not use the Unit start date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Year → Month dropped Course.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-lesson'), 'Year → Month kept Lesson focus.')
    const monthCtx = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
    assert(monthCtx.unitId === 'unit-2d-2', 'Year → Month did not keep the selected Course Unit.')
    assert(!monthCtx.sectionId, 'Year → Month resurrected Section at Month depth.')
    await shot(page, '07-year-back-to-month.png')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await selectView(page, 'Year')
    await page.getByRole('button', { name: 'Return to Teaching Day' }).click()
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Year → Home did not land on Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Year → Home moved the anchored date.')
    assert(await page.getByRole('heading', { level: 1, name: 'My Teaching Day' }).isVisible(), 'Year → Home did not open the Day view.')
    assert(await page.getByText('My Teaching Day', { exact: true }).isVisible(), 'Year → Home did not restore the Teaching Day header.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await selectView(page, 'Year')
    const before = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
    await page.getByRole('button', { name: 'Open Workspace', exact: true }).click()
    assert(await page.getByRole('button', { name: 'WORKSPACE', exact: true }).getAttribute('aria-expanded') === 'true', 'Year did not open Workspace as an overlay.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-overlay') === 'workspace', 'Workspace overlay was not reflected from Year.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Year Map', 'Opening Workspace from Year mutated Plan view.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Opening Workspace from Year mutated the date.')
    assert(await page.getByText('Museum label mini-lesson', { exact: true }).isVisible(), 'Workspace did not open over Year.')
    await shot(page, '05-year-workspace.png')
    await page.getByRole('button', { name: 'Close Workspace', exact: true }).click()
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-overlay') === 'none', 'Closing Workspace from Year left overlay state.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Year Map', 'Closing Workspace from Year did not restore Year.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Closing Workspace from Year moved the date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Closing Workspace from Year lost Course.')
    const after = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1')))
    assert(JSON.stringify(after) === JSON.stringify(before), 'Workspace overlay mutated persisted Plan context.')
    await shot(page, '06-year-after-workspace.png')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await selectView(page, 'Year')
    await selectView(page, 'Month')
    await page.getByRole('button', { name: 'Open Day for Monday, September 14, 2026' }).click()
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    assert(await page.getByText('Shifted for this class', { exact: true }).count() > 0, 'Section divergence was lost on Month after Year work.')
  })

  const yearContext = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Year Map', anchorDate: '2026-09-15',
    focus: 'day', courseId: 'course-2d', unitId: 'unit-2d-2', sectionId: 'section-p6', teachingBlockId: 'section-p6',
  }
  await withPage(browser, storageEntries(data, yearContext), async (page) => {
    await page.locator('.planning-year').waitFor({ timeout: 5000 })
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Year Map', 'Refresh did not restore Year view.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Refresh did not restore the Year anchor date.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Refresh did not restore Year Course.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-focus') === 'day', 'Refresh did not drop Year to day focus.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-section'), 'Refresh resurrected Section on Year.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-lesson'), 'Refresh restored a Lesson as active Year state.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).teachingBlockId === undefined, 'Year refresh resurrected teachingBlockId.')
  })

  const staleYear = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Year Map', anchorDate: '2026-09-15',
    focus: 'lesson', courseId: 'course-2d', unitId: 'unit-2d-2',
    lessonId: 'lesson-missing', teachingBlockId: 'section-p6',
  }
  await withPage(browser, storageEntries(data, staleYear), async (page) => {
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Year Map', 'Stale Year Lesson did not remain on Year.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-course') === 'course-2d', 'Stale Year Lesson lost the valid Course.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-lesson'), 'Stale Year Lesson kept Lesson focus.')
    assert(await page.locator('[data-lesson-focus]').count() === 0, 'Stale Year Lesson still rendered Lesson Focus.')
  })

  const staleYearCourse = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Year Map', anchorDate: '2026-09-15',
    focus: 'day', courseId: 'course-missing', unitId: 'unit-2d-2',
  }
  await withPage(browser, storageEntries(data, staleYearCourse), async (page) => {
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-view') === 'Year Map', 'Stale Year Course did not fall back to Year.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-date') === '2026-09-15', 'Stale Year Course moved the date.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-course'), 'Stale Year Course kept an invalid Course.')
    assert(!await page.locator('.plan-state-header').getAttribute('data-plan-section'), 'Stale Year Course kept Section.')
  })

  await withPage(browser, liveSeed, async (page) => {
    await page.getByRole('button', { name: 'Plan View', exact: true }).click()
    const before = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await selectView(page, 'Year')
    await page.getByRole('button', { name: 'Open Workspace', exact: true }).click()
    await page.getByRole('button', { name: 'Close Workspace', exact: true }).click()
    await page.getByRole('button', { name: 'Return to Teaching Day' }).click()
    const after = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    assert(before === after, 'Year navigation mutated ArcTable live state.')
    assert(JSON.parse(after).timer.remainingSeconds === live.timer.remainingSeconds, 'Year navigation changed the ArcTable timer.')
    assert(await page.getByRole('button', { name: /Return to ArcTable/ }).count() === 1, 'Year navigation dropped the live ArcTable session.')
  })

  console.log('Arc Plan Year context gate passed: Day/Class/Lesson/Week/Month entry, Unit→Month, Workspace overlay, Home, refresh, stale IDs, ArcTable isolation.')
} finally {
  await browser.close()
}
