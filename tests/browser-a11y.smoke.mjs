import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function trackRuntimeErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  return errors
}

async function auditDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  assert(await page.getByRole('main').count() === 1, 'Desktop: expected exactly one main landmark.')
  assert(await page.getByRole('navigation', { name: 'Calendar views' }).count() === 1, 'Desktop: Calendar views navigation lost its accessible name.')
  assert(await page.getByRole('heading', { name: 'Tell Arc which days are actually yours.' }).count() === 1, 'Desktop: calendar setup heading is missing or duplicated.')

  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to calendar' })
  assert(await skip.evaluate((node) => document.activeElement === node), 'Keyboard: first Tab must reach Skip to calendar.')
  await page.keyboard.press('Enter')
  assert(await page.locator('#calendar-stage').evaluate((node) => document.activeElement === node), 'Keyboard: Skip to calendar must move focus to main calendar stage.')

  const save = page.getByRole('button', { name: 'Use this calendar' })
  await save.click()
  const alert = page.getByRole('alert', { name: 'Calendar setup issues' })
  assert(await alert.isVisible(), 'Validation: failed calendar submit must expose an alert summary.')
  assert((await alert.textContent())?.includes('Check these before saving'), 'Validation: alert summary copy missing.')

  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `Desktop: unexpected document horizontal overflow (${geometry.scroll} > ${geometry.width}).`)
  assert(runtimeErrors.length === 0, `Desktop runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditTouchAndReflow(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const save = page.getByRole('button', { name: 'Use this calendar' })
  const box = await save.boundingBox()
  assert(box && box.width >= 44 && box.height >= 44, `Touch: primary setup action is smaller than 44px (${box?.width}×${box?.height}).`)

  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `390px: document overflowed horizontally (${geometry.scroll} > ${geometry.width}).`)
  assert(runtimeErrors.length === 0, `390px runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditMinimumWidth(browser) {
  const context = await browser.newContext({ viewport: { width: 320, height: 700 } })
  const page = await context.newPage()
  const runtimeErrors = trackRuntimeErrors(page)
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  const geometry = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  assert(geometry.scroll <= geometry.width + 1, `320px: document overflowed horizontally (${geometry.scroll} > ${geometry.width}).`)
  assert(runtimeErrors.length === 0, `320px runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
}

async function auditReducedMotion(browser) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'Reduced motion preference was not exposed to Arc.')
  const timing = await page.locator('.primary-button').evaluate((node) => {
    const style = getComputedStyle(node)
    const max = (value) => Math.max(...value.split(',').map((item) => parseFloat(item) || 0))
    return { animation: max(style.animationDuration), transition: max(style.transitionDuration) }
  })
  assert(timing.animation <= 0.01 && timing.transition <= 0.01, `Reduced motion was not effectively suppressed (${JSON.stringify(timing)}).`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await auditDesktop(browser)
  await auditTouchAndReflow(browser)
  await auditMinimumWidth(browser)
  await auditReducedMotion(browser)
  console.log('Arc browser accessibility smoke gate passed: landmarks, initial keyboard order, skip link, validation alert, 44px touch target, 320/390 reflow, reduced motion, overflow, and runtime errors.')
} finally {
  await browser.close()
}
