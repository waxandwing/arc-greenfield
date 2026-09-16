import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

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
    'arc.desk-preferences.v1': JSON.stringify({ showTray: true, showPriorityPad: true, showDeskNotes: false, showArcTable: true, homeDeskPlannerView: 'Week' }),
    'arc.onboarding.v1': JSON.stringify({
      schemaVersion: 1,
      draft: { stage: 'landed', dismissed: true, firstCapturePromptDismissed: true },
    }),
  }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

async function dismissArcTablePreview(page, { via = 'close-button' } = {}) {
  const layer = page.locator('.arc-desk-arctable-preview-layer')
  await layer.waitFor({ state: 'visible' })
  if (via === 'backdrop') {
    await layer.click({ position: { x: 12, y: 12 } })
  } else if (via === 'escape') {
    await page.keyboard.press('Escape')
  } else {
    await layer.getByRole('button', { name: 'Close', exact: true }).click()
  }
  await layer.waitFor({ state: 'hidden' })
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
  assert(await page.locator('.arc-desk-mark-svg image').count() === 1, 'Desk fixture must reference canonical AT-001 SVG asset.')
  const markHref = await page.locator('.arc-desk-mark-svg image').getAttribute('href')
  assert(
    markHref?.includes('assets/arctable/arctable-quadrant-mark.png'),
    'Desk mark must use Kelly ArcTable quadrant mark under public assets.',
  )
  const markAssetOk = await page.evaluate(async (url) => {
    const res = await fetch(url)
    return res.ok
  }, markHref)
  assert(markAssetOk, 'ArcTable desk mark raster must load (base-aware URL).')
  await shot(page, '01-desk-mark-idle.png')

  const fixture = page.getByTestId('arc-desk-arctable')
  assert(await fixture.getAttribute('data-quadrant-mode') === 'true', 'Default viewport must enable five-target launcher.')
  await fixture.locator('.arc-desk-mark-quadrant--live').hover({ force: true })
  await shot(page, '02-live-quadrant-hover.png')

  await page.getByRole('button', { name: 'Start class', exact: true }).focus()
  await page.keyboard.press('Enter')
  assert(await page.getByRole('heading', { name: 'Start or resume today’s class' }).isVisible(), 'Free preview must open contextual Start class dialog.')
  await shot(page, '03-explore-arctable-preview.png')

  await dismissArcTablePreview(page)
  await page.getByRole('button', { name: 'Timer & cleanup', exact: true }).focus()
  await page.keyboard.press('Enter')
  assert(await page.getByRole('heading', { name: 'Preview classroom timer' }).isVisible(), 'Free timer quadrant must show contextual preview.')
  await shot(page, '04-timer-preview.png')

  await dismissArcTablePreview(page, { via: 'escape' })
  await page.getByRole('button', { name: 'Open ArcTable', exact: true }).focus()
  await page.keyboard.press('Enter')
  assert(await page.getByRole('heading', { name: 'Open ArcTable from your desk' }).isVisible(), 'Center cream must open ArcTable home preview when not entitled.')
  await shot(page, '05-center-open-preview.png')

  await dismissArcTablePreview(page, { via: 'backdrop' })

  console.log('Arc desk mark smoke passed: AT-001 asset, five targets, entitlement previews, preview dismiss.')
  await context.close()
} finally {
  await browser.close()
}
