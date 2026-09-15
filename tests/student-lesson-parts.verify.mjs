import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
function assert(c, m) { if (!c) throw new Error(m) }

const live = {
  version: 2,
  startedAt: new Date().toISOString(),
  phase: 2,
  phaseCount: 3,
  directions: ['Name one shared motif across the two works.', 'What changed when you sat with both images?'],
  materials: 'art things',
  voiceLevel: 2,
  boardLocked: true,
  timer: { status: 'idle', durationSeconds: 600, remainingSeconds: 600, runStartedAt: null },
  cleanupTimer: { status: 'idle', durationSeconds: 300, remainingSeconds: 300, runStartedAt: null },
  people: { sectionId: 'section-p1', roster: [], selectedId: null, projected: false, mode: 'random' },
  passes: { sectionId: 'section-p1', passes: [] },
  media: { sectionId: 'section-p1', items: [], activeId: null, projected: false },
  session: {
    calendarId: 'calendar-multiprep',
    courseId: 'course-apah',
    courseTitle: 'AP Art History',
    sectionId: 'section-p1',
    sectionName: 'P1 • 8:05–9:00',
    unitId: 'unit-apah-meso',
    unitTitle: 'UNIT 2.1 Ancient Mesopotamia',
    lessonId: 'lesson-apah-w4',
    lessonTitle: 'Review + compare',
    date: '2026-09-10',
    deliveryStatus: 'in-progress',
    phases: ['Review', 'Compare', 'Synthesize'],
    directions: ['Name one shared motif across the two works.', 'What changed when you sat with both images?'],
    materials: ['art things'],
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
await page.getByRole('button', { name: /Student preview|Open projected view/i }).first().click()
await page.waitForSelector('.arctable--student')
await page.waitForSelector('[data-testid="arctable-student-parts"]')

const before = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('.arctable-student-parts button')]
  return {
    labels: buttons.map((button) => button.querySelector('.arctable-student-parts-label')?.textContent || ''),
    current: buttons.findIndex((button) => button.classList.contains('is-current')) + 1,
    rail: document.querySelector('.arctable-student-now')?.textContent || '',
    headerWordmark: document.querySelector('[data-testid="arctable-student-header-mark"]')?.getAttribute('src') || '',
  }
})

assert(before.labels.join('|') === 'Review|Compare|Synthesize', `expected plan parts, got ${before.labels.join('|')}`)
assert(before.current === 2, `expected Compare current, got ${before.current}`)
assert(before.rail.includes('2 of 3'), `rail should show phase 2 of 3, got ${before.rail}`)
assert(before.headerWordmark.includes('header-compact-dark'), `header brand asset must remain, got ${before.headerWordmark}`)

await page.getByRole('button', { name: 'Go to part: Synthesize' }).click()
await page.waitForFunction(() => document.querySelector('.arctable-student-parts button.is-current .arctable-student-parts-label')?.textContent === 'Synthesize')

const after = await page.evaluate(() => {
  const current = document.querySelector('.arctable-student-parts button.is-current .arctable-student-parts-label')?.textContent || ''
  const rail = document.querySelector('.arctable-student-now')?.textContent || ''
  return { current, rail }
})
assert(after.current === 'Synthesize', `click should switch current part, got ${after.current}`)
assert(after.rail.includes('3 of 3') && after.rail.includes('Synthesize'), `rail should follow part switch, got ${after.rail}`)

mkdirSync('docs/overnight/evidence/student-lesson-parts', { recursive: true })
await page.screenshot({ path: 'docs/overnight/evidence/student-lesson-parts/01-parts-strip.png', fullPage: true })

console.log('student-lesson-parts.verify: ok')
await browser.close()
