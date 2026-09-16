import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
function assert(c, m) { if (!c) throw new Error(m) }

const live = {
  version: 2,
  surface: 'teacher',
  startedAt: new Date().toISOString(),
  phase: 1,
  phaseCount: 1,
  directions: [],
  materials: '',
  voiceLevel: 2,
  boardLocked: false,
  timer: { status: 'idle', durationSeconds: 600, remainingSeconds: 600, runStartedAt: null },
  cleanupTimer: { status: 'idle', durationSeconds: 300, remainingSeconds: 300, runStartedAt: null },
  people: { sectionId: 'section-p4', roster: [], selectedId: null, projected: false, mode: 'random' },
  passes: { sectionId: 'section-p4', passes: [] },
  media: { sectionId: 'section-p4', items: [], activeId: null, projected: false },
  session: {
    calendarId: 'calendar-multiprep',
    courseId: 'course-apah',
    courseTitle: 'AP Art History',
    sectionId: 'section-p4',
    sectionName: 'Period 4',
    unitId: 'unit-apah',
    unitTitle: 'Unit',
    lessonId: 'lesson-boxes',
    lessonTitle: 'Finish boxes',
    date: '2026-10-12',
    deliveryStatus: 'in-progress',
    phases: ['Finish'],
    directions: [],
    materials: [],
    resources: [],
  },
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.addInitScript((liveState) => {
  localStorage.setItem('arc.arctable.live.v1', JSON.stringify(liveState))
  localStorage.setItem('arc.onboarding.v1', JSON.stringify({ schemaVersion: 1, stage: 'landed', dismissed: true, firstCapturePromptDismissed: true }))
}, live)
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForSelector('.arctable--teacher')

const editable = page.getByTestId('arctable-mode-editable')
const projected = page.getByTestId('arctable-mode-projected')
assert(await editable.count() === 1, 'Editable mode control missing')
assert(await projected.count() === 1, 'Projected view mode control missing')
assert(await editable.getAttribute('aria-pressed') === 'true', 'Editable should be active by default')
assert(await page.locator('.arctable-board.is-editable').count() === 1, 'board should be editable by default')
assert(await page.locator('.arctable-board.is-locked').count() === 0, 'board should not start locked')

await page.getByTestId('arctable-settings').click()
await page.waitForSelector('[data-testid="arctable-settings-board-lock"]')
await page.getByTestId('arctable-settings-board-lock').click()
assert(await page.evaluate(() => JSON.parse(localStorage.getItem('arc.arctable.live.v1')).boardLocked) === true, 'Table settings must still lock the board')
assert(await editable.getAttribute('aria-pressed') === 'false', 'Editable inactive when locked via settings')

await page.getByRole('button', { name: 'Close', exact: true }).click()
await editable.click()
assert(await page.evaluate(() => JSON.parse(localStorage.getItem('arc.arctable.live.v1')).boardLocked) === false, 'Editable must unlock immediately')
assert(await editable.getAttribute('aria-pressed') === 'true', 'Editable active after click')
assert(await page.locator('.arctable-board.is-editable').count() === 1, 'board editable after Editable click')

await projected.click()
await page.waitForSelector('.arctable--student')
assert(await page.evaluate(() => JSON.parse(localStorage.getItem('arc.arctable.live.v1')).boardLocked) === true, 'Projected view must lock for students')

await page.keyboard.press('Escape')
await page.waitForSelector('.arctable--teacher')
assert(await page.evaluate(() => JSON.parse(localStorage.getItem('arc.arctable.live.v1')).boardLocked) === false, 'return to teacher must restore Editable')
assert(await editable.getAttribute('aria-pressed') === 'true', 'Editable active after return from projected view')

await browser.close()
console.log('arctable editable default verify passed')
