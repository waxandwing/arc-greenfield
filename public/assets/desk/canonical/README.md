# Arc desk labeled asset authority

**STATUS: PARTIAL** — Kelly PNG batches landed 2026-09-16 (marks/magnet/post-it + tray/tab/calendar + **P0 wood LIVE** + todos-tab-alt); the 22 labeled SVG binaries are still missing.

Do **not** invent substitutes (crops, CSS gradients, generated magnets, re-traced SVGs) and claim Kelly labeled authority. Wire remaining roles only after files land in `uploads/desk-incoming/` and are copied here per the rename map below.

Source: Kelly-labeled SVG handoff, 2026-09-15, plus **Kelly PNG chat upload 2026-09-16** (asset-ingest batches + wood/todos-tab agent). Filenames containing `(USE)` are the strongest source-of-truth signal for the SVG pack.

**Kelly drop path:** `uploads/desk-incoming/`  
→ `KELLY-DROP-22-LABELED-SVGS-HERE.txt` · `LABELED-SVG-CHECKLIST.md` · `README.txt`

**Presence check:** `npm run check:canonical-desk-svgs`

## P0 wood LIVE (2026-09-16) — unblocks desk wood

Kelly uploaded a **light wood grain desk surface PNG**. Landed and wired as the **singular desk wood authority**:

| File | Role | Wire |
|------|------|------|
| `wood-background-light.png` | Light wood desk surface (Kelly chat upload `2d3129a3-…`) | **LIVE** — `--arc-wood-surface-image` + `--arc-schedule-setup-wood` |
| `todos-tab-alt.png` | Cream vertical folder/tab with right-side pull (upload `4856134a-…`) | **Landed** — reference / folder-tab alt only (not the USE `todos-tab`) |

**Wire rules:** `background-size: cover` only; **no** recolor filters / lighting washes. Replaces Icarus `texture-wood.png` and `light-wood-desk.png` as competing desk surfaces. See `docs/overnight/DESK-SURFACE-AUTHORITY.md` + `PROVENANCE-kelly-wood-todos-tab-2026-09-16.json`.

Raw sources also kept under `uploads/desk-incoming/kelly-2026-09-16-*-source.png`.

## Kelly PNG ingest (2026-09-16) — PARTIAL LAND

Kelly uploaded four source PNGs (letterboxed, transparent). Cropped to content bbox (+2px) and wired for matching roles. **Did not invent** the other labeled SVGs.

Provenance: `PROVENANCE-kelly-2026-09-16.json`

| Saved path | Role | Wire |
|---|---|---|
| `arc-upper-left-logo.png` (+ `public/assets/arc/arc-mark-stacked.png`) | Original Arc stacked mark (a/r/c + red pie) | **WIRED** — wood wordmark + planner shell; **no wood-burn** |
| `arctable-mark.png` (+ `public/assets/arctable/arctable-quadrant-mark.png`) | ArcTable four-quadrant star/table mark (sticker) | **WIRED** — `ARC_TABLE_MARK_ASSET` (header + desk table identity); AT-001 SVG kept for hit geometry |
| `magnet-blue.png` (+ `desk/magnets/magnet-blue.png`) | Slate-blue speckled magnet/plate | **WIRED** — blue/slate magnet face |
| `postit-blue.png` | Pale blue tilted post-it paper | **WIRED** — `.arc-desk-post-it--blue` / accent-blue |

`start-class-mark.png` is the cursive + quadrant lockup from upload `406826ec-…` — **WIRED** as the desk Start Class control (see section below). Do not replace with quadrant-only `arctable-mark.png`.

## Wiring order (from re-audit — do not skip ahead)

When remaining binaries land, wire in this order only:

1. **Wood** → `wood-background-light.png` ✅ **LIVE**
2. **Tray** → `ideas-tray.svg` (`tray image (use).svg`)
3. **Settings / TO-DOS tabs** → `settings-tab.svg`, `todos-tab.svg`
4. **Calendar tabs** → `calendar-tab-selected.svg`, `calendar-tab-unselected.svg`
5. **Calendar bg / rainbow / today / start-class / magnets** → remaining `calendar-*.svg`, `today-*.svg`, `start-class-mark.svg`, other `magnet-*.svg`
6. **Pixel gate** → `npm run test:desk-pixel-pass` (do not claim visual DONE while >>15% RGB)

## Recon pass landing (2026-09-15)

- **SHA:** `9fd392f` on `main` / `cursor/arc-production-integration` (feature commits `4dea09d` + evidence); stamped `580822b`.
- **P0 asset wires:** were **BLOCKED** for labeled SVG binaries; four PNG roles now partial above.
- **Shipped without binaries:** Week-grid repair (MON/day headers, paper lesson objects, denser unit/course hierarchy, softer planner rim, `object-fit:contain` on todos slice).
- **Smokes:** `test:arc-desk-pass` + `test:desk-slices` passed on preview stamped `desk-v2` / `4dea09d`.
- **Evidence:** `docs/overnight/evidence/kelly-labeled-recon/` + arc-desk-pass smoke shots.

## Re-hunt / re-audit (2026-09-16) — labeled SVGs still NOT FOUND

Aggressive hunt confirmed **no** Kelly labeled SVG binaries (Drive/Gmail/git/`uploads/`/`public/assets/`/LFS/Skin Lab). Visual grade improved **RED → YELLOW/RED**; title/kicker/rainbow/3-course week from the 2026-09-15 RED audit are **historical** (landed). **Current major blocker = remaining labeled binaries.**

Do **not** invent replacements from screenshot crops, CSS gradients, tiny generated magnet SVGs, or previously wired approximations and claim Kelly labeled authority.

## Planning Period desk audit (2026-09-16) — still BLOCKED

Kelly selected `.arc-desk-surface` on Planning Period and asked to find correct assets. Third hunt again found **zero** of the 22 labeled SVG binaries.

**No P0 wires shipped** for Planning Period furniture (rule: do not CSS-fake). Object → asset map: `uploads/desk-incoming/LABELED-SVG-CHECKLIST.md` § Planning Period view.

Planning Period blockers (remaining): `TODO tab (use).svg`, `tray image (use).svg`, calendar tab bodies, `Wood Background Light.svg`, `calendar background.svg`. SETTINGS copper tab PNG is wired (`settings-tab.png`).

## Kelly PNG upload session (2026-09-16) — batch 2 wired

Kelly uploaded four more desk PNGs (empty chat message) after batch 1 (Arc mark / ArcTable mark / blue magnet / blue post-it).

**Do not invent** the remaining labeled SVG pack. PNG paths below are provisional authority until matching SVGs arrive; they do **not** claim labeled-SVG status.

| Canonical PNG | Source upload UUID | Role | Wire |
|---|---|---|---|
| `calendar-background.png` | `5cba6dc1-…` | cream green-rim planner plate | `--arc-desk-calendar-background` on `.arc-calendar-spread--desk` |
| `calendar-tab.png` | `9896585d-…` | green vertical edge tab body | active planner edge tabs via `deskPlannerEdgeTabAssetUrl` |
| `magnet-green.png` | `4ef86817-…` | olive speckled magnet | `deskMagnetAssets` preferred + `magnets/magnet-green.png` mirror |
| `ideas-tray.png` | `25dc87d8-…` | felt sage tray + pull tab (**USE**) | replaces `green-folders-drawer.*` CSS + IDEAS drawer `<img>` |

Provenance: `PROVENANCE-kelly-2026-09-16-batch2-tray-tab-magnet-paper.json`.

Coordinate with batch 1 (`PROVENANCE-kelly-2026-09-16.json`) — do not overwrite those paths.

## Kelly PNG ingest — settings / start-class / rainbow / paper tray (2026-09-16)

Agent `bc-f777bf61`. Provenance: `PROVENANCE-kelly-settings-start-rainbow-2026-09-16.json`.

| Canonical PNG | Upload UUID | Role | Wire |
|---|---|---|---|
| `settings-tab.png` | `56d5f05f-…` | Copper brushed SETTINGS physical tab | **WIRED** — desk utility SETTINGS face |
| `start-class-mark.png` | `406826ec-…` | Cursive “start class” + ArcTable quadrant | **WIRED** — ArcTable desk Start Class control (+ `public/assets/arctable/start-class-mark.png`) |
| `calendar-date-rainbow.png` | `83aed162-…` | Teaching week header rainbow | **WIRED** — replaces interim `planner-rainbow-mark.png` |
| `postit-stack-base.png` (+ alias `paper-tray.png`) | `da2d1234-…` | Cream paper tray / post-it stack base | **STAGED** — binary landed; tray-stack wire pending |

Processing: transparent letterbox cropped to content bbox (+2px pad). No recolor. `start-class-mark.png` includes cursive + quadrant and must **not** be replaced by the quadrant-only `arctable-mark` tile.



## Binary handoff status

**PARTIAL** — batch 1 + batch 2 Kelly PNGs wired 2026-09-16; remaining labeled SVG binaries still missing.

| Canonical file | Original labeled source | Intended role | Authority | Wire status |
|---|---|---|---|---|
| `arc-upper-left-logo.png` | Kelly chat PNG 2026-09-16 (a/r/c + red pie) | Arc mark on wood / planner | **Kelly PNG** | **WIRED** → `assets/arc/arc-mark-stacked.png` |
| `arctable-mark.png` | Kelly chat PNG 2026-09-16 (quadrant sticker) | ArcTable identity | **Kelly PNG** (vs AT-001) | **WIRED** → `ARC_TABLE_MARK_ASSET` |
| `magnet-blue.png` | Kelly chat PNG 2026-09-16 | blue physical magnet | **Kelly PNG** | **WIRED** |
| `postit-blue.png` | Kelly chat PNG 2026-09-16 | blue Post-it object | **Kelly PNG** | **WIRED** |
| `calendar-background.png` | Kelly chat PNG 2026-09-16 batch 2 | planner plate | **Kelly PNG** | **WIRED** |
| `calendar-tab.png` | Kelly chat PNG 2026-09-16 batch 2 | active edge tab body | **Kelly PNG** | **WIRED** (active) |
| `magnet-green.png` | Kelly chat PNG 2026-09-16 batch 2 | green physical magnet | **Kelly PNG** | **WIRED** |
| `ideas-tray.png` | Kelly chat PNG 2026-09-16 batch 2 | IDEAS tray/drawer | **Kelly PNG / USE** | **WIRED** (replaces `green-folders-drawer.*`) |
| `wood-background-light.svg` | `Wood Background Light.svg` | light wood desk surface | canonical candidate | **BLOCKED** |
| `ideas-tray.svg` | `tray image (use).svg` | IDEAS tray/drawer | **USE / canonical** | **BLOCKED** SVG — live PNG `ideas-tray.png` |
| `settings-tab.svg` | `Settings tab (USE).svg` | SETTINGS physical tab | **USE / canonical** | **BLOCKED** |
| `todos-tab.svg` | `TODO tab (use).svg` | TO-DOS physical tab | **USE / canonical** | **BLOCKED** |
| `calendar-tab-selected.svg` | `calendar selected tab view.svg` | selected planner-view tab body | canonical | **BLOCKED** SVG — active uses PNG `calendar-tab.png` |
| `calendar-tab-unselected.svg` | `unselected calendar states.svg` | inactive planner-view tab body | canonical | **BLOCKED** |
| `calendar-background.svg` | `calendar background.svg` | planner/calendar physical background | canonical candidate | **BLOCKED** SVG — live PNG `calendar-background.png` |
| `calendar-date-rainbow.svg` | `to left of date on calendar rainbow icon.svg` | accent left of calendar date | canonical | **BLOCKED** |
| `today-button.svg` | `today button.svg` | Today physical control | canonical | **BLOCKED** |
| `today-highlight.svg` | `today highlighter icon.svg` | Today marker/highlighter | canonical | **BLOCKED** |
| `start-class-mark.svg` | `start class arctable logo.svg` | Start Class desk control | canonical | **BLOCKED** (PNG lockup may exist separately) |
| `magnet-green.svg` | `green icon magnet.svg` | green physical magnet | canonical | **BLOCKED** SVG — live PNG `magnet-green.png` |
| `magnet-mustard.svg` | `magnet vector yellow.svg` | mustard physical magnet | canonical | **BLOCKED** |
| `magnet-terracotta.svg` | `red icon magnet.svg` | terracotta/red physical magnet | canonical | **BLOCKED** |
| `postit-stack.svg` | `Post it stack.svg` | stacked paper/Post-it object | canonical candidate | **BLOCKED** |
| `calendar-class-selected-marker.svg` | `selected class calendar icon vector.svg` | class-focus selection marker | canonical | **BLOCKED** |
| `todos-tab-alt.svg` | `TODOS tab.svg` | alternate/legacy TO-DOS reference | reference only | still missing SVG; PNG covers reference |
| `ideas-tray-vector-alt.svg` | `Ideas Tray Vector.svg` | simplified/alternate tray | reference only | **BLOCKED** |


## Kelly PNG chat ingest — IDEAS + TODOs (2026-09-16)

Parallel ingest with other Kelly PNG drops. Source: chat uploads (not the 22 labeled SVG pack). Cropped to content bbox (+2px). Provenance: `PROVENANCE-kelly-ideas-todos-2026-09-16.json`.

| Canonical file | Source upload | Role | Wire status |
|---|---|---|---|
| `ideas-tray.png` | `cb692436-8441-4724-8bec-73ed5f76df6c.png` | Sage IDEAS drawer with baked pull-tab text — **primary IDEAS authority** | **WIRED** — replaces `green-folders-drawer.*` + cardboard/green pill chrome |
| `todos-tab.png` | `f065dec0-271d-4076-9b4a-b6c81f8cb70f.png` | Silver brushed metal TO-DOS side tab | **WIRED** — replaces `slices/todos-folder-tab.png` |
| `tray-notch-blue-grey.png` | `7ad07129-16fd-48c3-9067-8e317cc7c5fa.png` | Light blue-grey notched tray piece | staged / not wired (role unclear) |
| `mustard-tray-well.png` | `0ffc4e09-9cad-4c2b-b38a-3c4f111aec10.png` (split) | Mustard semicircle tray well | staged / not wired |
| `beige-tray-rail.png` | same composite (split) | Beige horizontal rail/tab | staged / not wired |
| `mustard-tray-well-rail.png` | same composite | Composite reference | staged / not wired |

**Live controllers after this land:**

- IDEAS: `--arc-desk-green-folders-drawer` / `--arc-desk-tray-texture` → `canonical/ideas-tray.png`
- TO-DOS tab: `canonical/todos-tab.png` (img chrome on `DeskTodosFolder`)

Labeled SVG rows for `ideas-tray.svg` / `todos-tab.svg` remain the eventual vector authority if the 22-file pack arrives; these PNGs are the current Kelly source-art stand-in until then.

## Live controllers still active (do not dual-wire)

- **Wood (singular):** `--arc-wood-surface-image` + `--arc-schedule-setup-wood` → `canonical/wood-background-light.png` (cover; no recolor)
- Arc mark on wood / planner: `assets/arc/arc-mark-stacked.png` (Kelly PNG; no pyrography)
- ArcTable / Start Class mark art: `assets/arctable/arctable-quadrant-mark.png` (Kelly PNG; AT-001 SVG for hits)
- Blue magnet / blue post-it: canonical PNGs (batch 1)
- Green magnet: `canonical/magnet-green.png` (batch 2)
- IDEAS: `canonical/ideas-tray.png` (Kelly PNG authority; legacy `green-folders-drawer.*` retained on disk, unwired)
- TO-DOS tab: `canonical/todos-tab.png` (Kelly silver brushed metal)
- Planner plate: `canonical/calendar-background.png`
- Edge tabs: active → `canonical/calendar-tab.png`; inactive → `slices/planner-edge-tab-*.png`
- Rainbow: `planner-rainbow-mark.png` / `.svg`
- Legacy archives (do not re-wire as desk wood): `assets/arc/icarus/texture-wood.png`, `assets/desk/light-wood-desk.png`

## Implementation rules

1. Do not mark an asset reconciled merely because its file loads.
2. Verify role, scale, crop, aspect ratio, edge behavior, layering, lighting and placement against the approved desk reference.
3. Prefer labeled source assets over screenshot-derived crop PNGs when they describe the complete object.
4. Never use `object-fit: fill` / stretch on tactile wood — wood uses **cover**; no recolor filters.
5. Some SVG files contain embedded raster texture. Do not aggressively optimize, trace, or re-vectorize them without visual comparison.
6. `calendar-tab-selected.svg` and `calendar-tab-unselected.svg` are state bodies; DAY/WEEK/MONTH/YEAR should remain live accessible labels unless later authority proves otherwise.
7. `calendar-class-selected-marker.svg` is not interchangeable with the general selected calendar-view tab.
8. `start-class-mark` is distinct from the generic ArcTable mark — do not double script chrome.
9. `ideas-tray.svg`, `settings-tab.svg`, and `todos-tab.svg` came from explicitly labeled `(USE)` files and should lead their respective reconciliations.
10. `todos-tab-alt` is reference / folder-tab geometry only — do not swap it in as the USE TO-DOS tab.
11. Keep current production assets intact until visual reconciliation and smoke tests are complete.

## Concurrent work (do not regress)

- Additional Kelly PNG batches (settings/tray/wood/start-class lockup) — coordinate; do not invent SVGs
- Planning Period asset map (`bc-a47c451f`)
- Post-it drops + u/l/i/n capture (`bc-61cb9db8`)
- IDEAS cleanup (`bc-5a50eada`)
