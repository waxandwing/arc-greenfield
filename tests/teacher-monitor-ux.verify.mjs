import { chromium } from 'playwright'
import { mkdirSync, copyFileSync } from 'node:fs'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
function assert(c, m) { if (!c) throw new Error(m) }

const live = {
  version: 1,
  surface: 'teacher',
  startedAt: new Date().toISOString(),
  phase: 1,
  phaseCount: 4,
  directions: ['Find one vertical line that pulls your eye upward.', 'Compare the west façade to the nave elevation.', 'Talk with your table: structure, light, or sculpture?'],
  materials: 'Workbook · Pencil',
  voiceLevel: 2,
  boardLocked: true,
  timer: { status: 'idle', durationSeconds: 600, remainingSeconds: 600, runStartedAt: null },
  cleanupTimer: { status: 'idle', durationSeconds: 300, remainingSeconds: 300, runStartedAt: null },
  people: { sectionId: 'section-p4', roster: [], selectedId: null, projected: false, mode: 'random' },
  passes: { sectionId: 'section-p4', passes: [{ id: 'hall-pass', label: 'Hall pass', status: 'inactive', personId: null }] },
  media: { sectionId: 'section-p4', items: [], activeId: null, projected: false },
  session: {
    calendarId: 'calendar-multiprep',
    courseId: 'course-apah',
    courseTitle: 'AP Art History',
    sectionId: 'section-p4',
    sectionName: 'Period 4',
    unitId: 'unit-apah',
    unitTitle: 'Early Europe + Colonial Americas',
    lessonId: 'lesson-chartres',
    lessonTitle: 'Gothic cathedrals: Chartres, light, engineering',
    date: '2026-10-12',
    deliveryStatus: 'in-progress',
    phases: ['Look', 'Compare', 'Discuss', 'Reflect'],
    directions: ['Find one vertical line that pulls your eye upward.', 'Compare the west façade to the nave elevation.', 'Talk with your table: structure, light, or sculpture?'],
    resources: [{ id: 'chartres-reference', title: 'Chartres reference image', kind: 'image', source: '/assets/arc/arc-mark.png' }],
  },
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.addInitScript((liveState) => {
  const calendarId = 'calendar-multiprep'
  const calendarInput = { id: calendarId, schoolYearLabel: '2026–27', firstDay: '2026-10-12', lastDay: '2027-05-28', instructionalWeekdays: [1,2,3,4,5], patternSource: 'manual', patternConfidence: 'confirmed', exceptions: [], quarters: [], semesters: [] }
  localStorage.setItem('arc.calendar.v1', JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), input: calendarInput }))
  localStorage.setItem('arc.planningWorkspace.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, courses: [{ id: 'course-apah', title: 'AP Art History' }], sections: [{ id: 'section-p4', courseId: 'course-apah', calendarId, name: 'Period 4' }], notes: [] } }))
  localStorage.setItem('arc.units.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, units: [] } }))
  localStorage.setItem('arc.lessons.v1', JSON.stringify({ schemaVersion: 1, input: { calendarId, lessons: [], deliveryStates: [] } }))
  localStorage.setItem('arc.arctable.live.v1', JSON.stringify(liveState))
  localStorage.setItem('arc.onboarding.v1', JSON.stringify({ schemaVersion: 1, stage: 'landed', dismissed: true, firstCapturePromptDismissed: true }))
}, live)
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.waitForSelector('.arctable--teacher')

const checks = await page.evaluate(() => {
  const main = document.querySelector('.arctable--teacher')
  const layout = document.querySelector('[data-testid="arctable-teacher-layout"]')
  const board = document.querySelector('.arctable-board')
  const stage = document.querySelector('[data-testid="arctable-stage"]')
  const controls = document.querySelector('aside.arctable-controls')
  const chip = document.querySelector('.arctable-live-chip')
  const settings = document.querySelector('[data-testid="arctable-settings"]')
  const mark = document.querySelector('[data-testid="arctable-header-mark"]')
  const timer = document.querySelector('.arctable-timer-display .arctable-timer-digits')
  const materials = document.querySelector('.arctable-control-field')
  const voice = document.querySelectorAll('.arctable-control-field')[1]
  const mainBox = main.getBoundingClientRect()
  const boardBox = board.getBoundingClientRect()
  const stageBox = stage.getBoundingClientRect()
  const controlsBox = controls.getBoundingClientRect()
  const materialsBox = materials.getBoundingClientRect()
  const voiceBox = voice.getBoundingClientRect()
  const chipBg = getComputedStyle(chip).backgroundColor
  const columnCount = getComputedStyle(layout).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length
  return {
    mainHeight: mainBox.height,
    viewport: window.innerHeight,
    boardTop: boardBox.top,
    boardBottom: boardBox.bottom,
    stageLeft: stageBox.left,
    boardRight: boardBox.right,
    controlsLeft: controlsBox.left,
    stageRight: stageBox.right,
    controlsWidth: controlsBox.width,
    columnCount,
    materialsBottom: materialsBox.bottom,
    voiceTop: voiceBox.top,
    labelGap: voiceBox.top - materialsBox.bottom,
    pageScrollable: document.documentElement.scrollHeight > window.innerHeight + 2,
    chipBg,
    pineFill: chipBg === 'rgb(31, 75, 58)',
    hasSettings: Boolean(settings),
    markSrc: mark?.getAttribute('src') || '',
    markLoaded: mark?.complete && mark.naturalWidth > 0,
    timerLabel: timer?.textContent || '',
    mediaCta: document.querySelector('.arctable-media-empty-actions button')?.textContent || '',
    stageHasMedia: Boolean(stage.querySelector('.arctable-media')),
  }
})

mkdirSync('/tmp/teacher-monitor-ux-9f3c/artifacts/teacher-ux', { recursive: true })
await page.screenshot({ path: '/tmp/teacher-monitor-ux-9f3c/artifacts/teacher-ux/teacher-monitor-desktop.png', fullPage: false })

assert(checks.mainHeight <= checks.viewport + 1, `main taller than viewport: ${JSON.stringify(checks)}`)
assert(checks.boardTop >= 0 && checks.boardBottom <= checks.viewport + 2, `board overflows viewport: ${JSON.stringify(checks)}`)
assert(!checks.pageScrollable, `page scrollable: ${JSON.stringify(checks)}`)
assert(!checks.pineFill, `pine fill still present: ${JSON.stringify(checks)}`)
assert(checks.hasSettings, 'missing settings')
assert(checks.markLoaded && checks.markSrc.includes('assets/arctable/logo-icon-framed-arc-primary-512.png'), `bad mark ${checks.markSrc}`)
assert(checks.timerLabel === '10:00', `timer honesty failed: ${checks.timerLabel}`)
assert(checks.mediaCta.toLowerCase().includes('project'), `missing media CTA: ${checks.mediaCta}`)
assert(checks.columnCount === 3, `expected 3 columns, got ${checks.columnCount}: ${JSON.stringify(checks)}`)
assert(checks.stageHasMedia, 'center stage missing media surface')
assert(checks.boardRight <= checks.stageLeft + 2, `board/stage overlap: ${JSON.stringify(checks)}`)
assert(checks.stageRight <= checks.controlsLeft + 2, `stage/controls overlap: ${JSON.stringify(checks)}`)
assert(checks.controlsWidth >= 280, `controls rail too narrow: ${JSON.stringify(checks)}`)
assert(checks.labelGap >= 0, `Materials/Voice labels overlapping: ${JSON.stringify(checks)}`)

await page.getByRole('button', { name: 'Pass tools' }).click()
assert(await page.locator('.arctable-pass-panel').count() === 1, 'pass panel open')
await page.locator('.arctable-board').click({ position: { x: 20, y: 20 } })
assert(await page.locator('.arctable-pass-panel').count() === 0, 'pass panel outside click')

await page.getByTestId('arctable-settings').click()
await page.waitForSelector('#b01-settings-surface')
assert(await page.getByRole('button', { name: /Return to ArcTable/ }).count() === 1, 'settings opens plan with return')
assert(await page.locator('.b01-settings-group').count() > 0, 'settings surface must show planner settings groups')
await page.screenshot({ path: '/tmp/teacher-monitor-ux-9f3c/artifacts/teacher-ux/teacher-settings-open.png', fullPage: false })
await page.getByRole('button', { name: /Return to ArcTable/ }).evaluate((el) => el.click())
await page.waitForSelector('.arctable--teacher')

console.log('Teacher Monitor UX verify OK', checks)
await browser.close()
