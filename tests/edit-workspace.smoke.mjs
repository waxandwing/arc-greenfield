import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const TRAY_CAPTURE_MIME = 'application/x-arc-tray-capture+json'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

/** Synthetic HTML5 drag — Playwright pointer moves do not fire tray capture dragstart. */
async function dragTrayCapture(page, { captureId, targetCaptureId = null, targetSelector = null, mode = 'dwell' }) {
  const ok = await page.evaluate(
    async ({ captureId, targetCaptureId, targetSelector, mode, mime }) => {
      const idByLabel = { 'Stack alpha': 'cap-a', 'Stack beta': 'cap-b', 'Calendar hop': 'cap-cal' }
      const findTrayCard = (id) => {
        const calendarChip = document.querySelector(`[data-testid="calendar-capture-${id}"]`)
        if (calendarChip) return calendarChip
        const cards = [...document.querySelectorAll('button.workspace-capture-card-select')]
        return cards.find((node) => {
          const label = node.querySelector('strong')?.textContent?.trim() ?? ''
          return idByLabel[label] === id
        })
      }
      const src = findTrayCard(captureId)
      const target = targetCaptureId ? findTrayCard(targetCaptureId) : document.querySelector(targetSelector ?? '')
      if (!src || !target) return false
      const dt = new DataTransfer()
      dt.setData(mime, JSON.stringify({ kind: 'capture', captureId }))
      src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))
      await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      })
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }))
      if (mode === 'dwell') {
        const dwell =
          typeof window.__ARC_STACK_DWELL_MS === 'number' ? window.__ARC_STACK_DWELL_MS + 40 : 500
        await new Promise((resolve) => setTimeout(resolve, dwell))
      } else if (mode === 'drop') {
        target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }))
      }
      src.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer: dt }))
      return true
    },
    { captureId, targetCaptureId, targetSelector, mode, mime: TRAY_CAPTURE_MIME },
  )
  assert(ok, `Tray capture drag failed for ${captureId} → ${targetSelector}`)
}

function seed() {
  const calendarId = 'edit-workspace-smoke'
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
        captures: [
          { id: 'cap-a', calendarId, text: 'Stack alpha', createdAt: '2026-09-01T12:00:00.000Z' },
          { id: 'cap-b', calendarId, text: 'Stack beta', createdAt: '2026-09-02T12:00:00.000Z' },
          { id: 'cap-cal', calendarId, text: 'Calendar hop', createdAt: '2026-09-03T12:00:00.000Z' },
        ],
      },
    }),
    'arc.planning-context.v1': JSON.stringify({ schemaVersion: 2, calendarId, view: 'Month', anchorDate: '2026-09-15', focus: 'day' }),
    'arc.onboarding.v1': JSON.stringify({
      schemaVersion: 1,
      draft: { stage: 'landed', dismissed: true, firstCapturePromptDismissed: true },
    }),
  }
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.addInitScript((entries) => {
    window.__ARC_STACK_DWELL_MS = 80
    if (localStorage.getItem('arc.calendar.v1') !== null) return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, seed())
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible' })

  await page.evaluate(() => {
    document.querySelector('[data-testid="arc-desk-settings-tab"]')?.click()
  })
  await page.getByRole('button', { name: 'Edit Workspace', exact: true }).click()
  await page.locator('[data-settings-open="false"]').waitFor()
  await page.getByTestId('desk-edit-toolbar').waitFor({ state: 'visible' })
  assert(await page.locator('[data-desk-edit-mode="true"]').count() === 1, 'Edit mode must be active on the desk.')
  assert(await page.locator('.b01-calendar-owner--workspace-edit').count() === 1, 'Planning canvas must de-emphasize during edit.')

  const layoutBefore = await page.evaluate(() => localStorage.getItem('arc.workspace-layout.v1'))
  const trayBoxBefore = await page.getByTestId('arc-desk-tray-dock').boundingBox()
  await page.locator('[data-desk-object="tray"]').click()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(200)
  const trayBoxAfter = await page.getByTestId('arc-desk-tray-dock').boundingBox()
  assert(
    trayBoxBefore && trayBoxAfter && (trayBoxBefore.x !== trayBoxAfter.x || trayBoxBefore.y !== trayBoxAfter.y),
    'Edit Workspace arrow keys must move selected tray furniture on the desk.',
  )

  await page.getByRole('button', { name: 'Pin it down', exact: true }).click()
  const layoutAfter = await page.evaluate(() => localStorage.getItem('arc.workspace-layout.v1'))
  assert(layoutBefore !== layoutAfter, 'Pin it down must persist workspace layout after furniture moves.')
  await page.getByTestId('desk-edit-toolbar').waitFor({ state: 'hidden' })
  assert(await page.locator('[data-desk-edit-mode="false"]').count() >= 1, 'Pin it down must exit edit workspace mode.')

  const postIt = page.locator('.workspace-capture-card-select').first()
  assert(await postIt.getAttribute('draggable') === 'true', 'Tray post-its must remain draggable after pinning furniture.')

  const trayDock = page.getByTestId('arc-desk-tray-dock')
  const cards = trayDock.locator('.workspace-capture-card-select')
  assert(await cards.count() >= 2, 'Smoke seed must include two tray captures for stack dwell.')
  await dragTrayCapture(page, { captureId: 'cap-a', targetCaptureId: 'cap-b', mode: 'dwell' })
  await page.waitForTimeout(100)
  const stackUi = await page.locator('[data-testid^="tray-stack-"]').count()
  assert(stackUi >= 1, 'Dwell stack create must form a tray stack.')
  const stackRaw = await page.evaluate(() => localStorage.getItem('arc.object-stacks.v1'))
  assert(stackRaw && stackRaw.includes('stack'), 'Stack create must persist to arc.object-stacks.v1.')
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible' })
  assert(await page.locator('[data-testid^="tray-stack-"]').count() >= 1, 'Stack membership must survive reload.')

  await selectView(page, 'Month')
  const dropDay = page.locator('[data-plan-drop-date="2026-09-10"]').first()
  await dropDay.waitFor({ state: 'visible' })
  await dragTrayCapture(page, { captureId: 'cap-cal', targetSelector: '[data-plan-drop-date="2026-09-10"]', mode: 'drop' })
  await page.waitForTimeout(200)
  assert(await page.getByTestId('calendar-capture-cap-cal').count() === 1, 'Tray capture drag onto Month day must anchor on calendar.')
  await dragTrayCapture(page, { captureId: 'cap-cal', targetSelector: '[data-testid="tray-drop-surface"]', mode: 'drop' })
  await page.waitForTimeout(200)
  assert(await page.getByTestId('calendar-capture-cap-cal').count() === 0, 'Calendar capture drag back to tray must clear calendar anchor.')

  await browser.close()
  console.log('edit workspace smoke passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
