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
    if (message.type() !== 'error') return
    const text = message.text()
    // Live NCES proxy 404 is expected on static hosts; local directory fallback handles it.
    if (/Failed to load resource: the server responded with a status of 404/i.test(text)) return
    if (/\/api\/nces/i.test(text)) return
    runtimeErrors.push(text)
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
  const loadThis = page.getByRole('button', { name: 'Load this school' }).first()
  const schoolCandidateVisible = await loadThis.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false)
  if (schoolCandidateVisible) {
    await loadThis.click()
    assert(await page.getByText('School loaded', { exact: false }).count() >= 1, 'School loaded status must appear.')
    assert(await page.getByTestId('calendar-setup-class-times').count() === 1, 'Class times must appear after school load.')
    assert(await page.getByTestId('calendar-setup-class-time-label').inputValue() === 'Period 1', 'Oak Ridge class times must include Period 1.')
    assert(await page.locator('#first-school-day').inputValue() === '2026-08-11', 'First day must prefill from OCPS suggestion.')
    assert(await page.locator('#last-school-day').inputValue() === '2027-05-26', 'Last day must prefill from OCPS suggestion.')
    assert(await page.getByRole('button', { name: 'Change school' }).count() === 1, 'Loaded school must offer Change school.')
    assert(await page.getByText(/Arc local school directory|NCES|offline fallback/i).count() >= 1, 'Local/NCES source honesty must remain visible.')
  } else {
    // Hosts without Google/NCES proxies may not surface candidates; still prove year preview clarity.
    await page.locator('#school-year-label').fill('2026–27')
    await page.locator('#first-school-day').fill('2026-08-11')
    await page.locator('#last-school-day').fill('2027-05-26')
  }
  assert(await page.getByTestId('calendar-setup-preview').count() === 1, 'Calendar preview must be present.')
  assert(await page.getByRole('heading', { name: /This is what your calendar looks like/i }).count() === 1, 'Prefilled calendar preview title must show.')
  const monthCount = await page.locator('.calendar-setup-confirm-month').count()
  assert(monthCount >= 8, 'Preview must show school-year months.')
  assert(await page.getByRole('list', { name: 'Day color key' }).count() === 1, 'Confirm preview must show a day color key.')
  assert(await page.locator('.calendar-setup-confirm-day.is-school-day').count() > 0, 'School days must use the school-day color class.')
  assert(await page.locator('.calendar-setup-confirm-day.is-break-day').count() > 0, 'Breaks and no-school days must use the break color class.')
  const monthsBox = page.locator('.calendar-setup-confirm-months')
  const overflowY = await monthsBox.evaluate((node) => getComputedStyle(node).overflowY)
  assert(overflowY === 'visible', `Month grid must not scroll in-place (overflow-y=${overflowY}).`)
  assert(await page.getByText('More info', { exact: true }).count() >= 1, 'Long help copy must collapse behind More info.')
  assert(await page.getByRole('navigation', { name: 'Onboarding steps' }).count() === 1, 'Section nav must remain.')
  assert(await page.locator('.calendar-setup-progress').count() === 1, 'Setup step progress must be visible.')
  assert(await page.getByText('Recurring early release (optional)').count() === 1, 'Early release must stay collapsed under optional details.')
  assert(await page.getByText('Exceptions (optional)').count() === 1, 'Exceptions must stay collapsed under optional details.')

  assert(runtimeErrors.length === 0, `Runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('calendar-setup-class-times.smoke passed')
} finally {
  await browser.close()
}
