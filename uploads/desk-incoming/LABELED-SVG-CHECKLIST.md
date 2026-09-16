# Kelly labeled SVG drop checklist (P0)

**Status (2026-09-16):** binaries **NOT FOUND** — major visual blocker (YELLOW/RED re-audit). Do **not** invent stand-ins. No CSS fakes for Planning Period or Teaching week furniture.

## Plain English (Kelly)

1. Put the **22 labeled SVG files** (or one zip of them) in this folder: **`uploads/desk-incoming/`**.
2. Keep the **exact filenames** (including `(USE)` / `(use)`).
3. Commit + push to **`main`**, then ask Cursor: **“Incorporate Kelly labeled SVGs from uploads/desk-incoming”**.

Also see `KELLY-DROP-22-LABELED-SVGS-HERE.txt` and `README.txt` in this folder.

**Historical note:** Teaching week title / kicker / rainbow / three-course week were RED on 2026-09-15 and have since landed (see handback). They are **not** the current blocker. The current blocker is these **22 labeled SVG binaries**.


## Kelly PNG interim (2026-09-16) — settings / start-class / rainbow

While the SVG pack is still missing, these Kelly chat-upload PNGs are canonical + wired:

| Canonical PNG | Replaces interim | Status |
|---|---|---|
| `settings-tab.png` | CSS SETTINGS pill | **WIRED** |
| `start-class-mark.png` | `start-class-frame.png` / AT SVG + script | **WIRED** |
| `calendar-date-rainbow.png` | `planner-rainbow-mark.*` | **WIRED** |
| `postit-stack-base.png` / `paper-tray.png` | (none yet) | **STAGED** |

## Planning Period view — object → asset map (Kelly `.arc-desk-surface` select)

Screenshot audit of Planning Period desk furniture. **Correct source = Kelly labeled SVG only.** Interim live controllers listed for diagnosis — they are **not** approved replacements.

| Visible desk object (screenshot) | Wrong live controller now | Correct labeled source | Canonical target | Status |
|----------------------------------|---------------------------|------------------------|------------------|--------|
| Wood desk surface (`.arc-desk-surface`) | ~~`assets/arc/icarus/texture-wood.png`~~ → **LIVE** `canonical/wood-background-light.png` | `Wood Background Light.svg` (PNG chat stand-in landed) | `wood-background-light.png` | **LIVE** (SVG pack still optional) |
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

| # | Exact source filename | Canonical rename target | Wire order |
|---|------------------------|-------------------------|------------|
| 1 | `Wood Background Light.svg` | `wood-background-light.svg` | **1 — wood** |
| 2 | `tray image (use).svg` | `ideas-tray.svg` | **2 — tray (USE)** |
| 3 | `Ideas Tray Vector.svg` | `ideas-tray-vector-alt.svg` | reference only |
| 4 | `Settings tab (USE).svg` | `settings-tab.svg` | **3 — settings/todos tabs (USE)** |
| 5 | `TODO tab (use).svg` | `todos-tab.svg` | **3 — settings/todos tabs (USE)** |
| 6 | `TODOS tab.svg` | `todos-tab-alt.svg` | reference only |
| 7 | `calendar selected tab view.svg` | `calendar-tab-selected.svg` | **4 — calendar tabs** |
| 8 | `unselected calendar states.svg` | `calendar-tab-unselected.svg` | **4 — calendar tabs** |
| 9 | `calendar background.svg` | `calendar-background.svg` | **5 — calendar bg / rainbow / today / start-class / magnets** |
| 10 | `to left of date on calendar rainbow icon.svg` | `calendar-date-rainbow.svg` | **5** |
| 11 | `today button.svg` | `today-button.svg` | **5** |
| 12 | `today highlighter icon.svg` | `today-highlight.svg` | **5** |
| 13 | `start class arctable logo.svg` | `start-class-mark.svg` | **5** |
| 14 | `blue icon magnet.svg` | `magnet-blue.svg` | **5** |
| 15 | `green icon magnet.svg` | `magnet-green.svg` | **5** |
| 16 | `magnet vector yellow.svg` | `magnet-mustard.svg` | **5** |
| 17 | `red icon magnet.svg` | `magnet-terracotta.svg` | **5** |
| 18 | `Art upper left logo.svg` | `arc-upper-left-logo.svg` | candidate |
| 19 | `arctable vector icon.svg` | `arctable-mark.svg` | candidate |
| 20 | `Blue post it.svg` | `postit-blue.svg` | candidate |
| 21 | `Post it stack.svg` | `postit-stack.svg` | candidate |
| 22 | `selected class calendar icon vector.svg` | `calendar-class-selected-marker.svg` | candidate |

## Agent wiring order (resume when binaries land)

Copy sources → `public/assets/desk/canonical/` using the rename map. Update provenance in `public/assets/desk/canonical/README.md`. Wire in this order only — **do not invent art**:

| Step | Wire target | Live controller to archive **after** visual evidence |
|------|-------------|------------------------------------------------------|
| 1 | Wood → `canonical/wood-background-light.png` (**LIVE** singular authority; cover; no recolor) | Archive Icarus `texture-wood.png` + `light-wood-desk.png` (do not re-wire) |
| 2 | IDEAS tray → `ideas-tray.svg` | `green-folders-drawer.svg` / `.png` |
| 3 | Settings + TO-DOS tabs → `settings-tab.svg`, `todos-tab.svg` | CSS / non-USE tab chrome; `todos-folder-tab.png` slice |
| 4 | Calendar edge tabs → `calendar-tab-selected.svg` / `calendar-tab-unselected.svg` | `public/assets/desk/slices/planner-edge-tab-*.png` |
| 5 | Calendar bg + rainbow + Today + Start Class + magnets | CSS cream / `planner-rainbow-mark.*` / CSS Today / `start-class-frame.png` / PNG magnet faces |
| 6 | **Pixel gate** — `npm run test:desk-pixel-pass` after wires; do not claim visual DONE while >>15% RGB |

**Hard rules:** no `object-fit: fill` on tactile SVG art; no destructive SVG optimize/re-trace; archive old controllers only after side-by-side evidence; never claim Kelly labeled authority from invented or cropped stand-ins.

**Presence check:** `npm run check:canonical-desk-svgs` lists expected filenames; fails (`--strict` or partial land) if code claims canonical wires without files present.

## Agent note (2026-09-16 Kelly desk pass)

Labeled SVG USE binaries still missing. Kelly chat PNGs (`todos-tab.png`, `ideas-tray.png`, `settings-tab.png`) ingested under `public/assets/desk/canonical/` as interim wires — not SVG authority.
SETTINGS USE SVG still missing (interim planner edge tab shipped). IDEAS tray + TO-DOS tab PNGs are wired; labeled SVGs still outstanding. Drop remaining labeled SVGs here to unblock P0 wires.
