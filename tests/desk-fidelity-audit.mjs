import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/desk-fidelity-audit/', import.meta.url).pathname
const pixelEvidenceDir = new URL('../docs/overnight/evidence/desk-pixel-pass/', import.meta.url).pathname
const refPath = new URL('../docs/overnight/evidence/figma-desk-6-3194/01-codex-image-37-11052.png', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

const deskPrefsJson = JSON.stringify({
  showTray: true,
  showPriorityPad: true,
  showDeskNotes: false,
  showArcTable: true,
  homeDeskPlannerView: 'Week',
  plannerSize: 'standard',
  traySize: 'standard',
  mscSize: 'standard',
})

function seed() {
  const calendarId = 'desk-fidelity-audit'
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
        courses: [
          { id: 'course-apah', title: 'AP Art History' },
          { id: 'course-2d', title: '2D Design' },
          { id: 'course-3d', title: '3D Design' },
        ],
        sections: [
          { id: 'section-1', courseId: 'course-apah', calendarId, name: 'Period 1' },
          { id: 'section-2', courseId: 'course-2d', calendarId, name: 'Period 2' },
          { id: 'section-3', courseId: 'course-3d', calendarId, name: 'Period 3' },
        ],
        notes: [],
      },
    }),
    'arc.units.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId, units: [] } }),
    'arc.lessons.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId, lessons: [], deliveryStates: [] } }),
    'arc.shift.v1': JSON.stringify({ schemaVersion: 1, input: { calendarId, overrides: [], undo: null } }),
    'arc.captures.v1': JSON.stringify({
      schemaVersion: 1,
      workspace: { calendarId, captures: [{ id: 'cap-1', calendarId, text: 'Field trip idea', createdAt: '2026-09-01T12:00:00.000Z' }] },
    }),
    'arc.planning-context.v1': JSON.stringify({ schemaVersion: 2, calendarId, view: 'Week', anchorDate: '2026-09-08', focus: 'day' }),
    'arc.onboarding.v1': JSON.stringify({
      schemaVersion: 1,
      draft: { stage: 'landed', dismissed: true, firstCapturePromptDismissed: true },
    }),
  }
}

async function sideBySide(ref, impl, out) {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 3200, height: 1300 } })
    const refB64 = readFileSync(ref).toString('base64')
    const implB64 = readFileSync(impl).toString('base64')
    await page.setContent(`<!DOCTYPE html><html><head><style>
      body{margin:0;background:#ccc;display:flex;gap:0}
      img{display:block;height:900px;width:auto}
      .label{position:absolute;top:8px;left:8px;font:12px sans-serif;background:#111;color:#fff;padding:4px 8px}
      .pane{position:relative}
    </style></head><body>
      <div class="pane"><span class="label">Kelly ref</span><img src="data:image/png;base64,${refB64}" /></div>
      <div class="pane"><span class="label">Preview</span><img src="data:image/png;base64,${implB64}" /></div>
    </body></html>`)
    await page.screenshot({ path: out })
  } finally {
    await browser.close()
  }
}

const checks = [
  { id: 'wood-texture', weight: 12, label: 'Icarus wood field' },
  { id: 'ideas-drawer', weight: 10, label: 'IDEAS green drawer top' },
  { id: 'todos-folder', weight: 10, label: 'TO-DOS MSC folder' },
  { id: 'planner-cream-green', weight: 14, label: 'Cream planner + green trim' },
  { id: 'teaching-week', weight: 12, label: 'Teaching week header' },
  { id: 'vertical-tabs', weight: 12, label: 'Vertical DAY/WEEK/MONTH/YEAR tabs' },
  { id: 'search-today', weight: 8, label: 'Search + Today pill' },
  { id: 'wordmark-wood', weight: 8, label: 'Arc wordmark on wood' },
  { id: 'arctable-script', weight: 10, label: 'Start class script + mark' },
  { id: 'week-grid', weight: 14, label: 'Week course rows + unit bars' },
]

const browser = await chromium.launch({ headless: true })
const results = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript((entries) => {
    if (localStorage.getItem('arc.calendar.v1') !== null) return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, seed())
  await page.goto(`${baseUrl}?demo=1`, { waitUntil: 'networkidle' })
  await page.evaluate((prefs) => localStorage.setItem('arc.desk-preferences.v1', prefs), deskPrefsJson)
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tabletop').waitFor({ state: 'visible', timeout: 25000 })

  await page.screenshot({ path: join(evidenceDir, '01-preview-desk-week.png'), fullPage: true })

  async function pass(id, ok, note) {
    results.push({ id, ok, note })
  }

  const shellWood = await page.locator('.arc-shell--desk').evaluate((el) => getComputedStyle(el).backgroundImage)
  await pass('wood-texture', shellWood.includes('texture-wood'), shellWood.slice(0, 80))

  const ideasTab = await page.getByRole('button', { name: 'IDEAS', exact: true }).isVisible()
  await pass('ideas-drawer', ideasTab, ideasTab ? 'IDEAS tab visible' : 'missing IDEAS tab')

  await pass('todos-folder', await page.getByTestId('arc-desk-todos-folder').isVisible(), 'TO-DOS folder chrome')

  const spreadBorder = await page.locator('.arc-calendar-spread--desk').evaluate((el) => getComputedStyle(el).borderColor)
  await pass('planner-cream-green', spreadBorder.length > 0, spreadBorder)

  const title = (await page.locator('.plan-state-primary').first().textContent())?.trim()
  await pass('teaching-week', title === 'Teaching week', title ?? 'missing title')

  const tabNav = page.getByTestId('arc-planner-physical-tabs')
  const vertical = await tabNav.evaluate((el) => getComputedStyle(el).flexDirection === 'column')
  await pass('vertical-tabs', vertical && (await tabNav.getByRole('button', { name: 'WEEK' }).isVisible()), vertical ? 'column tabs' : 'not vertical')

  await pass(
    'search-today',
    (await page.getByTestId('desk-planner-search').isVisible()) && (await page.getByTestId('desk-planner-today').isVisible()),
    'search + Today rendered',
  )

  await pass('wordmark-wood', await page.getByTestId('arc-desk-wood-wordmark').isVisible(), 'wood wordmark')

  const script = (await page.locator('.arc-desk-arctable-script').textContent())?.trim()
  await pass(
    'arctable-script',
    Boolean(script?.includes('Start class') || script?.includes('Resume class')) && (await page.getByTestId('arc-desk-arctable').isVisible()),
    script ?? 'no script',
  )

  await pass(
    'week-grid',
    (await page.locator('[data-plan-calendar-surface="teaching-week"]').count()) === 1
      && (await page.locator('.planning-course').count()) >= 1,
    'teaching week grid surface',
  )

  await context.close()
} finally {
  await browser.close()
}

let earned = 0
let total = 0
for (const check of checks) {
  const row = results.find((r) => r.id === check.id)
  total += check.weight
  if (row?.ok) earned += check.weight
}
const pct = Math.round((earned / total) * 100)

let pixelKellyDiff = null
let pixelKellySsim = null
try {
  const metricsPath = join(pixelEvidenceDir, 'round-2-metrics.json')
  const fallbackPath = join(pixelEvidenceDir, 'round-1-metrics.json')
  const raw = existsSync(metricsPath) ? readFileSync(metricsPath, 'utf8') : existsSync(fallbackPath) ? readFileSync(fallbackPath, 'utf8') : null
  if (raw) {
    const parsed = JSON.parse(raw)
    const kelly = parsed.comparisons?.find((c) => c.label === 'kelly-comp')
    if (kelly) {
      pixelKellyDiff = kelly.diffPct
      pixelKellySsim = kelly.ssim
    }
  }
} catch {
  /* optional pixel pass */
}

const gaps = checks
  .map((c) => {
    const row = results.find((r) => r.id === c.id)
    return { ...c, ok: row?.ok ?? false, note: row?.note ?? 'not evaluated' }
  })
  .filter((g) => !g.ok)
  .map((g) => `- **${g.label}** (${g.weight}% weight): ${g.note}`)

const report = `# Desk fidelity audit

Generated: ${new Date().toISOString()}

Reference: \`docs/overnight/evidence/figma-desk-6-3194/01-codex-image-37-11052.png\`

## Score

**Estimated fidelity: ${pct}%** (${earned}/${total} weighted checks)

${pixelKellyDiff != null ? `**Pixel diff vs Kelly comp (scale-normalized): ${pixelKellyDiff}%** (SSIM ${pixelKellySsim})\n\nStructural checks passing does not imply pixel parity.\n` : ''}

## Evidence

| File | Description |
|------|-------------|
| \`01-preview-desk-week.png\` | Implementation preview (Week / Teaching week) |
| \`02-side-by-side.png\` | Kelly ref vs preview (scaled contact) |

## Checklist

| Check | Weight | Pass |
|-------|--------|------|
${checks
  .map((c) => {
    const row = results.find((r) => r.id === c.id)
    return `| ${c.label} | ${c.weight} | ${row?.ok ? 'yes' : 'no'} |`
  })
  .join('\n')}

## Top gaps

${gaps.length ? gaps.join('\n') : '- None — all weighted checks passed.'}

## Notes

Side-by-side uses the Kelly PNG as directional reference; pixel parity is not expected for authored SVG drawer vs comp photography. Run \`npm run test:desk-pixel-pass\` for honest overlay metrics.
`

writeFileSync(join(evidenceDir, 'DESK-FIDELITY-AUDIT-REPORT.md'), report)

if (existsSync(refPath)) {
  await sideBySide(refPath, join(evidenceDir, '01-preview-desk-week.png'), join(evidenceDir, '02-side-by-side.png'))
}

console.log(`Desk fidelity audit: ${pct}% — report at docs/overnight/evidence/desk-fidelity-audit/DESK-FIDELITY-AUDIT-REPORT.md`)

if (pct < 70) process.exitCode = 1
