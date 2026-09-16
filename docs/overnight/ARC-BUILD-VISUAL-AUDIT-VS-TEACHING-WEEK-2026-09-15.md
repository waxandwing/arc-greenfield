# ArcBuild visual audit vs Teaching week — 2026-09-15

> **HISTORICAL AUDIT (2026-09-15).** Original overall verdict was **RED**.  
> **2026-09-16 re-audit:** grade improved **RED → YELLOW/RED**. Title / kicker / rainbow / 3-course week chrome from the P0 list below have **landed** (see `ARC-BUILD-VISUAL-AUDIT-HANDBACK-2026-09-15.md`).  
> **Current major blocker:** the **22 Kelly labeled SVG binaries** are still absent — drop at `uploads/desk-incoming/` (see `LABELED-SVG-CHECKLIST.md`). Do **not** invent replacement art. Pixel gate remains open after binaries wire.

**Audit id:** ArcBuild live-desk vs Teaching week authority  
**Auditor:** ArcBuild audit agent (`bc-1fdde260`)  
**Scope:** Visual composition only — **no implementation this pass**  
**Overall verdict (at time of audit):** **RED** — superseded; see banner above for current status

## Inputs compared (vision)

| Role | Path | Notes |
|------|------|-------|
| **LIVE (what Kelly sees)** | `/home/ubuntu/.cursor/projects/workspace/assets/7a82998b-ed15-4de9-badb-ff34d7d48e15.png` | Pages desk capture; footer `desk-v2 · f6ce4df…` |
| **AUTHORITY** | `docs/overnight/evidence/kelly-teaching-week-authority.png` | Kelly zip `1.png` (also `uploads/desk-incoming/teaching-week-1/1.png`) |
| **Repo tip at audit write** | `origin/main` @ `1d68617` | Historical tip at audit write. Structural P0s later landed; see banner — current blocker is labeled SVG binaries |

**North-star docs read:** `MASTER-DESK-VISUAL-GOAL.md`, `TEACHING-WEEK-ZIP-INCORPORATION.md`, `KELLY-CURRENT-VS-TARGET.md`, `ARC-DESK-VISUAL-RECONCILIATION-PASS-2026-09-15.md`, `DESK-PIXEL-REQUIREMENTS.md`, `ARC-BUILD-AUDIT-LOOP.md`.

**Honesty note (at audit write):** Live Pages then contradicted some DESK-PIXEL / zip checklist PASS rows. Structural smoke PASS ≠ pixel PASS.  
**Now:** title/kicker/rainbow/3-course structural work has landed; remaining honesty gap is labeled SVG binaries + pixel gate — not “title still missing.”

---

## Overall verdict at audit time: **RED** (historical)

At capture time, live desk read as a **SaaS planner modal on wood wallpaper**, not Kelly’s **physical Teaching week desk**. The title/kicker/rainbow/3-course/denim/IDEAS items below were the P0 fails **then**.

**Now (2026-09-16):** those structural P0s largely landed (handback DONE rows). Remaining work is **labeled SVG binaries** (wood → tray → settings/todos tabs → calendar tabs → calendar bg/rainbow/today/start-class/magnets) then the **pixel gate** — not another CSS inventiveness pass.

Re-audit gate: after labeled SVGs land + wire, capture `?demo=1&demoReset=1` at same viewport and re-diff against authority. Pixel gate remains **&lt;15% RGB** (`test:desk-pixel-pass`) — do not claim visual DONE while >>15%.

---

## Ordered FAIL list (historical snapshot @ Pages `f6ce4df`)

### P0 — must fix before claiming Teaching-week parity
**(Status 2026-09-16:** title/kicker/rainbow/3-course + denim/IDEAS structural work **landed** per handback; **do not** treat as current open fails. Current blocker = labeled SVG pack.)

| # | Fail | Live (Pages @ `f6ce4df`) | Authority (Teaching week) | Concrete diff |
|---|------|--------------------------|---------------------------|---------------|
| **P0-1** | **Missing Teaching week title stack** | Planner top shows Search / ← Today → / Enlarge; content hero is **“AP Art History”** + unit bar. No large serif **“Teaching week”**. | Top-left of cream spread: kicker + rainbow + **Teaching week** | Title cluster absent or occluded; week view must show `.plan-state-primary` = “Teaching week” at hero scale beside rainbow |
| **P0-2** | **Missing kicker** | No `SEPTEMBER 7 - 11 • WEEK 4` | Small uppercase kicker above title | `.plan-state-secondary` / `formatKellyDeskWeekSecondary` must render on Week desk home |
| **P0-3** | **Missing rainbow / arch mark** | No rainbow beside title (tan square / tools only) | Three-arch rainbow left of “Teaching week” | `desk-planner-rainbow-mark` must be visible on Week (`planner-rainbow-mark.png` or AT-001 vector) |
| **P0-4** | **TO-DOS = three SaaS cards** | Stacked beige cards **MUST DO / SHOULD DO / COULD DO** with `+ Must` inputs on a tan/blue slab | Single **denim folder** left of planner; vertical **TO-DOS** tab; bold labels on denim body (not card chrome) | Live reads as priority *cards*; authority is one folder object. Hide card borders/headers; show denim body + edge tab |
| **P0-5** | **IDEAS is a floating pill, not a drawer** | Center-top dark-green **IDEAS** capsule alone | Sage **drawer / tray** with pull-tab **IDEAS** + visible circular tokens (LINE + stones) | Need tray body + tokens; not a lone nav pill |
| **P0-6** | **Week grid is single-course dashboard** | One big **AP Art History** block; days **MON Sep 7…THU Sep 10** (no FRI); lesson chips under one course | **MON 7…FRI 11**; **three** course rows (AP / 2D / 3D) with period rails + unit bars + lessons; Thu focus semicircle | Demo seed + week projection must show full Teaching-week grid chrome |
| **P0-7** | **Planner reads as modal card / toolbar** | Heavy white rounded “dialog” with full Search+Today+**Enlarge** toolbar dominating header | Cream paper **spread** on wood; quiet search icon + Today chevrons top-right; title owns left | De-modalize: thinner frame, title-first header, tools as quiet cluster (Enlarge may stay but must not replace title) |
| **P0-8** | **Edge tabs wrong material / rail** | Tabs on a **dark green vertical strip**; mixed brown/beige/white faces | Four **sage/forest tab tickets** protruding from planner **right edge** (WEEK slightly proud) | Match committed `planner-edge-tab-*.png` look; no app-rail strip behind tabs |

### P1 — composition polish (after P0)

| # | Fail | Live | Authority | Diff |
|---|------|------|-----------|------|
| **P1-1** | **Header tools floating / SaaS** | Large Search field + Enlarge compete with content | Small magnifier + Today pill; no Enlarge in comp | Quiet iconography; demote Enlarge |
| **P1-2** | **Start class context line** | Script + **“P2 • 10:00–10:55 • 2D Art 1”** under mark | Script **start class** above quadrant mark only | Hide `.arc-desk-arctable-script-detail` on desk hero |
| **P1-3** | **Wood continuity / desk objects** | Furniture floats; no sticky/token cluster by wordmark | Continuous wood; small paper + clay tokens near Arc mark | Soften card shadows; optional loose objects; single wood plane |
| **P1-4** | **Course row chrome** | Dashboard unit strip + circular lesson chips | Colored left rails, period/time blocks, horizontal unit bars per course | Rails + `P1 • 8:05–9:00` style blocks |
| **P1-5** | **Day header format / Thu focus** | `MON Sep 7` style; weak/no mustard Thu marker | `MON 7` … `FRI 11`; mustard semicircle under **THU 10** | Date heading CSS + focus marker |
| **P1-6** | **“Weekends?” footer** | Absent | Present bottom-right of spread | Add or accept as known FAIL #26 |
| **P1-7** | **IDEAS token labels** | N/A (no tray) | Orange **LINE** stone visible | After drawer body: token labels / art |

---

## What already matches (PASS / partial)

| Item | Verdict | Notes from live vs authority |
|------|---------|------------------------------|
| Full-bleed wood field | **PASS** | Light horizontal wood grain behind furniture |
| Arc wordmark top-left on wood | **PASS** | Small arc mark present (not inside cream planner) |
| WEEK tab selected among DAY/WEEK/MONTH/YEAR | **PASS** | WEEK highlighted; scale is Week-ish |
| Start-class quadrant mark present | **PASS** | Four-arc AT mark bottom-right |
| “start class” script present | **PASS** | Label exists (detail line is P1 fail) |
| Green-ish planner frame intent | **PARTIAL** | Border present but modal/card weight too high |
| Demo dates in Sept week range | **PARTIAL** | Sep 7–10 visible; missing FRI 11 + wrong day label format |
| Mesopotamia unit / lesson names | **PARTIAL** | Unit + some lessons appear under AP only |
| Build stamp footer | **PASS** | `desk-v2 · f6ce4df…` visible |

**Historical “Not PASS” at audit write:** Teaching week title, kicker, rainbow, denim TO-DOS, IDEAS drawer, three-course week chrome, edge-tab material, modal de-bloating.  
**Superseded 2026-09-16:** handback marks Req 1–6 DONE for those structural items; remaining major blocker is **22 labeled SVG binaries** + pixel gate.

---

## Exact fix requirements (implementation agent) — historical

> Handback (`ARC-BUILD-VISUAL-AUDIT-HANDBACK-2026-09-15.md`) records these Req 1–6 as **DONE**. Do not re-open them as if still missing. Next implementation work waits on Kelly labeled SVGs in `uploads/desk-incoming/`.

Do **not** claim visual DONE until live capture matches authority + pixel gate. Prefer committed assets (`public/assets/desk/…`) over new CSS inventiveness. Work on **`main`**, then handback per `ARC-BUILD-AUDIT-LOOP.md`.

### Req 1 — Restore Teaching week title + kicker + rainbow (P0-1…3)

**Outcome:** Left of planner head shows rainbow mark + serif **Teaching week** + kicker **SEPTEMBER 7 - 11 • WEEK 4**; tools stay right and do not replace title.

**Hints:**
- `src/components/DeskPlannerHeadRow.tsx` — ensure Week always mounts `desk-planner-rainbow-mark` + `PlanStateHeader`
- `src/components/PlanStateHeader.tsx` — Week `primaryLine` / `secondaryLine`; desk Week must not be overridden by course focus chrome
- `src/components/dateLabels.ts` — `formatKellyDeskWeekSecondary`
- `src/styles/arc-desk.css` — `.desk-planner-head-row`, `.plan-state-primary`, `.plan-state-secondary`, `.desk-planner-rainbow-mark` (visibility, size, no clip)
- Assets: `public/assets/desk/planner-rainbow-mark.png`, `deskPlannerTitleMarkUrl()` in `src/desk/deskSliceRuntime.ts`

**Accept:** Screenshot shows title stack; `data-testid="desk-planner-rainbow-mark"` visible; smoke asserts Teaching week + kicker (`tests/arc-desk-demo-reset.smoke.mjs` / `test:arc-desk-pass`).

### Req 2 — Denim TO-DOS folder, not SaaS cards (P0-4)

**Outcome:** One denim folder left of planner with vertical **TO-DOS** tab; MUST/SHOULD/COULD as folder labels (no beige card stack).

**Hints:**
- `src/components/DeskTodosFolder.tsx` + `src/components/DeskPriorityPad.tsx` (`folderChrome={true}` from `AppFrame`)
- CSS: `.arc-desk-todos-folder`, `.arc-desk-todos-folder-sheet`, `.desk-priority-pad--folder` in `src/styles/arc-desk.css`
- Default raster: `deskCommittedRasterChromeEnabled()` + slices `todos-folder-body.png` / `todos-folder-tab.png`
- Kill card look: borders, separate lane backgrounds, “To-dos” SaaS heading when `folderChrome`

**Accept:** Live shows denim body + edge tab; no three floating cards.

### Req 3 — IDEAS drawer tray + tokens (P0-5)

**Outcome:** Top-center forest/sage **drawer** with IDEAS pull-tab and circular tokens visible when collapsed.

**Hints:**
- `src/components/DeskGreenFoldersDrawer.tsx`
- Asset: `public/assets/desk/green-folders-drawer.svg` (default); optional slice `ideas-drawer-chrome`
- CSS: `.arc-desk-tray-dock`, `.arc-desk-green-drawer-*`, `.arc-desk-ideas-tab`

**Accept:** Not a lone pill; tray body readable vs wood.

### Req 4 — Full Teaching-week grid (P0-6, P1-4/5)

**Outcome:** MON–FRI headers; AP + 2D + 3D rows; period rails; unit bars; Thu focus; lesson pills.

**Hints:**
- `src/demo/kellyDeskDemo.ts` + demo seed path (`applyDemoSeed` / `?demo=1&demoReset=1`)
- Week projection components under planning/calendar (day headings, row labels)
- `src/styles/` desk planning date/row rules; `.planning-date-heading--focus`

**Accept:** Three courses visible; FRI 11 present; matches authority structure (pixel polish can trail).

### Req 5 — De-modalize planner + quiet tools + edge tabs (P0-7/8, P1-1)

**Outcome:** Cream spread on wood (paper/book, not dialog); Search/Today quiet; Enlarge demoted; tabs as edge tickets.

**Hints:**
- `src/styles/arc-desk.css` — `.arc-calendar-spread--desk` border/radius/shadow; `.desk-planner-head-tools`
- `src/components/DeskPlannerHeadRow.tsx` — Enlarge styling/placement
- `src/components/B01Furniture.tsx` — `arc-planner-physical-tabs--desk-edge`
- Tab PNGs: `public/assets/desk/slices/planner-edge-tab-*.png` via `deskPlannerEdgeTabAssetUrl`

**Accept:** No dark rail strip; WEEK proud; header not a SaaS toolbar.

### Req 6 — Start class detail + wood continuity (P1-2/3)

**Outcome:** Script + mark only on hero; continuous wood; less floating-card shadow.

**Hints:**
- `src/components/ArcTableDeskFixture.tsx` + `.arc-desk-arctable-script-detail` hide on desk
- Wood: `.arc-shell--desk` / `.arc-desk-tabletop` — no nested wood mats (`ARC-DESK-VISUAL-RECONCILIATION-PASS`)

### Out of scope this audit

- Implementing the above (hand to implementation agent)
- Discrete Figma layer pack (still **BLOCKED** — Kelly upload to `uploads/desk-incoming/`)
- Drive Ruthless sheet write (Kelly-owned)

---

## Docs honesty correction for builder

Update or reconcile after fixes:

1. `DESK-PIXEL-REQUIREMENTS.md` — rows 15–18, 10–13, 5–9 must not stay **PASS** until live matches; mark **FAIL** until re-audit GREEN/YELLOW.
2. `TEACHING-WEEK-ZIP-INCORPORATION.md` placement checklist — same; live Pages proves title/folder/IDEAS not visually PASS.
3. Queue items **B** (header) and TO-DOS/IDEAS chrome remain **NEXT**, not done.

---

## Evidence pointers

- Live capture (this audit): agent asset `7a82998b-ed15-4de9-badb-ff34d7d48e15.png` (Pages @ `f6ce4df`)
- Authority: `docs/overnight/evidence/kelly-teaching-week-authority.png`
- Prior reconciliation: `docs/overnight/ARC-DESK-VISUAL-RECONCILIATION-PASS-2026-09-15.md` (structural wiring; **did not** achieve Teaching-week look on Pages)
- Pixel history: ~60% RGB (`evidence/desk-pixel-pass/round-4-REPORT.md`) — still RED

---

## Handback block template (for implementation → ArcBuild)

```markdown
## ArcBuild handback

- **Branch:** main
- **SHA:** `<git rev-parse HEAD>`
- **Pushed:** yes — `origin/main` at `<sha>`
- **Audit addressed:** `docs/overnight/ARC-BUILD-VISUAL-AUDIT-VS-TEACHING-WEEK-2026-09-15.md` (RED → re-audit)

### Requirements addressed
| Req | Status | Notes |
|-----|--------|-------|
| Req 1 title/kicker/rainbow | DONE / PARTIAL / BLOCKED | |
| Req 2 denim TO-DOS | DONE / PARTIAL / BLOCKED | |
| Req 3 IDEAS drawer | DONE / PARTIAL / BLOCKED | |
| Req 4 week grid 3 courses | DONE / PARTIAL / BLOCKED | |
| Req 5 de-modal + edge tabs | DONE / PARTIAL / BLOCKED | |
| Req 6 start class / wood | DONE / PARTIAL / BLOCKED | |

### Tests
| Command | Result |
|---------|--------|
| test:contracts | |
| test:arc-desk-pass | |
| test:desk-pixel-pass | diff % |

### Evidence / docs
- New live screenshot path under `docs/overnight/evidence/`
- Queue note in `AGENT-WORK-QUEUE.md`

### Remaining for next audit
- …

### Kelly-only blockers
- Discrete Figma layer pack (if still blocked)
```
