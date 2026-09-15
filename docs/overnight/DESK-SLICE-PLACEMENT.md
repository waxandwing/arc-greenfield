# Desk slice placement (Figma → runtime)

Kelly desk chrome uses **committed raster slices** from Figma file `CfWcuQPY4ljYXondICj2ZX`, cropped from evidence comp `37:11053` (`docs/overnight/evidence/figma-desk-6-3194/06-image-gen-7-37-11053.png`). Hero reference node `37:11052` is stored at `public/assets/desk/figma/desk-hero-37-11052.png`.

## Paths

| Asset | Path |
|-------|------|
| Slice PNGs | `public/assets/desk/slices/*.png` |
| Placement manifest (JSON) | `public/assets/desk/slices/manifest.json` |
| Typed manifest (runtime) | `src/navigation/deskSliceManifestData.ts` |
| Runtime URL helpers | `src/desk/deskSliceRuntime.ts` |
| Re-export script | `scripts/export-desk-figma-slices.mjs` |

Disable slices locally: `VITE_ARC_DESK_SLICES=false` (falls back to SVG/CSS chrome).

## Manifest mapping

Reference frame: **1440×1024** (`.arc-desk-tabletop` logical size). All slices are **decorative** (`liveChrome: false`); live React content stays in the wells listed below.

| Slice id | Target | z-index | Live content slot |
|----------|--------|---------|---------------------|
| `ideas-drawer-chrome` | `DeskGreenFoldersDrawer` | 1 | `.arc-desk-green-drawer-well` (TRAY captures when extended) |
| `todos-folder-body` | `DeskTodosFolder` | 0 | `.arc-desk-todos-folder-body` → `DeskPriorityPad` |
| `todos-folder-tab` | `DeskTodosFolder` | 2 | Tab raster only; label in `.sr-only` |
| `planner-frame-top-accent` | `.arc-calendar-spread--desk` | 3 | `.b01-calendar-owner` (Teaching week grid) |
| `planner-frame-left-accent` | `.arc-calendar-spread--desk` | 3 | same |
| `start-class-frame` | `ArcTableDeskFixture` | 0 | AT mark + script (canonical SVG mark unchanged) |
| `planner-edge-tab-*` | `arc-planner-physical-tabs--desk-edge` | 45–46 | Live `button.arc-index-tab` labels (DAY/WEEK/MONTH/YEAR) |
| `planner-edge-tab-*` | `.arc-planner-physical-tabs--desk-edge` | 45–46 | Live DAY/WEEK/MONTH/YEAR buttons (`interactive-chrome`; click → view nav) |

## Calendar enlarge (desk planner)

- **Trigger:** `Enlarge` in desk planner head row — `data-testid="calendar-enlarge"`.
- **Pop-out:** `DeskCalendarPopOut` — `role="dialog"`, `aria-modal`, Escape, focus trap, `data-testid="desk-calendar-popout"`.
- **Dismiss:** `Back to desk` — `data-testid="desk-calendar-popout-dismiss"`.
- View tabs inside pop-out: `desk-calendar-popout-tab-day|week|month|year`.
- TRAY/MSC smokes unchanged: full TRAY still via off-screen utility tabs; molded dock hidden when workspace drawer open.

## Figma MCP

- `get_design_context` on `37:11052` returns the flat hero raster (no child layers in this file revision).
- Per-region chrome is produced by **norm-crop** from `37:11053` aligned to desk slot percentages in `arc-desk.css`.

## Remaining pixel gaps (post-integration)

See `docs/overnight/DESK-PIXEL-REQUIREMENTS.md` and `b030b24` honest diff (~60% RGB vs Kelly). Slices improve tray/folder/frame photography but do not yet fix:

1. Global viewport scale vs Kelly 1696×1254 comp.
2. Live week grid typography (course P1 blocks, rainbow title mark, Weekends footer).
3. Vertical tab label typography vs Figma (raster stack shipped; fine kerning may drift).
4. Quick Capture sticky (hidden on desk; no slice).
5. `LINE` stone label on IDEAS drawer tokens (slice is photographic; tokens hidden when slices on).
