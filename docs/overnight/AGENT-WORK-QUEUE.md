# Agent work queue — desk visual (integration branch)

**Updated:** coordinator pass on `cursor/arc-production-integration`  
**North star:** `docs/overnight/MASTER-DESK-VISUAL-GOAL.md`

## Do not settle

1. **Blockers → ask Kelly** (specific file, node, or decision) — log under **Blockers log** / **QUESTIONS FOR KELLY** below; do not stop at “good enough.”
2. **Insufficient Figma access → document + request export** (file key, node id, desired crop) before CSS fallback.
3. **Pixel diff &gt; 15% → continue slices**, not a close pass — run `npm run test:desk-pixel-pass` each iteration; global ~60% means more header/row/tab/folder work.
4. **No false 100%** — smoke green ≠ visual done.

| ID | Work item | Priority | Status | Owner / notes |
|----|-----------|----------|--------|----------------|
| **A** | Figma/Arc slice placement: vertical tabs + IDEAS drawer + TO-DOS folder + start-class frame | P0 | **DONE** | 11 PNGs + manifest; edge tabs via `deskPlannerEdgeTabAssetUrl`; `test:desk-slices` |
| **B** | Planner header chrome parity (rainbow mark, Today chevron pill, title/kicker typography) | P0 | **IN PROGRESS** | Today ←/→ cluster landed; rainbow mark still FAIL (#18) |
| **C** | Course row rails + period/time blocks (`P1 • 8:05–9:00`) | P1 | **IN PROGRESS** | Kelly demo section labels + desk typography; left rails still FAIL |
| **D** | Calendar enlarge pop-out (inline week + modal YEAR/DAY navigation) | P1 | **DONE** | `DeskCalendarPopOut`; `desk-calendar-enlarge-trigger` + pop-out smokes |
| **E** | Drive Ruthless Design Audit after **each** pass | P0 | **RECURRING** | Human/Drive step; document rules + PASS/FAIL in audit doc |
| **F** | Pixel diff loop until **&lt;15%** or blocked on assets | P1 | **BLOCKED (assets)** | ~60% diff round-2; slices should shrink drawer/folder gap |

## Ordered execution (do not skip A while slices missing for P0 chrome)

1. **A1 — Slice manifest contract + assets** — six PNGs under `public/assets/desk/slices/`; contract in `deskSliceManifest.contract.ts`. **Done** when `test:contracts` + smoke assert `desk-slice-*` testids.
2. **A2 — Vertical planner tab slices** — **done** (five inactive + active crops in manifest).
3. **B — Planner header** — rainbow icon asset; Today as chevron pill; no duplicate titles.
4. **C — Course rows** — left color rails + period typography from comp.
5. **D — Calendar pop-out** — enlarge trigger, focus trap, dismiss restores inline spread; tab sync with edge tabs.
6. **E — Ruthless audit** — update Drive + `ARC-RUTHLESS-UI-UX-AUDIT.md` successor per pass.
7. **F — Pixel pass** — `npm run test:desk-pixel-pass`; iterate until &lt;15% or document asset blockers.

## Smoke / contract gates

| Gate | Command |
|------|---------|
| Desk structural | `npm run test:arc-desk-pass` |
| Contracts | `npm run test:contracts` |
| Pixel (honest) | `npm run test:desk-pixel-pass` |
| Fidelity checklist | `npm run test:desk-fidelity-audit` |

## Blockers log

| Blocker | Unblocks |
|---------|----------|
| Global ~60% RGB diff | A2 slices, B header art, C row chrome, viewport scale normalization |
| Denim still gradient when slices off | A TO-DOS slices default on in preview |
| Vertical tab crop alignment vs comp | Fine-tune `arc-planner-physical-tabs--desk-edge` + crop script |
| Drive audit | Kelly/manual upload after each agent pass |

## QUESTIONS FOR KELLY

- **Google Drive Ruthless Design Audit:** This agent session does **not** have the Drive audit rules doc or folder access loaded. Please share the Drive path or filename for “Ruthless Design Audit” (Arc folder) so passes can record FAIL→fix per rule **E**. Until then, repo-side audit remains `docs/overnight/ARC-RUTHLESS-UI-UX-AUDIT.md` (preview-driven, not Drive-synced).
- **Rainbow title mark:** Export or node id for the Teaching week header icon beside “Teaching week” (req #18 FAIL).
- **Period times on comp:** Confirm P4/P5 times for 2D/3D rows if they differ from demo `P4 • 9:05–10:00` / `P5 • 10:05–11:00`.

## Queue status snapshot (coordinator)

- **Done this pass:** A (full slice stack), D calendar pop-out, coordinator docs, integration tip commit.
- **Next agent:** B planner header, then C course row rails.
- **Blocked:** F pixel target until B/C land and pixel pass re-run.

### 2026-09-15 — Drive ruthless audit on integration

- **Merged:** `e9947cc` (from `cursor/vertical-slices-desk-audit-b637`) onto `cursor/arc-production-integration` via fast-forward.
- **Verdict:** **YELLOW** — structural/integration continuity OK; not Drive-GREEN overall (`docs/overnight/DESK-RUTHLESS-AUDIT-PASS-2026-09-15.md`).
- **Open RED:** Kelly pixel gate ~60% RGB diff; repo IA ruthless (title stack / notes chrome); full Gate 1 battery not run this pass.

### 2026-09-15 — Do not settle pass (bc subagent)

- **Docs:** “Do not settle” in MASTER + QUEUE; **QUESTIONS FOR KELLY** (Drive path, rainbow mark, period times).
- **Visual:** Today ←/→ cluster (`DeskPlannerHeadRow`); Kelly demo `P1 • 8:05–9:00` row labels + desk typography; edge tab `right: 0` (Drive audit fine-tune).
- **Pixel:** `round-4` evidence — Kelly **60.08%** diff (not &lt;15%; continue B/C slices).
- **Leader merge:** `bc-e88a74c1` tip not accessible from this environment; worked from integration tip `72a7ee7` → `e9947cc` lineage.
