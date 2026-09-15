# Teaching week assets — crop vs source file honesty

Kelly’s feedback: the desk looked like **one demo image cropped into pieces**, not **real PNG/SVG files wired in**.

This doc is the audit matrix after re-reading `Teaching_week__1__01fd.zip` and the repo.

## Zip inventory (`uploads/desk-incoming/teaching-week-1/`)

| File | Size | What it is |
|------|------|------------|
| `1.png` | 1366×768 | Full **Teaching week comp** (authority layout reference) |
| `2.png` | 1920×1080 | **Blank white** — no UI; not wired |
| `INVENTORY.md` | — | Agent notes |

**No other files** — no per-layer SVG/PNG exports (drawer, folder, tabs, frame, etc.).

Committed copies:

- Authority: `docs/overnight/evidence/kelly-teaching-week-authority.png`
- Hero mirror: `public/assets/desk/figma/kelly-teaching-week-hero.png` (+ `kelly-teaching-week-comp.png`)

## Runtime: source file vs comp crop

| UI region | **Source file (default)** | **Comp crop (opt-in only)** | Wired how |
|-----------|---------------------------|-----------------------------|-----------|
| Wood tabletop | `public/assets/arc/icarus/texture-wood.png` | — | CSS `--arc-wood-surface-image` |
| IDEAS drawer | `public/assets/desk/green-folders-drawer.svg` | `slices/ideas-drawer-chrome.png` from `1.png` | SVG on shell; crop via `DeskChromeSlice` when `deskSlices=1` |
| TO-DOS folder | CSS `.arc-desk-todos-folder-*` | `slices/todos-folder-body.png`, `todos-folder-tab.png` | Same opt-in |
| Planner green frame accents | Live React / CSS spread | `slices/planner-frame-*-accent.png` | `DeskPlannerFrameSlices` only when slices on |
| Week title rainbow mark | `public/assets/arctable/AT-001_table-mark.svg` | `planner-rainbow-mark.png` from `1.png` | `deskPlannerTitleMarkUrl()` |
| Edge tabs DAY/WEEK/… | CSS `.arc-index-tab` denim/cream | `slices/planner-edge-tab-*.png` | Background image only when slices on |
| Start class frame | `ArcTableDeskMarkSvg` + CSS | `slices/start-class-frame.png` | Slice behind mark when slices on |
| Arc wordmark on wood | `assets/arc/arc-mark.png` (existing) | — | Component |
| Live week grid / copy | React + demo seed | — | Not raster |

**Opt-in comp crops:** build with `VITE_ARC_DESK_SLICES=true` or open preview with `?deskSlices=1`.

**Do not** run `scripts/export-desk-teaching-week-slices.mjs` unless there is still no discrete export for that layer — it overwrites `public/assets/desk/slices/*.png` from the authority comp.

Figma-era fallback crops (different comp): `scripts/export-desk-figma-slices.mjs` → same slice filenames, source `docs/overnight/evidence/figma-desk-6-3194/06-image-gen-7-37-11053.png`.

## What Kelly should send next

Please export **one PNG or SVG per layer** from Figma (not a single flattened comp), into `uploads/desk-incoming/`:

- IDEAS drawer (vector preferred)
- TO-DOS folder body + tab
- Planner frame accents (or one frame SVG)
- Vertical DAY/WEEK/MONTH/YEAR tabs (active + inactive)
- Start-class / ArcTable frame chrome
- Title mark beside “Teaching week” (if not `AT-001`)

List each file in `uploads/desk-incoming/README.txt`. An agent will place them under `public/assets/desk/` or `public/assets/desk/slices/` and point the manifest at **files**, not crops.

## Tests

- Default (source mode): `npm run test:arc-desk-pass` — asserts SVG/CSS, not slice testids.
- Crop mode: `npm run test:desk-slices` — loads `?deskSlices=1`.
- Manifest contract: `npm run test:contracts` — slice PNG paths still valid for opt-in mode.
