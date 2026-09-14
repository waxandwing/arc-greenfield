import { mkdirSync, readFileSync } from 'node:fs'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/stage7-2-1-shell-emphasis/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

async function contactSheet(browser) {
  const names = [
    '01-teaching-day.png', '02-class-focus.png', '03-lesson-focus.png', '04-week.png',
    '05-month.png', '06-year.png', '07-planning-p5.png', '08-workspace.png',
    '09-move-shift-recovery.png', '10-onboarding.png', '11-import-review.png',
    '12-arctable-teacher.png', '13-arctable-student.png',
  ]
  const cards = names.map((name) => {
    const data = readFileSync(`${evidenceDir}${name}`).toString('base64')
    return `<figure><figcaption>${name.replace('.png', '')}</figcaption><img src="data:image/png;base64,${data}" alt=""></figure>`
  }).join('')
  const page = await browser.newPage({ viewport: { width: 2000, height: 1200 } })
  await page.setContent(`<style>html,body{margin:0;background:#fbf8f0;color:#2c2e2e;font:14px system-ui}main{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:28px;padding:28px}figure{margin:0}figcaption{margin:0 0 8px;font-weight:700}img{display:block;width:100%;height:auto}</style><main>${cards}</main>`)
  await page.screenshot({ path: `${evidenceDir}00-contact-sheet.png`, fullPage: true })
  await page.close()
}

function gauntletFixture() {
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
    'arc.onboarding.v1': JSON.stringify({ schemaVersion: 1, stage: 'landed', dismissed: true, firstCapturePromptDismissed: true }),
  }
}

const csv = 'Course,Order,Unit,Unit Length,Item Type,Title,Item Length,Content/Resources,Homework/Next Up,Important Notes\nAP Art History,1,Looking & Meaning,2 weeks,Lesson,Reading images,45 min,https://example.com/images,Compare two works,Model evidence first\nAP Art History,2,Looking & Meaning,2 weeks,Lesson,Formal analysis relay,45 min,,Bring notes,Use partner talk'

const browser = await chromium.launch({ headless: true })
try {
  const data = gauntletFixture()
  const dayContext = { schemaVersion: 2, calendarId: data.calendarId, view: 'Day', anchorDate: '2026-09-15', focus: 'day' }

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    await page.addInitScript((entries) => {
      for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    }, storageEntries(data, dayContext))
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await shot(page, '01-teaching-day.png')
    await page.getByRole('button', { name: /Period 6 2D Art 1/ }).click()
    await shot(page, '02-class-focus.png')
    await page.getByRole('button', { name: 'Open lesson', exact: true }).first().click()
    await shot(page, '03-lesson-focus.png')
    await selectView(page, 'Week')
    await shot(page, '04-week.png')
    await selectView(page, 'Month')
    await shot(page, '05-month.png')
    await selectView(page, 'Year')
    await shot(page, '06-year.png')
    await selectView(page, 'Day')
    await page.locator('.day-period-gap').filter({ hasText: 'Planning time' }).click()
    await shot(page, '07-planning-p5.png')
    await page.getByRole('button', { name: 'TRAY', exact: true }).click()
    await shot(page, '08-workspace.png')
    await context.close()
  }

  {
    const calendarId = 'arc-plan-gauntlet-2026'
    const shiftSeed = {
      'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-15T12:00:00.000Z', input: { id: calendarId, schoolYearLabel: '2026–27', firstDay: '2026-09-01', lastDay: '2027-05-28', instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [], provenance: [] } }),
      'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId, courses: [{ id: 'course-apah', title: 'AP Art History' }, { id: 'course-2d', title: '2D Art 1' }], sections: [{ id: 'section-p1', courseId: 'course-apah', calendarId, name: 'Period 1' }, { id: 'section-p4', courseId: 'course-apah', calendarId, name: 'Period 4' }, { id: 'section-p6', courseId: 'course-2d', calendarId, name: 'Period 6' }], notes: [] } }),
      'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId, units: [{ id: 'unit-apah-2', calendarId, courseId: 'course-apah', title: 'Power & Place', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } }, { id: 'unit-2d-2', calendarId, courseId: 'course-2d', title: 'Value & Form', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } }] } }),
      'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId, lessons: [{ id: 'lesson-apah-5', calendarId, courseId: 'course-apah', unitId: 'unit-apah-2', title: 'Temple threshold', sequence: 5, plannedDate: '2026-09-14', datePolicy: 'flexible', directions: ['Look'], materials: ['Sketchbook'], phases: ['Look'], resources: [] }, { id: 'lesson-apah-6', calendarId, courseId: 'course-apah', unitId: 'unit-apah-2', title: 'Patron and audience', sequence: 6, plannedDate: '2026-09-15', datePolicy: 'flexible', directions: ['Look'], materials: ['Sketchbook'], phases: ['Look'], resources: [] }], deliveryStates: [{ lessonId: 'lesson-apah-5', sectionId: 'section-p4', status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Stopped after the threshold comparison.' }] } }),
      'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId, overrides: [{ sectionId: 'section-p6', lessonId: 'lesson-2d-5', plannedDate: '2026-09-15' }], undo: null } }),
      'arc.planning-context.v1': JSON.stringify(dayContext),
      'arc.view-preferences.v1': JSON.stringify({ home: { mode: 'fixed', view: 'Day' }, lastUsedView: 'Day', showWeekends: false }),
      'arc.onboarding.v1': JSON.stringify({ schemaVersion: 1, stage: 'landed', dismissed: true, firstCapturePromptDismissed: true }),
    }
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    await page.addInitScript((entries) => {
      for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    }, shiftSeed)
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /Period 4 AP Art History/ }).click()
    await page.getByRole('button', { name: 'Review Shift', exact: true }).first().click()
    await shot(page, '09-move-shift-recovery.png')
    await context.close()
  }

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await shot(page, '10-onboarding.png')
    await context.close()
  }

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    await page.addInitScript((entries) => {
      for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
    }, {
      ...storageEntries(data, dayContext),
      'arc.onboarding.v1': JSON.stringify({ schemaVersion: 1, stage: 'landed', dismissed: true, firstCapturePromptDismissed: true }),
    })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'SETTINGS', exact: true }).click()
    await page.getByRole('button', { name: 'Import curriculum' }).click()
    await page.getByLabel('Choose a CSV file').setInputFiles({ name: 'apah-2026.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
    await page.getByText('source rows ready for review').waitFor()
    await page.getByRole('button', { name: 'Review proposal', exact: true }).click()
    await shot(page, '11-import-review.png')
    await context.close()
  }

  {
    const calendarId = 'calendar-multiprep'
    const courses = [{ id: 'course-apah', title: 'AP Art History' }]
    const sections = [{ id: 'section-p4', courseId: 'course-apah', calendarId, name: 'Period 4' }]
    const units = [{ id: 'unit-apah', calendarId, courseId: 'course-apah', title: 'Early Europe', placement: { startDate: '2026-10-12', endDate: '2026-11-06' } }]
    const lessons = [{ id: 'lesson-chartres', calendarId, courseId: 'course-apah', unitId: 'unit-apah', title: 'Gothic cathedrals: Chartres, light, engineering', sequence: 1, plannedDate: '2026-10-12', datePolicy: 'flexible', directions: ['Find one vertical line.'], materials: ['Workbook'], phases: ['Look'], resources: [] }]
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    await page.addInitScript(({ calendarId, courses, sections, units, lessons }) => {
      const calendarInput = { id: calendarId, schoolYearLabel: '2026–27', firstDay: '2026-10-12', lastDay: '2027-05-28', instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [] }
      localStorage.setItem('arc.calendar.v1', JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), input: calendarInput }))
      localStorage.setItem('arc.planningWorkspace.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, courses, sections, notes: [] } }))
      localStorage.setItem('arc.units.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, units } }))
      localStorage.setItem('arc.lessons.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, lessons, deliveryStates: [] } }))
      localStorage.setItem('arc.onboarding.v1', JSON.stringify({ schemaVersion: 1, stage: 'landed', dismissed: true, firstCapturePromptDismissed: true }))
    }, { calendarId, courses, sections, units, lessons })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await selectView(page, 'Day')
    await page.locator('.day-period-button').filter({ hasText: 'Period 4' }).click()
    await page.getByRole('button', { name: 'Start class' }).click()
    await shot(page, '12-arctable-teacher.png')
    await page.getByRole('button', { name: /Student preview/ }).click()
    await shot(page, '13-arctable-student.png')
    await context.close()
  }

  await contactSheet(browser)
  console.log(`Stage 7.2.1 shell emphasis evidence captured in ${evidenceDir}`)
} finally {
  await browser.close()
}
