import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = 'artifacts/b07-interaction-engine-independent'
function check(condition, message) { if (!condition) throw new Error(message) }
function action(page, text) { return page.locator('.calendar-context-actions button').filter({ hasText:text }) }

async function chooseView(page, name) {
  await page.getByRole('button', { name:/Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name:'Calendar views' }).getByRole('button', { name, exact:true }).click()
}

async function targetWeek(page) {
  await chooseView(page, 'Week')
  await page.getByRole('button', { name:'Next Week', exact:true }).click()
  await page.getByRole('button', { name:'Next Week', exact:true }).click()
}

async function seed(page) {
  await page.goto(baseUrl, { waitUntil:'networkidle' })
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-01')
  await page.locator('#last-school-day').fill('2027-06-01')
  await page.getByRole('button', { name:'Use this calendar', exact:true }).click()

  await action(page, 'Set classes').click()
  await page.getByRole('button', { name:'Add a course', exact:true }).click()
  await page.getByRole('textbox', { name:'Course', exact:true }).fill('Drawing II')
  for (const name of ['Studio A','Studio B']) {
    await page.getByRole('button', { name:'Add a period or section', exact:true }).click()
    await page.getByRole('textbox', { name:'Period or section', exact:true }).last().fill(name)
  }
  await page.getByRole('button', { name:'Save classes', exact:true }).click()

  await action(page, 'Add Units').click()
  await page.getByRole('button', { name:'Add Unit', exact:true }).click()
  await page.getByRole('textbox', { name:'Unit', exact:true }).fill('Perspective')
  await page.getByRole('textbox', { name:'Start', exact:true }).fill('2026-09-14')
  await page.getByRole('textbox', { name:'End', exact:true }).fill('2026-09-25')
  await page.getByRole('button', { name:'Save Units', exact:true }).click()

  await action(page, 'Add Lessons').click()
  for (const [title, date] of [['One point','2026-09-16'], ['Critique','2026-09-17']]) {
    await page.getByRole('button', { name:'Add Lesson', exact:true }).click()
    await page.getByRole('textbox', { name:'Lesson title', exact:true }).last().fill(title)
    await page.getByRole('textbox', { name:'Planned date', exact:true }).last().fill(date)
  }
  await page.getByRole('button', { name:'Save Lessons', exact:true }).click()
  await targetWeek(page)
}

async function shiftCritique(page) {
  const studio = page.locator('.planning-section-row').filter({ hasText:'Studio A' })
  const lesson = studio.getByRole('button', { name:/Select Critique/ })
  await lesson.focus(); await lesson.press('Enter')
  const toolbar = studio.getByRole('toolbar', { name:'Critique actions' })
  await toolbar.getByRole('button', { name:'Shift this class', exact:true }).focus()
  await page.keyboard.press('Enter')
  await studio.getByRole('textbox', { name:'Shift destination date' }).fill('2026-09-21')
  await studio.getByRole('button', { name:'Preview Shift', exact:true }).click()
  await studio.getByRole('button', { name:'Apply Shift', exact:true }).click()
  await page.getByText('Section Shift applied. Shared Course plan unchanged; Undo is available.').waitFor({ state:'visible' })
}

async function keyboardRejectedQuickAdd(page) {
  await page.getByRole('button', { name:'Next Week', exact:true }).click()
  const trigger = page.getByRole('button', { name:/Add work on .*September 21, 2026/ })
  await trigger.focus(); await trigger.press('Enter')
  const dialog = page.getByRole('dialog', { name:/Add work on .*September 21, 2026/ })
  const title = dialog.getByRole('textbox', { name:'Lesson title', exact:true })
  await title.fill('Blocked studio add')
  await dialog.getByRole('button', { name:'Add Lesson', exact:true }).focus()
  await page.keyboard.press('Enter')
  await page.locator('.storage-notice').filter({ hasText:/Section schedule/ }).waitFor({ state:'visible' })
  check(await dialog.count() === 1, 'Independent B07: rejected keyboard Quick Add must stay open.')
  check(await title.inputValue() === 'Blocked studio add', 'Independent B07: rejected Quick Add must preserve draft text.')
  check(await page.getByText('Blocked studio add', { exact:true }).count() === 0, 'Independent B07: rejected Quick Add must not leak into projected planner truth.')
  await page.keyboard.press('Escape')
  await page.waitForFunction((el) => document.activeElement === el, await trigger.elementHandle())
}

async function successfulNoteAfterRejection(page) {
  const trigger = page.getByRole('button', { name:/Add work on .*September 22, 2026/ })
  await trigger.focus(); await trigger.press('Enter')
  const dialog = page.getByRole('dialog', { name:/Add work on .*September 22, 2026/ })
  await dialog.getByRole('button', { name:'Note', exact:true }).click()
  await dialog.getByRole('textbox', { name:'Note text' }).fill('Mat board pickup')
  await dialog.getByRole('button', { name:'Add Note', exact:true }).click()
  await dialog.waitFor({ state:'detached' })
  await page.waitForFunction((el) => document.activeElement === el, await trigger.elementHandle())
  await page.getByText('Mat board pickup', { exact:true }).waitFor({ state:'visible' })
}

async function guardedUnitRange(page) {
  await page.getByRole('button', { name:'Previous Week', exact:true }).click()
  const unit = page.getByRole('button', { name:/Select Unit Perspective/ })
  await unit.focus(); await unit.press('Enter')
  const toolbar = page.getByRole('toolbar', { name:'Perspective actions' })
  await toolbar.getByRole('button', { name:'Move / resize', exact:true }).click()
  const editor = page.getByRole('group', { name:'Move or resize Unit' })
  await editor.getByRole('textbox', { name:'Unit end date' }).fill('2026-09-15')
  await editor.getByRole('button', { name:'Apply range', exact:true }).click()
  await page.getByText(/Cannot move Unit/).waitFor({ state:'visible' })
  check(await editor.count() === 1, 'Independent B07: rejected Unit range must remain editable.')
  check(await unit.getAttribute('aria-pressed') === 'true', 'Independent B07: rejected Unit range must preserve selection owner.')
  check(await page.locator('.b03-context-notice').filter({ hasText:/Unit range updated/ }).count() === 0, 'Independent B07: guarded Unit failure must not claim success.')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
}

async function reloadProof(page) {
  await page.reload({ waitUntil:'networkidle' })
  await targetWeek(page)
  await page.getByRole('button', { name:'Next Week', exact:true }).click()
  await page.getByText('Mat board pickup', { exact:true }).waitFor({ state:'visible' })
  const studioA = page.locator('.planning-section-row').filter({ hasText:'Studio A' })
  const studioB = page.locator('.planning-section-row').filter({ hasText:'Studio B' })
  check(await studioA.getByRole('button', { name:/Select Critique.*Section-specific date/ }).count() === 1, 'Independent B07: Section-specific Shift must survive reload for Studio A.')
  check(await studioB.getByRole('button', { name:/Select Critique/ }).count() === 1, 'Independent B07: shared Critique must remain intact for Studio B.')
  check(await page.getByText('Blocked studio add', { exact:true }).count() === 0, 'Independent B07: rejected draft must remain absent after reload.')
}

await fs.mkdir(outDir, { recursive:true })
const browser = await chromium.launch({ headless:true })
try {
  const context = await browser.newContext({ viewport:{ width:1280,height:720 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })

  await seed(page)
  await shiftCritique(page)
  await keyboardRejectedQuickAdd(page)
  await successfulNoteAfterRejection(page)
  await guardedUnitRange(page)
  await reloadProof(page)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  check(overflow <= 1, `Independent B07: 1280×720 must not introduce page horizontal overflow; got ${overflow}px.`)
  await page.screenshot({ path:`${outDir}/b07-independent-1280.png`, fullPage:true })
  check(errors.length === 0, `Independent B07 runtime errors: ${errors.join(' | ')}`)
  console.log('B07 independent interaction audit passed.')
  await context.close()
} finally {
  await browser.close()
}
