# Arc desk labeled asset authority

**STATUS: BLOCKED** — the 22 Kelly labeled SVG binaries are **not in this folder**.

Do **not** invent substitutes (crops, CSS gradients, generated magnets, re-traced SVGs) and claim Kelly labeled authority. Wire only after files land in `uploads/desk-incoming/` and are copied here per the rename map below.

Source: Kelly-labeled SVG handoff, 2026-09-15. Filenames containing `(USE)` are the strongest source-of-truth signal.

**Kelly drop path:** `uploads/desk-incoming/`  
→ `KELLY-DROP-22-LABELED-SVGS-HERE.txt` · `LABELED-SVG-CHECKLIST.md` · `README.txt`

**Presence check:** `npm run check:canonical-desk-svgs`

## Wiring order (from re-audit — do not skip ahead)

When binaries land, wire in this order only:

1. **Wood** → `wood-background-light.svg`
2. **Tray** → `ideas-tray.svg` (`tray image (use).svg`)
3. **Settings / TO-DOS tabs** → `settings-tab.svg`, `todos-tab.svg`
4. **Calendar tabs** → `calendar-tab-selected.svg`, `calendar-tab-unselected.svg`
5. **Calendar bg / rainbow / today / start-class / magnets** → `calendar-background.svg`, `calendar-date-rainbow.svg`, `today-button.svg`, `today-highlight.svg`, `start-class-mark.svg`, `magnet-*.svg`
6. **Pixel gate** → `npm run test:desk-pixel-pass` (do not claim visual DONE while >>15% RGB)

## Recon pass landing (2026-09-15)

- **SHA:** `9fd392f` on `main` / `cursor/arc-production-integration` (feature commits `4dea09d` + evidence); stamped `580822b`.
- **P0 asset wires:** all **BLOCKED** — Kelly labeled SVG binaries still absent.
- **Shipped without binaries:** Week-grid repair (MON/day headers, paper lesson objects, denser unit/course hierarchy, softer planner rim, `object-fit:contain` on todos slice).
- **Smokes:** `test:arc-desk-pass` + `test:desk-slices` passed on preview stamped `desk-v2` / `4dea09d`.
- **Evidence:** `docs/overnight/evidence/kelly-labeled-recon/` + arc-desk-pass smoke shots.

## Re-hunt / re-audit (2026-09-16) — still NOT FOUND

Aggressive hunt confirmed **no** Kelly labeled SVG binaries (Drive/Gmail/git/`uploads/`/`public/assets/`/LFS/Skin Lab). Visual grade improved **RED → YELLOW/RED**; title/kicker/rainbow/3-course week from the 2026-09-15 RED audit are **historical** (landed). **Current major blocker = these 22 labeled binaries.**

Do **not** invent replacements from screenshot crops, CSS gradients, tiny generated magnet SVGs, or previously wired approximations and claim Kelly labeled authority.

## Planning Period desk audit (2026-09-16) — still BLOCKED

Kelly selected `.arc-desk-surface` on Planning Period and asked to find correct assets. Third hunt (uploads / Drive / Gmail / branches / zips / worktrees) again found **zero** of the 22 labeled SVG binaries.

**No P0 wires shipped** for this view (rule: do not CSS-fake). Object → asset map + blocking filenames: `uploads/desk-incoming/LABELED-SVG-CHECKLIST.md` § Planning Period view.

Planning Period blockers: `TODO tab (use).svg`, `tray image (use).svg`, `Settings tab (USE).svg`, `calendar selected tab view.svg`, `unselected calendar states.svg`, `Wood Background Light.svg`, `calendar background.svg`.
## Binary handoff status

**BLOCKED — binaries not in repo.** Only this README (filename → canonical map) ships here until the 22 originals land in `uploads/desk-incoming/` and are copied into this folder.

| Canonical file | Original labeled source | Intended role | Authority | Wire status |
|---|---|---|---|---|
| `wood-background-light.svg` | `Wood Background Light.svg` | light wood desk surface | canonical candidate | **BLOCKED** — binary missing |
| `ideas-tray.svg` | `tray image (use).svg` | IDEAS tray/drawer | **USE / canonical** | **BLOCKED** — binary missing |
| `ideas-tray-vector-alt.svg` | `Ideas Tray Vector.svg` | simplified/alternate tray | reference only | **BLOCKED** — binary missing |
| `settings-tab.svg` | `Settings tab (USE).svg` | SETTINGS physical tab | **USE / canonical** | **BLOCKED** — binary missing |
| `todos-tab.svg` | `TODO tab (use).svg` | TO-DOS physical tab | **USE / canonical** | **BLOCKED** — binary missing |
| `todos-tab-alt.svg` | `TODOS tab.svg` | alternate/legacy TO-DOS reference | reference only | **BLOCKED** — binary missing |
| `calendar-tab-selected.svg` | `calendar selected tab view.svg` | selected planner-view tab body | canonical | **BLOCKED** — binary missing |
| `calendar-tab-unselected.svg` | `unselected calendar states.svg` | inactive planner-view tab body | canonical | **BLOCKED** — binary missing |
| `calendar-background.svg` | `calendar background.svg` | planner/calendar physical background | canonical candidate | **BLOCKED** — binary missing |
| `calendar-date-rainbow.svg` | `to left of date on calendar rainbow icon.svg` | accent left of calendar date | canonical | **BLOCKED** — binary missing |
| `today-button.svg` | `today button.svg` | Today physical control | canonical | **BLOCKED** — binary missing |
| `today-highlight.svg` | `today highlighter icon.svg` | Today marker/highlighter | canonical | **BLOCKED** — binary missing |
| `start-class-mark.svg` | `start class arctable logo.svg` | Start Class desk control | canonical | **BLOCKED** — binary missing |
| `magnet-blue.svg` | `blue icon magnet.svg` | blue physical magnet | canonical | **BLOCKED** — binary missing |
| `magnet-green.svg` | `green icon magnet.svg` | green physical magnet | canonical | **BLOCKED** — binary missing |
| `magnet-mustard.svg` | `magnet vector yellow.svg` | mustard physical magnet | canonical | **BLOCKED** — binary missing |
| `magnet-terracotta.svg` | `red icon magnet.svg` | terracotta/red physical magnet | canonical | **BLOCKED** — binary missing |
| `arc-upper-left-logo.svg` | `Art upper left logo.svg` | Arc mark on wood / upper-left desk | canonical candidate | **BLOCKED** — binary missing |
| `arctable-mark.svg` | `arctable vector icon.svg` | generic ArcTable identity | canonical candidate | **BLOCKED** — binary missing |
| `postit-blue.svg` | `Blue post it.svg` | blue Post-it object | canonical candidate | **BLOCKED** — binary missing |
| `postit-stack.svg` | `Post it stack.svg` | stacked paper/Post-it object | canonical candidate | **BLOCKED** — binary missing |
| `calendar-class-selected-marker.svg` | `selected class calendar icon vector.svg` | class-focus selection marker | canonical | **BLOCKED** — binary missing |

## Live controllers still active (do not dual-wire)

Until Kelly binaries land and are visually compared:

- Wood: `--arc-wood-surface-image` → `assets/arc/icarus/texture-wood.png`
- IDEAS: `green-folders-drawer.svg` / `.png`
- Edge tabs: `public/assets/desk/slices/planner-edge-tab-*.png` (+ live DAY/WEEK/MONTH/YEAR text)
- Rainbow: `planner-rainbow-mark.png` / `.svg` (interim — not the labeled `calendar-date-rainbow.svg`)
- Schedule-setup wood only: `light-wood-desk.png`

## Implementation rules

1. Do not mark an asset reconciled merely because its file loads.
2. Verify role, scale, crop, aspect ratio, edge behavior, layering, lighting and placement against the approved desk reference.
3. Prefer labeled source assets over screenshot-derived crop PNGs when they describe the complete object.
4. Never use `object-fit: fill` on tactile source art unless a specifically documented scalable interior region exists.
5. Some SVG files contain embedded raster texture. Do not aggressively optimize, trace, or re-vectorize them without visual comparison.
6. `calendar-tab-selected.svg` and `calendar-tab-unselected.svg` are state bodies; DAY/WEEK/MONTH/YEAR should remain live accessible labels unless later authority proves otherwise.
7. `calendar-class-selected-marker.svg` is not interchangeable with the general selected calendar-view tab.
8. `start-class-mark.svg` is distinct from the generic ArcTable mark.
9. `ideas-tray.svg`, `settings-tab.svg`, and `todos-tab.svg` came from explicitly labeled `(USE)` files and should lead their respective reconciliations.
10. Keep current production assets intact until visual reconciliation and smoke tests are complete.
11. Do not run another “prettier CSS” pass on wrong interim assets while labeled binaries are missing.

## Concurrent work (do not regress)

- Post-it drops + u/l/i/n capture (`bc-61cb9db8`)
- IDEAS cleanup (`bc-5a50eada`)
- Student ArcTable work — merge carefully around desk chrome
