# ArcTable Teacher Monitor — UX brief (Kelly feedback)

**Surface:** `main.arctable--teacher` (`ArcTableSurfaces` Teacher Monitor)  
**Feedback:** Kelly — “Not sure what's up with this interface, but im not a fan.”  
**Screenshot:** `/home/ubuntu/.cursor/projects/workspace/assets/1d0ae24a-d3f6-43c5-a260-885c88dc2fe3.png` (AP Art History · P1 · live)  
**Authority docs:** `docs/overnight/ARCTABLE-ICARUS-PLANNER-MERGE.md`, `docs/overnight/ARC-DESK-ARCTABLE-MARK-REPORT.md`, `docs/overnight/MASTER-DESK-VISUAL-GOAL.md`  
**Assets on hand:** `public/assets/arctable/` (AT-001, timer-ring, board-panel, paper-cream, logo-icon-*, header-compact, media-apparatus-frame, progress-rail, …)  
**Scope of this brief:** diagnose + ordered visual/IA fixes only. **Do not** redesign the whole product yet.

---

## 1. What this screen is for

Teacher Monitor is the **live-class control surface** for one Section session after Start class:

| Job | What the teacher does here |
|-----|----------------------------|
| **See the lesson** | Phase, title, directions, materials/voice/cleanup facts — the board students will feel |
| **Run time** | Classroom countdown + cleanup countdown |
| **Steer flow** | Phase step, board lock, Plan View (plan-while-live), End Class outcome |
| **Project** | Media / artwork (and optional people pick) onto the student/room surface |
| **Classroom tools** | People picker, passes, media attach — the AT-001 quadrant jobs |

It is **not** the Teaching week planner and **not** a general dashboard. It should feel like standing at the front of the room with the lesson on the board and tools within reach — continuous with the wood desk / AT-001 mark that launched the session (`ARCTABLE-ICARUS-PLANNER-MERGE.md` slices 1–3; Green++ asset reskin = slice 6).

---

## 2. Why it feels wrong (vs desk / Teaching week / Green++)

Kelly’s Teaching week north star is **physical furniture on wood**: cream spread, quiet chrome, one clear work plane. Teacher Monitor currently reads as a **SaaS live console** dropped on paper texture.

| Symptom (from Kelly shot) | Why it fights the metaphor |
|---------------------------|----------------------------|
| **Sparse lesson center** | Huge cream board with title + “No directions…” + empty **MEDIA / ARTWORK** well. The eye lands on failure/emptiness, not on teaching. Green++ / Figma jury wanted **board dominance** with utilities as a quiet rail — not a hollow card. |
| **SaaS sidebar** | “Teacher controls” is a stacked form column (timer form, phase stepper, materials, voice…). Same grammar as admin settings, not desk objects. AT-001 maps timer / people / media to **quadrant tools**, not a generic control list. |
| **Missing projection** | “Nothing projected yet” + soft excuse copy makes the live session feel unfinished. Projection is a core live job; empty state should be calm and actionable, not a void that owns half the viewport. |
| **Timer / logo chrome** | Timer shows **0:00 IDLE** while duration is set to 10 — reads broken (ready state should show **10:00**, not zero). Display is a flat serif numeral on `timer-ring.png`, not the richer `timer-well` / Green++ ring language. Header uses `header-compact.png` wordmark; desk authority is **AT-001** + framed `logo-icon-*` — Monitor does not inherit that mark language, so live feels like a different product than Teaching week. |
| **Live chip overpowers lesson** | Pine **CLASS LIVE · N MIN** pill competes with (and wins over) the lesson title. Desk law: status is secondary; the work is primary. |
| **Green++ gap** | Merge plan Phase 3 slice 6 + Kelly Q6: Drive `ARC_TABLE_*_GREENPP.png` reskin not applied. Repo already has usable local assets (`timer-ring.png`, `timer-well.png`, `board-panel.png`, `paper-cream.png`, `media-apparatus-frame.png`, AT-001, logo icons) that Monitor underuses or mis-composes. |

**Net:** Functionally GREEN++ tools exist; the **composition** still feels like a prototype sidebar + empty stage, not a live desk continuation.

---

## 3. Ordered P0 visual / IA fixes

Ship **visual/IA only** on Teacher Monitor — no new product surface, no Teaching Mode transport debate.

### P0-1 — denser lesson center (board first)

- Collapse empty hierarchy: if no directions, do not leave a large serif void — tighten title → facts → media into one continuous board stack.
- Shrink or **collapse** the media well when nothing is projected; replace hero empty state with a short action (“Add / project media”) that opens the existing Media tool.
- Prefer `board-panel.png` / `paper-cream.png` / `media-apparatus-frame.png` so the board reads as **furniture**, not a white SaaS card with gold hairline.
- Keep student-facing facts (voice / materials / cleanup) as a quiet footer strip — not competing headlines.

### P0-2 — quieter chrome; status secondary

- Demote **Class live** chip (smaller, less pill/SaaS; ink/mustard live-return language from Stage 7 shell, not a dashboard badge).
- Soften “Teacher controls” as a label; reduce control-row borders/cards so the rail feels like a **tool edge**, not Settings.
- Header: use **AT-001** (or framed `logo-icon-framed-arc-primary-*`) beside “Teacher Monitor” so live inherits desk mark identity; keep `header-compact` only if it matches AT-001 crop quality at this size.

### P0-3 — fix timer + logo honesty (assets already in repo)

- **Ready/idle display** must show configured duration (e.g. **10:00**), not **0:00**. Reserve 0:00 for completed/expired.
- Compose timer with `timer-ring.png` + `timer-well.png` (cleanup → `timer-ring-cleanup.png`) so it matches student ring and Green++ intent — not a bare numeral disc.
- Wire desk launch intent focus (timer quadrant → timer control) so AT-001 → Monitor remains one gesture language (`ARC-DESK-ARCTABLE-MARK-REPORT.md`).

### P0-4 — projection as a first-class empty state

- Empty media: apparatus frame + one CTA into Media tool; optional one-tap **Student preview** so “projection” is visible even before artwork.
- When media exists but not projected, show thumbnail **dimmed** with “Not projecting” — never a blank gray slab owning the board.
- Do not invent Now/Next/hold/blackout here (still YELLOW / Kelly-scoped in merge plan).

### P0-5 — Green++ asset pass (local first)

- Reskin Monitor chrome from `public/assets/arctable/` **now**; treat Drive `*_GREENPP.png` as a drop-in upgrade when Kelly supplies the path (merge plan Q6).
- Match Teaching week materials: cream paper, pine ink, gold progress rail already partially wired (`progress-rail.png`) — extend consistently; avoid new purple/glow/card stacks.

**Out of scope for this P0 list:** whole-product redesign, I3 network Teaching Mode, Explore discovery, planner Teaching week furniture (separate audit track).

---

## 4. Questions for Kelly (max 3)

1. **Empty board:** When a lesson has no directions and nothing projected, should Monitor stay **intentionally quiet** (minimal board + CTA), or should we **seed / prompt projection** (demo artwork or forced Media open) so live never looks “broken”?
2. **Tool grammar:** Keep a **right tool rail** (quieter Green++ furniture), or move toward **AT-001 quadrant objects** on the live board (timer/people/media as desk-like controls)?
3. **Green++ assets:** Ship the reskin with **repo `public/assets/arctable/`** immediately, or wait for your Drive **`ARC_TABLE_*_GREENPP.png`** pack before touching Monitor chrome?

---

## References

- Code: `src/components/ArcTableSurfaces.tsx` (`.arctable--teacher`), `src/styles/arctable.css`
- Merge / Green++: `docs/overnight/ARCTABLE-ICARUS-PLANNER-MERGE.md` (I2 `arc-table-greenpp`, slice 6)
- Desk mark: `public/assets/arctable/AT-001_table-mark.svg`, `docs/overnight/ARC-DESK-ARCTABLE-MARK-REPORT.md`
- Prior jury evidence: `docs/overnight/evidence/05-teacher-monitor.png`
