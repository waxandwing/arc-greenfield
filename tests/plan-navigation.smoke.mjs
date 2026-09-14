import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { retreatToTeachingDayViaDayTab } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/plan-navigation/', import.meta.url).pathname
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

  await withPage(browser, storageEntries(data, dayContext), async (page, runtimeErrors) => {
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Teaching Day did not restore as the starting focus.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Teaching Day did not keep the persisted date.')
    assert(await page.getByText('My Teaching Day', { exact: true }).isVisible(), 'State header did not name Teaching Day.')
    assert(await page.locator('.progressive-setup').count() === 0, 'Complete gauntlet fixture must not show setup banner on Day.')
    await shot(page, '01-teaching-day.png')

    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'class', 'Day → Class did not enter Class Focus.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-section') === 'section-p6', 'Class Focus did not preserve Section.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Class Focus did not preserve date.')
    assert(await page.getByText('Shifted for this class', { exact: true }).count() > 0, 'Section divergence was lost when entering Class Focus.')
    await shot(page, '02-class-focus.png')

    const liveBeforeClassWorkspace = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    await page.getByRole('button', { name: 'TRAY', exact: true }).click()
    assert(await page.getByRole('button', { name: 'TRAY', exact: true }).getAttribute('aria-expanded') === 'true', 'Class Focus did not open Tray as an overlay.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-overlay') === 'workspace', 'Tray overlay was not reflected in the state header.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'class', 'Opening Tray from Class mutated Plan focus.')
    await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'class', 'Closing Tray from Class did not restore Class Focus.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-section') === 'section-p6', 'Closing Tray from Class lost Section.')
    assert(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')) === liveBeforeClassWorkspace, 'Tray overlay mutated ArcTable live storage.')

    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'lesson', 'Class → Lesson did not enter Lesson Focus.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-section') === 'section-p6', 'Lesson Focus did not preserve Section.')
    assert(await page.locator('[data-lesson-focus="lesson-2d-5"]').count() === 1, 'Lesson Focus did not keep the canonical Lesson.')
    assert(await page.getByRole('heading', { level: 1, name: 'Value scale' }).isVisible(), 'Lesson Focus did not show the canonical Lesson title.')
    await shot(page, '03-lesson-focus.png')

    await page.getByRole('button', { name: 'TRAY', exact: true }).click()
    assert(await page.getByLabel('Tray furniture').getByText('Museum label mini-lesson', { exact: true }).isVisible(), 'Tray did not open over Lesson Focus.')
    await shot(page, '04-lesson-workspace.png')
    await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'lesson', 'Closing Tray did not restore Lesson Focus.')
    assert(await page.locator('[data-lesson-focus="lesson-2d-5"]').count() === 1, 'Closing Tray reconstructed a different Lesson.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-overlay') === 'none', 'Tray overlay remained after Close.')
    await shot(page, '05-lesson-after-workspace.png')

    await page.getByRole('button', { name: 'Back to class', exact: true }).click()
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'class', 'Lesson → Back did not restore Class Focus.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-section') === 'section-p6', 'Lesson → Back lost Section.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Lesson → Back lost the Day date.')

    await retreatToTeachingDayViaDayTab(page)
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Class → Home did not restore Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Class → Back did not restore the same date.')
    assert(!await page.locator('.day-continuity').getAttribute('data-plan-section'), 'Class → Back left a Section selected on Teaching Day.')

    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('.day-continuity[data-plan-focus="lesson"]').waitFor({ timeout: 5000 })
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'lesson', 'Refresh did not restore persisted Lesson Focus.')
    assert(await page.locator('[data-lesson-focus="lesson-2d-5"]').count() === 1, 'Refresh did not restore the same Lesson.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).overlay === undefined, 'Plan navigation persistence stored Tray overlay state.')
    assert(await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1')) === null, 'Plan navigation created ArcTable live state.')
    assert(runtimeErrors.length === 0, `Plan navigation runtime errors: ${runtimeErrors.join(' | ')}`)
  })

  const stale = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Day', anchorDate: '2026-09-15',
    focus: 'lesson', courseId: 'course-2d', sectionId: 'section-p6', unitId: 'unit-2d-2',
    lessonId: 'lesson-missing', teachingBlockId: 'section-p6',
  }
  await withPage(browser, storageEntries(data, stale), async (page) => {
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'class', 'A stale Lesson ID did not fail safely to Class Focus.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-section') === 'section-p6', 'Safe fallback from a stale Lesson lost the valid Section.')
  })

  const missingSection = {
    schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Day', anchorDate: '2026-09-15',
    focus: 'class', sectionId: 'section-missing', teachingBlockId: 'block-missing',
  }
  await withPage(browser, storageEntries(data, missingSection), async (page) => {
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Stale Section/block IDs did not fail safely to Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Safe fallback to Teaching Day moved the date.')
  })

  const live = liveState()
  const liveSeed = {
    ...storageEntries(data, dayContext),
    'arc.arctable.live.v1': JSON.stringify(live),
  }
  await withPage(browser, liveSeed, async (page) => {
    await page.getByRole('button', { name: 'Plan View', exact: true }).click()
    const before = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await page.getByRole('button', { name: 'TRAY', exact: true }).click()
    await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
    const after = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    assert(before === after, 'Plan navigation mutated ArcTable live state.')
    assert(JSON.parse(after).timer.remainingSeconds === live.timer.remainingSeconds, 'Plan navigation changed the ArcTable timer.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'lesson', 'ArcTable Plan return did not keep the Lesson context after navigation.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await retreatToTeachingDayViaDayTab(page)
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Class → Home did not land on Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Class → Home moved the anchored date.')
    assert(await page.getByRole('heading', { level: 1, name: 'My Teaching Day' }).isVisible(), 'Class → Home did not open the Day view.')
    assert(await page.getByText('My Teaching Day', { exact: true }).isVisible(), 'Class → Home did not restore the Teaching Day header.')
    assert(!await page.locator('.day-continuity').getAttribute('data-plan-section'), 'Class → Home left Class Focus selected.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await retreatToTeachingDayViaDayTab(page)
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Lesson → Home did not land on Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Lesson → Home moved the anchored date.')
    assert(await page.locator('[data-lesson-focus]').count() === 0, 'Lesson → Home kept Lesson Focus.')
    assert(await page.getByRole('button', { name: 'Back to class', exact: true }).count() === 0, 'Lesson → Home behaved like Back to Class.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await page.getByRole('button', { name: 'TRAY', exact: true }).click()
    assert(await page.getByRole('button', { name: 'TRAY', exact: true }).getAttribute('aria-expanded') === 'true', 'Tray did not open before Home.')
    await retreatToTeachingDayViaDayTab(page)
    assert(await page.getByRole('button', { name: 'TRAY', exact: true }).getAttribute('aria-expanded') === 'false', 'Home from Tray did not close the overlay.')
    assert(await page.locator('.plan-state-header').getAttribute('data-plan-overlay') === 'none', 'Home from Tray left overlay state on the header.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Workspace-from-Lesson → Home did not land on Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Workspace-from-Lesson → Home moved the anchored date.')
  })

  await withPage(browser, liveSeed, async (page) => {
    await page.getByRole('button', { name: 'Plan View', exact: true }).click()
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    const before = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    await retreatToTeachingDayViaDayTab(page)
    const after = await page.evaluate(() => localStorage.getItem('arc.arctable.live.v1'))
    assert(before === after, 'Home mutated ArcTable live state.')
    assert(JSON.parse(after).timer.remainingSeconds === live.timer.remainingSeconds, 'Home changed the ArcTable timer.')
    assert(await page.getByRole('button', { name: /Return to ArcTable/ }).count() === 1, 'Home from Plan View dropped the live ArcTable session.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'day', 'Home from live Plan View did not land on Teaching Day.')
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Home from live Plan View moved the anchored date.')
  })

  await withPage(browser, storageEntries(data, dayContext), async (page) => {
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await retreatToTeachingDayViaDayTab(page)
    await page.reload({ waitUntil: 'networkidle' })
    await page.locator('.day-continuity[data-plan-focus="day"]').waitFor({ timeout: 5000 })
    assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Refresh after Home did not restore the same Teaching Day date.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).view === 'Day', 'Refresh after Home did not persist Day view.')
    assert(JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planning-context.v1'))).focus === 'day', 'Refresh after Home did not persist Teaching Day focus.')
    assert(await page.getByRole('heading', { level: 1, name: 'This Month' }).count() === 0, 'Refresh after Home restored Month home instead of Teaching Day.')
  })

  console.log('Arc Plan navigation spine gate passed: Day → Class → Lesson → Workspace return, Home to Teaching Day, refresh, stale IDs, Section divergence, ArcTable isolation.')
} finally {
  await browser.close()
}
