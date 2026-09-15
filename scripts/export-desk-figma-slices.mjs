#!/usr/bin/env node
/**
 * Re-crop desk chrome PNG slices from Figma evidence comp (node 37:11053).
 * Source PNG: docs/overnight/evidence/figma-desk-6-3194/06-image-gen-7-37-11053.png
 * Manifest: public/assets/desk/slices/manifest.json
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const src = join(root, 'docs/overnight/evidence/figma-desk-6-3194/06-image-gen-7-37-11053.png')
const outDir = join(root, 'public/assets/desk/slices')

if (!existsSync(src)) {
  console.error(`Missing evidence PNG: ${src}`)
  process.exit(1)
}

const py = `
from PIL import Image
from pathlib import Path
SRC = Path(${JSON.stringify(src)})
OUT = Path(${JSON.stringify(outDir)})
REF_W, REF_H = 1440, 1024
im = Image.open(SRC)
sw, sh = im.size
sx, sy = sw / REF_W, sh / REF_H

def crop_norm(left, top, width, height, name, pad=0):
    x0 = int(left * sx) - pad
    y0 = int(top * sy) - pad
    x1 = int((left + width) * sx) + pad
    y1 = int((top + height) * sy) + pad
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(sw, x1), min(sh, y1)
    im.crop((x0, y0, x1, y1)).save(OUT / name, optimize=True)

# ideas-drawer-chrome: green panel chrome ONLY — post-its are live DeskPostIt React objects, not crops.
crop_norm(0.33*REF_W, 0, 0.28*REF_W, 420, 'ideas-drawer-chrome.png', pad=2)
crop_norm(0.035*REF_W, 0.22*REF_H, 0.156*REF_W, 0.51*REF_H, 'todos-folder-body.png')
crop_norm(0.01*REF_W, 0.38*REF_H, 0.04*REF_W, 0.22*REF_H, 'todos-folder-tab.png')
crop_norm(0.172*REF_W, 0.24*REF_H, 0.656*REF_W, 0.04*REF_H, 'planner-frame-top-accent.png')
crop_norm(0.172*REF_W, 0.26*REF_H, 0.018*REF_W, 0.60*REF_H, 'planner-frame-left-accent.png')
crop_norm(0.858*REF_W, 0.78*REF_H, 0.10*REF_W, 0.14*REF_H, 'start-class-frame.png', pad=4)
col_left = 0.818 * REF_W
col_top = 0.305 * REF_H
col_w = 0.034 * REF_W
tab_h = 0.105 * REF_H
for i, label in enumerate(['day', 'week', 'month', 'year']):
    crop_norm(col_left, col_top + i * tab_h, col_w, tab_h, f'planner-edge-tab-{label}-inactive.png', pad=2)
crop_norm(col_left, col_top + tab_h, col_w, tab_h, 'planner-edge-tab-active.png', pad=2)
print('Desk slices exported to', OUT)
`

const result = spawnSync('python3', ['-c', py], { stdio: 'inherit' })
process.exit(result.status ?? 1)
