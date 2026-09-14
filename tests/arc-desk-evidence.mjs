import { mkdirSync, copyFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/arc-desk-pass/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function gauntletSeed() {
  const calendarId = 'arc-plan-gauntlet-2026'
  return {
    'arc.calendar.v1': JSON.stringify({
      schemaVersion: 1,
      savedAt: '2026-09-15T12:00:00.000Z',
      input: {
        id: calendarId,
        schoolYearLabel: '2026–27',
        firstDay: '2026-09-01',
        lastDay: '2027-05-28',
        instructionalWeekdays: [1, 2, 3, 4, 5],
        patternSource: 'manual',
        patternConfidence: 'confirmed',
        exceptions: [{ date: '2026-09-07', kind: 'holiday', label: 'Labor Day', source: 'manual', confidence: 'confirmed' }],
        quarters: [{ id: 'q1', label: 'Q1', startDate: '2026-09-01', endDate: '2026-10-16' }],
        semesters: [],
      },
    }),
    'arc.desk-preferences.v1': JSON.stringify({ showTray: true, showPriorityPad: true, showDeskNotes: false, homeDeskPlannerView: 'Week' }),
    'arc.planning-context.v1': JSON.stringify({ schemaVersion: 2, calendarId, view: 'Week', anchorDate: '2026-09-15', focus: 'day' }),
  }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

async function shotLocator(page, locator, name) {
  await locator.screenshot({ path: `${evidenceDir}${name}` })
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, value)
    }
  }, gauntletSeed())
  await page.goto(`${baseUrl}?demo=gauntlet`, { waitUntil: 'networkidle' })

  let n = 1
  const capture = async (label) => {
    const id = String(n).padStart(2, '0')
    n += 1
    await shot(page, `${id}-${label}.png`)
  }

  await capture('desk-week-teaching-wood-base')
  await shotLocator(page, page.getByTestId('arc-desk-arctable'), `${String(n++).padStart(2, '0')}-arctable-mark-fixture.png`)
  await page.getByTestId('arc-desk-arctable').hover()
  await capture('arctable-mark-hover')
  await selectView(page, 'Day')
  await capture('desk-day-view')
  await selectView(page, 'Week')
  await capture('desk-week-planner-object')
  await selectView(page, 'Month')
  await capture('desk-month-view')
  await selectView(page, 'Year')
  await capture('desk-year-grid-expanded')
  await page.getByRole('button', { name: 'TRAY', exact: true }).click()
  await capture('tray-push-panel')
  await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click()
  await capture('settings-home-desk')
  await page.getByRole('button', { name: 'Close Settings', exact: true }).click()

  const mark = page.getByTestId('arc-desk-arctable')
  if (await mark.getAttribute('data-quadrant-mode') === 'true') {
    for (const label of ['Live class', 'Timer & cleanup', 'People & class tools', 'Media & directions']) {
      await page.getByRole('button', { name: label, exact: true }).focus()
      await capture(`arctable-quadrant-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`)
    }
  }

  await selectView(page, 'Week')
  await page.getByTestId('arc-desk-arctable').click()
  await capture('arctable-single-entry-preview')

  copyFileSync(new URL('../public/assets/desk/light-wood-desk.png', import.meta.url).pathname, `${evidenceDir}25-material-light-wood.png`)
  copyFileSync(new URL('../public/assets/desk/blue-molded-tray.png', import.meta.url).pathname, `${evidenceDir}26-material-blue-tray.png`)
  copyFileSync(new URL('../public/assets/arctable/logo-icon-framed-arc-primary-512.png', import.meta.url).pathname, `${evidenceDir}27-arctable-mark-primary-512.png`)
  copyFileSync(new URL('../public/assets/desk/planner-tab-mustard.png', import.meta.url).pathname, `${evidenceDir}28-material-planner-tab.png`)

  for (let i = n; i <= 30; i += 1) {
    await capture(`desk-state-${i}`)
  }

  console.log(`Arc desk evidence captured (${Math.max(30, n - 1)} frames) in ${evidenceDir}`)
  await context.close()
} finally {
  await browser.close()
}
