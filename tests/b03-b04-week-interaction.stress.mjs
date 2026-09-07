import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = 'artifacts/b03-b04-week-interaction-stress'
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
  await page.getByRole('textbox', { name:'Course', exact:true }).fill('Studio Art')
  for (const name of ['Period 1','Period 4','Period 6']) {
    await page.getByRole('button', { name:'Add a period or section', exact:true }).click()
    await page.getByRole('textbox', { name:'Period or section', exact:true }).last().fill(name)
  }
  await page.getByRole('button', { name:'Save classes', exact:true }).click()
  await action(page, 'Add Units').click()
  await page.getByRole('button', { name:'Add Unit', exact:true }).click()
  await page.getByRole('textbox', { name:'Unit', exact:true }).fill('Sculpture')
  await page.getByRole('textbox', { name:'Start', exact:true }).fill('2026-09-14')
  await page.getByRole('textbox', { name:'End', exact:true }).fill('2026-09-30')
  await page.getByRole('button', { name:'Save Units', exact:true }).click()
  await action(page, 'Add Lessons').click()
  for (let index=1; index<=6; index++) {
    await page.getByRole('button', { name:'Add Lesson', exact:true }).click()
    await page.getByRole('textbox', { name:'Lesson title', exact:true }).last().fill(`Lesson ${index}`)
    await page.getByRole('textbox', { name:'Planned date', exact:true }).last().fill(index % 2 ? '2026-09-17' : '2026-09-18')
  }
  await page.getByRole('button', { name:'Save Lessons', exact:true }).click()
  await goTargetWeek(page)
}

async function stressSelection(page) {
  for (let index=0; index<120; index++) {
    const row = page.locator('.planning-section-row').filter({ hasText:index % 2 ? 'Period 1' : 'Period 6' })
    const lesson = row.getByRole('button', { name:/Select Lesson 1/ })
    await lesson.click()
    check(await page.getByRole('toolbar', { name:'Lesson 1 actions' }).count() === 1, `Stress selection ${index}: exactly one toolbar must exist.`)
  }
  await page.keyboard.press('Escape')
}

async function stressUnitRanges(page) {
  for (let index=0; index<12; index++) {
    const unit = page.getByRole('button', { name:/Select Unit Sculpture/ })
    await unit.click()
    const toolbar = page.getByRole('toolbar', { name:'Sculpture actions' })
    await toolbar.getByRole('button', { name:'Move / resize', exact:true }).click()
    const editor = page.getByRole('group', { name:'Move or resize Unit' })
    await page.getByRole('textbox', { name:'Unit end date' }).fill(index % 2 ? '2026-09-30' : '2026-09-25')
    await page.getByRole('button', { name:'Apply range', exact:true }).click()
    await page.getByText(/Unit range updated/).waitFor({ state:'visible' })
    await editor.waitFor({ state:'hidden' })
    await page.keyboard.press('Escape')
    await toolbar.waitFor({ state:'hidden' })
  }
}

async function stressShiftUndo(page) {
  for (let index=0; index<6; index++) {
    const row = page.locator('.planning-section-row').filter({ hasText:'Period 1' })
    const lesson = row.getByRole('button', { name:/Select Lesson 1/ })
    await lesson.click()
    const toolbar = row.getByRole('toolbar', { name:'Lesson 1 actions' })
    await toolbar.getByRole('button', { name:'Shift this class', exact:true }).click()
    const editor = row.getByRole('group', { name:'Shift Lesson for this class' })
    // Use an otherwise empty confirmed instructional day. September 18 already contains
    // shared Lessons, so shifting there correctly requires same-day collision approval and
    // is not a valid durability fixture for repeated ordinary Shift/Undo.
    await row.getByRole('textbox', { name:'Shift destination date' }).fill('2026-09-21')
    await row.getByRole('button', { name:'Preview Shift', exact:true }).click()
    await row.getByRole('button', { name:'Apply Shift', exact:true }).click()
    await page.getByText(/Section Shift applied/).waitFor({ state:'visible' })
    await editor.waitFor({ state:'hidden' })
    await action(page, 'Undo last Shift').click()
    await page.getByText(/Undid the last Shift/).waitFor({ state:'visible' })
    // Undo lives outside the selected planner object, so a page-level Escape would be handled
    // by that current focus owner rather than the object toolbar. Explicitly close the toolbar
    // and prove the B03 focus-return contract before beginning the next durability cycle.
    await toolbar.getByRole('button', { name:'Close object actions' }).click()
    await toolbar.waitFor({ state:'hidden' })
    await page.waitForFunction((label) => document.activeElement?.getAttribute('aria-label') === label, await lesson.getAttribute('aria-label'))
    check(await lesson.evaluate((element) => document.activeElement === element), `Stress Shift/Undo ${index}: closing actions must return focus to the Lesson trigger.`)
  }
}

async function stressQuickAdd(page) {
  const trigger = page.getByRole('button', { name:/Add work on .*September 18, 2026/ })
  for (let index=0; index<30; index++) {
    await trigger.click()
    await page.getByRole('button', { name:'Note', exact:true }).click()
    await page.getByRole('textbox', { name:'Note text' }).fill(`Stress note ${index+1}`)
    await page.getByRole('combobox', { name:'Note placement' }).selectOption(index % 2 ? 'after-school' : 'calendar')
    if (index % 3 === 0) await page.getByRole('checkbox', { name:'Important', exact:true }).check()
    await page.getByRole('button', { name:'Add Note', exact:true }).click()
    await page.getByText(/note added from the Week calendar/i).waitFor({ state:'visible' })
  }
}

async function geometry(page, width, height) {
  await page.setViewportSize({ width, height })
  const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  const internal = await page.locator('.planning-scroll-frame').evaluate((el) => el.scrollWidth - el.clientWidth)
  check(pageOverflow <= 1, `Stress ${width}x${height}: page overflow ${pageOverflow}px.`)
  check(internal <= 1, `Stress ${width}x${height}: internal Week overflow ${internal}px.`)
  const toolbars = await page.getByRole('toolbar').count()
  check(toolbars <= 1, `Stress ${width}x${height}: multiple temporary toolbars remained (${toolbars}).`)
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
  await stressSelection(page)
  await stressUnitRanges(page)
  await stressShiftUndo(page)
  await stressQuickAdd(page)
  await page.reload({ waitUntil:'networkidle' })
  await goTargetWeek(page)
  check(await page.getByText(/^Stress note /).count() === 30, 'Stress reload: all 30 Notes must survive reload exactly once.')
  for (const size of [[1440,900],[1280,720],[1024,768],[700,700]]) await geometry(page, size[0], size[1])
  await page.setViewportSize({ width:1280,height:720 })
  await page.screenshot({ path:`${outDir}/stress-final-1280x720.png`, fullPage:true })
  check(errors.length === 0, `Stress runtime errors: ${errors.join(' | ')}`)
  console.log('B03/B04 component stress test passed.')
  await context.close()
} finally { await browser.close() }
