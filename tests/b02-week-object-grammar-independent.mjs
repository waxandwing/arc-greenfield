import { chromium } from 'playwright'
import fs from 'node:fs/promises'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = 'artifacts/b02-week-object-grammar-independent'

function check(condition, message) {
  if (!condition) throw new Error(message)
}

function action(page, text) {
  return page.locator('.calendar-context-actions button').filter({ hasText: text })
}

async function setCalendar(page) {
  await page.locator('#school-year-label').fill('2026–27')
  await page.locator('#first-school-day').fill('2026-09-02')
  await page.locator('#last-school-day').fill('2027-05-28')
  await page.getByRole('button', { name: 'Use this calendar', exact: true }).click()
  await page.getByRole('heading', { level: 1, name: 'Month', exact: true }).waitFor({ state: 'visible' })
}

async function setTeachingObjects(page) {
  await action(page, 'Set classes').click()
  await page.getByRole('button', { name: 'Add a course', exact: true }).click()
  await page.getByRole('textbox', { name: 'Course', exact: true }).fill('3D Art')
  for (const name of ['Period 1', 'Period 6']) {
    await page.getByRole('button', { name: 'Add a period or section', exact: true }).click()
    await page.getByRole('textbox', { name: 'Period or section', exact: true }).last().fill(name)
  }
  await page.getByRole('button', { name: 'Save classes', exact: true }).click()

  await action(page, 'Add Units').click()
  await page.getByRole('button', { name: 'Add Unit', exact: true }).click()
  await page.getByRole('textbox', { name: 'Unit', exact: true }).fill('Sculpture')
  await page.getByRole('textbox', { name: 'Start', exact: true }).fill('2026-09-14')
  await page.getByRole('textbox', { name: 'End', exact: true }).fill('2026-09-25')
  await page.getByRole('button', { name: 'Save Units', exact: true }).click()

  await action(page, 'Add Lessons').click()
  for (const title of ['Armature demo', 'Attachment practice']) {
    await page.getByRole('button', { name: 'Add Lesson', exact: true }).click()
    await page.getByRole('textbox', { name: 'Lesson title', exact: true }).last().fill(title)
    await page.getByRole('textbox', { name: 'Planned date', exact: true }).last().fill('2026-09-17')
  }
  await page.getByRole('button', { name: 'Save Lessons', exact: true }).click()
}

async function addNotesWithoutAuthoringUI(page) {
  await page.evaluate(() => {
    const key = 'arc.planningWorkspace.v1'
    const raw = localStorage.getItem(key)
    if (!raw) throw new Error('Independent B02 audit could not find canonical planning persistence.')
    const stored = JSON.parse(raw)
    stored.input.notes = [
      { id:'note-materials', calendarId:stored.input.calendarId, date:'2026-09-16', text:'Set out wire + foil', placement:'calendar', important:false, sourceLabel:null, sourceLocator:null },
      { id:'note-meeting', calendarId:stored.input.calendarId, date:'2026-09-18', text:'Department meeting', placement:'after-school', important:true, sourceLabel:'School calendar', sourceLocator:'school://meeting/2026-09-18' },
    ]
    localStorage.setItem(key, JSON.stringify(stored))
  })
  await page.reload({ waitUntil: 'networkidle' })
}

async function openWeek(page) {
  await page.getByRole('button', { name: /Change calendar view, current/ }).click()
  await page.getByRole('navigation', { name: 'Calendar views' }).getByRole('button', { name: 'Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
  await page.getByRole('button', { name: 'Next Week', exact: true }).click()
}

async function audit(page) {
  check(await page.getByRole('heading', { level: 1, name: 'Week', exact: true }).count() === 1, 'Independent B02: Week must remain the single page heading.')
  check(await page.getByRole('heading', { level: 2, name: '3D Art', exact: true }).count() === 1, 'Independent B02: Course identity must be explicit and singular.')

  const rows = page.locator('.planning-section-row')
  check(await rows.count() === 2, `Independent B02: expected two Section rows, found ${await rows.count()}.`)
  check(await rows.nth(0).getByText('Period 1', { exact:true }).count() === 1, 'Independent B02: first Section identity must remain readable.')
  check(await rows.nth(1).getByText('Period 6', { exact:true }).count() === 1, 'Independent B02: second Section identity must remain readable.')

  const unit = page.locator('.planning-unit-span').filter({ hasText:'Sculpture' })
  check(await unit.count() === 1, 'Independent B02: one Unit must remain one continuous range object.')
  const unitBox = await unit.boundingBox()
  check(unitBox && unitBox.width > 300, 'Independent B02: Unit range must cross multiple visible days.')

  for (const row of [rows.nth(0), rows.nth(1)]) {
    const day = row.locator('.planning-day-slot').filter({ hasText:'Armature demo' })
    check(await day.count() === 1, 'Independent B02: each Section must project the shared Lesson truth once on the correct date.')
    check(await day.getByRole('listitem').count() === 2, 'Independent B02: two same-day Lessons must remain two accessible objects.')
    check(await day.getByText('Sculpture', { exact:true }).count() === 2, 'Independent B02: both Lessons must retain visible parent Unit cues.')
  }

  const notes = page.getByRole('region', { name:'Notes', exact:true })
  const after = page.getByRole('region', { name:'After School', exact:true })
  check(await notes.getByRole('listitem').count() === 1, 'Independent B02: Note must remain its own accessible paper object.')
  check(await after.getByRole('listitem').count() === 1, 'Independent B02: After School item must remain outside instructional Lesson hierarchy.')
  check(await after.getByLabel(/Important\. After School note\. Department meeting/).count() === 1, 'Independent B02: Important meaning must be present in accessible text, not color alone.')
  check(await after.getByText('Source: School calendar', { exact:true }).count() === 1, 'Independent B02: source provenance must remain visible.')

  const noteStyle = await notes.locator('.planning-note').evaluate((element) => {
    const style = getComputedStyle(element)
    return { radius:style.borderRadius, transform:style.transform, fontSize:getComputedStyle(element.querySelector('.planning-note-text')).fontSize }
  })
  const lessonStyle = await rows.first().locator('.planning-lesson').first().evaluate((element) => {
    const style = getComputedStyle(element)
    return { radius:style.borderRadius, borderLeft:style.borderLeftWidth, fontSize:getComputedStyle(element.querySelector('.planning-lesson-title')).fontSize }
  })
  const unitStyle = await unit.evaluate((element) => {
    const style = getComputedStyle(element)
    return { borderLeft:style.borderLeftWidth, background:style.backgroundColor }
  })
  check(noteStyle.radius !== lessonStyle.radius || noteStyle.transform !== 'none', 'Independent B02: Note and Lesson must not collapse into card-kit sameness.')
  check(Number.parseFloat(noteStyle.fontSize) >= 16 && Number.parseFloat(lessonStyle.fontSize) >= 16, 'Independent B02: primary object copy must remain at least 16px.')
  check(unitStyle.borderLeft !== '0px' && lessonStyle.borderLeft !== '0px', 'Independent B02: Unit and Lesson type language must remain structurally visible.')

  const importantNote = after.locator('.planning-note--important')
  const importantCircle = await importantNote.evaluate((element) => {
    const pseudo = getComputedStyle(element, '::after')
    return { width:pseudo.borderTopWidth, style:pseudo.borderTopStyle, color:pseudo.borderTopColor }
  })
  check(importantCircle.style === 'solid' && Number.parseFloat(importantCircle.width) >= 2, 'Independent B02: canonical Important circle must be visibly drawn around the paper object.')
  const importantSlot = importantNote.locator('xpath=..')
  const noteBox = await importantNote.boundingBox()
  const slotBox = await importantSlot.boundingBox()
  check(noteBox && slotBox && noteBox.x + noteBox.width + 9 <= slotBox.x + slotBox.width, 'Independent B02: Important paper plus its hand-drawn ring must remain fully inside an edge day column.')

  const ordered = await page.locator('.planning-grid > *').evaluateAll((nodes) => nodes.map((node) => ({ cls:node.className, label:node.getAttribute('aria-label') })))
  const noteIndex = ordered.findIndex((item) => String(item.cls).includes('planning-note-lane') && item.label === 'Notes')
  const courseIndex = ordered.findIndex((item) => String(item.cls).includes('planning-course'))
  const afterIndex = ordered.findIndex((item) => String(item.cls).includes('planning-note-lane') && item.label === 'After School')
  check(noteIndex >= 0 && courseIndex > noteIndex && afterIndex > courseIndex, 'Independent B02: DOM/read order must remain Notes → instructional plan → After School.')

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  check(overflow <= 1, `Independent B02: page-level overflow must remain zero; got ${overflow}px.`)
}

await fs.mkdir(outDir, { recursive:true })
const browser = await chromium.launch({ headless:true })
try {
  const context = await browser.newContext({ viewport:{ width:1440, height:900 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })

  await page.goto(baseUrl, { waitUntil:'networkidle' })
  await setCalendar(page)
  await setTeachingObjects(page)
  await addNotesWithoutAuthoringUI(page)
  await openWeek(page)
  await audit(page)
  await page.screenshot({ path:`${outDir}/week-independent-1440.png`, fullPage:true })

  await page.setViewportSize({ width:1280, height:720 })
  await audit(page)
  await page.screenshot({ path:`${outDir}/week-independent-1280x720.png`, fullPage:true })

  check(errors.length === 0, `Independent B02 runtime errors: ${errors.join(' | ')}`)
  await context.close()
  console.log('Independent B02 Week object grammar audit passed at 1440 and 1280x720.')
} finally {
  await browser.close()
}
