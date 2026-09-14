import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/arc-desk-mark/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function seed() {
  const calendarId = 'arc-desk-mark'
  return {
    'arc.calendar.v1': JSON.stringify({
      schemaVersion: 1,
      savedAt: '2026-09-15T12:00:00.000Z',
      input: {
        id: calendarId,
        schoolYearLabel: '2026–27',
        firstDay: '2026-08-10',
        lastDay: '2027-05-28',
        instructionalWeekdays: [1, 2, 3, 4, 5],
        patternSource: 'manual',
        patternConfidence: 'confirmed',
        exceptions: [],
        quarters: [{ id: 'q1', label: 'Q1', startDate: '2026-08-10', endDate: '2026-10-16' }],
        semesters: [],
      },
    }),
    'arc.planningWorkspace.v1': JSON.stringify({
      schemaVersion: 1,
      input: {
        calendarId,
        courses: [{ id: 'course-1', title: 'Studio Art' }],
        sections: [{ id: 'section-1', courseId: 'course-1', calendarId, name: 'Period 1' }],
        notes: [],
      },
    }),
    'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId, units: [] } }),
    'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId, lessons: [], deliveryStates: [] } }),
    'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId, overrides: [], undo: null } }),
    'arc.captures.v1': JSON.stringify({ schemaVersion: 1, workspace: { calendarId, captures: [] } }),
    'arc.planning-context.v1': JSON.stringify({ schemaVersion: 2, calendarId, view: 'Month', anchorDate: '2026-09-15', focus: 'day' }),
    'arc.desk-preferences.v1': JSON.stringify({ showTray: true, showPriorityPad: true, showDeskNotes: false, homeDeskPlannerView: 'Month' }),
  }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  await page.addInitScript((entries) => {
    if (localStorage.getItem('arc.calendar.v1') !== null) return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, seed())
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  assert(await page.locator('.arc-shell--desk').count() === 1, 'Desk shell must render.')
  assert(await page.getByTestId('arc-desk-arctable-anchor').isVisible(), 'ArcTable mark anchor must render on desk.')
  assert(await page.getByTestId('arc-desk-arctable').isVisible(), 'ArcTable desk fixture must render.')
  assert(await page.locator('.arc-desk-mark-svg').count() === 1, 'Desk fixture must use inline SVG mark, not raster quadrants.')
  await shot(page, '01-desk-mark-idle.png')

  const fixture = page.getByTestId('arc-desk-arctable')
  assert(await fixture.getAttribute('data-quadrant-mode') === 'true', 'Default viewport must enable quadrant launcher.')
  await fixture.locator('.arc-desk-mark-quadrant--live').hover()
  await shot(page, '02-live-quadrant-hover.png')

  await fixture.locator('.arc-desk-mark-quadrant--live').click()
  assert(await page.getByRole('heading', { name: 'Explore ArcTable on your desk' }).isVisible(), 'Free preview must open Explore ArcTable dialog from Live quadrant.')
  await shot(page, '03-explore-arctable-preview.png')

  console.log('Arc desk mark smoke passed: AT-001 SVG fixture, quadrant hover, free preview gate.')
  await context.close()
} finally {
  await browser.close()
}
