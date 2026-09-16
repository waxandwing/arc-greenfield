# Agent work queue — desk visual

**Updated:** 2026-09-16 — Kelly re-audit **YELLOW/RED** (improved from RED); **blocker = 22 labeled SVG binaries**  
**Behavior contract (gates visual work):** `docs/overnight/ARC-HARD-UI-AUDIT-INTUITIVE-HELPFUL-2026-09-15.md` — see `docs/overnight/README.md` (six teacher scenarios A–F)  
**North star (visual):** `docs/overnight/MASTER-DESK-VISUAL-GOAL.md`  
**Audit ↔ build loop:** `docs/overnight/ARC-BUILD-AUDIT-LOOP.md` (ArcBuild audit agent requirements → implementation handback SHA)

## ArcBuild audit lane (Kelly routing)

| Step | Owner | Action |
|------|--------|--------|
| 1 | **ArcBuild audit agent** | Audit iteration @ `main` SHA; send **requirements** (see loop doc) |
| 2 | **Implementation agent** | Apply changes on `main`, run smokes, **push**, post **handback packet** |
| 3 | **ArcBuild audit agent** | Re-audit @ new SHA; repeat until PASS or Kelly blockers |

### 2026-09-16 — Re-audit status (current)

- **Verdict:** **YELLOW/RED** (improved from RED). Stop inventing replacement art.
- **Major blocker:** 22 Kelly labeled SVG binaries still absent — `uploads/desk-incoming/` + `LABELED-SVG-CHECKLIST.md`.
- **Historical (landed — do not re-open as missing):** Teaching week title, kicker, rainbow, 3-course week grid (see handback Req 1–6 DONE).
- **Wire order when binaries land:** wood → tray → settings/todos tabs → calendar tabs → calendar bg/rainbow/today/start-class/magnets → pixel gate.
- **Do not:** invent wood/tray/tab SVGs; another prettier CSS pass on wrong interim assets.

### 2026-09-15 — ArcBuild visual audit vs Teaching week (**RED**) — HISTORICAL

- **Doc:** `docs/overnight/ARC-BUILD-VISUAL-AUDIT-VS-TEACHING-WEEK-2026-09-15.md` (banner: historical; superseded by 2026-09-16 re-audit)
- **Live:** Pages capture @ `f6ce4df` (Kelly screenshot) vs authority `kelly-teaching-week-authority.png`
- **Verdict then:** **RED** — SaaS modal desk, not Teaching week furniture
- **Top P0 then:** missing Teaching week title/rainbow/kicker; TO-DOS as three cards; IDEAS pill; single-course week grid; planner modal + wrong edge-tab rail — **structural items landed in handback; not current open fails**
- **Repo tip when audit filed:** `1d68617`

| Asset state | Status |
|-------------|--------|
| Teaching week zip `1.png` + authority copies on GitHub | **YES** |
| 11 slice PNGs (crops from comp) in `public/assets/desk/slices/` | **YES** — opt-in via `?deskSlices=1` only |
| **22 Kelly labeled SVGs** (USE wood/tray/tabs/magnets/…) | **NO** — **BLOCKED**; drop in `uploads/desk-incoming/` |
| Discrete per-layer Figma export pack | **NO** — **BLOCKED** until Kelly drops files in `uploads/desk-incoming/` |
| Default desk runtime | Source SVG/CSS/wood (`TEACHING-WEEK-ASSETS-HONESTY.md`) |

**Kelly Pages @ this SHA:** https://waxandwing.github.io/arc-greenfield/?demo=1&demoReset=1

## Do not settle

1. **Blockers → ask Kelly** (specific file, node, or decision) — log under **Blockers log** / **QUESTIONS FOR KELLY** below; do not stop at “good enough.”
2. **Insufficient Figma access → document + request export** (file key, node id, desired crop) before CSS fallback.
3. **Pixel diff &gt; 15% → continue slices**, not a close pass — run `npm run test:desk-pixel-pass` each iteration; global ~60% means more header/row/tab/folder work.
4. **No false 100%** — smoke green ≠ visual done.

| ID | Work item | Priority | Status | Owner / notes |
|----|-----------|----------|--------|----------------|
| **A** | Figma/Arc slice placement: vertical tabs + IDEAS drawer + TO-DOS folder + start-class frame | P0 | **DONE** | 11 PNGs + manifest; edge tabs via `deskPlannerEdgeTabAssetUrl`; `test:desk-slices` |
| **B** | Planner header chrome parity (rainbow mark, Today chevron pill, title/kicker typography) | P0 | **DONE (structural)** | Title/kicker/rainbow landed in Teaching-week handback; labeled `calendar-date-rainbow.svg` still **BLOCKED** on binaries |
| **C** | Course row rails + period/time blocks (`P1 • 8:05–9:00`) | P1 | **IN PROGRESS** | Kelly demo section labels + desk typography; left rails still FAIL |
| **D** | Calendar enlarge pop-out (inline week + modal YEAR/DAY navigation) | P1 | **DONE** | `DeskCalendarPopOut`; `desk-calendar-enlarge-trigger` + pop-out smokes |
| **E** | Drive Ruthless Design Audit after **each** pass | P0 | **YELLOW @ `3067c83` (2026-09-15)** | Repo: `DESK-RUTHLESS-AUDIT-PASS-2026-09-15.md` addendum; Kelly: mirror to Drive sheet |
| **F** | Pixel diff loop until **&lt;15%** or blocked on assets | P1 | **BLOCKED (assets)** | ~60% diff; blocked on labeled SVG binaries |

## Ordered execution (do not skip A while slices missing for P0 chrome)

1. **A1 — Slice manifest contract + assets** — six PNGs under `public/assets/desk/slices/`; contract in `deskSliceManifest.contract.ts`. **Done** when `test:contracts` + smoke assert `desk-slice-*` testids.
2. **A2 — Vertical planner tab slices** — **done** (five inactive + active crops in manifest).
3. **B — Planner header** — structural DONE; labeled rainbow SVG waits on Kelly binaries.
4. **C — Course rows** — left color rails + period typography from comp.
5. **D — Calendar pop-out** — enlarge trigger, focus trap, dismiss restores inline spread; tab sync with edge tabs.
6. **E — Ruthless audit** — update Drive + `ARC-RUTHLESS-UI-UX-AUDIT.md` successor per pass.
7. **Labeled SVG wire** — after Kelly drop: wood → tray → settings/todos → calendar tabs → bg/rainbow/today/start-class/magnets.
8. **F — Pixel pass** — `npm run test:desk-pixel-pass`; iterate until &lt;15% or document asset blockers.

## Smoke / contract gates

| Gate | Command |
|------|---------|
| Desk structural | `npm run test:arc-desk-pass` |
| Contracts | `npm run test:contracts` |
| Pixel (honest) | `npm run test:desk-pixel-pass` |
| Canonical SVG presence | `npm run check:canonical-desk-svgs` |
| Fidelity checklist | `npm run test:desk-fidelity-audit` |

## Blockers log

| Blocker | Unblocks |
|---------|----------|
| **22 labeled SVG binaries** (major) | Kelly drop in `uploads/desk-incoming/` → wire wood→tray→tabs→calendar→pixel |
| Global ~60% RGB diff | Labeled art wire + viewport scale; not more invented CSS |
| Denim / IDEAS interim texture | USE tray/todos labeled SVGs |
| Drive audit | Kelly/manual upload after each agent pass |

## QUESTIONS FOR KELLY

- **22 labeled SVGs (P0):** Drop the exact filenames from `uploads/desk-incoming/LABELED-SVG-CHECKLIST.md` into `uploads/desk-incoming/` (zip OK). This is the major visual blocker after the YELLOW/RED re-audit.
- **Google Drive Ruthless Design Audit sheet:** Agents can **read** gate docs via MCP (`docs/overnight/AUDIT-RULES-FROM-DRIVE.md` ids). **Kelly still owns** writing PASS/FAIL rows into the live Drive audit tracker each pass (MCP does not replace the approval workbook).
- **Period times on comp:** Confirm P4/P5 times for 2D/3D rows if they differ from demo `P4 • 9:05–10:00` / `P5 • 10:05–11:00`.
- **ArcTable × icarus merge:** See **QUESTIONS FOR KELLY** in `docs/overnight/ARCTABLE-ICARUS-PLANNER-MERGE.md` (Teaching Mode transport, demo paid-live, week-row start scope, `/table` QA route, NOW/NEXT/hold, Drive GREENPP assets).

## Queue status snapshot (coordinator)

- **Done:** A (slice stack), B structural title/kicker/rainbow, D calendar pop-out, Teaching-week handback Req 1–6.
- **Blocked (Kelly):** 22 labeled SVG binaries in `uploads/desk-incoming/` — then wire wood → tray → settings/todos → calendar tabs → bg/rainbow/today/start-class/magnets → pixel gate.
- **Do not:** invent replacement Kelly art or prettier CSS on wrong assets while binaries are missing.

### 2026-09-15 — Drive ruthless audit on integration

- **Merged:** `e9947cc` (from `cursor/vertical-slices-desk-audit-b637`) onto `cursor/arc-production-integration` via fast-forward.
- **Verdict:** **YELLOW** — structural/integration continuity OK; not Drive-GREEN overall (`docs/overnight/DESK-RUTHLESS-AUDIT-PASS-2026-09-15.md`).
- **Open RED:** Kelly pixel gate ~60% RGB diff; repo IA ruthless (title stack / notes chrome); full Gate 1 battery not run this pass.

### 2026-09-15 — Do not settle pass (bc subagent)

- **Docs:** “Do not settle” in MASTER + QUEUE; **QUESTIONS FOR KELLY** (Drive path, rainbow mark, period times).
- **Visual:** Today ←/→ cluster (`DeskPlannerHeadRow`); Kelly demo `P1 • 8:05–9:00` row labels + desk typography; edge tab `right: 0` (Drive audit fine-tune).
- **Pixel:** `round-4` evidence — Kelly **60.08%** diff (not &lt;15%; continue B/C slices).
- **Leader merge:** `bc-e88a74c1` tip not accessible from this environment; worked from integration tip `72a7ee7` → `e9947cc` lineage.

### 2026-09-15 — Ruthless audit addendum @ `3067c83` (leader pass `bc-e88a74c1`)

- **Tip SHA:** `3067c83` — Kelly demo kicker locked in `arc-desk-demo-reset.smoke.mjs`; pop-out trigger testid (`8043b99`).
- **Item E:** **YELLOW** — P0 structural/visual rules PASS except pixel (**RED ~60%**), rainbow header (**FAIL #18**), partial row/weekends chrome; full Gate 1 brand battery not run.
- **Smokes:** `npm run test:arc-desk-pass` **PASS** on `desk-v2 · 3067c83` preview build.
- **Next agent:** **B** planner header (rainbow + Today pill), then **C** course row rails.

### Sync — 2026-09-15

- **Origin `cursor/arc-production-integration` pushed to `9a869f1`** after local-only drift (remote tracking had lagged at `2d973c3`); Kelly can pull audit/slice/ArcTable merge docs + Week-row live launch (slice 1).
