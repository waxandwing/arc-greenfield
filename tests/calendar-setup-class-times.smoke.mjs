import { chromium } from 'playwright'

const rawBase = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const baseUrl = rawBase.includes('skipEntry') ? rawBase : `${rawBase.replace(/\/$/, '')}/?skipEntry=1`

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const onboardingNav = page.getByRole('navigation', { name: 'Onboarding steps' })
  await onboardingNav.getByRole('button', { name: 'School year' }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'School year' }).isVisible(), 'School year step must open.')
  assert(await page.getByTestId('school-load').count() === 1, 'Load school must be present.')

  await page.locator('#school-identity-name').fill('Oak Ridge High')
  await page.locator('#school-identity-city').fill('Orlando')
  await page.locator('#school-identity-state').fill('FL')
  await page.getByRole('button', { name: 'Load school' }).click()
  await page.getByRole('button', { name: 'Load this school' }).first().click()

  assert(await page.getByText('School loaded', { exact: false }).count() >= 1, 'School loaded status must appear.')
  assert(await page.getByTestId('calendar-setup-class-times').count() === 1, 'Class times must appear after school load.')
  assert(await page.getByText('Period 1').count() >= 1, 'Oak Ridge class times must include Period 1.')
  assert(await page.locator('#first-school-day').inputValue() === '2026-08-11', 'First day must prefill from OCPS suggestion.')
  assert(await page.locator('#last-school-day').inputValue() === '2027-05-26', 'Last day must prefill from OCPS suggestion.')
  assert(await page.getByTestId('calendar-setup-preview').count() === 1, 'Calendar preview must be present.')
  assert(await page.getByRole('heading', { name: /This is what your calendar looks like/i }).count() === 1, 'Prefilled calendar preview title must show.')
  assert(await page.locator('.calendar-setup-confirm-month').count() >= 8, 'Preview must show school-year months.')
  assert(await page.getByRole('button', { name: 'Load school' }).count() === 0, 'Load school form stays collapsed while school is loaded.')
  assert(await page.getByText(/Arc local school directory|NCES|offline fallback/i).count() >= 1, 'Local/NCES source honesty must remain visible.')

  const setupHeight = await page.locator('section.calendar-setup').evaluate((node) => node.getBoundingClientRect().height)
  assert(setupHeight < 2200, `Calendar setup should be shorter after hierarchy polish (was ${Math.round(setupHeight)}px).`)

  assert(runtimeErrors.length === 0, `Runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('calendar-setup-class-times.smoke passed')
} finally {
  await browser.close()
}
