# Kelly labeled SVG drop checklist (P0)

**Status (2026-09-16 Planning Period audit):** binaries **NOT FOUND**. Do not invent stand-ins. No CSS fakes shipped for this view.

Drop the originals into this folder (`uploads/desk-incoming/`), preserving exact filenames (including `(USE)` / `(use)`). A single `.zip` is fine.

After drop + push to `main`, ask Cursor: **“Incorporate Kelly labeled SVGs from uploads/desk-incoming”**.

## Planning Period view — object → asset map (Kelly `.arc-desk-surface` select)

Screenshot audit of Planning Period desk furniture. **Correct source = Kelly labeled SVG only.** Interim live controllers listed for diagnosis — they are **not** approved replacements.

| Visible desk object (screenshot) | Wrong live controller now | Correct labeled source | Canonical target | Status |
|----------------------------------|---------------------------|------------------------|------------------|--------|
| Wood desk surface (`.arc-desk-surface`) | `assets/arc/icarus/texture-wood.png` | `Wood Background Light.svg` | `wood-background-light.svg` | **MISSING** |
| Left MUST/SHOULD/COULD tray (photographic cardboard/denim strip) | `slices/todos-folder-body.png` + `todos-folder-tab.png` | `TODO tab (use).svg` (+ `TODOS tab.svg` ref) | `todos-tab.svg` | **MISSING** |
| IDEAS green pill / drawer | `green-folders-drawer.svg` / `.png` | `tray image (use).svg` (+ `Ideas Tray Vector.svg` ref) | `ideas-tray.svg` | **MISSING** |
| SETTINGS pill / tab | CSS / non-USE tab chrome | `Settings tab (USE).svg` | `settings-tab.svg` | **MISSING** |
| Edge tabs DAY/WEEK/MONTH/YEAR (PNG crops) | `slices/planner-edge-tab-*.png` | `calendar selected tab view.svg` + `unselected calendar states.svg` | `calendar-tab-selected.svg` / `calendar-tab-unselected.svg` | **MISSING** |
| Planning period planner paper / buckets (NOW · NEEDS ATTENTION · NEXT PLANNED chrome) | CSS cream paper interim | `calendar background.svg` | `calendar-background.svg` | **MISSING** |

**Blocking this view (drop these first):**

1. `TODO tab (use).svg`
2. `tray image (use).svg`
3. `Settings tab (USE).svg`
4. `calendar selected tab view.svg`
5. `unselected calendar states.svg`
6. `Wood Background Light.svg`
7. `calendar background.svg`

Until those seven land in this folder, agents must **not** wire or CSS-fake Planning Period furniture.
## Expected source filenames (22)

| # | Exact source filename | Canonical rename target | P0 wire |
|---|------------------------|-------------------------|---------|
| 1 | `Wood Background Light.svg` | `wood-background-light.svg` | P0-1 wood |
| 2 | `calendar background.svg` | `calendar-background.svg` | P0-2 calendar background |
| 3 | `calendar selected tab view.svg` | `calendar-tab-selected.svg` | P0-3 tabs |
| 4 | `unselected calendar states.svg` | `calendar-tab-unselected.svg` | P0-3 tabs |
| 5 | `Settings tab (USE).svg` | `settings-tab.svg` | P0-4 settings USE |
| 6 | `TODO tab (use).svg` | `todos-tab.svg` | P0-5 todos USE |
| 7 | `TODOS tab.svg` | `todos-tab-alt.svg` | reference only |
| 8 | `tray image (use).svg` | `ideas-tray.svg` | P0-6 ideas tray USE |
| 9 | `Ideas Tray Vector.svg` | `ideas-tray-vector-alt.svg` | reference only |
| 10 | `start class arctable logo.svg` | `start-class-mark.svg` | P0-7 start-class mark |
| 11 | `blue icon magnet.svg` | `magnet-blue.svg` | P0-8 magnets |
| 12 | `green icon magnet.svg` | `magnet-green.svg` | P0-8 magnets |
| 13 | `magnet vector yellow.svg` | `magnet-mustard.svg` | P0-8 magnets |
| 14 | `red icon magnet.svg` | `magnet-terracotta.svg` | P0-8 magnets |
| 15 | `to left of date on calendar rainbow icon.svg` | `calendar-date-rainbow.svg` | P0-9 header rainbow/today |
| 16 | `today button.svg` | `today-button.svg` | P0-9 header rainbow/today |
| 17 | `today highlighter icon.svg` | `today-highlight.svg` | P0-9 header rainbow/today |
| 18 | `Art upper left logo.svg` | `arc-upper-left-logo.svg` | candidate |
| 19 | `arctable vector icon.svg` | `arctable-mark.svg` | candidate |
| 20 | `Blue post it.svg` | `postit-blue.svg` | candidate |
| 21 | `Post it stack.svg` | `postit-stack.svg` | candidate |
| 22 | `selected class calendar icon vector.svg` | `calendar-class-selected-marker.svg` | candidate |

## Agent wiring stubs (resume when binaries land)

Copy sources → `public/assets/desk/canonical/` using the rename map above. Update provenance in `public/assets/desk/canonical/README.md`. Then:

| P0 | Wire target (do not invent art) | Live controller to archive **after** visual evidence |
|----|----------------------------------|------------------------------------------------------|
| 1 | `--arc-wood-surface-image` → `canonical/wood-background-light.svg` | `assets/arc/icarus/texture-wood.png` (+ keep `light-wood-desk.png` only if schedule-setup still needs it) |
| 2 | Planner spread background → `canonical/calendar-background.svg` | CSS cream / paper interim |
| 3 | Edge tab bodies → `calendar-tab-selected.svg` / `calendar-tab-unselected.svg` | `public/assets/desk/slices/planner-edge-tab-*.png` |
| 4 | Settings tab → `settings-tab.svg` | CSS / non-USE tab chrome |
| 5 | TO-DOS tab → `todos-tab.svg` | `todos-folder-tab.png` slice |
| 6 | IDEAS tray → `ideas-tray.svg` | `green-folders-drawer.svg` / `.png` |
| 7 | Start Class → `start-class-mark.svg` | `start-class-frame.png` / AT mark interim |
| 8 | Unit magnets → `magnet-*.svg` | PNG unit-magnet faces / CSS fills |
| 9 | Rainbow + Today → `calendar-date-rainbow.svg`, `today-button.svg`, `today-highlight.svg` | `planner-rainbow-mark.*` + CSS Today control |

**Hard rules:** no `object-fit: fill` on tactile SVG art; no destructive SVG optimize/re-trace; archive old controllers only after side-by-side evidence; never claim Kelly labeled authority from invented or cropped stand-ins.
