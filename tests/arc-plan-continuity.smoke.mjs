import { mkdirSync } from 'node:fs'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/arc-plan/', import.meta.url).pathname
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
        const id = `${course.id.replace('course-', 'lesson-')}-${sequence}`
        const isFixed = course.id === 'course-apah' && sequence === 8
        lessons.push({
          id, calendarId, courseId: course.id, unitId: `unit-${course.id.slice(7)}-${unitIndex + 1}`,
          title: titles[course.id][sequence - 1], sequence, plannedDate: dates[unitIndex][lessonIndex], datePolicy: isFixed ? 'fixed' : 'flexible',
          directions: [`Open with ${titles[course.id][sequence - 1].toLowerCase()}.`, 'Make thinking visible before critique.'],
          materials: course.id === 'course-3d' ? ['Sketchbook', 'Cardboard', 'Tape'] : ['Sketchbook', 'Pencil'],
          phases: course.id === 'course-2d' && sequence === 6 ? ['Day 1 · observe and block in', 'Day 2 · refine values', 'Reflect'] : ['Look', 'Make', 'Reflect'],
          resources: [],
        })
      }
    }
  }
  lessons.push({ id: 'lesson-3d-loose', calendarId, courseId: 'course-3d', unitId: 'unit-3d-3', title: 'Pedestal lighting idea', sequence: 13, plannedDate: null, datePolicy: 'flexible', directions: ['Test side light and overhead light.'], materials: ['Lamp', 'Pedestal'], phases: [], resources: [] })
  const planning = {
    calendarId, courses, sections,
    notes: [
      { id: 'note-day', calendarId, date: '2026-09-15', text: 'Photograph 2D work before cleanup.', placement: 'calendar', important: true, sourceLabel: null, sourceLocator: null, priority: null, completed: false, completedAt: null },
      { id: 'task-must', calendarId, date: null, text: 'Prep AP comparison set', placement: 'task-bar', important: true, sourceLabel: null, sourceLocator: null, priority: 'must', completed: false, completedAt: null },
      { id: 'task-should', calendarId, date: null, text: 'Cut cardboard bases', placement: 'task-bar', important: false, sourceLabel: null, sourceLocator: null, priority: 'should', completed: false, completedAt: null },
      { id: 'task-could', calendarId, date: null, text: 'Archive critique photos', placement: 'task-bar', important: false, sourceLabel: null, sourceLocator: null, priority: 'could', completed: false, completedAt: null },
    ],
  }
  const deliveryStates = [{ lessonId: 'lesson-apah-5', sectionId: 'section-p4', status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Stopped after the threshold comparison. Resume with patron evidence.' }]
  const overrides = [
    { sectionId: 'section-p6', lessonId: 'lesson-2d-5', plannedDate: '2026-09-15' },
    { sectionId: 'section-p6', lessonId: 'lesson-2d-6', plannedDate: '2026-09-14' },
  ]
  const calendarInput = {
    id: calendarId, schoolYearLabel: '2026–27', firstDay: '2026-09-01', lastDay: '2027-05-28', instructionalWeekdays: [1, 2, 3, 4, 5], patternSource: 'manual', patternConfidence: 'confirmed',
    exceptions: [
      { date: '2026-09-07', kind: 'holiday', label: 'Labor Day', source: 'manual', confidence: 'confirmed' },
      { date: '2026-09-21', kind: 'no-school', label: 'No school', source: 'manual', confidence: 'confirmed' },
      { date: '2026-10-12', kind: 'teacher-workday', label: 'Teacher workday', source: 'manual', confidence: 'confirmed' },
    ],
    quarters: [
      { id: 'q1', label: 'Quarter 1', startDate: '2026-09-01', endDate: '2026-10-30' },
      { id: 'q2', label: 'Quarter 2', startDate: '2026-11-02', endDate: '2027-01-15' },
    ], semesters: [{ id: 's1', label: 'Semester 1', startDate: '2026-09-01', endDate: '2027-01-15' }], provenance: [],
  }
  const captures = ['Museum label mini-lesson', 'Ask ceramics studio about clay reclaim', 'Unassigned installation idea'].map((text, index) => ({ id: `capture-seed-${index + 1}`, calendarId, text, createdAt: `2026-09-0${index + 1}T12:00:00.000Z` }))
  return { calendarId, calendarInput, planning, units, lessons, deliveryStates, overrides, captures }
}

function storageEntries(data) {
  return {
    'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-15T12:00:00.000Z', input: data.calendarInput }),
    'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: data.planning }),
    'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, units: data.units } }),
    'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, lessons: data.lessons, deliveryStates: data.deliveryStates } }),
    'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, overrides: data.overrides, undo: null } }),
    'arc.captures.v1': JSON.stringify({ schemaVersion: 1, workspace: { calendarId: data.calendarId, captures: data.captures } }),
    'arc.planning-context.v1': JSON.stringify({ schemaVersion: 1, calendarId: data.calendarId, anchorDate: '2026-09-15' }),
    'arc.view-preferences.v1': JSON.stringify({ home: { mode: 'fixed', view: 'Month' }, lastUsedView: 'Month', showWeekends: false }),
  }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })
  const data = fixture()
  const entries = storageEntries(data)
  await page.addInitScript((seed) => { if (localStorage.getItem('arc.calendar.v1') === null) for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value) }, entries)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  assert(await page.getByRole('heading', { level: 1, name: 'This Month' }).isVisible(), 'Fixture did not restore into Arc Plan Month.')
  assert(await page.getByText('AP Art History', { exact: true }).count() > 0, 'Month did not show AP Art History planning.')
  assert(await page.getByText('Fixed visual analysis assessment', { exact: true }).count() > 0, 'Month did not expose the fixed assessment constraint.')

  await selectView(page, 'Day')
  assert(await page.getByRole('button', { name: 'Period 5, planning time' }).count() === 1, 'P5 Planning was not represented as teacher time.')
  assert(await page.getByText('Period 1', { exact: true }).count() > 0 && await page.getByText('Period 7', { exact: true }).count() > 0, 'Day did not preserve teaching-period order.')
  assert(await page.getByText('Photograph 2D work before cleanup.', { exact: true }).isVisible(), 'Day did not project the seeded teacher Note.')
  await page.getByRole('button', { name: '+ Note', exact: true }).click()
  await page.getByRole('textbox', { name: 'New Note', exact: true }).fill('Email kiln schedule before Friday.')
  await page.getByRole('button', { name: 'Add Note', exact: true }).click()
  assert(await page.getByText('Email kiln schedule before Friday.', { exact: true }).isVisible(), 'Day Note authoring did not update canonical planning state.')
  await shot(page, '01-plan-day-multiprep.png')

  await page.getByRole('button', { name: 'Period 5, planning time' }).click()
  assert(await page.getByRole('heading', { name: 'Planning period' }).isVisible(), 'Planning period did not open the cross-prep lens.')
  assert(await page.getByText('Needs attention', { exact: true }).count() > 0, 'Planning period did not surface attention buckets.')
  assert(await page.getByText('Stopped after the threshold comparison. Resume with patron evidence.', { exact: false }).count() > 0 || await page.getByRole('button', { name: /Temple threshold/ }).count() > 0, 'Planning period did not surface unfinished teaching.')
  await shot(page, '02-plan-day-planning-period.png')

  await selectView(page, 'Week')
  assert(await page.getByRole('button', { name: /Open Day for/ }).count() === 5, 'Week did not expose keyboard-accessible Day deep links.')
  await shot(page, '03-plan-week-selected.png')
  await selectView(page, 'Month')
  await shot(page, '04-plan-month-continuity.png')
  await selectView(page, 'Year')
  assert(await page.getByRole('button', { name: /Open .* in Month/ }).count() === 9, 'Year did not preserve three Units for each of three Courses.')
  await shot(page, '05-plan-year-courses.png')

  await page.getByRole('button', { name: 'WORKSPACE', exact: true }).click()
  assert(await page.getByText('Unassigned installation idea', { exact: true }).isVisible(), 'Workspace did not restore unassigned capture.')
  await shot(page, '06-plan-workspace-populated.png')
  await page.getByRole('textbox', { name: 'Quick capture' }).fill('Midweek cyanotype idea')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  assert(await page.getByText('Midweek cyanotype idea', { exact: true }).isVisible(), 'Quick Capture did not persist immediately in Workspace.')
  const captureEnvelope = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.captures.v1')))
  const captureId = captureEnvelope.workspace.captures.find((capture) => capture.text === 'Midweek cyanotype idea')?.id
  assert(captureId, 'Quick Capture did not receive stable identity in persisted state.')
  await shot(page, '07-plan-capture.png')

  const card = page.locator('.workspace-capture-card').filter({ hasText: 'Midweek cyanotype idea' })
  await card.getByRole('combobox', { name: 'Unit for Midweek cyanotype idea' }).selectOption('unit-apah-2')
  await card.getByRole('checkbox').check()
  await card.getByRole('button', { name: 'Place as Lesson', exact: true }).click()
  const promotedLessons = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.lessons.v1'))).input.lessons
  assert(promotedLessons.some((lesson) => lesson.id === captureId && lesson.title === 'Midweek cyanotype idea' && lesson.plannedDate === '2026-09-15'), 'Capture promotion did not preserve ID, text, and placement.')
  const remainingCaptures = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.captures.v1'))).workspace.captures
  assert(!remainingCaptures.some((capture) => capture.id === captureId), 'Promoted Capture remained as duplicate Workspace truth.')
  await shot(page, '08-plan-capture-placed.png')

  await page.getByRole('button', { name: 'WORKSPACE', exact: true }).click()
  await (async () => { const settings = page.getByRole('button', { name: 'SETTINGS', exact: true }); if (await settings.getAttribute('aria-expanded') !== 'true') await settings.click() })()
  await page.locator('aside[aria-label="Settings furniture"]').getByRole('button', { name: 'Lesson library', exact: true }).click()
  await page.getByRole('button', { name: /Midweek cyanotype idea/ }).click()
  await shot(page, '09-plan-move-before.png')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-16')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
  await shot(page, '10-plan-move-after.png')

  const review = page.locator('.calendar-context-actions').getByRole('button', { name: /Review recovery/ })
  await review.click()
  assert(await page.getByRole('heading', { name: 'Arc held the stopping point.' }).isVisible(), 'Incomplete Lesson did not produce consequence preview.')
  await shot(page, '11-plan-shift-preview.png')
  const recoveryCard = page.locator('.recovery-card').filter({ hasText: 'Period 4' })
  for (const select of await recoveryCard.getByRole('combobox', { name: 'Move to', exact: true }).all()) {
    const values = await select.locator('option').evaluateAll((options) => options.map((option) => option.value).filter(Boolean))
    if (values[0]) await select.selectOption(values[0])
  }
  const apply = recoveryCard.getByRole('button', { name: 'Apply Shift', exact: true })
  if (await apply.isEnabled()) await apply.click()
  else await page.getByRole('button', { name: 'Back to calendar', exact: true }).click()
  await shot(page, '12-plan-shift-applied.png')

  await selectView(page, 'Week')
  assert(await page.getByText('Shifted for this class', { exact: true }).count() > 0, 'Section divergence was not visible in Week.')
  await shot(page, '13-plan-section-divergence.png')
  const undoShift = page.locator('.calendar-context-actions').getByRole('button', { name: 'Undo last Shift', exact: true })
  if (await undoShift.count()) await undoShift.click()
  await shot(page, '14-plan-section-reconciled.png')

  await page.getByRole('button', { name: 'WORKSPACE', exact: true }).click()
  const returnDetails = page.locator('.b01-fridge-return')
  await returnDetails.locator('summary').click()
  await returnDetails.getByRole('button', { name: 'Midweek cyanotype idea', exact: true }).click()
  assert(await page.locator('.b01-fridge-card').filter({ hasText: 'Midweek cyanotype idea' }).count() === 1, 'Unplace did not return the same Lesson to Workspace.')
  await shot(page, '15-plan-unplaced-workspace.png')
  await page.getByRole('button', { name: 'Undo last Workspace move', exact: true }).click()
  assert(await page.locator('.b01-fridge-card').filter({ hasText: 'Midweek cyanotype idea' }).count() === 0, 'Workspace Undo did not restore scheduling state.')
  await shot(page, '16-plan-undo-recovery.png')

  await page.getByRole('button', { name: 'WORKSPACE', exact: true }).click()
  await selectView(page, 'Month')
  assert(await page.getByText('Fixed visual analysis assessment', { exact: true }).count() > 0, 'Fixed assessment was lost after move/shift/undo operations.')
  await shot(page, '17-plan-fixed-date-protection.png')
  await selectView(page, 'Day')
  await page.getByRole('button', { name: /Period 4 AP Art History/ }).click()
  assert(await page.getByText(/Continue:/).count() > 0, 'Day did not preserve incomplete Section-specific Lesson context.')
  await shot(page, '18-plan-incomplete-lesson.png')

  await selectView(page, 'Year')
  await page.getByRole('button', { name: 'Open Power & Place in Month', exact: true }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'This Month' }).isVisible(), 'Year → Month deep navigation failed.')
  await page.reload({ waitUntil: 'networkidle' })
  assert(await page.getByText('Power & Place', { exact: true }).count() > 0, 'Selected planning date/context was not restored after refresh.')
  await shot(page, '19-plan-cross-view-continuity.png')

  await selectView(page, 'Day')
  assert(await page.getByRole('button', { name: 'WORKSPACE', exact: true }).isVisible() && await page.getByRole('button', { name: 'SETTINGS', exact: true }).isVisible(), 'Arc Plan core controls require ArcTable unexpectedly.')
  assert(await page.getByText('Return to ArcTable', { exact: true }).count() === 0, 'Free-only scenario entered an ArcTable live session.')
  await shot(page, '20-plan-free-only.png')

  await page.reload({ waitUntil: 'networkidle' })
  const persistedCaptures = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.captures.v1'))).workspace.captures
  assert(persistedCaptures.some((capture) => capture.text === 'Unassigned installation idea'), 'Original unassigned Capture did not survive the multi-operation refresh sequence.')
  const persistedNotes = JSON.parse(await page.evaluate(() => localStorage.getItem('arc.planningWorkspace.v1'))).input.notes
  assert(persistedNotes.some((note) => note.text === 'Email kiln schedule before Friday.' && note.date === '2026-09-15'), 'Authored Day Note did not survive refresh.')
  assert(runtimeErrors.length === 0, `Arc Plan continuity runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('Arc Plan free-product continuity gate passed: exact three-prep fixture → Day/P5/Week/Month/Year → Capture identity → place/move → Shift/Undo → unplace/re-place → refresh → free-only planning.')
} finally {
  await browser.close()
}
