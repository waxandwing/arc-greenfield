# Asset reconciliation audit (no implementation)

**Repo:** waxandwing/arc-greenfield  
**Branch:** `cursor/arc-production-integration`  
**Audit HEAD (repo-only pass):** `4f6610d`  
**Supplement:** Kelly reference samples **19 PNGs** (3 chat batches) + ingest scaffold `f3ed6e8` + reports `0ef13dc`, `8b4443b`  
**Date:** 2026-09-14  
**Mode:** Audit-first — no copies into `public/assets/` until shortlist approval. **Exception:** central planner spread CSS aligned to Kelly journal reference (center gutter removed, `c098ede+`).

---

## Executive summary

| Scope | Result |
|-------|--------|
| **Production raster assets in repo** | **18 PNG** under `public/assets/` (+ **3 font** files) |
| **`src/assets/`** | Does not exist |
| **SVG brand assets in `public/`** | None |
| **Kelly local library** `/Users/knyhagen/assets910` | Not mounted on Mac path in cloud VM |
| **Cloud ingest path (option 3)** | `/workspace/.local/assets910/` — **scaffold only**; library not present yet (see **Phase 2 ingest**) |
| **Icarus public assets repo** | [waxandwing/icarus](https://github.com/waxandwing/icarus) — **14 source PNGs** inventoried; see **`ICARUS-ASSET-INVENTORY-CROSSWALK.md`** (cloneable; not copied to `public/assets/` yet) |
| **Canonical Arc mark (in repo)** | `public/assets/arc/arc-mark.png` — board `ARC-LOGO-*` / `ARC-001A` family |

---

## Brand typography (identified)

| Layer | Governing doc (icarus `04_CANONICAL_BRAND_SYSTEM`) | **arc-greenfield production** (`arc-fonts.css`, `tokens.css`) | Logo boards (visual) |
|-------|-----------------------------------------------------|----------------------------------------------------------------|----------------------|
| Primary UI sans | Nunito Sans or Avenir Next Rounded | **Inter** (+ League Spartan labels) | **TABLE** lockups: bold, tracked **all-caps sans** (not named by font file on board) |
| Editorial / display | Georgia, Source Serif 4, Newsreader | **Instrument Serif** (+ same serif fallbacks) | Large onboarding/view titles in product match Instrument Serif direction |
| Plan wordmark | — | **`arc-mark.png` only** (no `@font-face` for “arc” letters) | Chunky geometric **lowercase a/r/c** + red quadrant — **outlined artwork**, not CSS text |
| ArcTable wordmark | — | **`header-compact*.png`** | Image type; separate from square **`AT-LOGO-*`** icons |

**Files shipped:** `InstrumentSerif-Regular.ttf`, `Inter-Variable.woff2`, `LeagueSpartan-VF.woff2` under `public/assets/`.

**Reconciliation:** Drive/governing sans (**Nunito/Avenir**) vs repo (**Inter/League Spartan**) needs founder pick. Logo boards do not substitute font files — they show **TABLE** and **arc** as **designed lockups**.

--- (from `src/styles/tokens.css`): mustard `#E4B33D`, dusty blue `#7C9CAD`, sage `#9AAA89`, pine live `#1F4B3A`, cream field `#FBF8F0` / paper `#F3EBDD`.

**Approved visual target (Kelly, 2026-09-14):** dark green **planner frame** only; **light cream exterior** with **large, faded, desaturated** direct Arc pattern (not dark-green-dominant shell). Interior quiet; exterior branded. Stage 7.2.2 exterior reads too dark/heavy — future import should favor light-field pattern sources below, not `green.png` or full-strength breezeblock wash alone.

**Swappable assets:** Kelly is continuing to attach **alternate candidates** for the same slots (exterior pattern, course motifs, textures). Log each batch in this report as **KEEP / POSSIBLE / REJECT**; only the production shortlist imports after explicit approval.

---

## Central planner “journal” spread (Kelly approval)

| Audit ID | Evidence | Notes |
|----------|----------|--------|
| **REF-PLANNER-JOURNAL** | `reference-samples/planner-journal-spread-reference.png` (chat `da113491…`) | **Approved target** for `arc-planner-object` / `arc-calendar-spread`: thick pine frame, continuous cream paper, header + canvas inside spread |

Kelly (2026-09-14): reference is **excellent and correct** provided the UI **does not** show a **central gutter / spine line** (no book crease). Implementation: removed `.arc-calendar-spread::before` / `::after` gutter stack in `shell-visibility-lock.css`. Frame + `--plan-surface-paper` repeat remain.

This is **not** legacy “journal spine” product chrome (still rejected per Plan law) — it is the **single cream planner field** inside the green frame.

---

## Candidate source library — Phase 2 ingest

### Where the library is *not*

| Location | Result (2026-09-14 cloud search) |
|----------|-----------------------------------|
| `/Users/knyhagen/assets910` | Not mounted (Mac-only path) |
| `/workspace/uploads/` | Absent |
| `*.zip` under `/workspace`, `/opt/cursor`, `/cursor` | No `ARC ASSETS 910` / `assets910` archive |
| Chat attachments | `/home/ubuntu/.cursor/projects/workspace/assets/` — **reference PNGs only** (e.g. planner spread refs), not the 317-file library |
| Git `origin` | No committed assets910 tree; multiprep **function audit** (`ARC_MULTIPREP_ARCTABLE_REPORT.md`) described an archive that lived on a **prior ephemeral VM**, not in repo |

### Approved ingest — **option 3 (environment snapshot)**

Kelly selected **option 3**: populate **`/workspace/.local/assets910/`**, then save a Cloud Agent **environment snapshot** so later runs inherit the library without re-attaching the zip.

- Scaffold: `.local/assets910/README.md` (tracked); binaries **gitignored**
- After snapshot: agent verifies with `find .local/assets910 -type f ! -name README.md | wc -l` and looks for archive markers (`AUDIT_STATUS.txt`, `PLACEMENT.md`, `GOLD-AUDIT.md` if shipped in zip)

**Alternatives (still valid):** (1) attach zip to agent message + extract to `.local/assets910/` in-session; (2) commit checksum manifest only under `docs/asset-library/` — no binaries in git.

**Section A (assets910 total):** **19 reference samples audited** (chat attachments); **full library still N/A** until `.local/assets910/` populated. Prior multiprep audit cited ~317 production rasters + manifests in archive — filenames not verified on this VM.

---

## Kelly reference sample pack (partial assets910 proxy)

Kelly attached five approved-family samples (saved under Cursor chat assets, copied for audit to `docs/overnight/evidence/asset-reconciliation/reference-samples/`). **None are byte-identical to any file in `public/assets/`** (MD5 mismatch on all 18 repo PNGs).

| Audit ID | Evidence copy | Size | α | Visual role | vs repo | Rec |
|----------|---------------|------|---|-------------|---------|-----|
| **REF-PATTERN-GRID** | `pattern-grid-dots-semicircles-2048.png` | 2048×2048 | opaque | Cream field + **tileable grid** of circles / up-down semicircles in pine, terracotta, dusty blue, mustard; grainy print texture | **Not** `breezeblock-tile.png` (1024 corner-quadrant breezeblock — same palette, **different geometry**) | **KEEP** — primary **exterior** pattern candidate |
| **REF-MARK-COMP** | `mark-composition-quadrants-1400.png` | 1400×1400 | opaque | Static **mark board**: red dome, yellow vertical semicircle, blue quadrant on cream — same DNA as `arc-mark.png` letters+quadrant | Related to **`arc-mark.png`** (70×59) but **not** a drop-in file | **POSSIBLE** — design reference / @2x export target; **do not replace** mark until exact approved export identified in assets910 |
| **REF-TEXTURE-MUSTARD** | `texture-mustard-field-2048.png` | 2048×2048 | opaque | Monochrome **mustard/kraft** paper grain | Distinct from **`paper-cream.png`** (neutral cream 2048) | **POSSIBLE** — AP course band wash or accent fill, not global planner paper |
| **REF-MOTIF-RING** | `motif-terracotta-ring-562.png` | 562×562 | ~88% transparent | Terracotta **stroke ring** on transparent | No repo match | **POSSIBLE** — **3D Art 1** dot/circle signature (recolor to sage in CSS overlay, not redraw) |
| **REF-MOTIF-WEDGE** | `motif-green-wedge-256.png` | 256×256 | ~78% transparent | Pine **120° wedge** / fan on transparent | No repo match | **KEEP** — **AP Art History** arch / sector motif (mustard placement via tint) |

**Chat asset UUIDs (batch 1):** `0ffe9532…`, `00a60a93…`, `e445eb68…`, `591a06d1…`, `72cd61c6…`.

### Batch 2 — breezeblock variants, primitives, rejects

| Audit ID | Evidence copy | Size | Visual role | vs repo | Rec |
|----------|---------------|------|-------------|---------|-----|
| **REF-BREEZE-FRAMED** | `breezeblock-framed-green-border-1000.png` | 1000×1000 | **ArcTable logo icon** (quadrant breezeblock + pine frame) — Kelly 2026-09-14 | Same file as **arctable-logo-icon-01** (MD5 `c709168d…` / batch 2 `c11a239…` export) | **KEEP ArcTable only** — **not** Plan shell / exterior |
| **REF-BREEZE-INVERT** | `breezeblock-inverted-green-dominant-1000.png` | 1000×1000 | **ArcTable logo icon** (inverted green star) | Same as **arctable-logo-icon-02** | **KEEP ArcTable only** — **REJECT** Plan exterior |
| **REF-MOTIF-MUSTARD-DOT** | `motif-mustard-fill-circle-392.png` | 392×392 | Textured **mustard fill disc** on transparent/black | No repo match | **POSSIBLE** — AP **dot** signature alt. to wedge |
| **REF-MOTIF-BLUE-DOT** | `motif-dusty-blue-fill-circle-496.png` | 496×496 | Textured **dusty blue fill disc** | No repo match | **KEEP** — preferred **2D Art 1** small signature (filled circle) |
| **REF-PATTERN-FINE-GRID** | `pattern-fine-line-grid-2048.png` | 2048×2048 | Neutral cream + **thin line graph grid** | No repo match | **REJECT** — not approved Arc dot/semicircle family; too technical for exterior |
| **REF-PRIMITIVE-QUAD** | `primitive-green-quadrant-cream-2048.png` | 2048×2048 | Single **pine quadrant** on cream paper texture | Component of breezeblock / mark | **POSSIBLE** — crop source for 2D quadrant if dot not used |
| **REF-PATTERN-STRIPES** | `pattern-vertical-green-cream-stripes-2048.png` | 2048×2048 | **Vertical awning stripes** pine + cream | No repo match | **REJECT** — off-brand for approved exterior (use dot grid instead) |

**Chat asset UUIDs (batch 2):** `633399ad…`, `fc6572fc…`, `645fdf9e…`, `64ffb77d…`, `2b3f2cdd…`, `a53c0bdf…`, `8556cdbf…`.

**Breezeblock lineage:** Repo **`breezeblock-tile.png`** (1024 tile, no frame) remains the **Plan second-choice exterior** when faded on cream. **Framed / inverted 1000² icons** are **ArcTable logo variants**, not Plan field tiles. **REF-PATTERN-GRID** stays **first choice** for Plan light exterior.

### ArcTable logo icon family (Kelly clarification, 2026-09-14)

Kelly confirmed the **six 1000×1000 quadrant / breezeblock frame variants** (chat batch + batch 2 duplicates) are **ArcTable logo icons**, not Plan planner chrome or shell patterns.

| Evidence | MD5 prefix | Role |
|----------|------------|------|
| `arctable-logo-icons/arctable-logo-icon-01-1000.png` | `c709168d…` | Color quadrant breezeblock + green frame (logo tile) |
| `arctable-logo-icon-02-1000.png` | `3b4fb4de…` | Inverted green-dominant variant |
| `arctable-logo-icon-03-1000.png` | `6f3e4666…` | Green-frame / cream-quadrant variant |
| `arctable-logo-icon-04-1000.png` | `c709168d…` | **Duplicate of icon-01** |
| `arctable-logo-icon-05-1000.png` | `b8f69ec8…` | Green star / cream corners variant |
| `arctable-logo-icon-06-1000.png` | `9c87102a…` | Thick green frame + color quadrants |

**Production today:** ArcTable teacher/student headers use **`header-compact.png`** / **`header-compact-dark.png`** (“TABLE” lockup), not these square icons.

**Proposal (no import yet):** Pick **one** icon variant for ArcTable mark/splash experiments under `public/assets/arctable/logo-icon-*.png`; **do not** wire to Plan `AppFrame` wordmark (`arc-mark.png`) or `--shell-pattern`.

### Logo & asset board extracts (Kelly chat)

Full contact sheets archived (not individual tile exports):

| Evidence | Size | Contents |
|----------|------|----------|
| `board-extracts/arc-arctable-logos-board-extract.png` | 1060×1084 | **~53 tiles** — `ARC-LOGO-*` arc lettermark; `AT-D04` / `AT-D06` TABLE lockups; **`AT-LOGO-*` square arch + “TABLE / AN ARC CLASSROOM SPACE”** |
| `board-extracts/arc-asset-grid-124-tiles-board-extract.png` | 1388×3148 | **~124 tiles** — numbered library (`ARC-001A` … `AT-SURF-*`), magnets, planner shell, surfaces, `AT-GEO-*` primitives |

**Logo authority map (from boards + repo):**

| Use | Board IDs | Repo today | Notes |
|-----|-----------|------------|-------|
| Plan header mark | `ARC-LOGO-*`, `ARC-001A` mark | `arc-mark.png` | Colored **a / r / c + red quadrant** — raster, not a text font |
| ArcTable header | `AT-D04`, `AT-D06`, `AT-LOGO-*` + subtitle | `header-compact*.png` | **TABLE** = bold wide **caps sans**; subtitle “AN ARC CLASSROOM SPACE” |
| ArcTable app/icon | `AT-LOGO-04/05`, chat **arctable-logo-icon-*** | *(none wired)* | Square **quadrant arch** matches Kelly’s ArcTable logo icon set |
| Legacy TABLE-as-furniture | `AT-D06` (T shaped like table) | — | **REJECT** for current lockup unless explicitly revived |

**Magnet reuse (from 124-tile board):** `ARC-010A–E` / `ARC-010` / `AT-08-*` **unit-magnet** discs (blue, red, mustard, sage, lavender) → candidate **course signature** rasters instead of Fridge chrome; map AP/2D/3D to mustard/blue/sage discs + existing wedge/dot shortlist.

**Fridge-named tiles on board (`ARC-006/007/015/017`, `ARC-019B`, etc.):** **Do not import** to Plan; Workspace stays CSS + live UI (Kelly: remove Fridge product language).

**Planner shell:** `ARC-003_calendar-shell` on board = journal spread **with center gutter**; approved direction is **same chrome without gutter** (see REF-PLANNER-JOURNAL + CSS).

### Batch 3 — arcs, bloops, ArcTable duplicates

| Audit ID | Evidence copy | Size | Visual role | vs repo | Rec |
|----------|---------------|------|-------------|---------|-----|
| **REF-MOTIF-CREAM-RING** | `motif-cream-disc-green-stroke-792.png` | 792×792 | Cream **disc** + pine stroke ring | No match | **POSSIBLE** — quiet **3D** signature (sage tint) alt. to terracotta stroke ring |
| **REF-ARCTABLE-TIMER** | `arctable-timer-ring-green-780-DUP.png` | 780×780 | Green **C-arc** timer ring | **Byte-identical** to `public/assets/arctable/timer-ring.png` | **KEEP** — ArcTable only; **not** Plan shell / course motif |
| **REF-ARCTABLE-TIMER-CLEANUP** | `arctable-timer-ring-cleanup-780-DUP.png` | 780×780 | Terracotta/mustard **concentric C** | **Byte-identical** to `timer-ring-cleanup.png` | **KEEP** — ArcTable only |
| **REF-BLOOP-TERRA** | `bloop-terracotta-trapezoid-712x292.png` | 712×292 | Textured **trapezoid cap** (terracotta) | No match | **REJECT** Plan — illustrative bloop; keep **CSS `--radius-bloop`** |
| **REF-BLOOP-BLUE** | `bloop-dusty-blue-trapezoid-632x252.png` | 632×252 | Blue trapezoid pair | No match | **REJECT** Plan (same) |
| **REF-QUAD-SCATTER** | `mark-four-quadrants-scatter-1920x1080.png` | 1920×1080 | Four **corner quadrants** on black (palette board) | Palette cousin of breezeblock | **POSSIBLE** — brand reference only; not a tile |
| **REF-SEMI-GREEN** | `motif-green-semicircle-vertical-1400.png` | 1400×1400 | Large pine **semicircle** (flat edge left) | No match | **POSSIBLE** — **2D arc** motif alt. to blue dot |

**Chat asset UUIDs (batch 3):** `5f4b5e57…`, `c9e1f9fe…`, `758fb230…`, `c11a27bc…`, `f6b5964f…`, `d7a4d73c…`, `7825ae40…`.

**Duplicate note:** Batch 3 confirms assets910 (or Kelly exports) **shares ArcTable timer rings already in repo** — do not re-import under new Plan paths.

---

## Approved pattern family (priority §3)

| Family member | Identified in this pass | Source |
|---------------|-------------------------|--------|
| Large multicolor dots + semicircles grid | **Yes** — REF-PATTERN-GRID | Kelly sample; **assets910 original filename TBD** |
| Small dots | Subsumed in grid cells (full circles) | Same tile |
| Grid | **Yes** — explicit column rhythm (semicircle / circle / semicircle) | REF-PATTERN-GRID |
| Concentric / arc forms | Corner **breezeblock** in repo (`breezeblock-tile.png`) + semicircles in grid | Two related assets, same palette |
| Semicircle pattern | **Yes** — dominant in grid + mark composition | REF-PATTERN-GRID, REF-MARK-COMP |
| Large geometric block composition | **Yes** — REF-MARK-COMP (non-tile hero) | Mark board only |

**Exterior treatment (approved direction):** cream/light page field (`--shell-field-cream` / `paper-cream` tone) + **REF-PATTERN-GRID** as full-page repeat at **low opacity + reduced saturation** (CSS filters at implementation time — **use real tile**, do not redraw in CSS). **Do not** use `public/assets/arctable/green.png` as exterior fill. Retire heavy dark wash on `breezeblock-tile.png` as primary exterior when this pattern imports.

**Second-choice exterior:** existing **`breezeblock-tile.png`** at **much lower scale/opacity** on cream — already in repo; palette-aligned but geometry differs from approved grid.

---

## Course motif selection (§4)

| Course | Color | Recommended motif | Source | Notes |
|--------|-------|-------------------|--------|-------|
| **AP Art History** | Mustard `#E4B33D` | Green **wedge / sector** | REF-MOTIF-WEDGE → future `motif-apah-wedge.png` | Small signature; optional mustard field from REF-TEXTURE-MUSTARD for band only |
| **2D Art 1** | Dusty blue `#7C9CAD` | **Filled blue disc** (preferred) or blue quadrant crop | **REF-MOTIF-BLUE-DOT** or REF-MARK-COMP / REF-PRIMITIVE-QUAD | Filled circle matches “dot” language for 3D/2D parity at small size |
| **3D Art 1** | Sage `#9AAA89` | **Ring / circle** | REF-MOTIF-RING → future `motif-3d-ring.png` | Recolor/tint to sage at use time; keep thin stroke |

Single pattern file can supply multiple crops if assets910 confirms one master artboard.

---

## Production shortlist (§6) — max items

| Slot | Recommendation | Status |
|------|----------------|--------|
| Arc mark | **`public/assets/arc/arc-mark.png`** (canonical until assets910 exact export) | In repo |
| Exterior pattern **1st** | REF-PATTERN-GRID (import as e.g. `arc-pattern-grid-tile.png`) | **Import candidate** |
| Exterior pattern **2nd** | `breezeblock-tile.png` (existing, subdued) | In repo |
| AP motif | REF-MOTIF-WEDGE | **Import candidate** |
| 2D motif | Crop from REF-MARK-COMP or pattern grid | **Import candidate** |
| 3D motif | REF-MOTIF-RING | **Import candidate** |
| Texture | **`paper-cream.png`** interior; REF-TEXTURE-MUSTARD optional AP-only | Repo + optional import |

**Secondary candidates:** REF-MARK-COMP full board (marketing only); `people-surface-open.png`; ArcTable instrument PNGs (unchanged scope).

---

## Proposed production mapping (§7) — no implementation

| Use | Source (shortlist) | Destination (proposed) | Mechanism |
|-----|-------------------|------------------------|-----------|
| Light exterior field | CSS cream tokens + optional `paper-cream` at very low contrast | — | Background base |
| Faded Arc pattern | REF-PATTERN-GRID | `public/assets/arc/pattern-grid-tile.png` | `--shell-pattern` repeat; opacity ~0.12–0.22; saturate(0.5–0.7) — tune with reference |
| Fallback pattern | `breezeblock-tile.png` | keep path | Secondary / A-B only |
| Planner interior | `paper-cream.png` | keep | `--plan-surface-paper` |
| Arc mark | `arc-mark.png` until @2x from assets910 | keep | Header wordmark |
| AP motif | REF-MOTIF-WEDGE | `public/assets/arc/motif-apah-wedge.png` | Small background in course band |
| 2D motif | **REF-MOTIF-BLUE-DOT** | `public/assets/arc/motif-2d-dot-blue.png` | Course band signature |
| 3D motif | REF-MOTIF-RING | `public/assets/arc/motif-3d-ring.png` | Course band; sage tint |
| AP mustard wash (optional) | REF-TEXTURE-MUSTARD | `public/assets/arc/texture-mustard-field.png` | Section accent only |

---

## Stop-condition report (§9) — partial until full assets910 ingest

| Key | Answer |
|-----|--------|
| **A.** assets910 inspected | **19** Kelly reference samples + **18** repo PNGs; full archive **not** on disk |
| **B.** Strongest logo source | **`arc-mark.png`** in repo; watch assets910 for **same geometry @2x/SVG** — REF-MARK-COMP is related artboard, not verified production export |
| **C.** Strongest exterior pattern | **REF-PATTERN-GRID** (`pattern-grid-dots-semicircles-2048.png`) |
| **D.** Second exterior | **`breezeblock-tile.png`** (repo), faded on cream |
| **E.** AP motif | **REF-MOTIF-WEDGE** (green sector → mustard context in UI) |
| **F.** 2D motif | **REF-MOTIF-BLUE-DOT** (filled disc); fallback quadrant crop |
| **G.** 3D motif | **REF-MOTIF-RING** (tint sage) |
| **H.** Texture | **`paper-cream.png`** primary; optional **REF-TEXTURE-MUSTARD** for AP |
| **I.** Exact repo duplicates | **None** among batch 1–2 samples; batch 3: **`timer-ring.png`**, **`timer-ring-cleanup.png`** (MD5 match) |
| **J.** Recommended import files | pattern grid tile, wedge, ring, 2D crop export, optional mustard field — **pending assets910 filename confirmation** |
| **K.** Proposed destinations | See mapping table (`public/assets/arc/…`) |
| **L.** Rejected | **`green.png`** exterior; **`header-compact*`** as Plan mark; **REF-BREEZE-INVERT** / **REF-PATTERN-STRIPES** / **REF-PATTERN-FINE-GRID** as primary exterior; full-strength dark breezeblock wash; REF-MARK-COMP hero as live header without parity review; **REF-BLOOP-*** trapezoids for Plan (use CSS bloops); re-import **timer rings** to `public/assets/arc/` or as course motifs |

**STOP:** Await Kelly approval of shortlist + full assets910 ingest to confirm original filenames and any superior mark export.

---

## Stop-condition report (repo-only pass — historical)

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
- Kelly samples copied to `docs/overnight/evidence/asset-reconciliation/reference-samples/` (audit evidence only).
- **No files added under `public/assets/`.**

---

## Audit completion checklist

- [x] Repo asset inventory (public/assets + CSS references)  
- [x] assets910 access attempted  
- [x] Logo authority vs `arc-mark.png`  
- [x] Stop-condition sections A–G  
- [x] Rejection criteria  
- [x] Kelly reference sample pack — **19** PNGs (3 batches) — pattern family + shortlist  
- [ ] assets910 **full** filename-level reconciliation — blocked until `.local/assets910/` populated (option 3 snapshot) or zip ingest  
