import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
mkdirSync('artifacts/phase2-visual', { recursive: true })

function headerAction(page, text) {
  return page.locator('.calendar-context-actions button').filter({ hasText: text })
}

async function configure(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()

  await headerAction(page, 'Set classes').click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('AP Art History')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).fill('Period 2')
  await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
  await page.getByRole('textbox', { name: 'Period or section', exact: true }).nth(1).fill('Period 5')
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()

  await headerAction(page, 'Add Units').click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Ancient Mediterranean')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

  await headerAction(page, 'Add Lessons').click()
  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Temple and ziggurat')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-16')
  const p2 = page.locator('.delivery-row').filter({ hasText: 'Period 2' })
  await p2.getByRole('combobox', { name: 'Status', exact: true }).selectOption('in-progress')
  await p2.getByRole('textbox', { name: 'Actual date', exact: true }).fill('2026-09-16')
  await p2.getByRole('textbox', { name: 'Pick up here', exact: true }).fill('Stopped after visual comparison. Resume with context.')

  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Votive figures')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-17')

  await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lesson title', exact: true }).fill('Stele of Hammurabi')
  await page.getByRole('textbox', { name: 'Planned date', exact: true }).fill('2026-09-18')
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await configure(page)

  await page.screenshot({ path: 'artifacts/phase2-visual/01-month-planning.png', fullPage: true })

  await headerAction(page, 'Edit Lessons').click()
  await page.getByRole('button', { name: /^Temple and ziggurat/ }).click()
  await page.screenshot({ path: 'artifacts/phase2-visual/02-lesson-editor.png', fullPage: true })
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()

  await headerAction(page, 'Review recovery').click()
  await page.screenshot({ path: 'artifacts/phase2-visual/03-recovery-review.png', fullPage: true })
  await page.getByRole('button', { name: 'Back to calendar', exact: true }).click()

  await page.getByRole('button', { name: 'Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
  await page.screenshot({ path: 'artifacts/phase2-visual/04-week-planning.png', fullPage: true })

  await context.close()
  console.log('Phase 2 visual gate artifacts captured.')
} finally {
  await browser.close()
}
