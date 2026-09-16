import { chromium } from 'playwright'

const rawBase = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const baseUrl = rawBase.includes('skipEntry') ? rawBase : `${rawBase.replace(/\/$/, '')}/?skipEntry=1`

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function openSettings(page) {
  const button = page.getByRole('button', { name: 'SETTINGS', exact: true })
  if (await button.getAttribute('aria-expanded') !== 'true') {
    // Desk priority dock / todos folder can cover the physical settings tab; bypass hit-testing.
    await button.evaluate((el) => el.click())
  }
}

async function configureCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-01')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar' }).click()
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(message.text())
  })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  assert(await page.getByTestId('setup-section-nav').count() === 1, 'Onboarding must show setup section navigation.')
  const onboardingNav = page.getByRole('navigation', { name: 'Onboarding steps' })
  assert(await onboardingNav.getByRole('button', { name: 'Welcome' }).getAttribute('aria-current') === 'page', 'Welcome must be current on first load.')
  assert(await onboardingNav.getByRole('button', { name: 'Courses' }).isDisabled(), 'Courses must stay locked until the school year is set.')
  await onboardingNav.getByRole('button', { name: 'School year' }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'School year' }).isVisible(), 'School year step must open from section nav.')

  await configureCalendar(page)
  assert(await page.getByRole('heading', { level: 1, name: 'Courses & sections' }).isVisible(), 'Calendar save must advance to courses.')
  const coursesNav = page.getByRole('navigation', { name: 'Onboarding steps' })
  assert(await coursesNav.getByRole('button', { name: 'Courses' }).getAttribute('aria-current') === 'page', 'Courses must become current after calendar save.')
  await coursesNav.getByRole('button', { name: 'Welcome' }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'Welcome' }).isVisible(), 'Onboarding section nav must jump back to Welcome.')
  await page.getByRole('navigation', { name: 'Onboarding steps' }).getByRole('button', { name: 'Courses' }).click()

  await page.getByRole('button', { name: 'Add a course' }).click()
  await page.locator('.class-course-title input').fill('AP Art History')
  await page.getByRole('button', { name: 'Add a period or section' }).click()
  await page.locator('.class-section-row input').fill('Period 1')
  await page.getByRole('button', { name: 'Save classes' }).click()
  await page.getByRole('button', { name: 'Use this teaching day' }).click()
  const landed = await page.getByRole('heading', { level: 1, name: /My Teaching Day|Teaching week|This Month/ }).count()
  assert(landed === 1, 'Onboarding must land in the live planner after teaching-day save.')

  await openSettings(page)
  await page.getByRole('button', { name: 'Term boundaries' }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'Terms' }).isVisible(), 'Term boundaries must open Terms setup.')
  const setupNav = page.getByRole('navigation', { name: 'Setup sections' })
  assert(await setupNav.count() === 1, 'Settings setup must show section navigation.')
  for (const name of ['Calendar', 'Terms', 'Courses', 'Teaching day', 'Import']) {
    assert(await setupNav.getByRole('button', { name, exact: true }).count() === 1, `Missing setup section: ${name}`)
  }
  assert(await setupNav.getByRole('button', { name: 'Units', exact: true }).count() === 0, 'Units must not appear in setup section navigation.')
  assert(await setupNav.getByRole('button', { name: 'Lessons', exact: true }).count() === 0, 'Lessons must not appear in setup section navigation.')
  assert(await setupNav.getByRole('button', { name: 'Terms', exact: true }).getAttribute('aria-current') === 'page', 'Terms must be current after Settings entry.')
  assert(await setupNav.getByRole('button', { name: 'Teaching day', exact: true }).isEnabled(), 'Teaching day must unlock after courses exist.')
  assert(await setupNav.getByRole('button', { name: 'Import', exact: true }).isEnabled(), 'Import must unlock after courses exist.')

  await setupNav.getByRole('button', { name: 'Courses', exact: true }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'Courses & sections' }).isVisible(), 'Setup nav must open Courses.')
  assert(await page.getByRole('navigation', { name: 'Setup sections' }).count() === 1, 'Courses setup must keep setup section navigation.')
  assert(await page.getByRole('heading', { level: 1, name: 'Lessons' }).count() === 0, 'Setup chrome must not show a Lessons heading.')
  await page.getByRole('navigation', { name: 'Setup sections' }).getByRole('button', { name: 'Teaching day', exact: true }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'Teaching day' }).isVisible(), 'Setup nav must open Teaching day.')
  await page.getByRole('navigation', { name: 'Setup sections' }).getByRole('button', { name: 'Calendar', exact: true }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'Calendar' }).isVisible(), 'Setup nav must open Calendar.')
  assert(await page.getByTestId('school-load').count() === 1, 'School load must stay visible when editing an existing calendar.')
  assert(await page.getByRole('button', { name: 'Load school' }).count() === 1, 'Load school CTA must be present on Calendar Setup with existing dates.')
  await page.getByRole('navigation', { name: 'Setup sections' }).getByRole('button', { name: 'Import', exact: true }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'Import curriculum' }).isVisible(), 'Setup nav must open Import.')

  await page.getByRole('button', { name: 'Cancel' }).click()
  const settings = page.getByRole('button', { name: 'SETTINGS', exact: true })
  assert(await settings.getAttribute('aria-expanded') === 'true', 'Cancel from setup must reopen Settings.')
  assert(await page.locator('aside[aria-label="Settings furniture"]').getByRole('button', { name: 'Term boundaries' }).isVisible(), 'Cancel must land back in the Settings panel.')

  await page.getByRole('button', { name: 'Add units' }).click()
  assert(await page.getByRole('heading', { level: 1, name: 'Units' }).isVisible(), 'Settings Unit library must still open Units.')
  assert(await page.getByRole('navigation', { name: 'Setup sections' }).count() === 0, 'Unit library must not use setup section navigation.')
  await page.getByRole('button', { name: 'Cancel' }).click()
  assert(await settings.getAttribute('aria-expanded') === 'true', 'Cancel from Unit library must reopen Settings.')

  await page.getByRole('button', { name: 'Term boundaries' }).click()
  await page.getByRole('button', { name: 'Cancel' }).click()
  assert(await settings.getAttribute('aria-expanded') === 'true', 'Cancel from Terms must reopen Settings again.')

  assert(runtimeErrors.length === 0, `Setup section nav runtime errors: ${runtimeErrors.join(' | ')}`)
  await context.close()
  console.log('calendar-setup-sections.smoke passed')
} finally {
  await browser.close()
}
