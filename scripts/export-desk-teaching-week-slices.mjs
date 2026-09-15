#!/usr/bin/env node
/**
 * LAST RESORT: re-crop desk chrome PNG slices from Kelly Teaching week authority comp (zip 1.png).
 * Only run when Kelly has not supplied discrete per-layer PNG/SVG exports — see
 * docs/overnight/TEACHING-WEEK-ASSETS-HONESTY.md and uploads/desk-incoming/README.txt.
 *
 * Runtime default uses source files (green-folders-drawer.svg, CSS tabs, AT-001 mark).
 * Comp crops are opt-in via VITE_ARC_DESK_SLICES=true or ?deskSlices=1.
 *
 * Source: docs/overnight/evidence/kelly-teaching-week-authority.png (1366×768)
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const src = join(root, 'docs/overnight/evidence/kelly-teaching-week-authority.png')
const outDir = join(root, 'public/assets/desk/slices')

if (!existsSync(src)) {
  console.error(`Missing authority PNG: ${src}`)
  process.exit(1)
}

const py = `
from PIL import Image
from pathlib import Path
SRC = Path(${JSON.stringify(src)})
OUT = Path(${JSON.stringify(outDir)})
REF_W, REF_H = 1366, 768
im = Image.open(SRC).convert('RGBA')
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

# Norm regions tuned to Teaching week zip comp (1366×768)
# ideas-drawer-chrome: green panel chrome ONLY — never crop yellow/pink/blue post-its into this PNG.
crop_norm(0.355 * REF_W, 0, 0.29 * REF_W, 0.145 * REF_H, 'ideas-drawer-chrome.png', pad=2)
crop_norm(0.038 * REF_W, 0.175 * REF_H, 0.115 * REF_W, 0.535 * REF_H, 'todos-folder-body.png')
crop_norm(0.008 * REF_W, 0.335 * REF_H, 0.038 * REF_W, 0.245 * REF_H, 'todos-folder-tab.png')
crop_norm(0.128 * REF_W, 0.122 * REF_H, 0.625 * REF_W, 0.028 * REF_H, 'planner-frame-top-accent.png')
crop_norm(0.124 * REF_W, 0.138 * REF_H, 0.014 * REF_W, 0.64 * REF_H, 'planner-frame-left-accent.png')
crop_norm(0.718 * REF_W, 0.715 * REF_H, 0.115 * REF_W, 0.195 * REF_H, 'start-class-frame.png', pad=4)
col_left = 0.752 * REF_W
col_top = 0.168 * REF_H
col_w = 0.04 * REF_W
tab_h = 0.108 * REF_H
# Edge tabs: do NOT crop from the authority screenshot — those crops bake MONTH wrap
# ("MONT"/"H"), wood grain, and active/inactive inversion into the PNG. Generate clean
# ticket faces; live React supplies upright icon + label.
from PIL import ImageDraw as _ImageDraw
def _ticket(active: bool):
    W, H = 72, 96
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = _ImageDraw.Draw(im)
    fill = (45, 78, 52, 255) if active else (246, 241, 230, 255)
    edge = (32, 58, 38, 255) if active else (210, 198, 176, 255)
    draw.rounded_rectangle([0, 0, W - 1, H - 1], radius=14, fill=fill, outline=edge, width=1)
    draw.rectangle([0, 0, 8, H - 1], fill=fill)
    draw.line([(0, 0), (0, H - 1)], fill=edge, width=1)
    return im
_inactive = _ticket(False)
_active = _ticket(True)
for label in ['day', 'week', 'month', 'year']:
    _inactive.save(OUT / f'planner-edge-tab-{label}-inactive.png', optimize=True)
_active.save(OUT / 'planner-edge-tab-active.png', optimize=True)
# Rainbow title mark beside "Teaching week" (REF 1366×768).
# Prior 0.168–0.206 × 0.148–0.203 cropped wood desk (solid tan) — wrong.
mark = OUT.parent / 'planner-rainbow-mark.png'
x0, y0 = int(315 * sx), int(210 * sy)
x1, y1 = int(368 * sx), int(255 * sy)
im.crop((x0, y0, x1, y1)).save(mark, optimize=True)
print('Teaching week desk slices exported to', OUT)
`

const result = spawnSync('python3', ['-c', py], { stdio: 'inherit' })
process.exit(result.status ?? 1)
