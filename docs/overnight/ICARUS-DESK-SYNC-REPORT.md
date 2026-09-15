# Icarus desk asset sync report

**Target repo:** waxandwing/arc-greenfield  
**Branch:** `cursor/arc-production-integration`  
**Sync date:** 2026-09-15  
**Source repo:** [waxandwing/icarus](https://github.com/waxandwing/icarus)  
**Source SHA (exact):** `58797b98b4f3210df366dff0192058420878a013`  
**Source path:** `docs/assets/source/*.png`  
**Import scope:** `public/assets/arc/icarus/` only — **no** overwrites of canonical `public/assets/arc/arc-mark.png` or other production wiring.

---

## Desk visual law (supersedes “light cream exterior shell” for Plan desk mode)

For **desk-first Plan** (`arc-shell--desk`), Kelly direction is:

| Layer | Rule |
|-------|------|
| **Viewport field** | Full viewport wood via **`public/assets/arc/icarus/texture-wood.png`** (`--arc-wood-surface-image`), not cream shell wash |
| **On the wood** | Cream **planner**, **molded blue tray** (not flat blue paper), MSC pad, **yellow** quick capture, ArcTable mark, secondary **notes** |
| **Pattern** | Geometric / grid pattern is **secondary** — onboarding, bands, or subtle accents — **not** the main desk exterior around the live planner viewport |
| **Icarus wood texture** | **Wired** for main desk surface (Kelly 2026-09-15); still compare visually to Figma `6:3194` |
| **Schedule-setup wood** | `public/assets/desk/light-wood-desk.png` → `--arc-schedule-setup-wood` only (onboarding / calendar-on-wood alt) |

Prior reconciliation docs that prioritized **light cream exterior + faded pattern** for the **non-desk Plan shell** still apply to calendar shell modes; **desk mode law above wins** when both are discussed.

---

## Files copied

### Production-adjacent staging (`public/assets/arc/icarus/`)

| File | Dimensions | Size (bytes) | MD5 |
|------|------------|--------------|-----|
| `texture-wood.png` | 1536×1024 RGB | 2,429,587 | `0144ff8c1261b1206927bb7094543bfb` |
| `texture-cream-paper.png` | 1536×1024 RGB | 2,728,045 | `62008f7b70f2c12984ec8062fe8a36ab` |
| `pattern-arc-geometric.png` | 1672×941 RGB | 2,357,110 | `549156828cb1b2ee86b6fc42fc65bf9a` |
| `texture-mustard-paper.png` | 1536×1024 RGB | 2,793,324 | `5c800c7803b86d3866625420ef33aeb1` |
| `texture-blue-paper.png` | 1536×1024 RGB | 2,472,568 | `52ece191faf2d13a7cc4fe51fa8c7f38` |
| `calendar-open-planner.png` | 1366×768 RGBA | 634,163 | `2277012317c18c7456429f7496325294` |
| `arc-mark-stacked.png` | 1254×1254 RGBA | 1,062,900 | `18b388cfd5a40b6768c9fd452d52b766` |

Pin file: `public/assets/arc/icarus/SOURCE.txt` (repo URL + SHA).

### Reference / evidence only (not live UI)

| File | Location | Dimensions | Size (bytes) |
|------|----------|------------|--------------|
| `onboarding-tell-us-about-your-day.png` | `docs/overnight/evidence/icarus-onboarding-reference/` | 1366×768 | 1,269,121 |
| `onboarding-tell-us-about-your-day-wide.png` | same | 1672×941 | 1,975,916 |
| `onboarding-tell-us-about-your-day-hd.png` | same | 1920×1080 | 2,701,544 |

---

## Explicitly **not** imported

Per Kelly approval: `fridge-open-surface`, `fridge-notes-blue`, `fridge-notes-cream`, `taskbar-folder-mustard`, `settings-folder-cream` (remain icarus-only).

---

## Contact sheet

**Path:** `docs/overnight/evidence/icarus-desk-sync/icarus-desk-sync-contact-sheet.png`  
**Regenerate:** `python3 docs/overnight/evidence/icarus-desk-sync/generate-contact-sheet.py`

---

## Duplicates vs existing `public/assets/arc/` (root)

| Icarus import | Root `public/assets/arc/` | Relationship |
|---------------|---------------------------|--------------|
| `texture-cream-paper.png` | `texture-cream-paper.png` | **Byte-identical** (same MD5) — root copy from prior pass; **icarus/** is scoped provenance copy |
| `pattern-arc-geometric.png` | `pattern-arc-geometric.png` | **Byte-identical** |
| `texture-mustard-paper.png` | `texture-mustard-paper.png` | **Byte-identical** |
| `texture-blue-paper.png` | `texture-blue-paper.png` | **Byte-identical** |
| `arc-mark-stacked.png` | `arc-mark-stacked.png` | **Byte-identical** — canonical mark remains **`arc-mark.png`** (70×59) |
| `texture-wood.png` | *(none)* | **New in icarus/** only |
| `calendar-open-planner.png` | *(none)* | **New in icarus/** only |

**Policy:** Treat `public/assets/arc/icarus/` as the **pinned icarus subset** at SHA `58797b98…`. Root duplicates are unchanged; future canonical moves should be explicit after compare, not silent overwrite.

---

## Near-duplicates vs `public/assets/desk/` and related cream sources

| Icarus candidate | Existing production | Assessment |
|------------------|---------------------|------------|
| `texture-wood.png` (1536×1024, opaque RGB grain) | `desk/light-wood-desk.png` (1024×576 RGBA, `ca191c8f…`) | **Different assets** — production **desk viewport** uses icarus wood; `light-wood-desk` is schedule-setup alt only. |
| `texture-cream-paper.png` | `arc/planner-paper.png` + `arctable/paper-cream.png` (2048×2048, `4bec8e8c…`, identical) | **Not duplicate** — icarus cream is smaller RGB sheet; production planner interior uses square cream tile. Pick one canonical cream after visual compare to ArcTable spread. |
| `texture-blue-paper.png` | `desk/blue-molded-tray.png` (565×1024 RGBA) | **Not substitute** — paper texture ≠ molded tray silhouette. Keep tray asset for live desk. |
| `texture-mustard-paper.png` | `desk/planner-tab-mustard.png` (576×1024) | **Related hue, different role** — tab chrome vs full paper sheet; mustard paper for **small accents** only if approved. |
| `pattern-arc-geometric.png` | `arc/pattern-grid-tile-2048.png` + `arc/patterns/at-pattern-*` | **Same brand family, different geometry** — horizontal 1672×941 band vs square 2048 tile; **not** for main desk viewport exterior. |

---

## Recommended production usage (Kelly rules)

| Asset | Recommendation | Approved for wiring? |
|-------|----------------|----------------------|
| `texture-wood.png` | Main desk viewport + tabletop (`--arc-wood-surface-image`) | **Yes** — wired 2026-09-15 |
| `desk/light-wood-desk.png` | Schedule setup / onboarding calendar-on-wood (`--arc-schedule-setup-wood`) | **Yes** — token only until UI surfaces adopt it |
| `texture-cream-paper.png` | Candidate planner/settings paper; compare to `planner-paper.png` / ArcTable cream | **No** — compare first |
| `pattern-arc-geometric.png` | Secondary pattern (onboarding, side bands); **not** around main desk viewport | **No** |
| `texture-mustard-paper.png` | Small accents (AP band, sticky adjacency) | **No** |
| `texture-blue-paper.png` | Tactile reference for blue objects; **not** tray replacement | **No** |
| `calendar-open-planner.png` | Evidence / composition reference; **no** baked bitmap behind live calendar | **No** |
| `arc-mark-stacked.png` | Header/@2x mark candidate vs `arc-mark.png` | **No** — do not replace canonical mark |
| Onboarding PNGs (evidence folder) | Historical baked copy reference only | **No** — live onboarding unchanged |

---

## Visual fit vs Figma desk direction

| Asset | Desk law fit | Notes |
|-------|--------------|-------|
| `texture-wood.png` | **Primary desk surface** | Live on `.arc-shell--desk` / `.arc-desk-tabletop`; reconcile grain/crop vs Figma as needed. |
| `texture-cream-paper.png` | **Good reference** | Supports cream planner interior; must be judged against live `planner-paper` / CSS frame. |
| `pattern-arc-geometric.png` | **Fails if used as desk exterior** | Strong branded band — correct as **secondary** only; contradicts desk law if wrapped around planner viewport. |
| `texture-mustard-paper.png` | **Accent-only** | OK at small scale; too loud as primary surface. |
| `texture-blue-paper.png` | **Fails as tray** | Flat paper ≠ molded tray; OK as color/texture reference only. |
| `calendar-open-planner.png` | **Reference only** | Full composite shell — would fight live calendar UI if wired as background. |
| `arc-mark-stacked.png` | **Neutral** | Mark variant; unrelated to wood/tray composition. |

---

## Engineering actions (desk wood — 2026-09-15)

- `--arc-wood-surface-image` → `assets/arc/icarus/texture-wood.png` via `src/publicAssetUrl.ts` + `src/styles/tokens.css`
- `--arc-schedule-setup-wood` → `assets/desk/light-wood-desk.png` (no main tabletop wiring)
- See `docs/overnight/DESK-SURFACE-AUTHORITY.md`

Still **not** done in icarus sync scope: mark replacement, Fridge / Task Bar / Settings folder imports.

---

## Next step for Kelly

1. Visual compare live desk vs Figma `6:3194` with wired `texture-wood.png`.  
2. Approve or reject other icarus assets (cream paper, pattern, etc.) per contact sheet.
