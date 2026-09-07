import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = 'artifacts/b03-b04-week-interaction-independent'
function check(condition, message) { if (!condition) throw new Error(message) }
function action(page, text) { return page.locator('.calendar-context-actions button').filter({ hasText:text }) }

async function goTargetWeek(page) {
  await page.getByRole('button', { name:/Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name:'Calendar views' }).getByRole('button', { name:'Week', exact:true }).click()
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
  await page.getByRole('button', { name:'Add Lesson', exact:true }).click()
  await page.getByRole('textbox', { name:'Lesson title', exact:true }).fill('Old Kingdom')
  await page.getByRole('textbox', { name:'Planned date', exact:true }).fill('2026-09-17')
  await page.getByRole('button', { name:'Save Lessons', exact:true }).click()
  await goTargetWeek(page)
}

async function pass14ToolbarKeyboard(page) {
  const unit = page.getByRole('button', { name:/Select Unit Egypt/ })
  await unit.focus(); await unit.press('Enter')
  const toolbar = page.getByRole('toolbar', { name:'Egypt actions' })
  const move = toolbar.getByRole('button', { name:'Move / resize', exact:true })
  const fullEdit = toolbar.getByRole('button', { name:'Full Edit', exact:true })
  await move.focus(); await move.press('ArrowRight')
  check(await fullEdit.evaluate((el) => el === document.activeElement), 'Pass 14: ArrowRight must move focus within the declared toolbar.')
  await fullEdit.press('End')
  check(await toolbar.getByRole('button', { name:'Close object actions' }).evaluate((el) => el === document.activeElement), 'Pass 14: End must focus the final toolbar control.')
  await page.keyboard.press('Escape')
  check(await unit.getAttribute('aria-pressed') === 'false', 'Pass 14: Escape must dismiss selected Unit actions.')
  check(await unit.evaluate((el) => el === document.activeElement), 'Pass 14: toolbar Escape must restore focus to the Unit.')
}

async function pass15QuickAddFocus(page) {
  const trigger = page.getByRole('button', { name:/Add work on .*September 18, 2026/ })
  await trigger.focus(); await trigger.press('Enter')
  const dialog = page.getByRole('dialog', { name:/Add work on/ })
  await dialog.waitFor({ state:'visible' })
  check(await page.getByRole('textbox', { name:'Lesson title' }).evaluate((el) => el === document.activeElement), 'Pass 15: quick-add must focus its primary text field.')
  await page.keyboard.press('Escape')
  check(await dialog.count() === 0, 'Pass 15: Escape must close quick-add.')
  check(await trigger.evaluate((el) => el === document.activeElement), 'Pass 15: quick-add Escape must return focus to the originating day trigger.')
}

async function pass16DestructiveConfirmation(page) {
  const unit = page.getByRole('button', { name:/Select Unit Egypt/ })
  await unit.click()
  const toolbar = page.getByRole('toolbar', { name:'Egypt actions' })
  await toolbar.getByRole('button', { name:'Delete', exact:true }).click()
  check(await toolbar.getByRole('button', { name:'Confirm Delete', exact:true }).count() === 1, 'Pass 16: destructive action must require explicit second confirmation.')
  check(await page.getByRole('button', { name:/Select Unit Egypt/ }).count() === 1, 'Pass 16: first destructive click must not mutate the Unit.')
  await toolbar.getByRole('button', { name:'Confirm Delete', exact:true }).click()
  await page.getByText(/Cannot delete Unit/).waitFor({ state:'visible' })
  check(await page.getByRole('button', { name:/Select Unit Egypt/ }).count() === 1, 'Pass 16: dependency guard must preserve a Unit with Lessons after confirmed delete.')
  await page.keyboard.press('Escape')
}

async function pass17BlockedShift(page) {
  const p2 = page.locator('.planning-section-row').filter({ hasText:'Period 2' })
  await p2.getByRole('button', { name:/Select Old Kingdom/ }).click()
  await p2.getByRole('toolbar', { name:'Old Kingdom actions' }).getByRole('button', { name:'Shift this class', exact:true }).click()
  await p2.getByRole('textbox', { name:'Shift destination date' }).fill('2026-09-19')
  await p2.getByRole('button', { name:'Preview Shift', exact:true }).click()
  const status = p2.getByRole('status')
  await status.waitFor({ state:'visible' })
  check(!(await status.textContent()).startsWith('Preview:'), 'Pass 17: non-instructional Shift target must be blocked rather than presented as valid preview.')
  check(await p2.getByRole('button', { name:'Apply Shift', exact:true }).count() === 0, 'Pass 17: blocked Shift must not expose Apply.')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
}

async function pass18InvalidRange(page) {
  const unit = page.getByRole('button', { name:/Select Unit Egypt/ })
  await unit.click()
  await page.getByRole('toolbar', { name:'Egypt actions' }).getByRole('button', { name:'Move / resize', exact:true }).click()
  await page.getByRole('textbox', { name:'Unit start date' }).fill('2026-09-20')
  await page.getByRole('textbox', { name:'Unit end date' }).fill('2026-09-18')
  check(await page.getByRole('button', { name:'Apply range', exact:true }).isDisabled(), 'Pass 18: inverted Unit range must disable Apply locally.')
  check(await page.getByRole('status').filter({ hasText:/cannot be before/ }).count() === 1, 'Pass 18: invalid Unit range must explain why Apply is blocked.')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
}

async function pass19SingleSelectionOwner(page) {
  const p2 = page.locator('.planning-section-row').filter({ hasText:'Period 2' })
  const p7 = page.locator('.planning-section-row').filter({ hasText:'Period 7' })
  const first = p2.getByRole('button', { name:/Select Old Kingdom/ })
  const second = p7.getByRole('button', { name:/Select Old Kingdom/ })
  await first.click()
  check(await page.getByRole('toolbar', { name:'Old Kingdom actions' }).count() === 1, 'Pass 19: selection must create exactly one temporary toolbar.')
  await second.click()
  check(await first.getAttribute('aria-pressed') === 'false' && await second.getAttribute('aria-pressed') === 'true', 'Pass 19: Section Lesson selection must transfer ownership rather than mirror.')
  check(await page.getByRole('toolbar', { name:'Old Kingdom actions' }).count() === 1, 'Pass 19: selecting neighboring Section instance must still leave exactly one toolbar.')
  await page.keyboard.press('Escape')
}

async function pass20GeometryAndTargets(page) {
  for (const viewport of [{ width:1280,height:720,label:'1280' }, { width:900,height:700,label:'900' }, { width:700,height:700,label:'700' }]) {
    await page.setViewportSize({ width:viewport.width, height:viewport.height })
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    check(pageOverflow <= 1, `Pass 20 ${viewport.label}: page must not horizontally overflow; got ${pageOverflow}px.`)
    const frameOverflow = await page.locator('.planning-scroll-frame').evaluate((el) => el.scrollWidth - el.clientWidth)
    check(frameOverflow <= 1, `Pass 20 ${viewport.label}: Week frame must not restore internal horizontal scrolling; got ${frameOverflow}px.`)
    for (const control of await page.locator('.planning-quick-add-trigger,.planning-context-dismiss').all()) {
      if (!(await control.isVisible())) continue
      const box = await control.boundingBox()
      check(box && box.width >= 44 && box.height >= 44, `Pass 20 ${viewport.label}: temporary/quick-add control must be at least 44px.`)
    }
  }
}

await fs.mkdir(outDir, { recursive:true })
const browser = await chromium.launch({ headless:true })
try {
  const context = await browser.newContext({ viewport:{ width:1366,height:768 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await seed(page)
  await pass14ToolbarKeyboard(page)
  await pass15QuickAddFocus(page)
  await pass16DestructiveConfirmation(page)
  await pass17BlockedShift(page)
  await pass18InvalidRange(page)
  await pass19SingleSelectionOwner(page)
  await pass20GeometryAndTargets(page)
  await page.setViewportSize({ width:1366,height:768 })
  await page.screenshot({ path:`${outDir}/independent-final-1366.png`, fullPage:true })
  check(errors.length === 0, `Independent B03/B04 runtime errors: ${errors.join(' | ')}`)
  console.log('B03/B04 independent audit passes 14-20 passed.')
  await context.close()
} finally { await browser.close() }
