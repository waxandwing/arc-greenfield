import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/plan-p5/', import.meta.url).pathname
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
  const deliveryStates = [
    { lessonId: 'lesson-apah-4', sectionId: 'section-p1', status: 'completed', taughtDate: '2026-09-08', resumeNote: null },
    { lessonId: 'lesson-apah-6', sectionId: 'section-p1', status: 'completed', taughtDate: '2026-09-15', resumeNote: null },
    { lessonId: 'lesson-apah-5', sectionId: 'section-p4', status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Stopped after the threshold comparison. Resume with patron evidence.' },
  ]
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
    'arc.view-preferences.v1': JSON.stringify({ home: { mode: 'fixed', view: 'Day' }, lastUsedView: 'Day', showWeekends: false }),
  }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

const dayContext = { schemaVersion: 2, calendarId: 'arc-plan-gauntlet-2026', view: 'Day', anchorDate: '2026-09-15', focus: 'day' }

const browser = await chromium.launch({ headless: true })
try {
  const data = fixture()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  await page.addInitScript((entries) => {
    if (localStorage.getItem('arc.calendar.v1') !== null) return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, storageEntries(data, dayContext))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Teaching Day did not keep the anchor date.')
  await shot(page, '01-planning-period.png')

  await page.getByRole('button', { name: 'Period 5, planning time' }).click()
  assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'class', 'Planning period did not deepen like Class Focus.')
  assert(await page.getByRole('heading', { level: 1, name: 'Planning period' }).isVisible(), 'Planning period lens did not render.')
  assert(await page.getByText('Across my preps', { exact: true }).isVisible(), 'Planning period did not show cross-prep context.')
  assert(await page.getByRole('heading', { name: 'Now', exact: true }).isVisible(), 'Planning period did not render NOW bucket.')
  assert(await page.getByRole('heading', { name: 'Needs attention', exact: true }).isVisible(), 'Planning period did not render NEEDS ATTENTION bucket.')
  assert(await page.getByRole('heading', { name: 'Next planned', exact: true }).isVisible(), 'Planning period did not render NEXT PLANNED bucket.')
  await shot(page, '02-planning-buckets.png')

  const stopped = page.locator('[data-attention-kind="stopped-lesson"]').first()
  assert(await stopped.count() === 1, 'Fixture did not surface a stopped Lesson signal.')
  await stopped.click()
  assert(await page.locator('.day-continuity').getAttribute('data-plan-focus') === 'lesson', 'Stopped Lesson did not deep link to Lesson focus.')
  assert(await page.getByRole('button', { name: 'Back to Planning period', exact: true }).isVisible(), 'Lesson deep link did not offer Planning period return.')
  await shot(page, '03-planning-lesson-deeplink.png')
  await page.getByRole('button', { name: 'Back to Planning period', exact: true }).click()
  assert(await page.getByRole('heading', { name: 'Planning period' }).isVisible(), 'Return did not restore Planning period focus.')
  assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Return moved the anchor date.')
  await shot(page, '04-planning-return.png')

  const behind = page.locator('[data-attention-kind="section-behind"]').first()
  assert(await behind.count() === 1, 'Fixture did not surface a section-behind signal.')
  await behind.click()
  assert(await page.locator('.planning-week').count() === 1, 'Section-behind item did not open Week context.')
  await shot(page, '05-planning-week-deeplink.png')
  await page.getByRole('button', { name: 'Back to Planning period', exact: true }).click()
  assert(await page.getByRole('heading', { name: 'Planning period' }).isVisible(), 'Week deep link did not return to Planning period.')

  await page.getByRole('button', { name: 'TRAY', exact: true }).click()
  assert(await page.locator('.plan-state-header').getAttribute('data-plan-overlay') === 'workspace', 'Planning period did not open Tray overlay.')
  await shot(page, '06-planning-workspace.png')
  await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
  assert(await page.getByRole('heading', { name: 'Planning period' }).isVisible(), 'Closing Tray did not restore Planning period.')
  assert(await page.locator('.day-continuity').getAttribute('data-plan-date') === '2026-09-15', 'Tray close moved the anchor date.')
  await shot(page, '07-planning-after-workspace.png')

  assert(runtimeErrors.length === 0, `Plan P5 runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('Plan P5 planning-period gate passed: Teaching Day anchor → Planning period buckets → deep links → return → Tray overlay restore.')
} finally {
  await browser.close()
}
