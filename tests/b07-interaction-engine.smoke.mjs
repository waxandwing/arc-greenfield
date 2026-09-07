import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = 'artifacts/b07-interaction-engine'
function check(condition, message) { if (!condition) throw new Error(message) }
function action(page, text) { return page.locator('.calendar-context-actions button').filter({ hasText:text }) }

async function chooseView(page, name) {
  await page.getByRole('button', { name:/Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name:'Calendar views' }).getByRole('button', { name, exact:true }).click()
}

async function goTargetWeek(page) {
  await chooseView(page, 'Week')
  await page.getByRole('button', { name:'Next Week', exact:true }).click()
  await page.getByRole('button', { name:'Next Week', exact:true }).click()
}

async function seed(page) {
  await page.goto(baseUrl, { waitUntil:'networkidle' })
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name:'Use this calendar', exact:true }).click()

  await action(page, 'Set classes').click()
  await page.getByRole('button', { name:'Add a course', exact:true }).click()
  await page.getByRole('textbox', { name:'Course', exact:true }).fill('AP Art History')
  for (const name of ['Period 2','Period 7']) {
    await page.getByRole('button', { name:'Add a period or section', exact:true }).click()
    await page.getByRole('textbox', { name:'Period or section', exact:true }).last().fill(name)
  }
  await page.getByRole('button', { name:'Save classes', exact:true }).click()

  await action(page, 'Add Units').click()
  await page.getByRole('button', { name:'Add Unit', exact:true }).click()
  await page.getByRole('textbox', { name:'Unit', exact:true }).fill('Egypt')
  await page.getByRole('textbox', { name:'Start', exact:true }).fill('2026-09-14')
  await page.getByRole('textbox', { name:'End', exact:true }).fill('2026-09-25')
  await page.getByRole('button', { name:'Save Units', exact:true }).click()

  await action(page, 'Add Lessons').click()
  for (const [title, date] of [['First Lesson','2026-09-17'], ['Second Lesson','2026-09-18']]) {
    await page.getByRole('button', { name:'Add Lesson', exact:true }).click()
    await page.getByRole('textbox', { name:'Lesson title', exact:true }).last().fill(title)
    await page.getByRole('textbox', { name:'Planned date', exact:true }).last().fill(date)
  }
  await page.getByRole('button', { name:'Save Lessons', exact:true }).click()
  await goTargetWeek(page)
}

async function applySectionShift(page) {
  const p2 = page.locator('.planning-section-row').filter({ hasText:'Period 2' })
  await p2.getByRole('button', { name:/Select Second Lesson/ }).click()
  const toolbar = p2.getByRole('toolbar', { name:'Second Lesson actions' })
  await toolbar.getByRole('button', { name:'Shift this class', exact:true }).click()
  await p2.getByRole('textbox', { name:'Shift destination date' }).fill('2026-09-21')
  await p2.getByRole('button', { name:'Preview Shift', exact:true }).click()
  await p2.getByRole('button', { name:'Apply Shift', exact:true }).click()
  await page.getByText('Section Shift applied. Shared Course plan unchanged; Undo is available.').waitFor({ state:'visible' })
}

async function rejectSharedMoveWithoutFalseSuccess(page) {
  const p2 = page.locator('.planning-section-row').filter({ hasText:'Period 2' })
  await p2.getByRole('button', { name:/Select First Lesson/ }).click()
  await p2.getByRole('toolbar', { name:'First Lesson actions' }).getByRole('button', { name:'Move', exact:true }).click()
  const editor = p2.getByRole('group', { name:'Move Lesson shared plan' })
  await editor.getByRole('textbox', { name:'Lesson planned date' }).fill('2026-09-21')
  await editor.getByRole('button', { name:'Move Lesson', exact:true }).click()

  const rejection = page.locator('.storage-notice').filter({ hasText:/Section schedule/ }).first()
  await rejection.waitFor({ state:'visible' })
  check((await rejection.textContent())?.includes('Arc has not changed the Lessons.'), 'Rejected shared move must explain that canonical Lesson state did not change.')
  check(await page.locator('.b03-context-notice').filter({ hasText:/Lesson moved in the shared Course plan/ }).count() === 0, 'Rejected shared move must not retain or emit success-adjacent Lesson-moved messaging.')
  check(await editor.count() === 1, 'Rejected shared move must keep the inline editor open for correction.')
  check(await p2.getByRole('button', { name:/Select First Lesson/ }).count() === 1, 'Rejected shared move must keep the original Lesson rendered on its canonical date.')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
}

async function rejectQuickAddAndKeepDraft(page) {
  await page.getByRole('button', { name:'Next Week', exact:true }).click()
  const trigger = page.getByRole('button', { name:/Add work on .*September 21, 2026/ })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name:/Add work on .*September 21, 2026/ })
  await dialog.getByRole('textbox', { name:'Lesson title', exact:true }).fill('Collision Lesson')
  await dialog.getByRole('button', { name:'Add Lesson', exact:true }).click()

  const rejection = page.locator('.storage-notice').filter({ hasText:/Section schedule/ }).first()
  await rejection.waitFor({ state:'visible' })
  check(await dialog.count() === 1, 'Rejected Week quick-add must remain open for correction rather than pretending creation completed.')
  check(await dialog.getByRole('textbox', { name:'Lesson title', exact:true }).inputValue() === 'Collision Lesson', 'Rejected Week quick-add must preserve the teacher draft.')
  check(await page.locator('.b03-context-notice').filter({ hasText:/Lesson added from the Week calendar/ }).count() === 0, 'Rejected Week quick-add must not emit or retain a success message.')
  check(await page.getByText('Collision Lesson', { exact:true }).count() === 0, 'Rejected Week quick-add must not project an uncommitted Lesson.')
  await page.keyboard.press('Escape')
  await trigger.waitFor({ state:'visible' })
  await page.getByRole('button', { name:'Previous Week', exact:true }).click()
}

async function rejectFridgeScheduleAndPreserveRealUndo(page) {
  await page.getByRole('button', { name:'Fridge', exact:true }).click()
  const fridge = page.getByRole('complementary', { name:'Fridge furniture' })
  const returnDetails = fridge.locator('details.b01-fridge-return')
  await returnDetails.locator('summary').click()
  await returnDetails.getByRole('button', { name:'First Lesson', exact:true }).click()
  await fridge.getByRole('button', { name:'Undo last Fridge move', exact:true }).waitFor({ state:'visible' })
  await fridge.getByLabel('Send Lesson to date').fill('2026-09-21')
  const firstCard = fridge.locator('.b01-fridge-card').filter({ hasText:'First Lesson' })
  await firstCard.getByRole('button', { name:'Send to week', exact:true }).click()

  const rejection = page.locator('.storage-notice').filter({ hasText:/Section schedule/ }).first()
  await rejection.waitFor({ state:'visible' })
  check(await firstCard.count() === 1, 'Rejected Fridge schedule must leave the Lesson unscheduled in the Fridge.')
  check(await fridge.getByRole('button', { name:'Undo last Fridge move', exact:true }).count() === 1, 'Rejected Fridge schedule must preserve the prior real Undo receipt.')

  await fridge.getByRole('button', { name:'Undo last Fridge move', exact:true }).click()
  await firstCard.waitFor({ state:'detached' })
  check(await fridge.getByRole('button', { name:'Undo last Fridge move', exact:true }).count() === 0, 'Undo receipt must clear only after its canonical restore is accepted.')
  await page.getByRole('button', { name:'Fridge', exact:true }).click()
}

async function proveCrossViewReload(page) {
  await chooseView(page, 'Month')
  await page.locator('.planning-month-signal').filter({ hasText:'First Lesson' }).first().waitFor({ state:'visible' })

  await chooseView(page, 'Day')
  for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name:'Next Day', exact:true }).click()
  await page.locator('.planning-date-heading').filter({ hasText:/Sep 17|9\/17|17/ }).first().waitFor({ state:'visible' })
  await page.getByRole('button', { name:/Select First Lesson/ }).first().waitFor({ state:'visible' })

  await page.reload({ waitUntil:'networkidle' })
  await goTargetWeek(page)
  const p2 = page.locator('.planning-section-row').filter({ hasText:'Period 2' })
  const p7 = page.locator('.planning-section-row').filter({ hasText:'Period 7' })
  check(await p2.getByRole('button', { name:/Select First Lesson/ }).count() === 1, 'Reload must preserve First Lesson on its restored shared date for Period 2.')
  check(await p7.getByRole('button', { name:/Select First Lesson/ }).count() === 1, 'Reload must preserve First Lesson on its restored shared date for Period 7.')
  check(await p7.getByRole('button', { name:/Select Second Lesson/ }).count() === 1, 'Reload must preserve shared Second Lesson for the unaffected Section.')
}

await fs.mkdir(outDir, { recursive:true })
const browser = await chromium.launch({ headless:true })
try {
  const context = await browser.newContext({ viewport:{ width:1440,height:900 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })

  await seed(page)
  await applySectionShift(page)
  await rejectSharedMoveWithoutFalseSuccess(page)
  await rejectQuickAddAndKeepDraft(page)
  await rejectFridgeScheduleAndPreserveRealUndo(page)
  await proveCrossViewReload(page)
  await page.screenshot({ path:`${outDir}/b07-final-1440.png`, fullPage:true })
  check(errors.length === 0, `B07 runtime errors: ${errors.join(' | ')}`)
  console.log('B07 primary interaction truth gate passed.')
  await context.close()
} finally {
  await browser.close()
}
