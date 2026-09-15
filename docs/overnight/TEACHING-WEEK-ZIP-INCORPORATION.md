# Teaching week zip incorporation (Kelly authority)

**Zip:** `Teaching_week__1__01fd.zip` → `uploads/desk-incoming/teaching-week-1/`  
**Authority comp:** `1.png` (1366×768) — committed as `docs/overnight/evidence/kelly-teaching-week-authority.png`

## File mapping

| Zip / source | Committed path | UI hook |
|--------------|----------------|---------|
| `1.png` (full comp) | `docs/overnight/evidence/kelly-teaching-week-authority.png` | Pixel pass default (`DESK_KELLY_REF`), north-star docs |
| `1.png` (mirror) | `public/assets/desk/figma/kelly-teaching-week-hero.png` | Evidence / hero reference (not runtime shell) |
| `1.png` (norm-crop) | `public/assets/desk/slices/*.png` | `DeskChromeSlice` via `deskSliceManifestData.ts` |
| `1.png` (title crop) | `public/assets/desk/planner-rainbow-mark.png` | `DeskPlannerHeadRow` `data-testid="desk-planner-rainbow-mark"` |
| `2.png` | `docs/overnight/evidence/kelly-teaching-week-zip-2-blank.png` | **None** — blank 1920×1080; no UI hook |
| — | `scripts/export-desk-teaching-week-slices.mjs` | Re-crop slices after comp updates |

**Not replaced from zip (no separate layers in zip):** icarus `texture-wood`, `assets/arc/arc-mark.png`, live week grid React, priority pad copy, edge tab button labels.

## Demo routing

- `maybeApplyDemoSeed`: `demoReset=1` seeds **Kelly Teaching week** bundle (Sept 7–11) and marks desk preview session (same as desk preview build).
- `AppFrame`: Month-on-desk drift → **Week** when desk shell forced or Kelly demo session seeded.

## Placement checklist (vs zip `1.png`)

| Region | testid / selector | Status |
|--------|-------------------|--------|
| Wood viewport | `arc-desk-tabletop`, `.arc-shell--desk` | **PASS** |
| Arc wordmark on wood | `arc-desk-wood-wordmark` | **PASS** |
| IDEAS drawer top-center | `desk-slice-ideas-drawer`, `arc-desk-tray-dock` | **PASS** (Kelly crop) |
| TO-DOS folder + tab | `desk-slice-todos-body`, `desk-slice-todos-tab` | **PASS** (Kelly crop) |
| Planner green frame accents | `desk-planner-frame-slices` | **PASS** (Kelly crop) |
| Title Teaching week + kicker | `.plan-state-primary`, `.plan-state-secondary` | **PASS** |
| Rainbow beside title | `desk-planner-rainbow-mark` | **PARTIAL** (Kelly crop; scale vs comp) |
| Search + Today cluster | `desk-planner-search`, `desk-planner-today` | **PARTIAL** (chevrons disabled) |
| Week grid courses / unit | demo seed + planning grid | **PASS** (period labels aligned to comp) |
| Edge tabs DAY/WEEK/MONTH/YEAR | `arc-planner-physical-tabs`, slice rasters | **PASS** (Kelly crop; WEEK active on home) |
| Start class + frame | `arc-desk-arctable`, `desk-slice-start-class-frame` | **PASS** (Kelly crop) |
| `?demo=1&demoReset=1` → Week + kicker | smoke + seed | **PASS** |

## Remaining gaps

1. **Pixel diff** still high vs 1366×768 authority scaled to 1696×1254 preview — run `npm run test:desk-pixel-pass` for metrics.
2. **`2.png`** — empty; Kelly may re-export if a 1080p comp was intended.
3. **Live chrome** — course row colored rails, “Weekends?” footer, LINE token on IDEAS stones (hidden when slices on).
4. **Viewport** — runtime 1440×1024 tabletop vs Kelly 16:9 comp; global scale mismatch.

## Tests (after `npm run preview:desk:serve`)

```bash
npm run test:contracts
npm run test:desk-slices
npm run test:arc-desk-pass
npm run test:desk-pixel-pass
```
