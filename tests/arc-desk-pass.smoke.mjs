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
  assert(closedIdeasPeek.artVisibility === 'hidden', 'Closed IDEAS must hide drawer chrome art so only the tab peeks.')
  const woodMarkSrc = await page.getByTestId('arc-desk-wood-wordmark').getAttribute('src')
  assert(woodMarkSrc?.includes('arc-mark-stacked.png'), 'Wood wordmark must use arc-mark-stacked.png (not sliced arc-mark.png).')
  assert(await page.getByTestId('desk-slice-ideas-drawer').count() === 1, 'IDEAS drawer must use ideas-drawer-chrome.png by default.')
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
  assert(await page.getByTestId('desk-slice-todos-tab').count() === 1, 'TO-DOS side tab slice must render on denim folder edge.')
  assert((await page.getByTestId('arc-desk-todos-folder').getAttribute('data-extended')) === 'true', 'TO-DOS denim folder stays visible.')
  assert(await page.getByTestId('desk-priority-pad').isVisible(), 'MSC pad must render inside denim TO-DOS folder.')
  // Accent post-its sit near the top edge; DOM click avoids pointer intercept on the slim tab.
  await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
  assert(await page.getByTestId('arc-desk-tray-dock').locator('.workspace-capture-card', { hasText: 'Field trip idea' }).count() === 1, 'Capture must appear in IDEAS/tray dock when extended.')
  const ideasOpen = await page.getByTestId('arc-desk-tray-dock').evaluate((el) => {
    const surface = el.closest('.arc-desk-surface')
    const rect = el.getBoundingClientRect()
    const surfaceTop = surface ? surface.getBoundingClientRect().top : 0
    const transform = getComputedStyle(el).transform
    return {
      transform,
      offsetFromSurfaceTop: rect.top - surfaceTop,
      extended: el.getAttribute('data-extended'),
      width: rect.width,
      height: rect.height,
    }
  })
  assert(ideasOpen.extended === 'true', 'IDEAS dock must be extended after tab click.')
  assert(ideasOpen.offsetFromSurfaceTop <= 4, `IDEAS drawer must stay locked to top of desk when open (offset=${ideasOpen.offsetFromSurfaceTop}).`)
  assert(ideasOpen.width > ideasOpen.height, 'Open IDEAS drawer must remain landscape (wider than tall).')
  assert(await page.getByTestId('desk-slice-todos-tab').isVisible(), 'TO-DOS tab art must remain visible while IDEAS is open.')
  assert(await page.getByTestId('arc-desk-todos-folder').isVisible(), 'TO-DOS denim folder must remain visible while IDEAS is open.')
  assert(await page.getByTestId('arc-desk-quick-capture').isVisible(), 'Quick capture post-it must remain visible while IDEAS is open.')
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
  }
  const blueAccent = page.getByTestId('arc-desk-post-it-accent-blue')
  const blueNote = page.getByTestId('arc-desk-post-it-accent-blue-note')
  await blueNote.click()
  assert(await blueAccent.getAttribute('data-dragging') === 'false', 'Click-to-edit on accent note must not start a drag.')
  await blueNote.fill('Kelly blue jot')
  assert(await blueAccent.getAttribute('data-dragging') === 'false', 'Typing on accent note must not start a drag.')
  const storedNotes = await page.evaluate(() => localStorage.getItem('arc.desk-postit-notes.v1'))
  assert(storedNotes && storedNotes.includes('Kelly blue jot'), 'Accent note text must persist to localStorage per post-it id.')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible' })
  assert(await page.getByTestId('arc-desk-post-it-accent-blue-note').inputValue() === 'Kelly blue jot', 'Accent note must reload from localStorage.')
  const pinkAccent = page.getByTestId('arc-desk-post-it-accent-pink')
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
  assert(
    await page.locator('.arc-desk-surface > [data-desk-post-it]').count() >= 4,
    'Post-its must be direct arc-desk-surface children (not nested in IDEAS tray raster).',
  )
  assert(
    await page.locator('.arc-desk-green-drawer-art [data-desk-post-it], .arc-desk-tray-dock [data-desk-post-it]').count() === 0,
    'Post-its must not live inside IDEAS tray chrome.',
  )
  assert(await page.getByTestId('global-capture-trigger').count() === 0, 'Desk Quick Capture must not show a + Capture button.')
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
  const markOk = await page.getByTestId('desk-planner-rainbow-mark').evaluate((img) => img instanceof HTMLImageElement && img.naturalWidth > 20)
  assert(markOk, 'Rainbow title mark must load real pixels.')
  assert(await page.getByTestId('desk-planner-week-kicker').count() === 1, 'Week kicker must render above Teaching week.')
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
  const deskNotesToggle = page.getByRole('checkbox', { name: /Desk notes strip/i })
  assert(await deskNotesToggle.count() === 1, 'Desk setup must keep optional Desk notes strip toggle.')
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
    const settings = document.querySelector('[data-testid="arc-desk-utility-tabs"] button.arc-index-tab--settings')
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
  assert(noLeftoverGap, 'Turning Desk notes strip off must remove the band without leaving a large gap.')
  await page.evaluate(() => {
    const settings = document.querySelector('[data-testid="arc-desk-utility-tabs"] button.arc-index-tab--settings')
    settings?.click()
  })
  await editWorkspace.waitFor({ state: 'visible', timeout: 8000 })
  await deskNotesToggle.check()
  await page.getByRole('button', { name: 'Close Settings', exact: true }).click()
  await page.getByTestId('planning-desk-notes-strip').waitFor({ state: 'visible', timeout: 8000 })

  await page.evaluate(() => {
    const settings = document.querySelector('[data-testid="arc-desk-utility-tabs"] button.arc-index-tab--settings')
    settings?.click()
  })
  await editWorkspace.waitFor({ state: 'visible', timeout: 8000 })
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
