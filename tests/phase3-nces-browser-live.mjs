import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1024, height: 800 } })
const page = await context.newPage()
const browserErrors = []

page.on('console', (message) => {
  if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`))

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Add my school dates' }).click()
  await page.getByLabel('School name').fill('Oak Ridge')
  await page.getByLabel('City').fill('Orlando')
  await page.getByLabel('State').fill('FL')
  await page.getByRole('button', { name: 'Find my school' }).click()

  const results = page.locator('.school-identity-results')
  const providerError = page.locator('.school-identity-message--error')
  await Promise.race([
    results.waitFor({ state: 'visible', timeout: 15000 }),
    providerError.waitFor({ state: 'visible', timeout: 15000 }),
  ])

  if (await providerError.isVisible().catch(() => false)) {
    const text = await providerError.textContent()
    throw new Error(`Live browser NCES lookup did not reach a usable candidate state: ${text}`)
  }

  const text = await results.textContent()
  const normalizedText = (text ?? '').toUpperCase()
  assert(normalizedText.includes('OAK RIDGE HIGH'), `Live browser NCES lookup did not return Oak Ridge High: ${text}`)
  assert((text ?? '').includes('NCES Common Core of Data'), `Live browser NCES lookup lost official source labeling: ${text}`)
  assert(browserErrors.length === 0, `Live browser NCES lookup produced browser errors: ${browserErrors.join(' | ')}`)

  console.log('phase3 live browser NCES smoke passed')
} finally {
  await context.close()
  await browser.close()
}
