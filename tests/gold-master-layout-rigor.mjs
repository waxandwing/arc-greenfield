import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/gold-master-rigor/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const routes = ['week','week-edit','shift','day','month','quarter','year','unit','ideas','connections','arctable','pocket','settings','onboarding','trust']
const viewports = [
  { name: 'desktop', width: 1440, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'compact', width: 1100, height: 760 },
]

const strictBoxes = [
  '.gm-lesson', '.gm-neutral', '.gm-lunch', '.gm-day-card', '.gm-detail',
  '.gm-sidepad section', '.gm-month-day', '.gm-unitbar', '.gm-year section',
  '.gm-unit-grid > section', '.gm-thinking-grid > section', '.gm-connections article',
  '.gm-phone', '.gm-inline-create', '.gm-shift-panel'
].join(',')

const textTargets = [
  '.gm-lesson strong', '.gm-lesson span', '.gm-lesson-course', '.gm-day-card h2',
  '.gm-day-card p', '.gm-detail h2', '.gm-detail p', '.gm-sidepad label span',
  '.gm-sidepad label small', '.gm-month-day span', '.gm-unitbar strong',
  '.gm-unitbar span', '.gm-connections h2', '.gm-connections p', '.gm-note'
].join(',')

const browser = await chromium.launch({ headless: true })
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const runtimeErrors = []
    page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
    page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`) })

    for (const route of routes) {
      await page.goto(`${baseUrl}/?gold=${route}`, { waitUntil: 'networkidle' })

      const audit = await page.evaluate(({ strictBoxes, textTargets }) => {
        const root = document.documentElement
        const offenders = []
        const textOffenders = []

        for (const el of document.querySelectorAll(strictBoxes)) {
          const style = getComputedStyle(el)
          const canScrollX = /(auto|scroll)/.test(style.overflowX)
          const canScrollY = /(auto|scroll)/.test(style.overflowY)
          if (!canScrollX && el.scrollWidth > el.clientWidth + 2) {
            offenders.push(`${el.className}: width ${el.scrollWidth}>${el.clientWidth}`)
          }
          if (!canScrollY && el.scrollHeight > el.clientHeight + 3) {
            offenders.push(`${el.className}: height ${el.scrollHeight}>${el.clientHeight}`)
          }
        }

        for (const el of document.querySelectorAll(textTargets)) {
          const parent = el.parentElement
          if (!parent) continue
          const r = el.getBoundingClientRect()
          const p = parent.getBoundingClientRect()
          if (r.left < p.left - 2 || r.right > p.right + 2 || r.top < p.top - 2 || r.bottom > p.bottom + 8) {
            textOffenders.push(`${el.className || el.tagName}: text rect escapes parent`)
          }
        }

        return {
          pageWidth: root.scrollWidth,
          viewportWidth: root.clientWidth,
          offenders,
          textOffenders,
          main: (() => {
            const el = document.querySelector('.gm-main')
            if (!el) return null
            const style = getComputedStyle(el)
            return { clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, overflowY: style.overflowY, scrollTop: el.scrollTop }
          })(),
        }
      }, { strictBoxes, textTargets })

      assert(audit.pageWidth <= audit.viewportWidth + 1, `${viewport.name}/${route}: page escapes viewport (${audit.pageWidth}>${audit.viewportWidth})`)
      assert(audit.offenders.length === 0, `${viewport.name}/${route}: box overflow: ${audit.offenders.slice(0,8).join(' | ')}`)
      assert(audit.textOffenders.length === 0, `${viewport.name}/${route}: text escape: ${audit.textOffenders.slice(0,8).join(' | ')}`)
      assert(runtimeErrors.length === 0, `${viewport.name}/${route}: runtime errors: ${runtimeErrors.join(' | ')}`)

      if (route === 'week' && viewport.width >= 1100) {
        assert(audit.main, `${viewport.name}/week: main calendar frame missing`)
        assert(/auto|scroll/.test(audit.main.overflowY), `${viewport.name}/week: calendar frame is not internally scrollable`)
        const moved = await page.locator('.gm-main').evaluate(el => {
          const before = el.scrollTop
          el.scrollTop = Math.min(180, Math.max(1, el.scrollHeight - el.clientHeight))
          return { before, after: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
        })
        if (moved.scrollHeight > moved.clientHeight + 1) {
          assert(moved.after > moved.before, `${viewport.name}/week: calendar has overflow but does not scroll inside its frame`)
        }
      }

      if (viewport.name === 'laptop' && ['week','week-edit','shift'].includes(route)) {
        await page.screenshot({ path: `${evidenceDir}${route}-${viewport.name}.png`, fullPage: true })
      }
    }
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(`Gold Master rigor audit passed: ${routes.length} routes × ${viewports.length} viewports.`)
