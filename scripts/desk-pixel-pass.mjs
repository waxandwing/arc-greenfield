/**
 * Honest pixel overlay/diff: Kelly comp + Figma export vs Playwright preview.
 * Writes evidence to docs/overnight/evidence/desk-pixel-pass/
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const evidenceDir = join(root, 'docs/overnight/evidence/desk-pixel-pass')
mkdirSync(evidenceDir, { recursive: true })

const baseUrl = process.env.ARC_BASE_URL ?? 'http://127.0.0.1:4173'
const kellyRef =
  process.env.DESK_KELLY_REF ??
  join(root, 'docs/overnight/evidence/kelly-teaching-week-authority.png')
const figmaRef = join(root, 'docs/overnight/evidence/figma-desk-6-3194/01-codex-image-37-11052.png')
const targetSize = { w: 1696, h: 1254 }

const deskPrefsJson = JSON.stringify({
  showTray: true,
  showPriorityPad: true,
  showDeskNotes: false,
  showArcTable: true,
  homeDeskPlannerView: 'Week',
  plannerSize: 'standard',
  traySize: 'standard',
  mscSize: 'standard',
})

async function capturePreview(outPath) {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      viewport: { width: targetSize.w, height: targetSize.h },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await page.goto(`${baseUrl}?demo=1&demoReset=1`, { waitUntil: 'networkidle' })
    await page.evaluate((prefs) => localStorage.setItem('arc.desk-preferences.v1', prefs), deskPrefsJson)
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByTestId('arc-desk-tabletop').waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: outPath, fullPage: false })
    await context.close()
  } finally {
    await browser.close()
  }
}

function runPythonDiff(previewPath, refPath, prefix) {
  const py = join(root, 'scripts/desk-pixel-diff.py')
  const result = spawnSync(
    'python3',
    [py, previewPath, refPath, join(evidenceDir, prefix), String(targetSize.w), String(targetSize.h)],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    throw new Error(`Python diff failed for ${prefix}`)
  }
  return JSON.parse(result.stdout.trim())
}

const roundTag = process.env.DESK_PIXEL_ROUND ?? 'round-1'
const previewPath = join(evidenceDir, `${roundTag}-preview-${targetSize.w}x${targetSize.h}.png`)
await capturePreview(previewPath)
console.log(`Captured preview → ${previewPath}`)

const metrics = { round: roundTag, targetSize, preview: previewPath, comparisons: [] }

for (const [label, refPath] of [
  ['kelly-comp', kellyRef],
  ['figma-export', figmaRef],
]) {
  if (!existsSync(refPath)) {
    console.warn(`Skip ${label}: missing ${refPath}`)
    continue
  }
  const m = runPythonDiff(previewPath, refPath, `${roundTag}-${label}`)
  metrics.comparisons.push({ label, refPath, ...m })
  console.log(`${label}: diff=${m.diffPct}% SSIM=${m.ssim} (threshold=${m.diffThreshold})`)
}

writeFileSync(join(evidenceDir, `${roundTag}-metrics.json`), JSON.stringify(metrics, null, 2))

const md = `# Desk pixel pass — ${roundTag}

Generated: ${new Date().toISOString()}

Preview: \`${previewPath.replace(root + '/', '')}\` (${targetSize.w}×${targetSize.h} viewport)

## Metrics (scale-normalized to ${targetSize.w}×${targetSize.h})

| Reference | Diff % (≥${metrics.comparisons[0]?.diffThreshold ?? 24} RGB) | SSIM |
|-----------|------|------|
${metrics.comparisons.map((c) => `| ${c.label} | **${c.diffPct}%** | ${c.ssim} |`).join('\n')}

## Artifacts

${metrics.comparisons
  .map(
    (c) =>
      `- \`${roundTag}-${c.label}-overlay.png\` — 50% blend ref/preview\n- \`${roundTag}-${c.label}-diff-heatmap.png\` — absolute RGB delta\n- \`${roundTag}-${c.label}-side-by-side.png\``,
  )
  .join('\n')}

**Note:** Pixel parity is not expected for SVG-authored chrome vs photographic comps; these numbers are the honest gate.
`

writeFileSync(join(evidenceDir, `${roundTag}-REPORT.md`), md)
console.log(`Report → docs/overnight/evidence/desk-pixel-pass/${roundTag}-REPORT.md`)
