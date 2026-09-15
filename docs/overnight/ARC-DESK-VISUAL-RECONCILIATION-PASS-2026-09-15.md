# Arc desk visual reconciliation pass — 2026-09-15

**Branch:** `main`  
**Audit authority:** ArcBuild audit brief (physical desk, source assets, header de-bloat)  
**Reference comp:** `docs/overnight/evidence/kelly-teaching-week-authority.png`

## Summary

Focused pass on **physical composition** and **committed asset wiring** without redesigning desk architecture or planning logic.

## Changes

| Area | Action |
|------|--------|
| **Wood plane** | Removed duplicate wood/shadow/radius from `.arc-desk-tabletop` — single continuous shell wood |
| **Planner frame** | Lighter green border (2px), smaller radius (12px), softer shadow — reads as paper/book not dashboard card |
| **Edge tabs** | Default **committed tab PNGs** via `deskCommittedRasterChromeEnabled()`; wider hit area (52px) |
| **TO-DOS folder** | Default **committed slice PNGs** for body/tab; CSS denim fallback only with `?deskRaster=0` |
| **IDEAS drawer** | Stays **SVG** `green-folders-drawer.svg` (not comp crop) unless full `?deskSlices=1` |
| **Title mark** | Week uses **committed** `planner-rainbow-mark.png` when raster mode on |
| **Header bloat** | Flattened `plan-state-header` inside desk head row; hide setup prompt on desk when setup complete |
| **Utilities** | Quieter PLANNING/TRAY/SETTINGS chips (lower opacity, smaller type) |

## Real assets wired (default preview)

- `public/assets/arc/icarus/texture-wood.png` — shell
- `public/assets/desk/green-folders-drawer.svg` — IDEAS
- `public/assets/desk/slices/planner-edge-tab-*.png` — DAY/WEEK/MONTH/YEAR
- `public/assets/desk/slices/todos-folder-*.png` — priority folder
- `public/assets/desk/planner-rainbow-mark.png` — Teaching week title
- `public/assets/arctable/AT-001_table-mark.svg` — ArcTable (unchanged)

## Approximations remaining

| Item | Why |
|------|-----|
| Slice PNGs are teaching-week exports stored as files — not live Figma layer pack | Kelly zip had only full comp |
| Planner frame accent rasters | Off unless `?deskSlices=1` (full overlay stack) |
| Week grid / course row polish | P1 — not this pass scope |
| Pixel diff vs authority | Still >>15%; structural reconciliation first |

## Flags

- `?deskRaster=0` — CSS tabs + denim folder + vector title mark
- `?deskSlices=1` — full comp-crop overlay including frame accents + IDEAS chrome PNG

## Evidence

See `docs/overnight/evidence/arc-desk-pass/` after smoke run at this SHA.

## Handback

**SHA:** `91fc486` (after push: `git rev-parse HEAD` on `origin/main`)

### Tests (2026-09-15)

| Command | Result |
|---------|--------|
| `npm run test:contracts` | PASS |
| `npm run test:arc-desk-pass` | PASS |
| `npm run test:arc-desk-mark` | PASS |
| `npm run test:desk-slices` | PASS (`?deskSlices=1`) |
| `npm run test:edit-workspace` | **FAIL** — Pin layout persistence (investigate separately) |
| `npm run test:plan-year` | **FAIL** — Month→Year anchor (pre-existing smoke) |
| `npm run build` | typecheck `@types/node` env issue in CI VM (bundle builds via `preview:desk`) |

### Evidence

`docs/overnight/evidence/arc-desk-pass/` — refreshed by `test:arc-desk-pass` run.

### Kelly preview

`npm run kelly:desk` → http://127.0.0.1:4173/?demo=1&demoReset=1

Pages: https://waxandwing.github.io/arc-greenfield/?demo=1&demoReset=1 (after deploy)
