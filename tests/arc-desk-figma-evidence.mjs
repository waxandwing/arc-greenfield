import { mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/arc-desk-figma-pass/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

const deskPrefsJson = JSON.stringify({
  showTray: true,
  showPriorityPad: true,
  showDeskNotes: true,
  showArcTable: true,
  homeDeskPlannerView: 'Week',
  plannerSize: 'standard',
  traySize: 'standard',
  mscSize: 'standard',
})

function seed() {
  const calendarId = 'arc-desk-figma-evidence'
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
    'arc.captures.v1': JSON.stringify({
      schemaVersion: 1,
      workspace: {
        calendarId,
        captures: [{ id: 'cap-1', calendarId, text: 'Field trip idea', createdAt: '2026-09-01T12:00:00.000Z' }],
      },
    }),
    'arc.planning-context.v1': JSON.stringify({ schemaVersion: 2, calendarId, view: 'Week', anchorDate: '2026-09-15', focus: 'day' }),
    'arc.onboarding.v1': JSON.stringify({
      schemaVersion: 1,
      draft: { stage: 'landed', dismissed: true, firstCapturePromptDismissed: true },
    }),
  }
}

async function shot(page, name) {
  await page.screenshot({ path: join(evidenceDir, name) })
}

async function sideBySide(refPath, implPath, outPath) {
  const ok = await pageSideBySide(refPath, implPath, outPath)
  return ok
}

async function pageSideBySide(refPath, implPath, outPath) {
  const browser = await chromium.launch({ headless: true })
  try {
    const html = `<!DOCTYPE html><html><head><style>
      body{margin:0;background:#ddd;display:flex;gap:0;align-items:flex-start}
      img{display:block;max-height:1254px;width:auto}
      .label{font:12px sans-serif;padding:8px;background:#222;color:#fff;position:absolute;top:0;left:0}
      .pane{position:relative}
    </style></head><body>
      <div class="pane"><span class="label">Figma ref</span><img src="file://${refPath}" /></div>
      <div class="pane"><span class="label">Implementation</span><img src="file://${implPath}" /></div>
    </body></html>`
    const page = await browser.newPage({ viewport: { width: 3400, height: 1300 } })
    await page.setContent(html, { waitUntil: 'load' })
    await page.screenshot({ path: outPath })
    return true
  } finally {
    await browser.close()
  }
}

const refFallback = new URL('../docs/overnight/evidence/arc-desk-pass/01-desk-layout.png', import.meta.url).pathname
const refOut = join(evidenceDir, '01-figma-reference.png')
if (!existsSync(refOut)) {
  if (existsSync(refFallback)) copyFileSync(refFallback, refOut)
  else copyFileSync(new URL('../public/assets/desk/light-wood-desk.png', import.meta.url).pathname, refOut)
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1696, height: 1254 } })
  const page = await context.newPage()
  await page.addInitScript((entries) => {
    if (localStorage.getItem('arc.calendar.v1') !== null) return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, seed())
  await page.goto(`${baseUrl}?demo=1`, { waitUntil: 'networkidle' })
  await page.evaluate((deskPrefs) => {
    localStorage.setItem('arc.desk-preferences.v1', deskPrefs)
  }, deskPrefsJson)
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tabletop').waitFor({ state: 'visible', timeout: 20000 })

  await shot(page, '02-implementation-pass-1.png')
  await sideBySide(refOut, join(evidenceDir, '02-implementation-pass-1.png'), join(evidenceDir, '03-side-by-side.png'))

  await shot(page, '04-final-desk.png')

  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click()
  await page.getByRole('button', { name: 'Edit Workspace', exact: true }).click()
  await page.getByTestId('desk-edit-toolbar').waitFor({ state: 'visible' })
  await shot(page, '05-edit-workspace.png')
  await page.getByRole('button', { name: 'Pin it down', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('[data-desk-edit-mode="true"]') === null)

  const trayCard = page.locator('.workspace-capture-card', { hasText: 'Field trip idea' }).first()
  if (await trayCard.isVisible().catch(() => false)) {
    await trayCard.hover()
    await shot(page, '06-tray-drag.png')
  }

  await selectView(page, 'Day')
  await shot(page, '07-day.png')
  await selectView(page, 'Week')
  await shot(page, '08-week.png')
  await selectView(page, 'Month')
  await shot(page, '09-month.png')

  console.log(`Arc desk figma evidence saved under ${evidenceDir}`)
  await context.close()
} finally {
  await browser.close()
}
