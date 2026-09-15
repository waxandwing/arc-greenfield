# Kelly desk asset incorporation pass

**Date:** 2026-09-15  
**Git:** `94a35d6` (main, up to date with origin)  
**Agent task:** Incorporate files from `uploads/desk-incoming/` per `docs/KELLY-WHERE-TO-PUT-DESK-ASSETS.md`.

## 1. Incoming drop folder inventory

Path: `uploads/desk-incoming/`

| File | Size | Type |
|------|------|------|
| `.gitkeep` | 0 B | placeholder |
| `README.txt` | 688 B | text (Kelly instructions; lists **no files yet**) |

**No PNG, SVG, or other image assets** were present in the drop folder or elsewhere under `uploads/`.

Searched workspace for alternate Kelly drops (recent untracked images, `agent-tools/`, etc.): **nothing new to incorporate** beyond what is already committed under `public/assets/`.

## 2. Actions taken

| Action | Result |
|--------|--------|
| Move/copy from `uploads/desk-incoming/` | **Skipped** — no image files |
| Update `public/assets/desk/slices/manifest.json` | **No change** — no new slices |
| Update `src/navigation/deskSliceManifestData.ts` | **No change** |
| CSS / component wiring | **No change** |

Existing desk art in repo (already wired; reference for Kelly):

- **Top-level desk:** `light-wood-desk.png`, `blue-molded-tray.png`, `planner-tab-mustard.png`, `green-folders-drawer.svg`
- **Figma hero ref:** `public/assets/desk/figma/desk-hero-37-11052.png`
- **Slices (11 PNGs + manifest):** ids match `manifest.json` / `deskSliceManifestData.ts` (drawer chrome, todos folder, planner frame accents, start-class frame, planner edge tabs)

## 3. Tests

| Script | Result |
|--------|--------|
| `npm run test:contracts` | **Passed** |
| `npm run test:desk-slices` | **Passed** (preview on `127.0.0.1:4173`) |
| `npm run test:arc-desk-pass` | **Passed** |

## 4. Still needs Kelly / Figma

When you add files, update `uploads/desk-incoming/README.txt` with one line per file (filename + purpose), then re-run incorporation.

| Need | Notes |
|------|--------|
| **New slice PNGs** | Name with hyphens; say which desk piece (e.g. replace `todos-folder-tab.png`). Agent updates manifest + TS if placement changes. |
| **Full-desk / hero exports** | → `public/assets/desk/figma/`; hero node ref `37:11052`, crop ref `37:11053` (Figma file `CfWcuQPY4ljYXondICj2ZX`). |
| **Wood / tray / drawer / tab strip** | → `public/assets/desk/` (not slices unless cropped chrome). |
| **Figma node ids for new chrome** | Required for scripted re-export via `scripts/export-desk-figma-slices.mjs` and evidence under `docs/overnight/evidence/figma-desk-6-3194/`. |
| **Pixel gaps (unchanged)** | See `docs/overnight/DESK-PIXEL-REQUIREMENTS.md` — viewport scale, week grid typography, Quick Capture sticky, IDEAS drawer LINE tokens. |

## 5. Next step for Kelly

1. Copy exports into `uploads/desk-incoming/`.
2. Edit `README.txt` — list each file and what it replaces or adds.
3. Ask: *Incorporate the desk assets in uploads/desk-incoming.*
