import { mkdirSync } from 'node:fs'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/interaction-laws/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function fixture() {
  const calendarId = 'arc-interaction-laws-2026'
  const planning = {
    calendarId,
    courses: [{ id: 'course-apah', title: 'AP Art History' }],
    sections: [{ id: 'section-p1', courseId: 'course-apah', calendarId, name: 'Period 1' }],
    teachingDay: {
      blocks: [{
        id: 'block-p1',
        label: 'Period 1',
        type: 'teaching',
        order: 1,
        sectionId: 'section-p1',
        startTime: '08:00',
        endTime: '08:50',
      }],
    },
    notes: [{
      id: 'note-day',
      calendarId,
      date: '2026-09-15',
      text: 'Photograph 2D work before cleanup.',
      placement: 'calendar',
      important: true,
      sourceLabel: null,
      sourceLocator: null,
      priority: null,
      completed: false,
      completedAt: null,
    }],
  }
  const calendarInput = {
    id: calendarId,
    schoolYearLabel: '2026–27',
    firstDay: '2026-09-01',
    lastDay: '2027-05-28',
    instructionalWeekdays: [1, 2, 3, 4, 5],
    patternSource: 'manual',
    patternConfidence: 'confirmed',
    exceptions: [],
    quarters: [{ id: 'q1', label: 'Quarter 1', startDate: '2026-09-01', endDate: '2026-10-30' }],
    semesters: [{ id: 's1', label: 'Semester 1', startDate: '2026-09-01', endDate: '2027-01-15' }],
    provenance: [],
  }
  const units = [{ id: 'unit-apah-1', calendarId, courseId: 'course-apah', title: 'Looking & Meaning', placement: { startDate: '2026-09-01', endDate: '2026-09-30' } }]
  const lessons = [{
    id: 'lesson-apah-1',
    calendarId,
    courseId: 'course-apah',
    unitId: 'unit-apah-1',
    title: 'Reading an image',
    sequence: 1,
    plannedDate: '2026-09-15',
    datePolicy: 'flexible',
    directions: ['Look slowly'],
    materials: ['Sketchbook'],
    phases: ['Look'],
    resources: [],
    important: true,
  }]
  const captures = {
    calendarId,
    captures: [{ id: 'capture-1', calendarId, text: 'Museum label mini-lesson', createdAt: '2026-09-01T12:00:00.000Z', important: true }],
  }
  return { calendarId, calendarInput, planning, units, lessons, captures }
}

function storageEntries(data) {
  return {
    'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-15T12:00:00.000Z', input: data.calendarInput }),
    'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: data.planning }),
    'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, units: data.units } }),
    'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, lessons: data.lessons, deliveryStates: [] } }),
    'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, overrides: [], undo: null } }),
    'arc.captures.v1': JSON.stringify({ schemaVersion: 1, workspace: data.captures }),
    'arc.planning-context.v1': JSON.stringify({ schemaVersion: 1, calendarId: data.calendarId, anchorDate: '2026-09-15' }),
    'arc.view-preferences.v1': JSON.stringify({ home: { mode: 'fixed', view: 'Month' }, lastUsedView: 'Month', showWeekends: false }),
  }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

const browser = await chromium.launch({ headless: true })
try {
  const data = fixture()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  await page.addInitScript((seed) => {
    if (localStorage.getItem('arc.calendar.v1') === null) {
      for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value)
    }
  }, storageEntries(data))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  assert(await page.locator('.calendar-day-note-text', { hasText: 'Photograph 2D work before cleanup.' }).first().isVisible(), 'Month cell must show Day Note above curriculum.')
  assert(await page.locator('.arc-important-object--marked').count() > 0, 'Important ring must render on marked Day Note.')
  await shot(page, '01-month-day-notes.png')

  await selectView(page, 'Day')
  assert(await page.getByText('Photograph 2D work before cleanup.', { exact: true }).isVisible(), 'Day view must show Day Notes above teaching sequence.')
  await page.getByRole('button', { name: /Add note for/i }).click()
  await page.getByRole('textbox', { name: 'New day note' }).fill('Email kiln schedule before Friday.')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await shot(page, '02-day-notes-above-sequence.png')

  await page.locator('.calendar-day-note-text', { hasText: 'Email kiln schedule before Friday.' }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Move to date…' }).waitFor({ state: 'visible' })
  await shot(page, '03-move-to-date-menu.png')

  await selectView(page, 'Month')
  await page.locator('.planning-month-signal').first().click({ button: 'right' })
  await page.getByRole('menuitem', { name: /Important/ }).first().waitFor({ state: 'visible' })
  await shot(page, '04-important-ring-lesson.png')

  await page.getByRole('button', { name: 'WORKSPACE', exact: true }).click()
  await page.locator('.workspace-capture-card').first().click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Remove Important' }).click()
  await shot(page, '05-capture-important-menu.png')

  console.log('interaction laws evidence captured')
} finally {
  await browser.close()
}
