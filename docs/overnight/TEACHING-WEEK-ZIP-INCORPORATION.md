# Teaching week zip incorporation (Kelly authority)

**Zip:** `Teaching_week__1__01fd.zip` → `uploads/desk-incoming/teaching-week-1/`  
**Authority comp:** `1.png` (1366×768) — committed as `docs/overnight/evidence/kelly-teaching-week-authority.png`

**Honesty matrix:** `docs/overnight/TEACHING-WEEK-ASSETS-HONESTY.md` — what is a real file vs a crop from `1.png`.

## Zip contents (complete list)

| File | Role |
|------|------|
| `1.png` | Full Teaching week comp — layout/pixel reference only |
| `2.png` | Blank 1920×1080 — not wired |
| *(no other assets)* | Kelly did **not** include separate layer exports in this zip |

## File mapping

| Zip / source | Committed path | UI hook |
|--------------|----------------|---------|
| `1.png` (full comp) | `docs/overnight/evidence/kelly-teaching-week-authority.png` | Pixel pass default (`DESK_KELLY_REF`), north-star docs |
| `1.png` (mirror) | `public/assets/desk/figma/kelly-teaching-week-hero.png` | Evidence / hero reference (not runtime shell) |
| `1.png` (norm-crop, **opt-in**) | `public/assets/desk/slices/*.png` | `DeskChromeSlice` when `VITE_ARC_DESK_SLICES=true` or `?deskSlices=1` |
| `1.png` (title crop, **opt-in**) | `public/assets/desk/planner-rainbow-mark.png` | Title mark only when slice mode on; default is `AT-001_table-mark.svg` |
| `2.png` | `docs/overnight/evidence/kelly-teaching-week-zip-2-blank.png` | **None** — blank 1920×1080; no UI hook |
| — | `scripts/export-desk-teaching-week-slices.mjs` | **Last resort** re-crop — see ASSETS-HONESTY doc |

**Default runtime (no crops):** `green-folders-drawer.svg`, icarus `texture-wood`, CSS TO-DOS + edge tabs, `ArcTableDeskMarkSvg`, live planner React.

**Not replaced from zip (no separate layers in zip):** icarus wood, `arc-mark.png`, live week grid, priority pad copy.

## Kelly export pack request

This zip is a **single comp**. For production fidelity without cropping, please add discrete exports to `uploads/desk-incoming/` (see README there) — one PNG/SVG per chrome layer — then ask to incorporate again.

## Demo routing

- `maybeApplyDemoSeed`: `demoReset=1` seeds **Kelly Teaching week** bundle (Sept 7–11) and marks desk preview session (same as desk preview build).
- `AppFrame`: Month-on-desk drift → **Week** when desk shell forced or Kelly demo session seeded.

## Placement checklist (vs zip `1.png`, **source mode default**)

| Region | testid / selector | Status |
|--------|-------------------|--------|
| Wood viewport | `arc-desk-tabletop`, `.arc-shell--desk` | **PASS** (icarus texture) |
| Arc wordmark on wood | `arc-desk-wood-wordmark` | **PASS** |
| IDEAS drawer | `desk-source-ideas-drawer`, `green-folders-drawer.svg` | **PASS** (vector source) |
| TO-DOS folder + tab | `desk-source-todos-body`, `desk-source-todos-tab` | **PASS** (CSS source) |
| Planner green frame | live spread CSS | **PASS** (no comp crop by default) |
| Title Teaching week + kicker | `.plan-state-primary`, `.plan-state-secondary` | **PASS** |
| Rainbow beside title | `desk-planner-rainbow-mark` `data-desk-mark-source="vector"` | **PASS** (AT-001 SVG) |
| Search + Today cluster | `desk-planner-search`, `desk-planner-today` | **PARTIAL** (chevrons disabled) |
| Week grid courses / unit | demo seed + planning grid | **PASS** |
| Edge tabs DAY/WEEK/MONTH/YEAR | `arc-planner-physical-tabs`, `data-desk-slices="false"` | **PASS** (CSS tabs) |
| Start class + mark | `arc-desk-arctable`, `ArcTableDeskMarkSvg` | **PASS** (no frame crop by default) |
| `?demo=1&demoReset=1` → Week + kicker | smoke + seed | **PASS** |

Optional comp-crop mode (`?deskSlices=1`): prior slice testids; use only for pixel diff experiments, not Kelly-facing default.

## Remaining gaps

1. **Pixel diff** vs authority @ 1696×1254: **~57% RGB** — source mode will differ from flat comp until discrete Kelly exports are wired.
2. **`2.png`** — empty; Kelly may re-export if a 1080p comp was intended.
3. **Discrete layer pack** — not in zip; needed to match comp without cropping `1.png`.

## Tests (after `npm run preview:desk:serve`)

```bash
npm run test:contracts
npm run test:desk-slices    # opt-in crops via ?deskSlices=1
npm run test:arc-desk-pass  # default source files
npm run test:desk-pixel-pass
```
