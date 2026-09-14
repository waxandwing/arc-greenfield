import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/repair-pass-3-tabs/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function fixture() {
  const calendarId = 'arc-plan-gauntlet-2026'
  const calendarInput = {
    id: calendarId,
    schoolYearLabel: '2026–27',
    firstDay: '2026-09-01',
    lastDay: '2027-05-28',
    instructionalWeekdays: [1, 2, 3, 4, 5],
    patternSource: 'manual',
    patternConfidence: 'confirmed',
    exceptions: [],
    quarters: [],
    semesters: [],
    provenance: [],
  }
  const planning = {
    calendarId,
    courses: [{ id: 'course-apah', title: 'AP Art History' }],
    sections: [{ id: 'section-p1', calendarId, courseId: 'course-apah', name: 'Period 1' }],
    notes: [],
    teachingDay: {
      blocks: [
        { id: 'b1', label: 'Period 1', type: 'teaching', order: 1, sectionId: 'section-p1', startTime: null, endTime: null },
        { id: 'b2', label: 'Planning', type: 'planning', order: 2, sectionId: null, startTime: null, endTime: null },
      ],
    },
  }
  return {
    calendarId,
    calendarInput,
    planning,
    units: [{ id: 'unit-apah-1', calendarId, courseId: 'course-apah', title: 'Unit 1', placement: { startDate: '2026-09-01', endDate: '2026-09-11' } }],
    lessons: [],
    deliveryStates: [],
    overrides: [],
    context: { anchorDate: '2026-09-15', activeView: 'Day', planContext: { focus: 'day' } },
  }
}

function storageEntries(data) {
  return {
    'arc.calendar.v1': JSON.stringify({ schemaVersion: 1, savedAt: '2026-09-15T12:00:00.000Z', input: data.calendarInput }),
    'arc.planningWorkspace.v1': JSON.stringify({ schemaVersion: 1, input: data.planning }),
    'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, units: data.units } }),
    'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, lessons: data.lessons, deliveryStates: data.deliveryStates } }),
    'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId: data.calendarId, overrides: data.overrides, undo: null } }),
    'arc.captures.v1': JSON.stringify({ schemaVersion: 1, workspace: { calendarId: data.calendarId, captures: [] } }),
    'arc.planning-context.v1': JSON.stringify(data.context),
    'arc.onboarding.v1': JSON.stringify({ schemaVersion: 1, draft: { stage: 'landed', dismissed: true, firstCapturePromptDismissed: true } }),
  }
}

async function seed(page, data) {
  await page.goto(`${baseUrl}/`)
  await page.evaluate((entries) => {
    for (const [key, value] of Object.entries(entries)) window.localStorage.setItem(key, value)
  }, storageEntries(data))
  await page.reload({ waitUntil: 'networkidle' })
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}/${name}.png`, fullPage: false })
}

const browser = await chromium.launch()
const data = fixture()

try {
  const desktop = await browser.newPage({ viewport: { width: 1366, height: 900 } })
  await seed(desktop, data)
  await shot(desktop, 'day-tabs-closed')
  await selectView(desktop, 'Week')
  await shot(desktop, 'week-tabs-closed')

  const viewBefore = await desktop.locator('.arc-index-tab[aria-current="page"]').textContent()
  await desktop.getByRole('button', { name: 'WORKSPACE' }).click()
  assert(await desktop.locator('.b01-furniture-composition').getAttribute('data-side-panel') === 'workspace', 'Workspace push panel open.')
  await shot(desktop, 'workspace-open-push')
  await desktop.getByRole('button', { name: 'Close Workspace' }).click()
  assert((await desktop.locator('.arc-index-tab[aria-current="page"]').textContent()) === viewBefore, 'Exact return after workspace close.')

  await desktop.getByRole('button', { name: 'SETTINGS' }).click()
  assert(await desktop.locator('.b01-furniture-composition').getAttribute('data-side-panel') === 'settings', 'Settings push panel open.')
  await shot(desktop, 'settings-open-push')

  const tabsBg = await desktop.locator('.arc-index-tabs').evaluate((el) => getComputedStyle(el).backgroundColor)
  assert(tabsBg === 'rgba(0, 0, 0, 0)', 'Index tabs must not use solid dark rail fill.')

  const tablet = await browser.newPage({ viewport: { width: 820, height: 900 } })
  await seed(tablet, data)
  await tablet.getByRole('button', { name: 'WORKSPACE' }).click()
  await shot(tablet, 'tablet-workspace-overlay')

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await seed(mobile, data)
  await mobile.getByRole('button', { name: 'SETTINGS' }).click()
  await shot(mobile, 'mobile-settings')

  console.log('repair pass 3 tabs smoke passed')
} finally {
  await browser.close()
}
