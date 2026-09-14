# Arc ruthless UI/UX audit (preview-driven)

**Repo:** waxandwing/arc-greenfield  
**Branch:** `cursor/arc-production-integration`  
**Audit HEAD:** `83c9560`  
**Date:** 2026-09-14  
**Mode:** Findings only — **no fixes applied** in this pass.

---

## Preview method

| Method | Status |
|--------|--------|
| **Local production preview** | `npm run build && npm run preview -- --host 127.0.0.1 --port 4173` — **primary audit surface** (smoke tests + evidence PNGs captured against this build at HEAD). |
| **GitHub-hosted live preview** | **Not available** for this branch. Repo has GitHub Actions that run `vite preview` in CI and upload **PNG artifacts** (e.g. `verify.yml`, `production-verify.yml`, `b01-furniture.yml`) — not a persistent public URL. Workflows trigger on `develop` / `feature/**` PRs, not a standing Pages deploy. **No Vercel** (per instruction). |
| **Evidence stills** | `docs/overnight/evidence/plan-navigation/`, `plan-week/`, `plan-month/`, `plan-p5/`, `arc-plan/` @ HEAD smoke refresh. |
| **Approved rendering reference** | `docs/overnight/evidence/asset-reconciliation/reference-samples/planner-journal-spread-reference.png` (empty spread — proportion/charm target, not feature-complete UI). |

**Git push:** `cursor/arc-production-integration` confirmed **up to date** with origin @ `83c9560` (uncommitted local changes: unrelated evidence PNG drift only).

---

## 1. Executive verdict

The shell and brand direction are **finally legible** (cream exterior, green frame, index tabs, course tints). The product still feels **clunky** because everyday planning is buried under **stacked headers**, **setup/product chrome**, and **form-like utilities** that read as application UI—not a planner you open and teach from.

The dominant failure mode is **information architecture + progressive disclosure**, not missing CSS polish: the teacher must parse **three title layers**, **setup banners**, and a **full-width Notes form** before reaching Week course grids or Day period content. Nested frames and a **full-width app chrome bar** add weight without proportional payoff.

**Verdict:** Pause styling passes. Next repair should **remove/hide chrome** and **collapse title stacks** before further visual tuning.

---

## 2. Top 10 problems (ranked by severity)

| Rank | Issue | Level | Tags |
|------|--------|-------|------|
| 1 | **Triple (or quadruple) title stack** — spread header view name + `PlanStateHeader` kicker/primary + duplicated dates | **RED** | IA, COPY, VISUAL |
| 2 | **Progressive setup panel** (`Shape the teaching day` / When you're ready) occupies prime vertical band on Day/Week after calendar exists | **RED** | IA, INTERACTION, COPY |
| 3 | **Notes block always expanded** — date picker + New Note + Add Note reads as admin form above teaching content | **RED** | INTERACTION, VISUAL |
| 4 | **Week teaching grid starts ~40–50% down viewport** — notes + state header + actions + date header before courses | **RED** | IA, VISUAL |
| 5 | **Dual header planes** — dark `arc-header` bar + in-spread `calendar-stage-header` + bordered `plan-state-header` | **YELLOW→RED** | VISUAL, IA |
| 6 | **Nested frame stack** — exterior pattern → composition border → planner green rim → spread cream → state header box | **YELLOW** | VISUAL |
| 7 | **Right index rail visual weight** — full-height dark green column competes with planner page | **YELLOW** | VISUAL, INTERACTION |
| 8 | **Recovery / school year in spread header** — always visible; loud on calm Day | **YELLOW** | IA, COPY |
| 9 | **Week lesson micro-actions** (`Open` / `Move` / `More`) dense in cells — database not week-at-a-glance | **YELLOW** | INTERACTION, VISUAL |
| 10 | **Redundant date strings** — PlanState secondary, day note, notes date input, period context | **YELLOW** | COPY, IA |

---

## 3. Screen-by-screen findings

### DAY (Teaching Day · plan focus day)

| Dimension | Finding | Level |
|-----------|---------|-------|
| Hierarchy | Eye hits **“Day”** (spread header), then yellow setup strip, then **“My Teaching Day”** box, then Notes form — **not** next class | RED |
| Space | Large `plan-state-header` + day note + notes before period rail; lesson body often **below fold** on 768–900px heights | RED |
| Containers | Bordered state header inside cream spread; period chips as mini-cards | YELLOW |
| Typography | Serif primary title competes with sans period chips; many kickers (TEACHING DAY, Today's plan) | YELLOW |
| Chrome | Period nav appropriate; setup + notes premature | RED |

### CLASS (plan focus class)

| Dimension | Finding | Level |
|-----------|---------|-------|
| Hierarchy | Kicker switches to section/course; primary is editorial — **good direction** | GREEN |
| Space | Still below setup/notes if unchanged from Day | YELLOW |
| Chrome | “Open Workspace” text link in class body — OK; duplicates Week-level entry | YELLOW |

### LESSON (plan focus lesson)

| Dimension | Finding | Level |
|-----------|---------|-------|
| Hierarchy | Lesson title in `plan-state-header` + again in `lesson-focus` — **duplicate** | YELLOW |
| Space | Directions/materials pushed down when Notes + setup visible | YELLOW |
| Chrome | Move / Start class appropriate; Workspace link repeated | YELLOW |

### WEEK

| Dimension | Finding | Level |
|-----------|---------|-------|
| Hierarchy | **“Week”** + **“2D Art 1 · This Week”** (when class context) + week range in secondary | RED |
| Space | **Courses/units grid below fold** on standard laptop evidence (`03-week-selected-day.png`) | RED |
| Containers | Course territories improving (tints, motifs) but unit rows still feel segmented | YELLOW |
| Typography | UNIT / Period labels caps-heavy vs editorial week title | YELLOW |
| Chrome | Standalone **Open Workspace** row; optional term context row | YELLOW |

### MONTH

| Dimension | Finding | Level |
|-----------|---------|-------|
| Hierarchy | Month title stack similar to Week | YELLOW |
| Space | Unit lanes + dense signals; improved softness but still **busy** at a glance | YELLOW |
| Chrome | Notes block above grid (same as Week) | RED |

### YEAR

| Dimension | Finding | Level |
|-----------|---------|-------|
| Hierarchy | Year + course context headers — acceptable for horizon view | GREEN |
| Space | Long scroll expected; less damaged by notes than Week | GREEN |

### PLANNING (P5 / planning period)

| Dimension | Finding | Level |
|-----------|---------|-------|
| Hierarchy | Still inherits Day chrome stack (Day tab, setup, notes) before buckets | YELLOW |
| UX | Mode feels like **same app with different body**, not a calm “planning lens” | YELLOW |

### WORKSPACE (overlay)

| Dimension | Finding | Level |
|-----------|---------|-------|
| Hierarchy | Overlay + underlying plan-state header + notes — **three layers** of planning UI | YELLOW |
| UX | Capture flow is clear; panel is form-heavy (expected) but **competes** with lesson header behind | YELLOW |
| IA | Index tab + overlay — correct “pulled from planner” metaphor | GREEN |

### SETTINGS (furniture surface)

| Dimension | Finding | Level |
|-----------|---------|-------|
| UX | Fixed panel from right; standard settings pattern | GREEN |
| Visual | Same furniture chrome as Workspace — consistent | GREEN |

### Transitions (Day ↔ Week ↔ Month ↔ Class ↔ Lesson ↔ Workspace)

| Transition | Finding | Level |
|------------|---------|-------|
| View change | Spread header **always** shows view name (`Day`/`Week`/…) even when `PlanStateHeader` already names state | RED |
| Focus deepen | Class/Lesson adds header emphasis but **does not remove** upper chrome | YELLOW |
| Workspace open | Background not dimmed enough; header stack still shouts | YELLOW |
| Index tab | Clear target; tab rail stays heavy during transition | YELLOW |

---

## 4. Teacher-task findings (scenarios)

### Scenario 1 — “Start of school day”

- **Where am I?** Confused by **Day** vs **My Teaching Day** vs date repeats.
- **What’s next?** Period rail is strong once reached; **too far down** behind setup/notes.
- **What matters?** Recovery link + school year compete with teaching focus.
- **Level:** RED (comprehension latency).

### Scenario 2 — “See my whole week”

- **Time to course sequence:** Poor — grid often **not in first screenful**.
- **Read:** “my teaching week” partially true after scroll; header noise delays it.
- **Level:** RED.

### Scenario 3 — “Lesson moved”

- **Move** visible in Week cells and Lesson focus — **GREEN** discoverability.
- **Friction:** Finding Move requires scanning dense cell links.
- **Level:** YELLOW.

### Scenario 4 — “Idea not scheduled yet”

- Workspace via index tab or **Open Workspace** links — **GREEN** paths exist.
- **Friction:** Week adds extra **Open Workspace** row above grid.
- **Level:** GREEN / YELLOW.

### Scenario 5 — “Plan during P5”

- Planning period content OK; **surrounded by Day setup + notes** — feels unfinished.
- **Level:** YELLOW.

### Scenario 6 — “Jot something down”

- Notes UI feels like **database entry**, not margin jottings.
- **Level:** RED (product identity).

---

## 5. Things to REMOVE (recommendation — not implemented)

- Duplicate **spread header view title** when `PlanStateHeader` present (keep one editorial line).
- **ProgressiveSetupPrompt** from daily views once `needsDay` false (or ever after first teaching-day save — product rule TBD).
- **Empty-state Notes row** text (“No Notes in this view”) from default layout.
- Standalone **Open Workspace** paragraph on Week/Month when index tab exists (pick one entry pattern).
- **TermContext-only** heading row on Week when it adds height without teacher value (evaluate).

---

## 6. Things to HIDE UNTIL NEEDED (progressive disclosure)

| Element | Trigger to show |
|---------|-----------------|
| Progressive setup (“Shape the teaching day”) | Only while teaching day incomplete **or** one-time dismissible coach mark |
| Notes composer (date + New Note + Add Note) | `+ Note` affordance; inherit anchor date |
| Notes list | When notes exist for visible range |
| Recovery review link | When count > 0 **and** user in recovery-relevant context (or badge, not banner) |
| Undo last Shift | Only when undo stack active (already conditional — keep, de-emphasize) |
| School year label | Settings or subtle spread footer |
| Plan-state bordered panel | Merge into single header band |
| First capture prompt | After dismiss — never again (already flagged in state) |

---

## 7. Things to KEEP

- Right index tabs (**DAY … SETTINGS**) — correct IA law.
- Period rail on Teaching Day — strong teaching metaphor.
- Course territory colors + small motifs (directionally right).
- Workspace overlay metaphor (not fridge furniture).
- Green **planner frame** + cream interior (matches approved direction).
- Instrument Serif on primary state titles (once deduplicated).
- Move / Start class on lesson surfaces.
- ArcTable isolation (unchanged).

---

## 8. Things to REDUCE (not remove)

- **`arc-header` height** — logo + live return only; shrink dead vertical padding.
- **`plan-state-header` box** — border/padding/shadow; merge with spread header.
- **Spread header** period controls footprint (Today cluster).
- **Index tab rail width** and contrast (charm vs sidebar).
- **Planner-object inner green padding** (frame-in-frame).
- **Visual reconciliation margins** if they push content down without shell benefit (re-evaluate after chrome removal).
- Week cell link count (progressive “More”).

---

## 9. Interaction friction

| Friction | Detail | Level |
|----------|--------|-------|
| Title parsing | 2–3 titles before action | RED |
| Notes date picker | Redundant with view anchor | YELLOW |
| Vertical tabs | Small hit targets; rotated text scanning cost | YELLOW |
| Week horizontal scroll | Required on narrow widths — OK but adds “app” feel | YELLOW |
| Multiple Workspace entry points | Tab + inline links + lesson actions | YELLOW |
| Setup never completes visually | Banner persists in gauntlet fixture | RED |

---

## 10. Accessibility concerns

| Concern | Detail | Level |
|---------|--------|-------|
| Visually hidden “Calendar” label | Spread header kicker hidden via clip in CSS — verify SR still gets meaningful page name | YELLOW |
| Notes Delete | Small text buttons in sticky notes — OK if name accessible | GREEN |
| Focus order | Skip link to `#calendar-stage` good; long header stack increases tab stops before content | YELLOW |
| Color | Course territories rely on color + left border — motifs help; verify contrast on bands | YELLOW |
| Index tabs | Vertical writing mode — screen reader order vs visual order | YELLOW |

---

## 11. Mobile / responsive concerns

| Concern | Level |
|---------|-------|
| Spread header stacks (period controls below title) — adds height | YELLOW |
| Notes form stacks to full width — dominates small screens | RED |
| Week grid `min-width` forces horizontal scroll — intentional but heavy | YELLOW |
| Fixed Workspace/Settings panels — OK; verify overlap with index tabs | YELLOW |
| `arc-header` drops to paper background at 520px — **third chrome personality** | YELLOW |

---

## 12. Recommended repair sequence (do not start in audit pass)

1. **Header consolidation** — one editorial title + one date line; remove spread `calendarViewLabel` duplicate (`CalendarStageHeader.tsx` + `PlanStateHeader.tsx` contract).
2. **Setup gating** — hide `ProgressiveSetupPrompt` when capability satisfied; collapse to Settings entry (`ProgressiveSetupPrompt.tsx` + `setupCapabilities`).
3. **Notes progressive disclosure** — collapse composer; inherit `focusDate` (`PlanningNotes.tsx` — interaction proposal only).
4. **Chrome diet** — shrink `arc-header`; merge spread headers (`arc-plan-shell.css`, `global.css`).
5. **Frame simplification** — reduce planner-object inner green band / duplicate outlines (`shell-visibility-lock.css`).
6. **Week above-the-fold** — move notes below grid or hidden; drop redundant Workspace row.
7. **Index tab refinement** — lighter rail, clearer selected state without full white slab.
8. **Re-run visual reconciliation margins** after chrome removal (avoid double margin).
9. **Evidence + teacher scenarios** re-capture.
10. **Accessibility pass** on new header order.

---

## Second audit — SIMPLICITY CUT LIST

*Law: Arc should look simpler than it is.*

| Could hide until needed? | Element |
|------------------------|---------|
| Yes | Spread header view name (`Day`/`Week`/…) when plan-state header exists |
| Yes | “When you’re ready” / Shape teaching day (after setup) |
| Yes | Full Notes form |
| Yes | “No Notes in this view” |
| Yes | School year in header |
| Yes | Recovery link (badge/menu) |
| Yes | Open Workspace inline links (keep tab) |
| Yes | Term context row on Week |
| Yes | Secondary date in plan-state when primary already has range |
| Yes | Day continuity full date line when header has date |
| Maybe | Period ← Today → cluster (keep keyboard; collapse visually) |
| No | Period rail |
| No | Index tabs |
| No | Start class / Move on lesson |
| No | Course territories |

---

## Third audit — visual reference comparison

Compared **running preview @ 83c9560** to **planner-journal-spread-reference** and Kelly approved renderings (evidence stills).

| Criterion | Reference intent | Current build | Gap |
|-----------|------------------|---------------|-----|
| Shell proportion | One confident frame, quiet field | Exterior + composition + planner rim + state box | **Heavier, nested** |
| Calendar/content scale | Working area inside planner, not whole product | Improved vs pre-reconciliation but **chrome eats gains** | YELLOW |
| Top chrome | Minimal | App bar + spread header + state panel | **Too much** |
| Visual quietness | Blank spread calm | Pattern + banners + forms | **Busy** |
| Course territory clarity | Broad bands | Improving (tints, motifs) | YELLOW-GREEN |
| Type hierarchy | Editorial primary | Serif present but **duplicated titles** undermine | YELLOW |
| Index-tab elegance | Attached sliver | Functional but **dark rail reads as nav drawer** | YELLOW |
| Background restraint | Subordinate pattern | 2048 grid fade OK; **interior noise dominates** | YELLOW |
| Charm | Planner object | Closer than Stage 7.2.2 dark shell | GREEN direction |
| Perceived complexity | Simple surface, deep engine | Feels like **SaaS dashboard** due to forms/setup | RED |

**Emotional equivalence:** Not yet — structure reads “planner,” behavior reads “app.”

---

## Appendix — explicit brief investigations

### A. Duplicated view titles

**Confirmed.** Spread header renders `calendarViewLabel(activeView)` (`CalendarStageHeader.tsx` L54–55). Canvas renders `PlanStateHeader` with kicker `Teaching Day` / `Week` and primary `My Teaching Day` / `This Week` / etc. (`PlanStateHeader.tsx`, `AppFrame.tsx` L392–411). **Recommendation:** single primary editorial title per screen.

### B. Setup / helper panel

**Confirmed** always rendered when `needsDay` / `needsTimes` / `needsCurriculum` (`ProgressiveSetupPrompt.tsx`, `AppFrame.tsx` L390). Occupies full-width band (`onboarding.css`). **Recommendation:** hide after teaching day established; move to Settings.

### C. Notes form

**Confirmed** always-visible composer (`PlanningNotes.tsx` L28, `planningCalendar.css` L350+). **Recommendation:** collapsed default; inherit date from anchor.

### D. Content priority (Week)

**Confirmed** order: `PlanStateHeader` → optional actions → `PlanningNotes` → grid (`CalendarProjectionView.tsx` L297–303). **Recommendation:** grid first or notes below fold.

### E. Top green bar

**Confirmed** `arc-header` min-height 64px, mostly empty (`arc-plan-shell.css`, `global.css`). Logo only unless live session. **Recommendation:** shrink; consider logo inside spread only (brand preserved).

### F. Right index tabs

**Confirmed** vertical rail, 44px min targets, dark green attach (`b01-furniture.css`, `shell-visibility-lock.css`). **Recommendation:** reduce width/contrast; soften selected state.

### G. Nested frames

**Confirmed** composition border + `arc-planner-object` green gradient padding + spread + bordered state header. **Recommendation:** one shell stroke; quiet interior.

---

## Stop condition report (§12)

| Item | Answer |
|------|--------|
| **A. Preview** | Local **`http://127.0.0.1:4173`** (production build). **No** GitHub-hosted web preview URL for this branch. |
| **B. Top 5 RED** | (1) Title stack (2) Setup banner persistence (3) Notes form prominence (4) Week grid below fold (5) “App not planner” identity from chrome |
| **C. Top 5 YELLOW** | Dual headers; nested frames; index rail weight; recovery/year chrome; week cell link density |
| **D. Strongest GREEN** | Index tab IA; period rail; Workspace overlay; Move/Start class; course tint direction |
| **E. Biggest “clunky” source** | **Vertical stack of headers + setup + notes before teaching content** |
| **F. Removal list** | §5 |
| **G. Progressive disclosure list** | §6 |
| **H. First repair pass** | Header consolidation → setup gating → notes collapse (§12) |
| **I. Audit doc** | **`docs/overnight/ARC-RUTHLESS-UI-UX-AUDIT.md`** |

**No fixes implemented. No merge. No Vercel.**
