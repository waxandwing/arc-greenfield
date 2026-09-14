import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/current/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

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
  for (const course of courses) {
    unitSpecs[course.id].forEach((title, index) => {
      units.push({ id: `unit-${course.id.slice(7)}-${index + 1}`, calendarId, courseId: course.id, title, placement: { startDate: spans[index][0], endDate: spans[index][1] } })
    })
  }
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
    { lessonId: 'lesson-apah-5', sectionId: 'section-p4', status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Stopped after the threshold comparison. Resume with patron evidence.' },
    { lessonId: 'lesson-apah-6', sectionId: 'section-p1', status: 'completed', taughtDate: '2026-09-15' },
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

function storageEntries(data) {
  const context = { schemaVersion: 2, calendarId: data.calendarId, view: 'Day', anchorDate: '2026-09-15', focus: 'day' }
  return {
    'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-15T12:00:00.000Z', input: data.calendarInput }),
    'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: data.planning }),
    'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, units: data.units } }),
    'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, lessons: data.lessons, deliveryStates: data.deliveryStates } }),
    'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, overrides: data.overrides, undo: null } }),
    'arc.captures.v1': JSON.stringify({ schemaVersion: 1, workspace: { calendarId: data.calendarId, captures: [] } }),
    'arc.planning-context.v1': JSON.stringify(context),
    'arc.view-preferences.v1': JSON.stringify({ home: { mode: 'fixed', view: 'Day' }, lastUsedView: 'Day', showWeekends: false }),
  }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

const data = fixture()
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, storageEntries(data))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { level: 1, name: 'My Teaching Day' }).waitFor({ timeout: 15000 })
  await shot(page, '01-day.png')

  await selectPlanView(page, 'Week')
  await page.getByRole('heading', { level: 1, name: 'This Week' }).waitFor({ timeout: 10000 })
  await shot(page, '02-week.png')

  await selectPlanView(page, 'Day')
  await page.getByRole('button', { name: 'Period 5, planning time' }).click()
  await page.getByRole('heading', { level: 1, name: 'Planning period' }).waitFor({ timeout: 10000 })
  await shot(page, '03-planning.png')

  await selectPlanView(page, 'Week')
  await selectPlanView(page, 'Day')
  await shot(page, '00-contact-sheet.png')

  await page.close()
  console.log(`Current HEAD evidence: ${evidenceDir} (branch cursor/arc-production-integration)`)
  const { execSync } = await import('node:child_process')
  execSync(`python3 scripts/build-contact-sheet.py "${evidenceDir}" "${evidenceDir}CONTACT-SHEET.png" "Arc current views · gauntlet Sep 15"`, { stdio: 'inherit' })
} finally {
  await browser.close()
}
