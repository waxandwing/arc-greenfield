import { chromium } from 'playwright'
import { selectPlanView as selectView } from './helpers/selectPlanView.mjs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
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
        notes: [{ id: 'task-1', calendarId, text: 'Print handouts', priority: 'must', placement: 'taskbar', createdAt: '2026-09-01T12:00:00.000Z' }],
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
    if (localStorage.getItem('arc.calendar.v1') !== null) return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value)
  }, seed())
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible' })

  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click()
  await page.getByRole('button', { name: 'Edit Workspace', exact: true }).click()
  await page.locator('[data-settings-open="false"]').waitFor()
  await page.getByTestId('desk-edit-toolbar').waitFor({ state: 'visible' })
  assert(await page.locator('[data-desk-edit-mode="true"]').count() === 1, 'Edit mode must be active on the desk.')
  assert(await page.locator('.b01-calendar-owner--workspace-edit').count() === 1, 'Planning canvas must de-emphasize during edit.')
  await page.getByRole('button', { name: 'Pin it down', exact: true }).click({ force: true })
  await page.getByTestId('desk-edit-toolbar').waitFor({ state: 'hidden' })
  assert(await page.locator('[data-desk-edit-mode="false"]').count() >= 1, 'Pin it down must exit edit workspace mode.')

  const cards = page.locator('.workspace-capture-card-select')
  assert(await cards.count() >= 2, 'Smoke seed must include two tray captures for stack dwell.')
  await cards.nth(0).dragTo(cards.nth(1), { force: true })
  await page.waitForTimeout(500)
  assert(await page.locator('[data-testid^="tray-stack-"]').count() >= 1, 'Dwell stack create must form a tray stack.')

  await browser.close()
  console.log('edit workspace smoke passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
