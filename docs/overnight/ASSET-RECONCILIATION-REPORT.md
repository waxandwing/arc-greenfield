# Asset reconciliation audit (no implementation)

**Repo:** waxandwing/arc-greenfield  
**Branch:** `cursor/arc-production-integration`  
**Audit HEAD:** `8f229ec4dae571eb83f09aa52de9508bc43d84be` (Stage 7.2.2 shell visibility lock)  
**Date:** 2026-09-14  
**Mode:** Audit only — no asset copies, renames, CSS changes, or imports.

---

## Executive summary

| Scope | Result |
|-------|--------|
| **Production raster assets in repo** | **18 PNG** under `public/assets/` (+ **3 font** files) |
| **`src/assets/`** | Does not exist |
| **SVG brand assets in `public/`** | None |
| **Kelly local library** `/Users/knyhagen/assets910` | **Not accessible** in cloud VM (path absent) |
| **Canonical Arc mark (in repo)** | `public/assets/arc/arc-mark.png` — no higher-fidelity alternate found in repo |

Palette reference (from `src/styles/tokens.css`): mustard `#E4B33D`, dusty blue `#7C9CAD`, sage `#9AAA89`, pine live `#1F4B3A`, cream field `#FBF8F0` / paper `#F3EBDD`.

Shell direction (from Stage 7 docs): **exterior branded** (green frame + breezeblock pattern); **interior quiet** (cream paper, CSS accents — not repeating trim/scrapbook).

---

## Candidate source library (not available in cloud agent)

**Path checked:** `/Users/knyhagen/assets910`  
**Result:** `No such file or directory` — expected on Cloud Agent (Kelly’s Mac path is not mounted).

**Instructions for Kelly (when continuing on a local machine or after upload):**

1. Confirm the library exists locally: `ls -la /Users/knyhagen/assets910`
2. To enable a future cloud pass, either:
   - Add a read-only export subtree to the repo (e.g. `docs/asset-library/manifest.json` + checksums only), or
   - Upload a zip to shared storage and attach path/URL to the agent run, or
   - Mount/sync via environment snapshot after placing assets under a workspace path (e.g. `/workspace/.local/assets910/` — **not created in this audit**).
3. Re-run reconciliation with the same report template; section **F** should list concrete filenames from `assets910` matched to gaps below (e.g. vector Arc mark, `@2x` marks, unused motifs).

**Section A (assets910 total):** **N/A** — count and inventory unknown without filesystem access.

---

## Stop-condition report

### A. Total assets in assets910

**N/A** (library not mounted in cloud VM).

### B. Grouped inventory (repo — sections A–H)

**Source of truth:** `public/assets/` (mirrored in `dist/assets/` at build time).  
**Dimensions:** Pillow 11.x on audit VM. **Transparency:** PNG RGBA; `%` = fully transparent pixels.

#### A — Logos / marks

| File | Path | Size (px) | Type | Transparency | References / use | Palette fit | Shell fit | Notes |
|------|------|-----------|------|--------------|----------------|-------------|-----------|-------|
| `arc-mark.png` | `public/assets/arc/` | 70×59 | PNG RGBA | ~32% transparent | `AppFrame.tsx` (`.arc-wordmark`), inverted in `arc-plan-shell.css` / `shell-emphasis.css`; demo media in `arcTableTools.contract.ts`, smoke tests | Quad: blue, terracotta, mustard, sage — matches brand accents | **Exterior/header** — canonical Plan home control | Small but adequate for 36×36 CSS display; no SVG in repo |
| `header-compact.png` | `public/assets/arctable/` | 299×103 | PNG RGBA | ~62% | `ArcTableSurfaces.tsx` teacher header | Pine + cream wordmark “TABLE” + quadrant mark | **ArcTable live only** — not Plan shell | Different mark system than `arc-mark` (arc logo vs “TABLE” lockup) |
| `header-compact-dark.png` | `public/assets/arctable/` | 299×103 | PNG RGBA | ~62% | `ArcTableSurfaces.tsx` student/dark header | Cream type on transparent | ArcTable student header | Pair with light header variant |

#### B — Patterns

| File | Path | Size (px) | Type | Transparency | References / use | Palette fit | Shell fit | Notes |
|------|------|-----------|------|--------------|----------------|-------------|-----------|-------|
| `breezeblock-tile.png` | `public/assets/arctable/` | 1024×1024 | PNG RGBA | Opaque tile | `--shell-pattern` in `tokens.css`; `b01-furniture.css`, `shell-emphasis.css`, `shell-visibility-lock.css`, `arc-plan-shell.css` | Dusty blue, terracotta, mustard, pine, cream center | **Exterior branded** — frame only | Tileable; sized via `--shell-pattern-size` (440px / 300px mobile) |
| `paper-cream.png` | `public/assets/arctable/` | 2048×2048 | PNG RGBA | Opaque | `--plan-surface-paper`, `arctable.css`, `planningDay.css`, `onboarding.css` | Cream/kraft paper (~244,236,221) | **Interior quiet** | **Exact duplicate** of `arc/planner-paper.png` (MD5 `4bec8e8c…`) |

#### C — Course motifs

| Asset | Notes |
|-------|--------|
| *(no dedicated course PNG/SVG files)* | Course identity is **CSS tokens** (`--course-apah-accent` mustard, `--course-2d-accent` dusty blue, `--course-3d-accent` sage) in `tokens.css`, `planningDay.css`, `planningMonth.css`, `shell-emphasis.css`, etc. |
| `breezeblock-tile.png` | Shared **quad-color DNA** with mark (blue / terracotta / mustard / green) — motif is pattern-level, not per-course files. |

#### D — Bloops

| Asset | Notes |
|-------|--------|
| *(none on disk)* | Organic shapes use CSS `--radius-bloop` (`tokens.css`) on planning surfaces (e.g. `planningDay.css`) — **not raster bloop assets** in repo. |

#### E — Textures

| File | Path | Size (px) | Type | Transparency | References / use | Palette fit | Shell fit | Notes |
|------|------|-----------|------|--------------|----------------|-------------|-----------|-------|
| `paper-cream.png` | `public/assets/arctable/` | 2048×2048 | PNG | Opaque | See B | Cream | Interior | Canonical path in CSS |
| `planner-paper.png` | `public/assets/arc/` | 2048×2048 | PNG | Opaque | **Unreferenced** in `src/` | Same as paper-cream | Would be interior | **Duplicate file** — prefer single canonical path |
| `note-paper.png` | `public/assets/arc/` | 794×494 | PNG RGBA | Yes | **Unreferenced** | Cream note stock | Interior candidate | Orphan; smaller sheet texture |
| `green.png` | `public/assets/arctable/` | 2048×2048 | PNG | Opaque | **Unreferenced** | Pine `#1F4B3A` field | Would read as **dark exterior** | Superseded by CSS `--shell-frame-green` for Plan shell |
| `board-panel.png` | `public/assets/arctable/` | 1208×868 | PNG RGBA | Yes | `arctable.css` (board chrome) | Cream deckled panel | ArcTable board only | Paper edge texture — keep out of Plan planner interior |
| `people-surface-open.png` | `public/assets/arctable/` | 892×1272 | PNG RGBA | Yes | `--plan-surface-people`, `arctable.css`, `planningDay.css` (P5 people strip) | Sage green wash | Accent on **people/time** band | Right-aligned decorative fill |

#### F — Icons / instrument UI chrome

| File | Path | Size (px) | References / use | Shell fit |
|------|------|-----------|------------------|-----------|
| `timer-ring.png` | `public/assets/arctable/` | 780×780 | Timer display (`arctable.css`) | ArcTable tools |
| `timer-ring-cleanup.png` | `public/assets/arctable/` | 780×780 | Cleanup timer state | ArcTable |
| `timer-well.png` | `public/assets/arctable/` | 528×528 | Timer well (`arctable.css`) | ArcTable |
| `pass-plate-available.png` | `public/assets/arctable/` | 724×504 | Pass tool idle | ArcTable |
| `pass-plate-active.png` | `public/assets/arctable/` | 724×504 | Pass tool active | ArcTable |
| `cleanup-corner-accent.png` | `public/assets/arctable/` | 800×800 | Active cleanup control corner | ArcTable — busy corner; not Plan |

#### G — Borders / frames / rails

| File | Path | Size (px) | References / use | Shell fit |
|------|------|-----------|------------------|-----------|
| `progress-rail.png` | `public/assets/arctable/` | 1648×128 | Lesson progress rail (`arctable.css`) | ArcTable |
| `media-apparatus-frame.png` | `public/assets/arctable/` | 724×484 | Projected media chrome | ArcTable live |
| `cleanup-corner-accent.png` | also listed in F | | | |
| Pass plates | also listed in F | | | |

#### H — Other

| Item | Notes |
|------|--------|
| **Fonts** (non-raster) | `InstrumentSerif-Regular.ttf`, `LeagueSpartan-VF.woff2`, `Inter-Variable.woff2` — `arc-fonts.css` |
| **`docs/overnight/evidence/**`, `artifacts/**`** | Screenshot PNGs for QA — **not production shell assets** |
| **CSS-only shell** | Frame color, shadows, gradients — no image for pine frame fill |

---

### C. Top recommended assets for shell (from repo audit only)

Priority for **Arc Plan shell / planning** (already wired or best fit):

1. **`breezeblock-tile.png`** — exterior frame pattern (`--shell-pattern`); keep outside `arc-planner-object` / cream inset.
2. **`paper-cream.png`** — interior paper repeat (`--plan-surface-paper`, planning day headers, onboarding bands).
3. **`arc-mark.png`** — header wordmark / home control (with CSS invert on green header).
4. **`people-surface-open.png`** — restrained sage accent for people/time planning band (`--plan-surface-people`).
5. **CSS tokens** — mustard / dusty blue / sage bands (no extra PNGs required for course lanes).

ArcTable-specific (live classroom — not Plan interior):

- `header-compact*.png`, timer/pass/media/board assets — retain for ArcTable surfaces only.

---

### D. Likely duplicates

| Relationship | Files | Action (future, not this pass) |
|--------------|-------|--------------------------------|
| **Byte-identical** | `public/assets/arc/planner-paper.png` ≡ `public/assets/arctable/paper-cream.png` | Single canonical path; remove or symlink duplicate |
| **Conceptual** | Quadrant mark in `breezeblock-tile.png` vs letterform `arc-mark.png` | Both valid — different contexts (pattern vs mark) |
| **Build mirror** | `dist/assets/**` duplicates `public/assets/**` | Expected Vite output — do not treat as second source |

---

### E. Recommended canonical logo source (in repo only)

| Role | Canonical file | Rationale |
|------|----------------|-----------|
| **Arc Plan / app shell mark** | `public/assets/arc/arc-mark.png` | Only dedicated Arc mark in repo; explicitly used by `AppFrame` and documented in Stage 7.2 reports |
| **ArcTable header lockup** | `public/assets/arctable/header-compact.png` (+ `-dark`) | Full “TABLE” wordmark; must not replace Plan `arc-mark` in global header |

**Quality:** `arc-mark.png` at 70×59 px is sufficient for current 36 px rendered size (~2×). No larger or vector Arc mark exists in repo. **`header-compact` mark is not a drop-in replacement** (different artwork: quadrant arcs + “TABLE” type).

**Recommendation:** Keep **`arc-mark.png` as canonical** until `assets910` (or design export) provides a verified higher-resolution or SVG mark; then reconcile without changing authority in this pass.

---

### F. Proposed files to copy (list only — do not copy)

**From `assets910`:** **TBD / empty** — library unavailable.

**Suggested targets once Kelly provides inventory** (hypothesis categories only — **no filenames invented**):

- Vector or @2x **`arc-mark`** → `public/assets/arc/`
- Any **shell/exterior patterns** not duplicating `breezeblock-tile.png`
- **Interior paper** only if measurably different from `paper-cream.png` (avoid third cream duplicate)
- **Course-specific motifs** if design system expects raster blobs (currently CSS-only)

---

### G. Proposed placements (proposal only — no CSS edits)

| Asset | Target | Mechanism |
|-------|--------|-----------|
| `breezeblock-tile.png` | `.b01-furniture-composition`, `.arc-shell` exterior | Existing `--shell-pattern` / `background-image` stacks |
| `paper-cream.png` | Plan state headers, onboarding hero, ArcTable page fill | `--plan-surface-paper`, `.arctable` background |
| `arc-mark.png` | `.arc-header .arc-wordmark img` | `<img src="/assets/arc/arc-mark.png">` + invert filter |
| `people-surface-open.png` | P5 / people context strip | `--plan-surface-people` in `planningDay.css` |
| Future `assets910` mark | Same slot as `arc-mark.png` | Swap `src` only after visual parity review |
| ArcTable bundle | `ArcTableSurfaces`, `arctable.css` | Keep isolated from Plan planner object |

---

## Logo authority — detailed comparison

| Candidate | Dimensions | In repo | Used for Plan header | vs `arc-mark.png` |
|-----------|------------|---------|----------------------|-------------------|
| `arc/arc-mark.png` | 70×59 | Yes | **Yes** | **Authority** |
| `arctable/header-compact.png` | 299×103 | Yes | No (ArcTable) | Different artwork + “TABLE” logotype |
| `arctable/header-compact-dark.png` | 299×103 | Yes | No | Cream variant for dark bar |
| `breezeblock-tile.png` | 1024×1024 | Yes | Pattern only | Motif cousin, not logo |
| SVG | — | **None in public** | — | — |

---

## CSS / component reference map (shell + planning)

| Reference | Location |
|-----------|----------|
| `--shell-pattern` | `src/styles/tokens.css` → `breezeblock-tile.png` |
| `--plan-surface-paper` / `--plan-surface-people` | `tokens.css` → `planningDay.css`, `onboarding.css` |
| Shell pattern consumption | `shell-visibility-lock.css`, `shell-emphasis.css`, `b01-furniture.css`, `arc-plan-shell.css` |
| Wordmark | `src/components/AppFrame.tsx`, `global.css`, `arc-plan-shell.css` |
| ArcTable assets | `src/styles/arctable.css`, `src/components/ArcTableSurfaces.tsx` |

No `url('/assets/...')` references found outside the paths above and font files.

---

## Rejection criteria (per brief — repo assets to avoid or keep scoped)

Aligns with `docs/overnight/evidence/final-skin/VISUAL-SYSTEM.md` (*Explicitly not in Plan skin*):

| Asset / pattern | Verdict | Reason |
|-----------------|---------|--------|
| `green.png` (2048 pine plate) | **Do not adopt for Plan** | Unreferenced; duplicates CSS frame green; pushes **dark-green-dominant Plan** (rejected direction) |
| `planner-paper.png` duplicate | **Do not add new uses** | Redundant with `paper-cream.png`; risks drift |
| `note-paper.png` | **Defer** | Unreferenced orphan; only import with explicit UI target |
| ArcTable chrome (`board-panel`, pass plates, timer rings, `cleanup-corner-accent`, `media-apparatus-frame`) | **Not for Plan interior** | Live-class / scrapbook-adjacent instrument UI; fine inside ArcTable route |
| `header-compact*.png` | **Not for global Plan header** | Wrong brand lockup (ArcTable) |
| Evidence / artifact PNGs under `docs/`, `artifacts/` | **Not UI assets** | QA captures only |
| Repeating scallop / journal / Fridge chrome | **N/A in repo** | Not present as assets (good) |

**Bloops:** keep **CSS-only** (`--radius-bloop`); do not add repeating raster trim or scrapbook borders to Plan shell.

---

## Unreferenced production PNGs (cleanup candidates for future pass)

1. `public/assets/arc/planner-paper.png` (duplicate)  
2. `public/assets/arc/note-paper.png`  
3. `public/assets/arctable/green.png`  

---

## Method notes

- Inventory: `find` + ripgrep across `src/` for `/assets/`  
- Dimensions: Python Pillow (`Image.open`)  
- Duplicate detection: MD5 of file bytes  
- ImageMagick `identify`: not installed; Pillow used instead  
- **No files were modified** except this report.

---

## Audit completion checklist

- [x] Repo asset inventory (public/assets + CSS references)  
- [x] assets910 access attempted  
- [x] Logo authority vs `arc-mark.png`  
- [x] Stop-condition sections A–G  
- [x] Rejection criteria  
- [ ] assets910 filename-level reconciliation — blocked on library access  
