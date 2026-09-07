import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = 'artifacts/b03-b04-week-interaction'
function check(condition, message) { if (!condition) throw new Error(message) }
function action(page, text) { return page.locator('.calendar-context-actions button').filter({ hasText: text }) }

async function seed(page) {
  await page.goto(baseUrl, { waitUntil:'networkidle' })
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name:'Use this calendar', exact:true }).click()
  await action(page, 'Set classes').click()
  await page.getByRole('button', { name:'Add a course', exact:true }).click()
  await page.getByRole('textbox', { name:'Course', exact:true }).fill('Studio Art')
  for (const name of ['Period 1','Period 6']) {
    await page.getByRole('button', { name:'Add a period or section', exact:true }).click()
    await page.getByRole('textbox', { name:'Period or section', exact:true }).last().fill(name)
  }
  await page.getByRole('button', { name:'Save classes', exact:true }).click()
  await action(page, 'Add Units').click()
  await page.getByRole('button', { name:'Add Unit', exact:true }).click()
  await page.getByRole('textbox', { name:'Unit', exact:true }).fill('Sculpture')
  await page.getByRole('textbox', { name:'Start', exact:true }).fill('2026-09-14')
  await page.getByRole('textbox', { name:'End', exact:true }).fill('2026-09-25')
  await page.getByRole('button', { name:'Save Units', exact:true }).click()
  await action(page, 'Add Lessons').click()
  for (const title of ['Armature demo','Attachment practice']) {
    await page.getByRole('button', { name:'Add Lesson', exact:true }).click()
    await page.getByRole('textbox', { name:'Lesson title', exact:true }).last().fill(title)
    await page.getByRole('textbox', { name:'Planned date', exact:true }).last().fill('2026-09-17')
  }
  await page.getByRole('button', { name:'Save Lessons', exact:true }).click()
  await page.evaluate(() => {
    const raw = localStorage.getItem('arc.planningWorkspace.v1')
    if (!raw) throw new Error('B03/B04 seed missing planning persistence.')
    const stored = JSON.parse(raw)
    stored.input.notes = [{ id:'note-copies', calendarId:stored.input.calendarId, date:'2026-09-16', text:'Make copies', placement:'calendar', important:false, sourceLabel:null, sourceLocator:null }]
    localStorage.setItem('arc.planningWorkspace.v1', JSON.stringify(stored))
  })
  await page.reload({ waitUntil:'networkidle' })
  await page.getByRole('button', { name:/Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name:'Calendar views' }).getByRole('button', { name:'Week', exact:true }).click()
  await page.getByRole('button', { name:'Next Week', exact:true }).click()
  await page.getByRole('button', { name:'Next Week', exact:true }).click()
}

async function auditSelectionAndMove(page) {
  const unit = page.getByRole('button', { name:/Select Unit Sculpture/ })
  await unit.click()
  const unitToolbar = page.getByRole('toolbar', { name:'Sculpture actions' })
  await unitToolbar.waitFor({ state:'visible' })
  check(await unitToolbar.getByRole('button', { name:'Move / resize', exact:true }).count() === 1, 'B03: Unit must expose real Move / resize.')
  check(await unitToolbar.getByRole('button', { name:'Full Edit', exact:true }).count() === 1, 'B03: legacy editor must be labeled Full Edit.')
  await unitToolbar.getByRole('button', { name:'Move / resize', exact:true }).click()
  await page.getByRole('textbox', { name:'Unit end date' }).fill('2026-09-30')
  await page.getByRole('button', { name:'Apply range', exact:true }).click()
  await page.getByText(/Unit range updated/).waitFor({ state:'visible' })
  const unitEnd = await page.evaluate(() => JSON.parse(localStorage.getItem('arc.units.v1')).input.units.find((unit) => unit.title === 'Sculpture').placement.endDate)
  check(unitEnd === '2026-09-30', `B03: Unit range must persist; got ${unitEnd}.`)

  const p1 = page.locator('.planning-section-row').filter({ hasText:'Period 1' })
  const p6 = page.locator('.planning-section-row').filter({ hasText:'Period 6' })
  const p1Lesson = p1.getByRole('button', { name:/Select Armature demo/ })
  const p6Lesson = p6.getByRole('button', { name:/Select Armature demo/ })
  await p1Lesson.click()
  check(await p1Lesson.getAttribute('aria-pressed') === 'true', 'B03: selected Section Lesson instance must own selection.')
  check(await p6Lesson.getAttribute('aria-pressed') === 'false', 'B03: same shared Lesson in neighboring Section must not mirror selection.')
  const lessonToolbar = p1.getByRole('toolbar', { name:'Armature demo actions' })
  check(await lessonToolbar.getByRole('button', { name:'Move', exact:true }).count() === 1, 'B03: Lesson must expose true Move.')
  check(await lessonToolbar.getByRole('button', { name:'Shift this class', exact:true }).count() === 1, 'B03: Section Lesson instance must expose Section Shift.')
  check(await lessonToolbar.getByRole('button', { name:'Full Edit', exact:true }).count() === 1, 'B03: legacy Lesson editor must be explicit Full Edit.')

  await lessonToolbar.getByRole('button', { name:'Shift this class', exact:true }).click()
  await p1.getByRole('textbox', { name:'Shift destination date' }).fill('2026-09-18')
  await p1.getByRole('button', { name:'Preview Shift', exact:true }).click()
  const preview = p1.getByRole('status').filter({ hasText:/Preview: move only Period 1/ })
  await preview.waitFor({ state:'visible' })
  await p1.getByRole('button', { name:'Apply Shift', exact:true }).click()
  await page.getByText(/Section Shift applied/).waitFor({ state:'visible' })
  check(await action(page, 'Undo last Shift').count() === 1, 'B03: applied Shift must surface Undo.')
  await page.reload({ waitUntil:'networkidle' })
  const p1Reloaded = page.locator('.planning-section-row').filter({ hasText:'Period 1' })
  const p6Reloaded = page.locator('.planning-section-row').filter({ hasText:'Period 6' })
  check(await p1Reloaded.locator('.planning-day-slot').nth(5).getByText('Armature demo', { exact:true }).count() === 1, 'B03: Section Shift must survive reload on Friday.')
  check(await p6Reloaded.locator('.planning-day-slot').nth(4).getByText('Armature demo', { exact:true }).count() === 1, 'B03: neighboring Section must remain on Thursday.')
  await action(page, 'Undo last Shift').click()
  await page.reload({ waitUntil:'networkidle' })
  check(await page.locator('.planning-section-row').filter({ hasText:'Period 1' }).locator('.planning-day-slot').nth(4).getByText('Armature demo', { exact:true }).count() === 1, 'B03: Shift Undo must restore original Section date after reload.')

  const note = page.getByRole('button', { name:/Select Note\. Make copies/ })
  await note.click()
  await page.getByRole('toolbar', { name:'Note actions' }).getByRole('button', { name:'Move', exact:true }).click()
  await page.getByRole('textbox', { name:'Note date' }).fill('2026-09-18')
  await page.getByRole('combobox', { name:'Move Note placement' }).selectOption('after-school')
  await page.getByRole('button', { name:'Move Note', exact:true }).click()
  await page.getByText(/Note moved/).waitFor({ state:'visible' })
  await page.reload({ waitUntil:'networkidle' })
  check(await page.getByRole('region', { name:'After School', exact:true }).getByText('Make copies', { exact:true }).count() === 1, 'B03: Note Move must persist date/placement across reload.')
}

async function auditQuickAdd(page) {
  const addFriday = page.getByRole('button', { name:/Add work on .*September 18, 2026/ })
  await addFriday.click()
  await page.getByRole('button', { name:'Unit', exact:true }).click()
  await page.getByRole('textbox', { name:'Unit title' }).fill('Printmaking')
  await page.getByRole('textbox', { name:'Unit end date' }).fill('2026-09-25')
  await page.getByRole('button', { name:'Add Unit', exact:true }).click()
  await page.getByText(/Unit added from the Week calendar/).waitFor({ state:'visible' })

  await addFriday.click()
  await page.getByRole('textbox', { name:'Lesson title' }).fill('Friday reflection')
  await page.getByRole('button', { name:'Add Lesson', exact:true }).click()
  await page.getByText(/Lesson added from the Week calendar/).waitFor({ state:'visible' })

  await addFriday.click()
  await page.getByRole('button', { name:'Note', exact:true }).click()
  await page.getByRole('textbox', { name:'Note text' }).fill('Call home')
  await page.getByRole('combobox', { name:'Note placement' }).selectOption('after-school')
  await page.getByLabel('Important', { exact:true }).check()
  await page.getByRole('button', { name:'Add Note', exact:true }).click()
  await page.getByText(/After School note added from the Week calendar/).waitFor({ state:'visible' })

  await page.reload({ waitUntil:'networkidle' })
  check(await page.getByText('Printmaking', { exact:true }).count() === 1, 'B04: quick-added Unit must survive reload.')
  check(await page.getByText('Friday reflection', { exact:true }).count() === 2, 'B04: shared quick-added Lesson must project once per Section after reload.')
  check(await page.getByRole('region', { name:'After School', exact:true }).getByText('Call home', { exact:true }).count() === 1, 'B04: quick-added Note must survive reload.')
  check(await page.getByRole('button', { name:/Select Important\. After School note\. Call home/ }).count() === 1, 'B04: quick-added Important Note must retain non-color semantics.')
}

async function geometry(page, label) {
  const internal = await page.locator('.planning-scroll-frame').evaluate((el) => el.scrollWidth - el.clientWidth)
  check(internal <= 1, `${label}: Week must not reintroduce B02 internal overflow; got ${internal}px.`)
  const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  check(pageOverflow <= 1, `${label}: page overflow must remain zero; got ${pageOverflow}px.`)
  for (const trigger of await page.locator('.planning-quick-add-trigger').all()) {
    const box = await trigger.boundingBox(); check(box && box.width >= 44 && box.height >= 44, `${label}: quick-add target must be at least 44px.`)
  }
}

await fs.mkdir(outDir, { recursive:true })
const browser = await chromium.launch({ headless:true })
try {
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await seed(page)
  await auditSelectionAndMove(page)
  await auditQuickAdd(page)
  await geometry(page, '1440')
  await page.screenshot({ path:`${outDir}/week-interaction-1440.png`, fullPage:true })
  await page.setViewportSize({ width:1280, height:720 })
  await geometry(page, '1280')
  await page.screenshot({ path:`${outDir}/week-interaction-1280x720.png`, fullPage:true })
  check(errors.length === 0, `B03/B04 runtime errors: ${errors.join(' | ')}`)
  await context.close()
  console.log('B03/B04 Week interaction primary audit passed.')
} finally { await browser.close() }
