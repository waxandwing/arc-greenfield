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

  // Sticky overlaps planner enlarge after week-fit; DOM click avoids pointer intercept.
  await page.getByTestId('calendar-enlarge').evaluate((el) => el.click())
  await page.getByTestId('desk-calendar-popout').waitFor({ state: 'visible' })
  assert(await page.getByTestId('desk-calendar-popout-body').isVisible(), 'Enlarge must open calendar pop-out body.')

  const popoutStagePattern = await page.locator('.desk-calendar-popout-stage').evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(
    popoutStagePattern.includes('pattern-grid'),
    'Enlarged calendar must frame with the same exterior pattern tile as Calendar Setup furniture.',
  )
  assert(await page.locator('.desk-calendar-popout-planner').count() === 1, 'Enlarged calendar must keep a cream planner card inside the patterned frame.')

  const popoutTabs = page.locator('.desk-calendar-popout-tabs')
  const tabMetrics = await popoutTabs.evaluate((nav) => {
    const style = getComputedStyle(nav)
    const buttons = [...nav.querySelectorAll('button.arc-index-tab')]
    const active = buttons.find((btn) => btn.getAttribute('aria-current') === 'page')
    const activeStyle = active ? getComputedStyle(active) : null
    const widths = buttons.map((btn) => Math.round(btn.getBoundingClientRect().width))
    const tops = buttons.map((btn) => Math.round(btn.getBoundingClientRect().top))
    return {
      flexDirection: style.flexDirection,
      navHeight: Math.round(nav.getBoundingClientRect().height),
      count: buttons.length,
      widths,
      sameRow: tops.every((top) => Math.abs(top - tops[0]) <= 2),
      activeTransform: activeStyle?.transform ?? 'none',
      activeWritingMode: activeStyle?.writingMode ?? '',
    }
  })
  assert(tabMetrics.count === 4, 'Popout must expose DAY/WEEK/MONTH/YEAR tabs.')
  assert(tabMetrics.flexDirection === 'row', 'Popout tabs must lay out in a horizontal row.')
  assert(tabMetrics.sameRow, 'Popout tabs must share one horizontal row (not stacked).')
  assert(tabMetrics.navHeight < 90, `Popout tab strip must stay compact (got ${tabMetrics.navHeight}px).`)
  assert(
    tabMetrics.activeTransform === 'none' || tabMetrics.activeTransform === 'matrix(1, 0, 0, 1, 0, 0)',
    `Active popout tab must not rotate/flip (got ${tabMetrics.activeTransform}).`,
  )
  assert(tabMetrics.activeWritingMode === 'horizontal-tb', 'Active popout tab text must stay upright horizontal.')
  const widthSpread = Math.max(...tabMetrics.widths) - Math.min(...tabMetrics.widths)
  assert(widthSpread <= 8, `Popout tabs must be equal width (spread ${widthSpread}px: ${tabMetrics.widths.join(',')}).`)

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
  assert(shellWood.includes('wood-background-light'), 'Desk shell must be edge-to-edge Kelly wood-background-light (no cream mat).')
  const calendarSpreadPaper = await page.locator('.arc-calendar-spread--desk').evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      image: style.backgroundImage,
      blend: style.backgroundBlendMode,
      size: style.backgroundSize,
    }
  })
  assert(
    calendarSpreadPaper.image.includes('calendar-background.png'),
    'Desk calendar spread must use Kelly canonical calendar-background.png planner plate.',
  )
  const tabletopImg = await page.locator('.arc-desk-tabletop').evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(
    tabletopImg === 'none' || !tabletopImg.includes('wood-background-light'),
    'Desk tabletop must not duplicate wood card — single continuous shell plane.',
  )
  const planShellPattern = await page.locator('.arc-shell--desk').evaluate((el) => getComputedStyle(el).backgroundImage.includes('pattern'))
  assert(!planShellPattern, 'Legacy plan shell pattern must not show when desk is enabled.')
  const deskFramePattern = await page.locator('.b01-furniture-composition--desk').evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(!deskFramePattern.includes('pattern-grid'), 'Desk composition must not repeat exterior pattern tile.')
  assert(await page.getByTestId('arc-desk-arctable').isVisible(), 'ArcTable desk mark must render on wood.')
  assert(await page.getByTestId('arc-desk-tray-dock').isVisible(), 'Tray dock must render on desk.')
  assert(await page.getByTestId('desk-help-button').isVisible(), 'Desk must expose a quiet ? help button on the wood.')
  const ideasDockBox = await page.getByTestId('arc-desk-tray-dock').boundingBox()
  assert(ideasDockBox && ideasDockBox.width > ideasDockBox.height, 'IDEAS drawer dock must be landscape (wider than tall).')
  assert((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')) === 'false', 'IDEAS drawer must start collapsed.')
  const closedIdeasPeek = await page.getByTestId('arc-desk-tray-dock').evaluate((el) => {
    const surface = el.closest('.arc-desk-surface')
    const rect = el.getBoundingClientRect()
    const surfaceTop = surface ? surface.getBoundingClientRect().top : 0
    const art = el.querySelector('.arc-desk-green-drawer-art')
    return {
      peekPx: rect.bottom - surfaceTop,
      artVisibility: art ? getComputedStyle(art).visibility : null,
    }
  })
  assert(closedIdeasPeek.peekPx <= 56, `Closed IDEAS must be a slim tab peek (peek=${closedIdeasPeek.peekPx}px), not a large dim panel.`)
  assert(closedIdeasPeek.artVisibility === 'visible', 'Closed IDEAS must keep ideas-tray.png chrome so the baked IDEAS pull-tab peeks.')
  assert(await page.getByTestId('arc-desk-clean-up').isVisible(), 'Clean up lip must sit on the IDEAS tray lower-right chrome on every desk view.')
  assert(await page.locator('[data-testid="arc-desk-clean-up"]').count() === 1, 'Clean up must be a single affordance (no duplicate pills).')
  assert(await page.getByTestId('arc-desk-clean-up').evaluate((el) => el.classList.contains('arc-desk-clean-up--lip')), 'Clean up must be the stamped lip control, not a planning pill.')
  const cleanUpLipBox = await page.getByTestId('arc-desk-clean-up').evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      left: style.left,
      right: style.right,
      top: style.top,
      bottom: style.bottom,
      boxShadow: style.boxShadow,
      parentIsTray: Boolean(el.closest('[data-testid="arc-desk-tray-dock"]')),
    }
  })
  assert(cleanUpLipBox.parentIsTray, 'Clean up must live on the IDEAS tray so park/drag keeps it attached.')
  assert(cleanUpLipBox.left === 'auto' || Number.parseFloat(cleanUpLipBox.right) >= 0, 'Clean up must sit on the right side of the tray lip.')
  assert(!/inset/.test(cleanUpLipBox.boxShadow), 'Clean up lip must not keep the underline stamp.')
  assert((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-tray-park-top')) === '0', 'IDEAS tray must default parked at the top edge.')
  const woodMarkSrc = await page.getByTestId('arc-desk-wood-wordmark').getAttribute('src')
  assert(woodMarkSrc?.includes('arc-mark-stacked.png'), 'Wood wordmark must use Kelly original Arc stacked mark.')
  const woodMarkFilter = await page.getByTestId('arc-desk-wood-wordmark').evaluate((img) => getComputedStyle(img).filter)
  assert(!/sepia|grayscale|contrast|brightness/i.test(woodMarkFilter) || woodMarkFilter === 'none', 'Wood wordmark must not use wood-burn filters.')
  assert(await page.getByTestId('desk-slice-ideas-drawer').count() === 1, 'IDEAS drawer must use canonical ideas-tray.png by default.')
  assert((await page.getByTestId('desk-slice-ideas-drawer').getAttribute('data-ideas-tray')) === 'canonical', 'IDEAS drawer art must be tagged as canonical ideas-tray.')
  assert((await page.getByTestId('desk-slice-ideas-drawer').getAttribute('src') || '').includes('ideas-tray.png'), 'IDEAS drawer src must point at ideas-tray.png.')
  assert(await page.getByTestId('desk-source-ideas-drawer').count() === 0, 'SVG IDEAS fallback must be off when committed rasters are default.')
  assert((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-desk-slices')) === 'true', 'IDEAS dock must opt into committed raster chrome.')
  const drawerSvg = await page.evaluate(async () => {
    const response = await fetch(new URL('assets/desk/green-folders-drawer.svg', window.location.href).href)
    return response.text()
  })
  assert(!/#f5e6a8|#f0c4c8|#dce8f4/.test(drawerSvg), 'IDEAS drawer SVG must not bake yellow/pink/blue sticky fills — post-its are live React objects.')
  assert(!/decorative sticky/i.test(drawerSvg), 'IDEAS drawer SVG must not include decorative sticky markup.')
  const drawerPngHasStickyFills = await page.evaluate(async () => {
    const response = await fetch(new URL('assets/desk/green-folders-drawer.png', window.location.href).href)
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    const { data, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
    let sticky = 0
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
      if (a < 40) continue
      const yellow = r >= 190 && g >= 160 && b <= 150 && (r - b) >= 50 && (g - b) >= 25
      const pink = r >= 185 && 120 <= g && g <= 200 && 130 <= b && b <= 210 && (r - g) >= 20 && Math.abs(r - b) <= 70
      const blue = b >= 165 && g >= 145 && r <= 190 && (b - r) >= 18 && g >= r - 5
      if (yellow || pink || blue) sticky += 1
    }
    return sticky > 40
  })
  assert(!drawerPngHasStickyFills, 'Landscape IDEAS PNG must not bake yellow/pink/blue sticky fills — post-its are live React objects.')
  assert(await page.getByTestId('desk-slice-todos-body').count() === 1, 'TO-DOS folder must use committed slice PNG assets by default.')
  assert(await page.getByTestId('desk-source-todos-body').count() === 0, 'CSS TO-DOS fallback must be off when committed rasters are default.')
  assert(await page.getByTestId('desk-slice-todos-tab').count() === 1, 'TO-DOS Kelly plate (todos-tab.png) must render as the folder surface.')
  assert((await page.getByTestId('arc-desk-todos-folder').getAttribute('data-extended')) === 'true', 'TO-DOS folder stays visible.')
  assert((await page.getByTestId('arc-desk-todos-folder').getAttribute('data-todos-plate')) === 'kelly-todos-tab', 'TO-DOS plate authority must be Kelly todos-tab.png.')
  assert(await page.getByTestId('desk-priority-pad').isVisible(), 'MSC pad must render on top of the Kelly TODOs plate.')
  assert(await page.getByTestId('desk-slice-todos-tab').getAttribute('data-desk-kelly-asset') === 'todos-tab', 'TO-DOS tab must use Kelly canonical todos-tab.png.')
  assert((await page.getByTestId('desk-slice-todos-tab').getAttribute('src') || '').includes('todos-tab.png'), 'TO-DOS tab src must be canonical todos-tab.png.')
  const todosLayering = await page.evaluate(() => {
    const plate = document.querySelector('[data-testid="desk-slice-todos-tab"]')
    const body = document.querySelector('[data-testid="arc-desk-todos-folder-body"]')
    const folder = document.querySelector('[data-testid="arc-desk-todos-folder"]')
    if (!(plate instanceof HTMLElement) || !(body instanceof HTMLElement) || !(folder instanceof HTMLElement)) {
      return { ok: false, reason: 'missing nodes' }
    }
    const plateZ = Number.parseInt(getComputedStyle(plate).zIndex, 10)
    const bodyZ = Number.parseInt(getComputedStyle(body).zIndex, 10)
    const bg = getComputedStyle(folder).backgroundImage
    const label = document.querySelector('[data-testid="desk-priority-lane-must"] h3')
    const labelVisible = label instanceof HTMLElement && getComputedStyle(label).visibility !== 'hidden'
      && getComputedStyle(label).clip === 'auto'
    return {
      ok: Number.isFinite(plateZ) && Number.isFinite(bodyZ) && bodyZ > plateZ && bg === 'none' && labelVisible,
      plateZ,
      bodyZ,
      bg,
      labelVisible,
    }
  })
  assert(todosLayering.ok, `Kelly plate must sit behind live MSC lanes without denim chrome (got ${JSON.stringify(todosLayering)}).`)
  const padHit = await page.getByTestId('desk-priority-pad').evaluate((el) => getComputedStyle(el).pointerEvents)
  assert(padHit === 'auto', `TO-DOS pad must accept pointer events (got ${padHit}).`)
  // MUST / SHOULD / COULD must accept add + complete (pointer-events on folder body).
  const mustAdd = page.getByTestId('desk-priority-add-must')
  assert(await mustAdd.isVisible(), 'MUST lane add input must be interactive.')
  await mustAdd.fill('Kelly must demo task')
  await mustAdd.press('Enter')
  const mustTask = page.getByTestId('desk-priority-lane-must').getByRole('button', { name: /Edit task Kelly must demo task/ })
  assert(await mustTask.count() === 1, 'MUST lane must accept added tasks.')
  const mustComplete = page.getByTestId('desk-priority-lane-must').locator('input[type="checkbox"]').last()
  await mustComplete.check()
  assert(await page.getByTestId('desk-priority-lane-must').locator('[data-completed="true"]').count() >= 1, 'MUST tasks must be completable.')
  // Rename must keep working on the plate surface.
  await mustTask.click()
  const mustEdit = page.getByTestId(/desk-priority-edit-/).last()
  await mustEdit.fill('Kelly must renamed')
  await mustEdit.press('Enter')
  assert(await page.getByTestId('desk-priority-lane-must').getByRole('button', { name: /Edit task Kelly must renamed/ }).count() === 1, 'MUST tasks must be renameable on the Kelly plate.')
  // Accent post-its sit near the top edge; DOM click avoids pointer intercept on the slim tab.
  await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
  assert(await page.getByTestId('arc-desk-tray-dock').locator('.workspace-capture-card', { hasText: 'Field trip idea' }).count() === 1, 'Capture must appear in IDEAS/tray dock when extended.')
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="arc-desk-tray-dock"]')
    const viewport = document.querySelector('.arc-desk-viewport')
    if (!el || !viewport || el.getAttribute('data-extended') !== 'true') return false
    const t = getComputedStyle(el).transform
    if (!(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')) return false
    const offset = el.getBoundingClientRect().top - viewport.getBoundingClientRect().top
    return offset >= -2 && offset <= 14
  }, undefined, { timeout: 3000 })
  const ideasOpen = await page.getByTestId('arc-desk-tray-dock').evaluate((el) => {
    const surface = el.closest('.arc-desk-surface')
    const viewport = document.querySelector('.arc-desk-viewport')
    const rect = el.getBoundingClientRect()
    const surfaceTop = surface ? surface.getBoundingClientRect().top : 0
    const viewportTop = viewport ? viewport.getBoundingClientRect().top : 0
    const transform = getComputedStyle(el).transform
    return {
      transform,
      offsetFromSurfaceTop: rect.top - surfaceTop,
      offsetFromViewportTop: rect.top - viewportTop,
      parkTop: el.getAttribute('data-tray-park-top'),
      extended: el.getAttribute('data-extended'),
      width: rect.width,
      height: rect.height,
    }
  })
  assert(ideasOpen.extended === 'true', 'IDEAS dock must be extended after tab click.')
  assert(ideasOpen.parkTop === '0' || ideasOpen.parkTop === '0.0', `Default IDEAS park must be top (got park=${ideasOpen.parkTop}).`)
  assert(
    ideasOpen.offsetFromViewportTop >= -2 && ideasOpen.offsetFromViewportTop <= 14,
    `IDEAS drawer must sit flush with the desk view panel top when open (viewportOffset=${ideasOpen.offsetFromViewportTop}).`,
  )
  assert(ideasOpen.width > ideasOpen.height, 'Open IDEAS drawer must remain landscape (wider than tall).')
  assert(await page.getByTestId('desk-slice-todos-tab').isVisible(), 'TO-DOS tab art must remain visible while IDEAS is open.')
  assert(await page.getByTestId('arc-desk-todos-folder').isVisible(), 'TO-DOS denim folder must remain visible while IDEAS is open.')
  assert(await page.getByTestId('arc-desk-quick-capture').isVisible(), 'Quick capture post-it must remain visible while IDEAS is open.')
  // Collapse IDEAS so wood accent post-its are not under the open drawer well.
  await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
  await page.waitForFunction(() => document.querySelector('[data-testid="arc-desk-tray-dock"]')?.getAttribute('data-extended') === 'false', null, { timeout: 3000 })
  assert(await page.locator('.arc-index-tabs').count() === 1, 'Desk must expose a single planner view tab strip (utilities are separate).')
  assert(await page.locator('.b01-index-rail > .arc-index-tabs').count() === 0, 'Side index rail must stay empty on desk.')
  const quickCaptureSticky = page.getByTestId('arc-desk-quick-capture')
  assert(await quickCaptureSticky.count() === 1, 'Desk must render DeskQuickCaptureSticky on the wood.')
  assert(await quickCaptureSticky.isVisible(), 'Quick jot sticky must be visible (not CSS-hidden for pixel fidelity).')
  assert(await quickCaptureSticky.getAttribute('data-desk-post-it') === 'quick-capture', 'Quick capture must be a live DeskPostIt desk object, not tray chrome.')
  assert(await page.getByTestId('arc-desk-post-it-accent-mustard').isVisible(), 'Mustard accent post-it must be an independent desk object.')
  assert(await page.getByTestId('arc-desk-post-it-accent-pink').isVisible(), 'Pink accent post-it must be an independent desk object.')
  assert(await page.getByTestId('arc-desk-post-it-accent-blue').isVisible(), 'Blue accent post-it must be an independent desk object.')
  for (const tone of ['mustard', 'pink', 'blue']) {
    const accent = page.getByTestId(`arc-desk-post-it-accent-${tone}`)
    const box = await accent.boundingBox()
    assert(box && box.width >= 100 && box.width <= 140, `${tone} accent post-it must be readable sticky size (~100–140px), got ${box && Math.round(box.width)}`)
    assert(box && box.height >= 100, `${tone} accent post-it height must be sticky-readable, got ${box && Math.round(box.height)}`)
    const note = page.getByTestId(`arc-desk-post-it-accent-${tone}-note`)
    assert(await note.count() === 1, `${tone} accent must expose a writable note textarea.`)
    assert(await note.isVisible(), `${tone} accent note must be visible.`)
    assert(await accent.locator('.arc-desk-post-it-grip').count() === 1, `${tone} accent must expose a drag grip separate from the note.`)
    const noteBox = await note.boundingBox()
    assert(noteBox && box, `${tone} accent note must expose a box for margin checks.`)
    const leftMargin = noteBox.x - box.x
    const rightMargin = (box.x + box.width) - (noteBox.x + noteBox.width)
    const topMargin = noteBox.y - box.y
    const bottomMargin = (box.y + box.height) - (noteBox.y + noteBox.height)
    assert(leftMargin >= 12 && rightMargin >= 12 && topMargin >= 12 && bottomMargin >= 12,
      `${tone} accent note must be inset with paper grip margins (≥12px); got L${Math.round(leftMargin)} R${Math.round(rightMargin)} T${Math.round(topMargin)} B${Math.round(bottomMargin)}`)
    assert(Math.abs(leftMargin - rightMargin) <= 3 && Math.abs(topMargin - bottomMargin) <= 3,
      `${tone} accent note must be centered on the sticky paper (margin delta L/R=${Math.abs(leftMargin - rightMargin).toFixed(1)} T/B=${Math.abs(topMargin - bottomMargin).toFixed(1)})`)
    const noteBorder = await note.evaluate((el) => getComputedStyle(el).borderTopWidth)
    assert(Number.parseFloat(noteBorder) >= 1, `${tone} accent note must show a visible border separating writable area from paper.`)
  }
  const mustardForMarginDrag = page.getByTestId('arc-desk-post-it-accent-mustard')
  const mustardNoteForMargin = page.getByTestId('arc-desk-post-it-accent-mustard-note')
  const mustardBeforeMarginDrag = await mustardForMarginDrag.boundingBox()
  const mustardNoteBox = await mustardNoteForMargin.boundingBox()
  assert(mustardBeforeMarginDrag && mustardNoteBox, 'Mustard accent needs boxes for paper-margin drag.')
  // Click bottom paper margin (between sticky edge and bordered note) — must drag, not focus the note.
  const marginX = mustardBeforeMarginDrag.x + mustardBeforeMarginDrag.width / 2
  const marginY = mustardNoteBox.y + mustardNoteBox.height + Math.max(4, (mustardBeforeMarginDrag.y + mustardBeforeMarginDrag.height - (mustardNoteBox.y + mustardNoteBox.height)) / 2)
  await page.mouse.move(marginX, marginY)
  await page.mouse.down()
  await page.mouse.move(marginX - 40, marginY + 28, { steps: 8 })
  await page.mouse.up()
  const mustardAfterMarginDrag = await mustardForMarginDrag.boundingBox()
  assert(mustardAfterMarginDrag, 'Mustard accent must keep a box after margin drag.')
  assert(Math.abs(mustardAfterMarginDrag.x - mustardBeforeMarginDrag.x) > 12 || Math.abs(mustardAfterMarginDrag.y - mustardBeforeMarginDrag.y) > 12,
    'Dragging from accent paper margin must move the sticky.')
  assert(await mustardNoteForMargin.evaluate((el) => document.activeElement !== el),
    'Paper-margin drag must not leave the note focused.')
  const blueAccent = page.getByTestId('arc-desk-post-it-accent-blue')
  const blueNote = page.getByTestId('arc-desk-post-it-accent-blue-note')
  await blueNote.click()
  assert(await blueAccent.getAttribute('data-dragging') === 'false', 'Click-to-edit on accent note must not start a drag.')
  await blueNote.fill('Kelly blue jot')
  assert(await blueAccent.getAttribute('data-dragging') === 'false', 'Typing on accent note must not start a drag.')
  assert(await blueNote.evaluate((el) => document.activeElement === el), 'Click inside bordered note must focus textarea for typing.')
  const storedNotes = await page.evaluate(() => localStorage.getItem('arc.desk-postit-notes.v1'))
  assert(storedNotes && storedNotes.includes('Kelly blue jot'), 'Accent note text must persist to localStorage per post-it id.')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible' })
  assert(await page.getByTestId('arc-desk-post-it-accent-blue-note').inputValue() === 'Kelly blue jot', 'Accent note must reload from localStorage.')
  const pinkAccent = page.getByTestId('arc-desk-post-it-accent-pink')
  const pinkLessonMark = page.getByTestId('arc-desk-post-it-accent-pink-lesson-mark')
  assert(await pinkLessonMark.count() === 1, 'Pink accent must expose a lesson-mark control in the bottom corner.')
  assert(await pinkAccent.getAttribute('data-desk-post-it-lesson') !== 'true', 'Pink accent must start unmarked as lesson.')
  await pinkLessonMark.click()
  assert(await pinkAccent.getAttribute('data-desk-post-it-lesson') === 'true', 'Lesson mark click must consider the sticky a lesson.')
  assert(await pinkAccent.evaluate((node) => node.classList.contains('arc-desk-post-it--lesson')), 'Lesson sticky must carry light marking class.')
  assert(await pinkLessonMark.getAttribute('aria-pressed') === 'true', 'Lesson mark control must reflect pressed state.')
  const persistedLessons = await page.evaluate(() => localStorage.getItem('arc.desk-postit-lessons.v1'))
  assert(Boolean(persistedLessons && persistedLessons.includes('accent-pink')), 'Lesson marks must persist in localStorage.')
  const blueForLink = page.getByTestId('arc-desk-post-it-accent-blue')
  const blueGrip = page.getByTestId('arc-desk-post-it-accent-blue-grip')
  const pinkBox = await pinkAccent.boundingBox()
  const blueGripBox = await blueGrip.boundingBox()
  assert(pinkBox && blueGripBox, 'Accent post-its must expose grip + boxes for link drag.')
  await page.mouse.move(blueGripBox.x + blueGripBox.width / 2, blueGripBox.y + blueGripBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(pinkBox.x + pinkBox.width / 2 + 4, pinkBox.y + 12, { steps: 14 })
  await page.mouse.up()
  const linkPrompt = page.getByTestId('arc-desk-post-it-link-prompt')
  await linkPrompt.waitFor({ state: 'visible', timeout: 5000 })
  assert(await linkPrompt.getByText('Link these post-its?').isVisible(), 'Overlap must prompt to link layered accent post-its.')
  await page.getByTestId('arc-desk-post-it-link-confirm').click()
  await linkPrompt.waitFor({ state: 'hidden' })
  const linkedStackId = await blueForLink.getAttribute('data-desk-post-it-stack')
  assert(Boolean(linkedStackId), 'Link confirm must assign a desk post-it stack id.')
  assert(await pinkAccent.getAttribute('data-desk-post-it-stack') === linkedStackId, 'Linked accents must share one stack id.')
  assert(await pinkAccent.getAttribute('data-desk-post-it-lesson') === 'true', 'Lesson mark must survive linking into a unit/class stack.')
  const persistedLinks = await page.evaluate(() => localStorage.getItem('arc.desk-postit-links.v1'))
  assert(Boolean(persistedLinks && persistedLinks.includes('accent-blue') && persistedLinks.includes('accent-pink')), 'Linked accents must persist in localStorage.')
  const beforeLinkMove = await Promise.all([pinkAccent.boundingBox(), blueForLink.boundingBox()])
  assert(beforeLinkMove[0] && beforeLinkMove[1], 'Linked accents need boxes before move-together check.')
  const linkedGrip = await blueGrip.boundingBox()
  assert(linkedGrip, 'Linked blue accent must keep a drag grip.')
  await page.mouse.move(linkedGrip.x + linkedGrip.width / 2, linkedGrip.y + linkedGrip.height / 2)
  await page.mouse.down()
  await page.mouse.move(linkedGrip.x + linkedGrip.width / 2 + 44, linkedGrip.y + linkedGrip.height / 2 + 30, { steps: 10 })
  await page.mouse.up()
  const afterLinkMove = await Promise.all([pinkAccent.boundingBox(), blueForLink.boundingBox()])
  assert(afterLinkMove[0] && afterLinkMove[1], 'Linked accents need boxes after move-together check.')
  assert(Math.abs((afterLinkMove[0].x - beforeLinkMove[0].x) - (afterLinkMove[1].x - beforeLinkMove[1].x)) < 8, 'Linked accents must translate together on X.')
  assert(Math.abs((afterLinkMove[0].y - beforeLinkMove[0].y) - (afterLinkMove[1].y - beforeLinkMove[1].y)) < 8, 'Linked accents must translate together on Y.')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible' })
  assert(await page.getByTestId('arc-desk-post-it-accent-pink').getAttribute('data-desk-post-it-lesson') === 'true', 'Lesson mark must reload from localStorage.')
  assert(await page.getByTestId('arc-desk-post-it-accent-pink').getAttribute('data-desk-post-it-stack'), 'Linked stack must survive reload alongside lesson mark.')
  assert(
    await page.locator('.arc-desk-surface > [data-desk-post-it]').count() >= 4,
    'Post-its must be direct arc-desk-surface children (not nested in IDEAS tray raster).',
  )
  assert(
    await page.locator('.arc-desk-green-drawer-art [data-desk-post-it]').count() === 0,
    'Post-its must not live inside IDEAS tray chrome art.',
  )
  assert(
    await page.locator('.arc-desk-tray-dock [data-desk-post-it]').count() === 0,
    'Loose accent post-its must stay on the wood until Clean up gathers them into IDEAS.',
  )
  assert(await page.getByTestId('global-capture-trigger').count() === 0, 'Desk Quick Capture must not show a + Capture button.')
  assert(
    await page.locator('.arc-capture-dialog, form.arc-capture-dialog-inner').count() === 0,
    'Desk path must not mount the capture modal (inline sticky only).',
  )
  const quickCaptureNote = page.getByTestId('arc-desk-quick-capture-note')
  const quickCaptureGrip = page.getByTestId('arc-desk-quick-capture-grip')
  assert(await quickCaptureNote.count() === 1, 'Quick Capture must expose a writable note textarea.')
  assert(await quickCaptureNote.isVisible(), 'Quick Capture note must be visible for type-first jotting.')
  assert(await quickCaptureGrip.count() === 1, 'Quick Capture must expose a drag grip separate from the note.')
  const captureHint = (await page.getByTestId('arc-desk-quick-capture-hint').innerText()).toLowerCase()
  assert(captureHint.includes('ideas'), 'Quick Capture must say captures land in IDEAS.')
  await quickCaptureNote.click()
  assert(await quickCaptureSticky.getAttribute('data-dragging') === 'false', 'Click-to-edit on Quick Capture must not start a drag.')
  await quickCaptureNote.fill('Kelly mustard jot for IDEAS')
  assert(await quickCaptureSticky.getAttribute('data-dragging') === 'false', 'Typing on Quick Capture must not start a drag.')
  await quickCaptureNote.press('Enter')
  assert(await page.getByTestId('arc-desk-quick-capture-notice').innerText() === 'Saved to IDEAS', 'Enter must confirm save destination as IDEAS.')
  assert(await quickCaptureNote.inputValue() === '', 'Quick Capture note must clear after Enter saves.')

  // Prefix commands: u=unit, l=lesson, i=idea, n=note — Enter spawns a fresh sticky/magnet.
  await quickCaptureNote.fill('u mesopotamia')
  await quickCaptureNote.press('Enter')
  assert(await page.getByTestId('arc-desk-quick-capture-notice').innerText() === 'Saved as unit', 'u prefix must save as unit.')
  assert(await quickCaptureNote.inputValue() === '', 'QC must clear after u-prefix Enter.')
  assert(await page.locator('.arc-desk-post-it--magnet').count() >= 1, 'u prefix must spawn a unit magnet on the wood.')
  assert(await page.locator('[data-desk-unit-magnet="true"]').count() >= 1, 'Unit magnet must show physical magnet artwork.')
  assert(await page.locator('.arc-desk-post-it--in-unit').count() >= 1, 'Unit spawn must mark the sticky/magnet as in-unit.')
  const unitMagnetImg = page.locator('[data-desk-unit-magnet="true"]').first()
  const unitMagnetSrc = await unitMagnetImg.getAttribute('src')
  assert(
    Boolean(unitMagnetSrc && (unitMagnetSrc.includes('/assets/desk/canonical/magnet-') || unitMagnetSrc.includes('/assets/desk/magnets/magnet-'))),
    `Unit magnet artwork src must be a magnet asset (got ${unitMagnetSrc}).`,
  )
  await quickCaptureNote.fill('n bring clay')
  await quickCaptureNote.press('Enter')
  assert(await page.getByTestId('arc-desk-quick-capture-notice').innerText() === 'Saved as note', 'n prefix must save as note.')
  assert(await page.locator('[data-desk-post-it^="spawn-"]').count() >= 1, 'Subsequent Enter must leave spawned sticky/magnet on wood.')


  // Drop targets: Planning Tray lanes + calendar date cells advertise post-it drops.
  assert(await page.locator('[data-desk-postit-drop="priority"][data-priority="must"]').count() >= 1, 'MUST lane must be a post-it drop target.')
  assert(await page.locator('[data-desk-postit-drop="priority"][data-priority="should"]').count() >= 1, 'SHOULD lane must be a post-it drop target.')
  assert(await page.locator('[data-desk-postit-drop="priority"][data-priority="could"]').count() >= 1, 'COULD lane must be a post-it drop target.')

  // Week planning day slots accept bundled unit (unit magnet + lesson sticky) drops.
  assert(await page.locator('.planning-day-slot[data-desk-postit-drop="date"]').count() >= 1, 'Planning day slots must be post-it date drop targets.')
  assert(await page.locator('.planning-date-heading[data-desk-postit-drop="date"]').count() >= 1, 'Date headings must remain post-it date drop targets.')

  // Ensure IDEAS is open so the new capture card is visible (reload leaves the drawer collapsed).
  const ideasExtended = await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')
  if (ideasExtended !== 'true') {
    await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
  }
  assert(
    await page.getByTestId('arc-desk-tray-dock').locator('.workspace-capture-card', { hasText: 'Kelly mustard jot for IDEAS' }).count() === 1,
    'Typed Quick Capture must land in IDEAS / tray.',
  )
  assert(await page.locator('[data-testid="planner-shell-bar"] .arc-wordmark').count() === 0, 'Desk must not duplicate planner shell chrome under PlanStateHeader.')
  assert(await page.locator('.plan-state-header').count() === 1, 'Desk keeps a single plan-state editorial header.')

  // IDEAS + Clean up must remain on Year (year-expanded must not swallow the closed tab peek).
  if ((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')) === 'true') {
    await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
  }
  await selectView(page, 'Year')
  assert(await page.locator('[data-year-expanded="true"]').count() === 1, 'Year view must mark furniture year-expanded.')
  assert(await page.getByTestId('arc-desk-tray-dock').isVisible(), 'IDEAS tray must remain on Year view.')
  assert(await page.getByTestId('arc-desk-clean-up').isVisible(), 'Clean up lip must remain available on Year view.')
  const yearIdeasPeek = await page.getByTestId('arc-desk-tray-dock').evaluate((el) => {
    const surface = el.closest('.arc-desk-surface')
    const rect = el.getBoundingClientRect()
    const surfaceTop = surface ? surface.getBoundingClientRect().top : 0
    return {
      peekPx: rect.bottom - surfaceTop,
      extended: el.getAttribute('data-extended'),
    }
  })
  assert(yearIdeasPeek.extended === 'false', 'IDEAS must start collapsed on Year.')
  assert(yearIdeasPeek.peekPx <= 72, `Year IDEAS closed peek must stay a slim tab (peek=${yearIdeasPeek.peekPx}px).`)
  await selectView(page, 'Week')

  // Clean up gathers loose accent post-its into the closed IDEAS tray (must not auto-open).
  await page.getByTestId('arc-desk-clean-up').click()
  assert((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')) === 'false', 'Clean up must keep the IDEAS tray closed.')
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-mustard"]').count() === 1, 'Clean up must move mustard accent into IDEAS.')
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-pink"]').count() === 1, 'Clean up must move pink accent into IDEAS.')
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-blue"]').count() === 1, 'Clean up must move blue accent into IDEAS.')
  // Open tray only via IDEAS tab; Clean up remains the single top-lip affordance (not a well toolbar pill).
  await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
  assert((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')) === 'true', 'IDEAS tab must open the tray after Clean up.')
  assert(await page.getByTestId('arc-desk-clean-up').isVisible(), 'Open IDEAS must keep the stamped Clean up lip visible.')
  assert(await page.locator('.arc-desk-ideas-well-toolbar .arc-desk-clean-up').count() === 0, 'Open IDEAS well must not duplicate Clean up as a toolbar button.')
  assert(await page.getByTestId('arc-desk-clean-up-tab').count() === 0, 'Open IDEAS must not keep a second tab-side Clean up.')
  // Tray stickies stay normal paper accents (writable + lesson mark), not locked tray chrome.
  const trayBlue = page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-blue"]')
  assert(await trayBlue.evaluate((node) => node.classList.contains('arc-desk-post-it--accent')), 'IDEAS tray stickies must keep accent paper chrome.')
  assert(await trayBlue.evaluate((node) => node.classList.contains('arc-desk-post-it--in-drawer')), 'Cleaned-up stickies must mark in-drawer.')
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').getByTestId('arc-desk-post-it-accent-blue-note').count() === 1, 'Tray sticky must remain writable.')
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').getByTestId('arc-desk-post-it-accent-blue-lesson-mark').count() === 1, 'Tray sticky must keep lesson corner dot.')
  // Unit magnets cleaned into IDEAS become paper stickies with a visible magnet badge.
  const trayUnit = page.getByTestId('arc-desk-ideas-accent-slot').locator('.arc-desk-post-it--in-unit').first()
  if (await trayUnit.count() >= 1) {
    assert(await trayUnit.evaluate((node) => node.classList.contains('arc-desk-post-it--accent')), 'Unit items in IDEAS must function as normal paper stickies.')
    assert(await trayUnit.locator('[data-desk-unit-magnet="true"]').count() === 1, 'Unit-associated tray sticky must show a magnet.')
  }
  // Drag mustard + pink accents out of IDEAS onto the exterior desk/planner surface.
  assert((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')) === 'true', 'IDEAS must stay open to drag stickies out.')
  await page.getByTestId('arc-desk-ideas-accent-slot').getByTestId('arc-desk-post-it-accent-mustard').waitFor({ state: 'visible', timeout: 5000 })
  await page.waitForTimeout(250)
  const surfaceBox = await page.locator('.arc-desk-surface').boundingBox()
  assert(surfaceBox, 'Desk surface must expose a box for exterior drop.')
  for (const tone of ['mustard', 'pink']) {
    const traySticky = page.getByTestId('arc-desk-ideas-accent-slot').getByTestId(`arc-desk-post-it-accent-${tone}`)
    await traySticky.waitFor({ state: 'visible', timeout: 5000 })
    const grip = traySticky.getByTestId(`arc-desk-post-it-accent-${tone}-grip`)
    const start = await grip.boundingBox()
    assert(start, `${tone} in-drawer grip must be draggable.`)
    const dropX = surfaceBox.x + surfaceBox.width * (tone === 'mustard' ? 0.72 : 0.82)
    const dropY = surfaceBox.y + surfaceBox.height * 0.58
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
    await page.mouse.down()
    await page.mouse.move(dropX, dropY, { steps: 24 })
    await page.getByTestId('arc-desk-post-it-drag-ghost').waitFor({ state: 'attached', timeout: 3000 })
    assert(await page.locator(".arc-desk-surface.arc-desk-postit-drop-target--desk-park, .arc-desk-surface[data-desk-postit-park='desk']").count() === 1, `${tone} drag-out must highlight the exterior desk park target.`)
    await page.mouse.up()
    await page.getByTestId('arc-desk-post-it-drag-ghost').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
    assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator(`[data-desk-post-it="accent-${tone}"]`).count() === 0, `${tone} must leave the IDEAS accent slot after exterior drop.`)
    const deskSticky = page.locator(`.arc-desk-surface > [data-desk-post-it="accent-${tone}"]`)
    assert(await deskSticky.count() === 1, `${tone} must park as a free desk post-it on the exterior surface.`)
    assert(await deskSticky.evaluate((node) => !node.classList.contains('arc-desk-post-it--in-drawer')), `${tone} on desk must not keep in-drawer chrome.`)
  }
  const drawerMembership = await page.evaluate(() => sessionStorage.getItem('arc.desk-postit-in-drawer.v1'))
  assert(drawerMembership && drawerMembership.includes('"accent-mustard":false') && drawerMembership.includes('"accent-pink":false'),
    'Drag-out must persist in-drawer=false for mustard + pink.')

  // Drop pink back into the open IDEAS tray — return path.
  const pinkOnDesk = page.locator('.arc-desk-surface > [data-desk-post-it="accent-pink"]')
  const pinkGrip = pinkOnDesk.getByTestId('arc-desk-post-it-accent-pink-grip')
  const pinkStart = await pinkGrip.boundingBox()
  const slotBox = await page.getByTestId('arc-desk-ideas-accent-slot').boundingBox()
  assert(pinkStart && slotBox, 'Pink desk sticky + IDEAS slot needed for return drop.')
  if ((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')) !== 'true') {
    await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
    await page.waitForTimeout(200)
  }
  await page.mouse.move(pinkStart.x + pinkStart.width / 2, pinkStart.y + pinkStart.height / 2)
  await page.mouse.down()
  await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2, { steps: 18 })
  await page.locator(".arc-desk-tray-dock.arc-desk-postit-drop-target--ideas, .arc-desk-tray-dock[data-desk-postit-park='ideas']").waitFor({ state: 'attached', timeout: 3000 })
  await page.mouse.up()
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-pink"]').count() === 1, 'Dropping pink onto IDEAS must return it to the tray.')
  // Leave mustard on wood; pull pink back out so later accent assertions see both loose.
  const pinkReturned = page.getByTestId('arc-desk-ideas-accent-slot').getByTestId('arc-desk-post-it-accent-pink')
  const pinkReturnedGrip = pinkReturned.getByTestId('arc-desk-post-it-accent-pink-grip')
  const pinkReturnedStart = await pinkReturnedGrip.boundingBox()
  assert(pinkReturnedStart, 'Returned pink must be draggable out again.')
  await page.mouse.move(pinkReturnedStart.x + pinkReturnedStart.width / 2, pinkReturnedStart.y + pinkReturnedStart.height / 2)
  await page.mouse.down()
  await page.mouse.move(surfaceBox.x + surfaceBox.width * 0.8, surfaceBox.y + surfaceBox.height * 0.62, { steps: 14 })
  await page.mouse.up()
  assert(await page.locator('.arc-desk-surface > [data-desk-post-it="accent-pink"]').count() === 1, 'Pink must leave IDEAS again onto the exterior desk.')

  // Clean up still gathers desk post-its back into IDEAS.
  await page.getByTestId('arc-desk-clean-up').click()
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-mustard"]').count() === 1, 'Clean up must gather mustard back into IDEAS after drag-out.')
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-pink"]').count() === 1, 'Clean up must gather pink back into IDEAS after drag-out.')
  // Pull accents back onto the wood for later accent assertions that expect loose stickies.
  if ((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')) !== 'true') {
    await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
  }
  for (const tone of ['mustard', 'pink', 'blue']) {
    const traySticky = page.getByTestId('arc-desk-ideas-accent-slot').getByTestId(`arc-desk-post-it-accent-${tone}`)
    if (await traySticky.count() === 0) continue
    const grip = traySticky.getByTestId(`arc-desk-post-it-accent-${tone}-grip`)
    const start = await grip.boundingBox()
    if (!start) continue
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
    await page.mouse.down()
    await page.mouse.move(surfaceBox.x + surfaceBox.width * (0.68 + (tone === 'pink' ? 0.08 : tone === 'blue' ? 0.14 : 0)), surfaceBox.y + surfaceBox.height * 0.55, { steps: 12 })
    await page.mouse.up()
  }
  // Collapse again so later tray-utility assertions match a closed IDEAS dock.
  if ((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')) === 'true') {
    await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
  }

  await page.evaluate(() => {
    const tray = document.querySelector('[data-testid="arc-desk-utility-tabs"] button.arc-index-tab--workspace')
    tray?.click()
  })
  await page.locator('.b01-fridge-owner[data-state="open"]').waitFor({ state: 'attached' })
  const edgeTabs = page.getByTestId('arc-planner-physical-tabs')
  assert((await edgeTabs.getAttribute('data-desk-slices')) === 'true', 'Planner edge tabs must use committed tab PNG assets by default.')
  const weekTabArt = await edgeTabs.locator('[data-desk-slice-tab="week"]').evaluate((el) => getComputedStyle(el).backgroundImage)
  assert(weekTabArt.includes('planner-edge-tab'), 'WEEK tab must use committed inactive/active slice rasters.')
  const edgeTabMetrics = await edgeTabs.evaluate((nav) => {
    const buttons = [...nav.querySelectorAll('button.arc-index-tab')]
    return buttons.map((btn) => {
      const label = btn.querySelector('.arc-index-tab-label')
      const style = getComputedStyle(btn)
      const labelBox = label?.getBoundingClientRect()
      return {
        name: (label?.textContent || btn.textContent || '').trim(),
        writingMode: style.writingMode,
        labelHeight: labelBox ? Math.round(labelBox.height) : 0,
        labelWidth: labelBox ? Math.round(labelBox.width) : 0,
      }
    })
  })
  assert(edgeTabMetrics.filter((tab) => ['DAY', 'WEEK', 'MONTH', 'YEAR'].includes(tab.name)).length === 4, 'Edge tabs must expose DAY/WEEK/MONTH/YEAR.')
  assert(!edgeTabMetrics.some((tab) => tab.name === 'SETTINGS'), 'SETTINGS must not sit in the right-edge DAY/WEEK stack.')
  assert(
    edgeTabMetrics.every((tab) => tab.writingMode === 'horizontal-tb'),
    `Edge tabs must stay upright horizontal (got ${edgeTabMetrics.map((t) => t.writingMode).join(',')}).`,
  )
  const monthTab = edgeTabMetrics.find((tab) => tab.name === 'MONTH')
  assert(Boolean(monthTab), 'MONTH edge tab must render.')
  assert(
    monthTab.labelHeight <= 18 && monthTab.labelWidth >= 36,
    `MONTH label must stay one line (got ${monthTab.labelWidth}×${monthTab.labelHeight}).`,
  )
  const settingsTab = page.getByTestId('arc-desk-settings-tab')
  assert(await settingsTab.isVisible(), 'SETTINGS must protrude from the planner as a physical edge tab.')
  assert(await settingsTab.evaluate((el) => el.classList.contains('arc-index-tab--settings-physical')), 'SETTINGS must use the physical copper tab face.')
  assert(await page.getByTestId('arc-desk-settings-tab-face').count() === 1, 'SETTINGS face must be Kelly settings-tab.png.')
  const settingsClosedStack = await page.evaluate(() => {
    const settings = document.querySelector('[data-testid="arc-desk-settings-tab"]')
    const planner = document.querySelector('.arc-planner-object')
    const face = document.querySelector('[data-testid="arc-desk-settings-tab-face"]')
    if (!(settings instanceof HTMLElement) || !(planner instanceof HTMLElement) || !(face instanceof HTMLElement)) {
      return { ok: false, reason: 'missing nodes' }
    }
    const sZ = Number.parseInt(getComputedStyle(settings).zIndex, 10)
    const pZ = Number.parseInt(getComputedStyle(planner).zIndex, 10)
    const faceW = face.getBoundingClientRect().width
    const expanded = settings.getAttribute('aria-expanded')
    return {
      ok: expanded === 'false' && Number.isFinite(sZ) && Number.isFinite(pZ) && sZ < pZ && faceW >= 52,
      sZ,
      pZ,
      faceW: Math.round(faceW),
      expanded,
    }
  })
  assert(settingsClosedStack.ok, `Closed SETTINGS must tuck under planner (z) and read larger (got ${JSON.stringify(settingsClosedStack)}).`)
  const settingsPlacement = await page.evaluate(() => {
    const settings = document.querySelector('[data-testid="arc-desk-settings-tab"]')
    const planner = document.querySelector('.arc-planner-object')
    const utility = document.querySelector('[data-testid="arc-desk-utility-tabs"] .arc-index-tab--settings')
    if (!(settings instanceof HTMLElement) || !(planner instanceof HTMLElement)) {
      return { ok: false, reason: 'missing nodes' }
    }
    const s = settings.getBoundingClientRect()
    const p = planner.getBoundingClientRect()
    const gripsLeft = s.left < p.left + 8 && s.right > p.left - 4
    const verticallyOnPlanner = s.top >= p.top - 20 && s.bottom <= p.bottom + 20
    return {
      ok: gripsLeft && verticallyOnPlanner && !utility,
      gripsLeft,
      verticallyOnPlanner,
      utilityPresent: Boolean(utility),
      settingsLeft: Math.round(s.left),
      plannerLeft: Math.round(p.left),
    }
  })
  assert(settingsPlacement.ok, `SETTINGS must grip the journal left edge (got ${JSON.stringify(settingsPlacement)}).`)
  assert(await page.locator('[data-testid="arc-desk-utility-tabs"] .arc-index-tab--settings').count() === 0, 'No duplicate SETTINGS in wood utility tabs.')
  const titleMark = page.getByTestId('desk-planner-rainbow-mark')
  const titleMarkSource = await titleMark.getAttribute('data-desk-mark-source')
  assert(titleMarkSource === 'canonical-calendar-date-rainbow', 'Week title mark must use Kelly calendar-date-rainbow.png.')
  const markOk = await page.getByTestId('desk-planner-rainbow-mark').evaluate((img) => img instanceof HTMLImageElement && img.naturalWidth > 20)
  assert(markOk, 'Rainbow title mark must load real pixels.')
  assert(await page.getByTestId('desk-planner-week-kicker').count() === 1, 'Week kicker must render above Teaching week.')
  const titleMarkSrc = await titleMark.getAttribute('src')
  assert(Boolean(titleMarkSrc && titleMarkSrc.includes('calendar-date-rainbow.png')), 'Week title mark src must be calendar-date-rainbow.png.')
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
  await page.getByRole('button', { name: 'Close IDEAS', exact: true }).click()
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible' })
  await shot(page, '01-desk-layout.png')

  await page.evaluate(() => {
    const settings = document.querySelector('[data-testid="arc-desk-settings-tab"]')
    settings?.click()
  })
  assert(await page.locator('.b01-settings-owner[data-state="open"]').count() === 1, 'SETTINGS edge tab must land on main Settings furniture.')
  const settingsOpenStack = await page.evaluate(() => {
    const settings = document.querySelector('[data-testid="arc-desk-settings-tab"]')
    const planner = document.querySelector('.arc-planner-object')
    if (!(settings instanceof HTMLElement) || !(planner instanceof HTMLElement)) return { ok: false }
    const sZ = Number.parseInt(getComputedStyle(settings).zIndex, 10)
    const pZ = Number.parseInt(getComputedStyle(planner).zIndex, 10)
    return { ok: settings.getAttribute('aria-expanded') === 'true' && sZ > pZ, sZ, pZ }
  })
  assert(settingsOpenStack.ok, `Open SETTINGS must come forward of planner (got ${JSON.stringify(settingsOpenStack)}).`)
  const editWorkspace = page.getByRole('button', { name: 'Arrange desk', exact: true })
  await editWorkspace.waitFor({ state: 'visible', timeout: 8000 })
  assert(await page.getByRole('heading', { name: 'Desk setup' }).isVisible(), 'Settings must expose Desk setup IA.')
  const deskNotesToggle = page.getByRole('checkbox', { name: /Day notes/i })
  assert(await deskNotesToggle.count() === 1, 'Desk setup must keep optional Day notes strip toggle.')
  await shot(page, '15-settings-home-desk.png')
  await deskNotesToggle.check()
  await page.getByRole('button', { name: 'Close Settings', exact: true }).click()
  await page.getByTestId('planning-desk-notes-strip').waitFor({ state: 'visible', timeout: 8000 })
  assert(await page.getByTestId('arc-desk-notes-object').getAttribute('data-notes-placement') === 'planner-header', 'Desk notes must render as planner header strip, not wood dock.')
  assert(await page.locator('.arc-desk-notes-dock').count() === 0, 'Floating wood notes dock must stay off when strip is enabled.')
  const notesBandPlacement = await page.evaluate(() => {
    const header = document.querySelector('.planning-date-header')
    const strip = document.querySelector('[data-testid="planning-desk-notes-strip"]')
    const firstCourse = document.querySelector('.planning-grid > .planning-course')
    if (!header || !strip || !firstCourse) return { ok: false, reason: 'missing nodes' }
    const headerBottom = header.getBoundingClientRect().bottom
    const stripTop = strip.getBoundingClientRect().top
    const stripBottom = strip.getBoundingClientRect().bottom
    const courseTop = firstCourse.getBoundingClientRect().top
    const cells = [...document.querySelectorAll('.planning-desk-notes-cell')]
    return {
      ok: stripTop >= headerBottom - 2 && courseTop >= stripBottom - 2 && cells.length >= 3,
      headerBottom,
      stripTop,
      stripBottom,
      courseTop,
      cellCount: cells.length,
    }
  })
  assert(notesBandPlacement.ok, `Notes strip must sit between CLASS/date header and first course with day cells. got ${JSON.stringify(notesBandPlacement)}`)
  const dateCentered = await page.evaluate(() => {
    const heading = document.querySelector('.planning-date-heading')
    if (!heading) return false
    const style = getComputedStyle(heading)
    return style.textAlign === 'center' && style.justifyItems === 'center'
  })
  assert(dateCentered, 'Week date headers must center the date under the weekday.')

  await page.evaluate(() => {
    const settings = document.querySelector('[data-testid="arc-desk-settings-tab"]')
    settings?.click()
  })
  await editWorkspace.waitFor({ state: 'visible', timeout: 8000 })
  await deskNotesToggle.uncheck()
  await page.getByRole('button', { name: 'Close Settings', exact: true }).click()
  await page.waitForFunction(() => !document.querySelector('[data-testid="planning-desk-notes-strip"]'), null, { timeout: 8000 })
  const noLeftoverGap = await page.evaluate(() => {
    const header = document.querySelector('.planning-date-header')
    const firstCourse = document.querySelector('.planning-grid > .planning-course')
    if (!header || !firstCourse) return false
    return firstCourse.getBoundingClientRect().top - header.getBoundingClientRect().bottom < 48
  })
  assert(noLeftoverGap, 'Turning Day notes strip off must remove the band without leaving a large gap.')
  await page.evaluate(() => {
    const settings = document.querySelector('[data-testid="arc-desk-settings-tab"]')
    settings?.click()
  })
  await editWorkspace.waitFor({ state: 'visible', timeout: 8000 })
  await deskNotesToggle.check()
  await page.getByRole('button', { name: 'Close Settings', exact: true }).click()
  await page.getByTestId('planning-desk-notes-strip').waitFor({ state: 'visible', timeout: 8000 })

  await page.evaluate(() => {
    const settings = document.querySelector('[data-testid="arc-desk-settings-tab"]')
    settings?.click()
  })
  await editWorkspace.waitFor({ state: 'visible', timeout: 8000 })
  await editWorkspace.click()
  assert(await page.getByTestId('desk-edit-toolbar').isVisible(), 'Arrange desk must enter arrangement mode on the real desk.')
  assert(await page.locator('[data-desk-edit-mode="true"]').count() === 1, 'Desk edit mode flag must be set.')
  assert(await page.getByTestId('arc-desk-arctable').getAttribute('data-interactions-disabled') === 'true', 'ArcTable quadrant clicks must disable while editing desk layout.')
  await shot(page, 'desk-edit-mode.png')

  await page.getByRole('button', { name: 'Done arranging', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('[data-desk-edit-mode="true"]') === null, null, { timeout: 8000 })
  assert((await page.locator('.arc-index-tab[aria-current="page"]').first().textContent())?.trim() === returnTabLabel, 'Done arranging must return to the same planner view.')

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
