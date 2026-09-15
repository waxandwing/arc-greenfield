import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/arc-desk-pass/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function seed() {
  const calendarId = 'arc-desk-pass'
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
      workspace: { calendarId, captures: [{ id: 'cap-1', calendarId, text: 'Field trip idea', createdAt: '2026-09-01T12:00:00.000Z' }] },
    }),
    'arc.planning-context.v1': JSON.stringify({ schemaVersion: 2, calendarId, view: 'Week', anchorDate: '2026-09-15', focus: 'day' }),
    'arc.desk-preferences.v1': JSON.stringify({
      showTray: true,
      showPriorityPad: true,
      showDeskNotes: false,
      showArcTable: true,
      homeDeskPlannerView: 'Week',
      plannerSize: 'standard',
      traySize: 'standard',
      mscSize: 'standard',
    }),
    'arc.onboarding.v1': JSON.stringify({
      schemaVersion: 1,
      draft: { stage: 'landed', dismissed: true, firstCapturePromptDismissed: true },
    }),
  }
}

async function shot(page, name) {
  await page.screenshot({ path: `${evidenceDir}${name}`, fullPage: true })
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.addInitScript((entries) => {
    if (localStorage.getItem('arc.calendar.v1') !== null) return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, seed())
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible' })

  await page.getByTestId('calendar-enlarge').click()
  await page.getByTestId('desk-calendar-popout').waitFor({ state: 'visible' })
  assert(await page.getByTestId('desk-calendar-popout-body').isVisible(), 'Enlarge must open calendar pop-out body.')
  await page.getByTestId('desk-calendar-popout-dismiss').click()
  await page.getByTestId('desk-calendar-popout').waitFor({ state: 'hidden' })
  assert(await page.getByTestId('desk-calendar-popout-placeholder').count() === 0, 'Dismiss must restore inline calendar.')

  const returnTabLabel = (await page.locator('.arc-index-tab[aria-current="page"]').first().textContent())?.trim()
    || 'DAY'

  assert(await page.locator('.arc-shell--desk').count() === 1, 'Desk shell must lock viewport.')
  assert(await page.locator('[data-layout-grid="false"]').count() === 1, 'Default desk must use Figma physical composition (not zone sidebar grid).')
  assert(await page.locator('.arc-planner-physical-tabs').isVisible(), 'Planner-attached physical tabs must be visible on default desk.')
  assert(await page.locator('.b01-side-rail > .arc-index-tabs').count() === 0, 'Vertical index rail must not show beside desk composition.')
  const shellWood = await page.locator('.arc-shell--desk').evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(shellWood.includes('texture-wood'), 'Desk shell must be edge-to-edge icarus wood (no cream mat).')
  const tabletopImg = await page.locator('.arc-desk-tabletop').evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(
    tabletopImg === 'none' || !tabletopImg.includes('texture-wood'),
    'Desk tabletop must not duplicate wood card — single continuous shell plane.',
  )
  const planShellPattern = await page.locator('.arc-shell--desk').evaluate((el) => getComputedStyle(el).backgroundImage.includes('pattern'))
  assert(!planShellPattern, 'Legacy plan shell pattern must not show when desk is enabled.')
  const deskFramePattern = await page.locator('.b01-furniture-composition--desk').evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(!deskFramePattern.includes('pattern-grid'), 'Desk composition must not repeat exterior pattern tile.')
  assert(await page.getByTestId('arc-desk-arctable').isVisible(), 'ArcTable desk mark must render on wood.')
  assert(await page.getByTestId('arc-desk-tray-dock').isVisible(), 'Tray dock must render on desk.')
  assert(await page.getByTestId('desk-slice-ideas-drawer').count() === 1, 'IDEAS drawer must use ideas-drawer-chrome.png by default.')
  assert(await page.getByTestId('desk-source-ideas-drawer').count() === 0, 'SVG IDEAS fallback must be off when committed rasters are default.')
  assert((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-desk-slices')) === 'true', 'IDEAS dock must opt into committed raster chrome.')
  const drawerSvg = await page.evaluate(async () => {
    const response = await fetch(new URL('assets/desk/green-folders-drawer.svg', window.location.href).href)
    return response.text()
  })
  assert(!/#f5e6a8|#f0c4c8|#dce8f4/.test(drawerSvg), 'IDEAS drawer SVG must not bake yellow/pink/blue sticky fills — post-its are live React objects.')
  assert(!/decorative sticky/i.test(drawerSvg), 'IDEAS drawer SVG must not include decorative sticky markup.')
  assert(await page.getByTestId('desk-slice-todos-body').count() === 1, 'TO-DOS folder must use committed slice PNG assets by default.')
  assert(await page.getByTestId('desk-source-todos-body').count() === 0, 'CSS TO-DOS fallback must be off when committed rasters are default.')
  const todosTab = page.getByTestId('arc-desk-todos-tab')
  assert(await todosTab.isVisible(), 'TO-DOS tab must stay visible on planner left edge.')
  assert((await todosTab.innerText()).includes('TO-DOS'), 'TO-DOS tab label must say TO-DOS.')
  assert((await page.getByTestId('arc-desk-todos-folder').getAttribute('data-extended')) === 'false', 'TO-DOS drawer starts collapsed on planner edge.')
  await todosTab.click()
  assert((await page.getByTestId('arc-desk-todos-folder').getAttribute('data-extended')) === 'true', 'TO-DOS tab click must open drawer left of planner.')
  assert(await page.getByTestId('desk-priority-pad').isVisible(), 'MSC pad must render inside open TO-DOS folder.')
  await todosTab.click()
  assert((await page.getByTestId('arc-desk-todos-folder').getAttribute('data-extended')) === 'false', 'Second TO-DOS tab click must close drawer.')
  await page.getByTestId('arc-desk-folders-tab').click()
  assert(await page.getByTestId('arc-desk-tray-dock').locator('.workspace-capture-card', { hasText: 'Field trip idea' }).count() === 1, 'Capture must appear in IDEAS/tray dock when extended.')
  assert(await page.locator('.arc-index-tabs').count() === 1, 'Desk must expose a single planner view tab strip (utilities are separate).')
  assert(await page.locator('.b01-index-rail > .arc-index-tabs').count() === 0, 'Side index rail must stay empty on desk.')
  const quickCaptureSticky = page.getByTestId('arc-desk-quick-capture')
  assert(await quickCaptureSticky.count() === 1, 'Desk must render DeskQuickCaptureSticky on the wood.')
  assert(await quickCaptureSticky.isVisible(), 'Quick jot sticky must be visible (not CSS-hidden for pixel fidelity).')
  assert(await quickCaptureSticky.getAttribute('data-desk-post-it') === 'quick-capture', 'Quick capture must be a live DeskPostIt desk object, not tray chrome.')
  assert(await page.getByTestId('arc-desk-post-it-accent-mustard').isVisible(), 'Mustard accent post-it must be an independent desk object.')
  assert(await page.getByTestId('arc-desk-post-it-accent-pink').isVisible(), 'Pink accent post-it must be an independent desk object.')
  assert(await page.getByTestId('arc-desk-post-it-accent-blue').isVisible(), 'Blue accent post-it must be an independent desk object.')
  assert(
    await page.locator('.arc-desk-surface > [data-desk-post-it]').count() >= 4,
    'Post-its must be direct arc-desk-surface children (not nested in IDEAS tray raster).',
  )
  assert(
    await page.locator('.arc-desk-green-drawer-art [data-desk-post-it], .arc-desk-tray-dock [data-desk-post-it]').count() === 0,
    'Post-its must not live inside IDEAS tray chrome.',
  )
  const captureTrigger = page.getByTestId('global-capture-trigger')
  assert(await captureTrigger.count() === 1, 'Desk must expose one quick capture trigger.')
  assert(await captureTrigger.isVisible(), 'global-capture-trigger must be visible on the upper-right sticky.')
  assert(await page.locator('[data-testid="planner-shell-bar"] .arc-wordmark').count() === 0, 'Desk must not duplicate planner shell chrome under PlanStateHeader.')
  assert(await page.locator('.plan-state-header').count() === 1, 'Desk keeps a single plan-state editorial header.')
  await page.evaluate(() => {
    const tray = document.querySelector('[data-testid="arc-desk-utility-tabs"] button.arc-index-tab--workspace')
    tray?.click()
  })
  await page.locator('.b01-fridge-owner[data-state="open"]').waitFor({ state: 'attached' })
  const edgeTabs = page.getByTestId('arc-planner-physical-tabs')
  assert((await edgeTabs.getAttribute('data-desk-slices')) === 'true', 'Planner edge tabs must use committed tab PNG assets by default.')
  const weekTabArt = await edgeTabs.locator('[data-desk-slice-tab="week"]').evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(weekTabArt.includes('planner-edge-tab'), 'WEEK tab must use committed inactive/active slice rasters.')
  const titleMark = page.getByTestId('desk-planner-rainbow-mark')
  const titleMarkSource = await titleMark.getAttribute('data-desk-mark-source')
  assert(titleMarkSource === 'committed-png', 'Week title mark must use committed planner-rainbow-mark.png.')
  const titleMarkSrc = await titleMark.getAttribute('src')
  assert(Boolean(titleMarkSrc && titleMarkSrc.includes('planner-rainbow-mark.png')), 'Week title mark src must be planner-rainbow-mark.png.')
  await titleMark.evaluate((el) => (el.complete ? null : new Promise((resolve, reject) => {
    el.addEventListener('load', () => resolve(null), { once: true })
    el.addEventListener('error', () => reject(new Error('rainbow mark failed to load')), { once: true })
  })))
  const markMetrics = await titleMark.evaluate((el) => ({
    naturalWidth: el.naturalWidth,
    naturalHeight: el.naturalHeight,
    clientWidth: el.clientWidth,
    clientHeight: el.clientHeight,
  }))
  assert(markMetrics.naturalWidth >= 40 && markMetrics.naturalHeight >= 30, 'Rainbow mark PNG must load with real intrinsic size (not 0×0).')
  assert(markMetrics.clientWidth >= 24 && markMetrics.clientHeight >= 20, 'Rainbow mark must render at visible size, not a collapsed square.')
  assert(await page.getByTestId('arc-desk-tray-dock').count() === 0, 'TRAY drawer must replace the molded tray dock, not stack beside it.')
  assert(await page.locator('.b01-fridge-owner[data-state="open"] .b01-fridge-content').count() === 1, 'TRAY drawer must expose one workspace panel.')
  await page.getByRole('button', { name: 'Close Tray', exact: true }).click()
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible' })
  await shot(page, '01-desk-layout.png')

  await page.evaluate(() => {
    const settings = document.querySelector('[data-testid="arc-desk-utility-tabs"] button.arc-index-tab--settings')
    settings?.click()
  })
  const editWorkspace = page.getByRole('button', { name: 'Edit Workspace', exact: true })
  await editWorkspace.waitFor({ state: 'visible', timeout: 8000 })
  assert(await page.getByRole('heading', { name: 'Desk setup' }).isVisible(), 'Settings must expose Desk setup IA.')
  await shot(page, '15-settings-home-desk.png')

  await editWorkspace.click()
  assert(await page.getByTestId('desk-edit-toolbar').isVisible(), 'Edit Workspace must enter arrangement mode on the real desk.')
  assert(await page.locator('[data-desk-edit-mode="true"]').count() === 1, 'Desk edit mode flag must be set.')
  assert(await page.getByTestId('arc-desk-arctable').getAttribute('data-interactions-disabled') === 'true', 'ArcTable quadrant clicks must disable while editing desk layout.')
  await shot(page, 'desk-edit-mode.png')

  await page.getByRole('button', { name: 'Pin it down', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('[data-desk-edit-mode="true"]') === null, null, { timeout: 8000 })
  assert((await page.locator('.arc-index-tab[aria-current="page"]').first().textContent())?.trim() === returnTabLabel, 'Pin it down must return to the same planner view.')

  await page.evaluate(() => {
    const payload = JSON.stringify({
      schemaVersion: 1,
      customized: true,
      placements: [
        { object: 'planner', zone: 'main' },
        { object: 'tray', zone: 'mid-upper' },
        { object: 'msc', zone: 'side-lower' },
        { object: 'arctable', zone: 'side-upper' },
        { object: 'notes', zone: 'notes-rail' },
      ],
    })
    localStorage.setItem('arc.workspace-layout.v1', payload)
    localStorage.setItem('arc.desk-layout.v1', payload)
  })
  await page.reload({ waitUntil: 'networkidle' })
  assert(await page.locator('[data-layout-grid="true"]').count() === 1, 'Saved desk layout must hydrate on load.')

  await selectView(page, 'Year')
  await page.getByTestId('school-year-desk').waitFor({ state: 'visible', timeout: 15000 })
  assert(await page.getByTestId('school-year-desk').count() === 1, 'Year must render school year desk grid.')
  await shot(page, '03-year-desk-grid.png')

  console.log('Arc desk pass smoke passed: desk setup IA, edit mode entry/exit, layout persistence, year desk.')
  await context.close()
} finally {
  await browser.close()
}
