import { chromium } from 'playwright'

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(`${baseUrl}/?demo=1&demoReset=1`, { waitUntil: 'networkidle' })
  await page.getByTestId('arc-desk-tray-dock').waitFor({ state: 'visible', timeout: 30000 })

  await page.getByTestId('arc-desk-clean-up').click()
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-mustard"]').count() === 1, 'Clean up mustard')
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-pink"]').count() === 1, 'Clean up pink')

  if ((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')) !== 'true') {
    await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
  }
  await page.getByTestId('arc-desk-tray-dock').locator('[data-extended="true"]').waitFor({ state: 'attached', timeout: 3000 }).catch(() => {})
  await page.getByTestId('arc-desk-ideas-accent-slot').getByTestId('arc-desk-post-it-accent-mustard').waitFor({ state: 'visible', timeout: 5000 })
  await page.waitForTimeout(250)

  const surfaceBox = await page.locator('.arc-desk-surface').boundingBox()
  assert(surfaceBox, 'surface')

  for (const tone of ['mustard', 'pink']) {
    const traySticky = page.getByTestId('arc-desk-ideas-accent-slot').getByTestId(`arc-desk-post-it-accent-${tone}`)
    await traySticky.waitFor({ state: 'visible', timeout: 5000 })
    const grip = traySticky.getByTestId(`arc-desk-post-it-accent-${tone}-grip`)
    const start = await grip.boundingBox()
    assert(start, `${tone} grip`)
    const dropX = surfaceBox.x + surfaceBox.width * (tone === 'mustard' ? 0.72 : 0.82)
    const dropY = surfaceBox.y + surfaceBox.height * 0.58
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
    await page.mouse.down()
    await page.mouse.move(dropX, dropY, { steps: 24 })
    await page.getByTestId('arc-desk-post-it-drag-ghost').waitFor({ state: 'attached', timeout: 3000 })
    assert(await page.locator(".arc-desk-surface.arc-desk-postit-drop-target--desk-park, .arc-desk-surface[data-desk-postit-park='desk']").count() === 1, `${tone} desk park`)
    await page.mouse.up()
    await page.getByTestId('arc-desk-post-it-drag-ghost').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
    assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator(`[data-desk-post-it="accent-${tone}"]`).count() === 0, `${tone} left slot`)
    assert(await page.locator(`.arc-desk-surface > [data-desk-post-it="accent-${tone}"]`).count() === 1, `${tone} on desk`)
  }

  const membership = await page.evaluate(() => sessionStorage.getItem('arc.desk-postit-in-drawer.v1'))
  assert(membership && membership.includes('"accent-mustard":false') && membership.includes('"accent-pink":false'), 'persist out')

  // Ensure tray still open for return drop
  if ((await page.getByTestId('arc-desk-tray-dock').getAttribute('data-extended')) !== 'true') {
    await page.getByTestId('arc-desk-folders-tab').evaluate((el) => el.click())
    await page.waitForTimeout(200)
  }

  const pinkOnDesk = page.locator('.arc-desk-surface > [data-desk-post-it="accent-pink"]')
  const pinkGrip = pinkOnDesk.getByTestId('arc-desk-post-it-accent-pink-grip')
  const pinkStart = await pinkGrip.boundingBox()
  const slotBox = await page.getByTestId('arc-desk-ideas-accent-slot').boundingBox()
  assert(pinkStart && slotBox, 'return boxes')
  await page.mouse.move(pinkStart.x + pinkStart.width / 2, pinkStart.y + pinkStart.height / 2)
  await page.mouse.down()
  await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2, { steps: 18 })
  await page.locator(".arc-desk-tray-dock.arc-desk-postit-drop-target--ideas, .arc-desk-tray-dock[data-desk-postit-park='ideas']").waitFor({ state: 'attached', timeout: 3000 })
  await page.mouse.up()
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-pink"]').count() === 1, 'pink returned')

  await page.getByTestId('arc-desk-clean-up').click()
  assert(await page.getByTestId('arc-desk-ideas-accent-slot').locator('[data-desk-post-it="accent-mustard"]').count() === 1, 'cleanup mustard')

  console.log('ideas post-it drag-out smoke passed')
} finally {
  await browser.close()
}
