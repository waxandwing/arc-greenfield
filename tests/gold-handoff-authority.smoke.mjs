import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const evidenceDir = new URL('../docs/overnight/evidence/gold-handoff/', import.meta.url).pathname
mkdirSync(evidenceDir, { recursive: true })

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function assertNoDocumentOverflow(page, label) {
  const g = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(g.scroll <= g.client + 2, `${label}: unexpected document horizontal overflow (${g.scroll} > ${g.client})`)
}

async function assertBoundedContent(page, label) {
  const failures = await page.evaluate(() => {
    const selectors = ['.gh-lesson','.gh-note-cell span','.gh-planning-card','.gh-recovery-card','.gh-day-row','.gh-trust article','.gh-side-note','.gh-phone']
    const bad = []
    for (const el of document.querySelectorAll(selectors.join(','))) {
      const node = /** @type {HTMLElement} */ (el)
      if (node.scrollWidth > node.clientWidth + 3 && getComputedStyle(node).overflowX !== 'auto') {
        bad.push(`${node.className}: ${node.scrollWidth} > ${node.clientWidth}`)
      }
    }
    return bad.slice(0, 20)
  })
  assert(failures.length === 0, `${label}: bounded content escaped: ${failures.join(' | ')}`)
}

const desktopViews = ['week','divergence','recovery','sync','login','arctable']
const browser = await chromium.launch({ headless: true })
try {
  for (const view of desktopViews) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
    page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
    await page.goto(`${baseUrl}/?gallery=gold-handoff&handoff=${view}`, { waitUntil: 'networkidle' })
    await assertNoDocumentOverflow(page, view)
    await assertBoundedContent(page, view)
    assert(errors.length === 0, `${view}: runtime errors: ${errors.join(' | ')}`)
    await page.screenshot({ path: `${evidenceDir}${view}.png`, fullPage: true })
    if (view === 'week') {
      const scroll = await page.locator('.gh-calendar-viewport').evaluate(el => ({ client: el.clientHeight, scroll: el.scrollHeight, overflow: getComputedStyle(el).overflowY }))
      assert(scroll.scroll > scroll.client + 40, `week: calendar fixture does not overflow its internal viewport (${scroll.scroll} <= ${scroll.client})`)
      assert(['auto','scroll'].includes(scroll.overflow), `week: calendar viewport is not independently scrollable (${scroll.overflow})`)
      assert(await page.getByRole('button', { name: 'Live · ArcTable', exact: true }).isVisible(), 'week: Live · ArcTable access missing')
      assert(await page.getByRole('button', { name: 'ArcPal', exact: true }).isVisible(), 'week: ArcPal access missing')
    }
    await context.close()
  }

  const mobileContext = await browser.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1 })
  const mobile = await mobileContext.newPage()
  await mobile.goto(`${baseUrl}/?gallery=gold-handoff&handoff=arcpal`, { waitUntil: 'networkidle' })
  await assertNoDocumentOverflow(mobile, 'arcpal-mobile')
  await assertBoundedContent(mobile, 'arcpal-mobile')
  assert(await mobile.getByText('ArcPal', { exact: true }).isVisible(), 'ArcPal identity missing')
  for (const item of ['Today','Plan','Pocket','Live']) assert(await mobile.getByRole('button', { name: item, exact: true }).isVisible(), `ArcPal nav missing ${item}`)
  const targets = await mobile.locator('.gh-phone nav button').evaluateAll(nodes => nodes.map(n => ({ w: n.getBoundingClientRect().width, h: n.getBoundingClientRect().height, text: n.textContent })))
  assert(targets.every(t => t.h >= 44), `ArcPal: bottom-nav target below 44px: ${JSON.stringify(targets)}`)
  await mobile.screenshot({ path: `${evidenceDir}arcpal.png`, fullPage: true })
  await mobileContext.close()

  const scaleContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
  const scale = await scaleContext.newPage()
  await scale.goto(`${baseUrl}/?gallery=gold-handoff&handoff=week`, { waitUntil: 'networkidle' })
  await scale.addStyleTag({ content: 'html{font-size:200%!important}' })
  await assertNoDocumentOverflow(scale, 'week-200-text')
  const escaped = await scale.evaluate(() => [...document.querySelectorAll('.gh-lesson strong,.gh-lesson small,.gh-day-head,.gh-row-label')].filter(el => {
    const r = el.getBoundingClientRect(); const p = el.parentElement?.getBoundingClientRect(); return p ? (r.right > p.right + 2 || r.bottom > p.bottom + 2) : false
  }).map(el => el.textContent).slice(0,20))
  assert(escaped.length === 0, `week-200-text: text escaped bounded parents: ${escaped.join(' | ')}`)
  await scale.screenshot({ path: `${evidenceDir}week-200-text.png`, fullPage: true })
  await scaleContext.close()
} finally {
  await browser.close()
}

console.log('Gold handoff authority passed: desktop states, ArcPal mobile, internal Week scrolling, and 200% text containment.')
