# Kelly desk asset incorporation pass

**Date:** 2026-09-15 (update)  
**Git:** main  
**Agent task:** Incorporate files from `uploads/desk-incoming/` per `docs/KELLY-WHERE-TO-PUT-DESK-ASSETS.md`.

## Latest incorporation — desk v3 preview repair (2026-08-03 comp)

Kelly uploaded a full-desk screenshot: **desk v3 preview-repair-2026-08-03**.

| Source | Destination |
|--------|-------------|
| Kelly upload | `uploads/desk-incoming/kelly-desk-v3-preview-repair-2026-08-03.png` |
| Hero / authority copy | `public/assets/desk/figma/kelly-desk-v3-comp-2026-08-03.png` |

### What the comp shows (brief)

- **Wood tabletop** — light grain fills the viewport; UI sits on the physical desk surface.
- **IDEAS** — forest-green pill tab, top-center on the wood.
- **TO-DOS folder** — left denim-style folder with **MUST DO**, **SHOULD DO**, **COULD DO** priority pads and “+ Must / + Should / + Could” inputs.
- **Planner** — cream spread in a green frame; **MONTH** view active with **AUGUST** title and month grid (Thu Aug 7 highlighted). Header has search, **Today**, enlarge control.
- **Vertical tabs** — **DAY / WEEK / MONTH / YEAR** on the planner’s right edge; **MONTH** selected in this mock.
- **abc logo** — small three-letter mark top-left (blue **a**, mustard **b**, red **c**).
- **AHEAD. quadrant mark** — bottom-right on wood: four quarter-circles (blue, red, mustard, green) with **AHEAD.** label beneath.
- **Background type** — large decorative “Table” lettering behind the windows (poster on desk).

**Teaching week note:** This PNG is the **Kelly authority comp** for desk v3 furniture and month layout. The **product default** on `?demo=1&demoReset=1` is still **Week / Teaching week** (September kicker), not August month — see `MASTER-DESK-VISUAL-GOAL.md`.

### Wiring

| Item | Change |
|------|--------|
| `uploads/desk-incoming/README.txt` | Listed incoming file as full-desk comp reference |
| `scripts/desk-pixel-pass.mjs` | Default `DESK_KELLY_REF` fallback → `public/assets/desk/figma/kelly-desk-v3-comp-2026-08-03.png` |
| `docs/overnight/MASTER-DESK-VISUAL-GOAL.md` | Authority table cites v3 comp; product-default vs month-mock clarified |

## 1. Incoming drop folder inventory (prior pass)

Path: `uploads/desk-incoming/`

| File | Purpose |
|------|---------|
| `kelly-desk-v3-preview-repair-2026-08-03.png` | Full-desk comp (see above) |
| `README.txt` | Kelly instructions + file list |
| `.gitkeep` | placeholder |

## 2. Actions taken (cumulative)

| Action | Result |
|--------|--------|
| Copy v3 comp to incoming + `public/assets/desk/figma/` | **Done** |
| Update `public/assets/desk/slices/manifest.json` | **No change** — no new slices |
| Update `src/navigation/deskSliceManifestData.ts` | **No change** |
| CSS / component wiring | **No change** (reference-only asset) |

Existing desk art in repo (already wired):

- **Top-level desk:** `light-wood-desk.png`, `blue-molded-tray.png`, `planner-tab-mustard.png`, `green-folders-drawer.svg`
- **Figma hero ref:** `public/assets/desk/figma/desk-hero-37-11052.png`
- **Kelly v3 authority comp:** `public/assets/desk/figma/kelly-desk-v3-comp-2026-08-03.png`
- **Slices (11 PNGs + manifest):** ids match `manifest.json` / `deskSliceManifestData.ts`

## 3. Tests

| Script | Result |
|--------|--------|
| `npm run test:contracts` | **Passed** |

## 4. Still needs Kelly / Figma

| Need | Notes |
|------|--------|
| **New slice PNGs** | Name with hyphens; say which desk piece. Agent updates manifest + TS if placement changes. |
| **Full-desk / hero exports** | → `public/assets/desk/figma/`; Figma file `CfWcuQPY4ljYXondICj2ZX`, nodes `37:11052` / `37:11053`. |
| **Wood / tray / drawer / tab strip** | → `public/assets/desk/` (not slices unless cropped chrome). |
| **Figma node ids for new chrome** | Required for `scripts/export-desk-figma-slices.mjs`. |
| **Pixel gaps** | See `docs/overnight/DESK-PIXEL-REQUIREMENTS.md`. |

## 5. Next step for Kelly

1. Copy exports into `uploads/desk-incoming/`.
2. Edit `README.txt` — list each file and what it replaces or adds.
3. Ask: *Incorporate the desk assets in uploads/desk-incoming.*
