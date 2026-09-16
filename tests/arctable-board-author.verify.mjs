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
  boardLocked: true,
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

assert(await page.getByTestId('arctable-board-add-direction').count() === 1, 'empty CTA missing')
assert(await page.getByText('Plan View to author the board').count() === 0, 'dead-end Plan View copy still present')
assert(await page.getByTestId('arctable-board-add-elements').count() === 1, 'add elements toolbar missing')

await page.getByTestId('arctable-board-add-direction').click()
await page.waitForSelector('[data-testid="arctable-board-compose"]')
await page.locator('#arctable-board-direction-input').fill('Glue the box lids carefully.')
await page.getByRole('button', { name: 'Add', exact: true }).click()
assert(await page.getByText('Glue the box lids carefully.').count() === 1, 'direction not added')

await page.getByTestId('arctable-board-add-materials').click()
await page.waitForSelector('.arctable-materials-edit input')
await page.locator('.arctable-materials-edit input').fill('Cardboard · glue')
await page.locator('.arctable-materials-edit input').blur()
assert(await page.getByText('Cardboard · glue').count() >= 1, 'materials not added')

await page.getByTestId('arctable-board-add-media').click()
assert(await page.locator('.arctable-media-panel').count() === 1, 'media tool did not open')

const locked = await page.evaluate(() => JSON.parse(localStorage.getItem('arc.arctable.live.v1')).boardLocked)
assert(locked === false, 'click-to-author should unlock the board')

await browser.close()
console.log('arctable board author verify passed')
