# Kelly desk asset incorporation pass

**Date:** 2026-09-15 (corrected)  
**Git:** main  
**Agent task:** Incorporate files from `uploads/desk-incoming/` per `docs/KELLY-WHERE-TO-PUT-DESK-ASSETS.md`.

## Correction — desk v3 preview repair (current display, not target)

Kelly uploaded **desk v3 preview-repair-2026-08-03** and confirmed it is the **current broken app display**, not the visual north star.

| Source | Destination |
|--------|-------------|
| Kelly upload | `uploads/desk-incoming/kelly-desk-v3-preview-repair-2026-08-03.png` |
| Evidence baseline (not Figma hero) | `docs/overnight/evidence/kelly-current-display-2026-08-03.png` |

**Do not** place this PNG under `public/assets/desk/figma/` as authority. Teaching week remains the comp — see `docs/overnight/KELLY-CURRENT-VS-TARGET.md`.

### What the screenshot shows (for baseline notes)

- Month view with **AUGUST** (not product default Teaching week).
- Useful to see furniture drift vs target; **not** pixel-truth for agents.

### Wiring (post-correction)

| Item | Change |
|------|--------|
| `uploads/desk-incoming/README.txt` | Lists incoming file as **current display** baseline |
| `scripts/desk-pixel-pass.mjs` | Default `DESK_KELLY_REF` → Teaching week Kelly comp (pre-`c29f613` path) |
| `docs/overnight/MASTER-DESK-VISUAL-GOAL.md` | Teaching week north star; v3 PNG cited as current-state evidence only |

## 1. Incoming drop folder inventory

Path: `uploads/desk-incoming/`

| File | Purpose |
|------|---------|
| `kelly-desk-v3-preview-repair-2026-08-03.png` | Kelly upload — **current display** snapshot |
| `README.txt` | Kelly instructions + file list |
| `.gitkeep` | placeholder |

## 2. Actions taken (cumulative)

| Action | Result |
|--------|--------|
| Store v3 screenshot in evidence | **Done** — `docs/overnight/evidence/kelly-current-display-2026-08-03.png` |
| Remove from `public/assets/desk/figma/` hero authority | **Done** |
| Update `public/assets/desk/slices/manifest.json` | **No change** — no new slices |
| Update `src/navigation/deskSliceManifestData.ts` | **No change** |
| CSS / component wiring | **No change** (reference-only asset) |

Existing desk art in repo (already wired):

- **Top-level desk:** `light-wood-desk.png`, `blue-molded-tray.png`, `planner-tab-mustard.png`, `green-folders-drawer.svg`
- **Figma hero ref:** `public/assets/desk/figma/desk-hero-37-11052.png`
- **Slices (11 PNGs + manifest):** ids match `manifest.json` / `deskSliceManifestData.ts`

## 3. Tests

| Script | Result |
|--------|--------|
| `npm run test:contracts` | Run after doc/asset moves |
| `npm run test:desk-pixel-pass` | Optional; requires preview server + Teaching week ref path |

## 4. Still needs Kelly / Figma

| Need | Notes |
|------|--------|
| **New slice PNGs** | Name with hyphens; say which desk piece. Agent updates manifest + TS if placement changes. |
| **Full-desk / hero exports** | Teaching week or Figma `37:11052` → `public/assets/desk/figma/`; not current-display screenshots. |
| **Wood / tray / drawer / tab strip** | → `public/assets/desk/` (not slices unless cropped chrome). |
| **Figma node ids for new chrome** | Required for `scripts/export-desk-figma-slices.mjs`. |
| **Pixel gaps** | See `docs/overnight/DESK-PIXEL-REQUIREMENTS.md`. |

## 5. Next step for Kelly

1. Copy **target** exports into `uploads/desk-incoming/` (Teaching week comp slices, not app screenshots).
2. Edit `README.txt` — list each file and what it replaces or adds.
3. Ask: *Incorporate the desk assets in uploads/desk-incoming.*
