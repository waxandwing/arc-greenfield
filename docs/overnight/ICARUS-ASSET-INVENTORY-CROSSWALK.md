# Icarus public assets → arc-greenfield crosswalk

**Source repo:** [waxandwing/icarus](https://github.com/waxandwing/icarus) (public, clone verified 2026-09-14)  
**Authority in icarus:** `docs/assets/ASSET_PLACEMENT_MAP.md`  
**Canonical PNGs:** `docs/assets/source/*.png` (14 files)  
**Runtime in icarus:** `public/assets/arc/*.webp` (optimized from those PNGs)

**Target repo:** waxandwing/arc-greenfield (`cursor/arc-production-integration`)  
**Current production rasters:** `public/assets/arc/` (3 PNG) + `public/assets/arctable/` (15 PNG)

This document **pulls inventory only** — no files copied into `public/assets/` in this pass (same stop rule as `ASSET-RECONCILIATION-REPORT.md` until Kelly approves shortlist).

---

## Can the cloud agent pull from icarus?

| Action | Feasible? | Notes |
|--------|-----------|--------|
| Clone / read inventory | **Yes** | `git clone https://github.com/waxandwing/icarus.git` |
| Copy PNG or WebP into arc-greenfield | **Yes** | Manual copy, subtree, or sync script |
| Rewire CSS/tokens + components | **Yes** | Requires mapping table below + regression smokes |
| Submodule icarus inside arc-greenfield | **Possible** | Heavier; usually prefer copied subset |

Icarus is a **different product slice** (Fridge / Task Bar furniture, governing docs in `docs/governing/`). arc-greenfield **Plan law** rejects Fridge chrome and legacy journal spine — but several icarus **textures and patterns** align with the approved Plan shell direction (light exterior, geometric pattern, cream planner).

---

## Full icarus source inventory

| Icarus asset (PNG) | Dimensions | WebP in icarus `public/` | Icarus role (placement map) |
|--------------------|------------|--------------------------|-----------------------------|
| `arc-mark-stacked` | 1254×1254 | yes | Planner header mark |
| `calendar-open-planner` | 1366×768 | yes | Desktop calendar shell under live content |
| `pattern-arc-geometric` | 1672×941 | yes | Setup/onboarding environment pattern |
| `texture-cream-paper` | 1536×1024 | yes | Planner / Settings paper fallback |
| `texture-mustard-paper` | 1536×1024 | yes | Task Bar surface |
| `texture-blue-paper` | 1536×1024 | yes | Fridge surface |
| `texture-wood` | 1536×1024 | yes | Outer desk/environment |
| `fridge-open-surface` | 1366×768 | yes | Fridge variant (preserved) |
| `fridge-notes-blue` | 1366×768 | yes | Fridge door decoration |
| `fridge-notes-cream` | 1366×768 | yes | Fridge empty-state decoration |
| `settings-folder-cream` | 1366×768 | yes | Settings folder silhouette (deferred) |
| `taskbar-folder-mustard` | 1366×768 | yes | Task Bar folder (deferred) |
| `onboarding-tell-us-about-your-day` | 1366×768 | yes | Static onboarding art (baked copy) |
| `onboarding-tell-us-about-your-day-wide` | 1672×941 | yes | Wide onboarding variant |
| `onboarding-tell-us-about-your-day-hd` | 1920×1080 | yes | HD onboarding variant |

---

## Recommended mapping → arc-greenfield (proposal only)

| Icarus source | Proposed destination | Plan / shell use | vs current arc-greenfield |
|---------------|----------------------|------------------|---------------------------|
| `pattern-arc-geometric` | `public/assets/arc/pattern-arc-geometric.webp` or `.png` | **Light exterior** repeat (fade/saturation in CSS) — same brand family as Kelly **REF-PATTERN-GRID**; icarus file is **1672×941 band**, not square tile — may need tile crop or alternate export | Replaces heavy `breezeblock-tile` wash when approved |
| `texture-cream-paper` | `public/assets/arc/texture-cream-paper.png` | `--plan-surface-paper` / spread interior | Compare to `arctable/paper-cream.png` (2048); **not byte-identical** — pick one canonical cream |
| `calendar-open-planner` | evidence or layered shell reference | Aligns with **REF-PLANNER-JOURNAL** (frame + cream); likely **reference** for CSS frame, not full-bleed bitmap UI | Plan uses CSS frame + `arc-calendar-spread` today |
| `arc-mark-stacked` | `public/assets/arc/arc-mark-stacked.png` | Candidate **@2x / header** vs `arc-mark.png` (70×59) | **Do not swap** until visual parity vs Kelly mark authority |
| `texture-mustard-paper` | `public/assets/arc/texture-mustard-paper.png` | AP band / accent only | Matches REF-TEXTURE-MUSTARD intent |
| `texture-blue-paper` | optional course/people band | 2D accent surface | Overlaps `--course-2d-accent` CSS |
| `texture-wood` | **Defer / reject Plan** | icarus “outer desk” — conflicts with **light cream exterior** target | — |
| `fridge-*`, `taskbar-*`, `settings-folder-*` | **Do not import Plan** | Fridge/Task Bar product (out of Plan shell scope) | — |
| `onboarding-tell-us-about-your-day*` | onboarding route only | Baked headline — never replace live editable UI | arc-greenfield has live onboarding components |

---

## Sync procedure (when approved)

```bash
# One-time or CI sync from pinned icarus commit
ICARUS_REF=58797b98   # update to chosen tag/SHA
git clone --depth 1 https://github.com/waxandwing/icarus.git /tmp/icarus-sync
cd /tmp/icarus-sync && git fetch --depth 1 origin "$ICARUS_REF" && git checkout "$ICARUS_REF"

# Example: copy approved subset only
install -d /workspace/public/assets/arc/icarus
cp docs/assets/source/pattern-arc-geometric.png \
   docs/assets/source/texture-cream-paper.png \
   /workspace/public/assets/arc/icarus/
# Then update src/styles/tokens.css paths and run npm run build
```

Prefer **PNG from `docs/assets/source/`** for arc-greenfield (matches existing `public/assets/**/*.png` convention) unless you standardize on WebP.

---

## Relation to assets910 / Kelly chat samples

- Kelly **dot/semicircle grid** (2048 tile) is the **preferred exterior** in the reconciliation shortlist; icarus **`pattern-arc-geometric`** is a **related horizontal composition** in the same palette — treat as **alternate or second source**, not automatic duplicate.
- Full **assets910** zip may still contain filenames not present in icarus; merge inventories before import.

---

## Next step

Kelly: confirm whether “pull inventory” means **this crosswalk only** (done) or **approved binary sync** from icarus (subset above). Binary sync + token/CSS wiring is a separate implementation pass after shortlist approval.
