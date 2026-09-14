# ARC Repair Pass 2 — Intuitive by Default (Report)

**Branch:** `cursor/arc-production-integration`  
**Scope:** UX subtraction only — no planning law, Move/Shift/Recovery, Month/Year structure, ArcTable, shell geometry, or deploy changes.

## Stop condition

### A. Commit SHA

**`5f48327`** (Repair Pass 2 code + evidence: **`0184cae`**).

### B. Files changed (summary)

| Area | Files |
|------|--------|
| Setup gating | `src/planning/setupCapabilities.ts`, `setupCapabilities.contract.ts`, `ProgressiveSetupPrompt.tsx`, `AppFrame.tsx` |
| State headers | `PlanStateHeader.tsx` |
| Day / Lesson / Planning lens | `PlanningDayContinuityView.tsx`, `CalendarProjectionView.tsx` |
| Week disclosure | `PlanningWeekDayView.tsx` |
| Recovery + workspace | `CalendarStageHeader.tsx`, `WorkspacePanel.tsx` |
| Styles | `src/styles/repair-pass-2-chrome.css`, `src/main.tsx` |
| Tests + evidence | `tests/plan-navigation.smoke.mjs`, `tests/plan-p5.smoke.mjs`, `tests/plan-year.smoke.mjs`, `tests/plan-move-shift.smoke.mjs`, `tests/repair-pass-2.smoke.mjs` |

### C. Setup gating result

- **Root cause:** `dayOrderEstablished` / `planningPeriodEstablished` required explicit `teachingDay.blocks` while gauntlet (and many teachers) use **legacy period rail** (sections + gap → Period 5 planning). Bell-time prompt also fired when order was already usable.
- **Fix:** Legacy gap detection (`legacyTeachingDayHasPlanningPeriod`) satisfies minimum setup when sections imply a planning slot. Progressive prompt only renders when `!minimumPlanningSetupEstablished`. Bell-time nudge removed from Day surface (Settings / teaching-day setup only).
- **Test:** Gauntlet fixture asserts `.progressive-setup` count `0` on Day (`plan-navigation.smoke.mjs`, `repair-pass-2.smoke.mjs`, contract gauntlet sections).

### D. Day simplification

- Setup banner hidden for complete day.
- Class focus: removed duplicate course heading, inline Workspace, and “Back to Teaching Day” (HOME / index DAY + Return to Teaching Day remain).
- Period rail CSS: wider min flex, full course names on laptop, calmer planning gap styling.

### E. Week progressive-disclosure behavior

- Default: lesson actions hidden (`opacity: 0`, no pointer events).
- Reveal: `:hover`, `:focus-within`, `.is-actions-revealed` (tap on tile for touch).
- Removed persistent Open / duplicate Move row; Move + More (Review Shift) only when revealed.
- Status meta suppressed for quiet `not-started` cells unless fixed/shifted.

### F. Fixed-item treatment

- `.planning-lesson--fixed`: top accent, 2-line title clamp, compact FIXED marker, full title via `title` / `aria-label`.

### G. Lesson title / action cleanup

- Single **h1** lesson title in `PlanStateHeader`; body `h2` removed.
- **Start class** primary first in action row; Move / Review Shift secondary.
- Inline **Open Workspace** removed from Lesson and Class.

### H. Planning title / context cleanup

- **h1:** Planning period  
- **Secondary:** `Period 5 · Tuesday, Sep 15` (block label + date)  
- **Context:** Across my preps  
- Removed lens duplicate headings, Back to Teaching Day, Open Workspace.

### I. Now-lane logic audit

**Current behavior (`planningPeriodAttention.ts`):** `now` bucket receives **every lesson on today’s plan** per section (`scheduled-today`), so six sections ⇒ six+ rows — not “current attention only.”

**Proposed narrower rule (product decision):** intersect `now` with stopped in-progress items, section-behind signals, or the single next prep before the planning block — **not implemented** (would change planning semantics).

**Action this pass:** Document only; logic unchanged.

### J. Workspace dimming + entry-point cleanup

- Planner canvas + stage header softened when `data-workspace-open='true'` (opacity + slight desaturate; no modal/blur).
- Inline Open Workspace removed from Day surfaces; **WORKSPACE** index tab is canonical (smokes updated).

### K. Recovery visibility changes

- Header copy: `Recovery (n)` with compact styling; still only when count > 0.

### L. Copy removed / reduced

- Setup bell-time button on Day removed.
- Planning bucket empty rows quiet (no “Nothing here from canonical…”).
- Non-teaching lens one line.
- Workspace empty state shortened (no “Capture first…” essay).

### M. Accessibility results

- One **h1** per state preserved.
- Week tiles `tabIndex={0}` when actions exist; `:focus-within` reveals controls.
- Full lesson/course names on `title` / `aria-label` where truncated.
- Smokes: lesson single h1; keyboard path via focus-within pattern.

### N. Responsive results

- Evidence: `08-mobile-day.png`, `09-mobile-week.png` (390px).
- Week actions use touch reveal on tile tap (`is-actions-revealed`).

### O. Tests

- Contracts: setup gauntlet legacy case.
- Smokes: `plan-navigation`, `plan-p5`, `plan-week`, `repair-pass-2` — all green against preview.

### P. Evidence paths

`docs/overnight/evidence/repair-pass-2/`

- `01-day-clean.png` … `09-mobile-week.png`, `00-contact-sheet.png`
- Before comparison: `docs/overnight/evidence/plan-navigation/`, `plan-week/`, `plan-p5/` (Pass 1 / pre–Pass 2 stills)

### Q. Remaining RED issues

- **Now lane semantics** — still “all of today’s plan” until product approves a narrower rule.
- **Class → Day retreat** — no inline “Back to Teaching Day”; teachers rely on Return to Teaching Day / period rail (DAY tab does not retreat focus alone).

### R. Remaining YELLOW issues

- Week **Open** lesson path still only from Day class cards (Week remains glance-first by design).
- Empty planning buckets are visually blank — intentional calm; may need one-line hint in Settings/help only.

### S. Recommendation

**GREEN FOR NEXT RUTHLESS UX REVIEW** — Pass 2 success criteria met: setup hidden for gauntlet, single lesson/planning titles, week actions disclosed, Workspace dimming + tab entry, primary Start class, no Month/Year/ArcTable regression in touched paths. Escalate **Now** bucket semantics before another logic pass.

---

## Progressive disclosure matrix (internal)

| Control | Default | Hover/focus | Selected | Menu | Touch | Keyboard |
|---------|---------|-------------|----------|------|-------|----------|
| Move | Hidden | Week tile hover/focus | `.is-actions-revealed` | — | Tap tile | Tab to tile → actions |
| More | Hidden | Same | Same | Expands Review Shift | Same | Same |
| Open | Removed inline | — | — | — | — | WORKSPACE tab |
| Recovery | Hidden unless count | — | — | — | — | Header when visible |
| Workspace | Tab only | — | Overlay open | — | Tab | Tab + Escape close |
| Note | + Note collapsed | — | Composer open | — | Tap + Note | Focus composer |
| Setup | Hidden when min setup | — | — | — | — | Settings / teaching-day mode |
| Delete | Workspace capture | — | — | — | — | Button in card |
| Start class | Visible Day | — | — | — | — | Primary button |

---

## Teacher scenario test (manual / smoke-derived)

| Scenario | Result |
|----------|--------|
| A. Start of day — next class < 3s | **Pass** — period rail + My Teaching Day + no setup noise |
| B. Week glance without action links | **Pass** — titles dominate until hover/focus/tap |
| C. Lesson — teach + Start class | **Pass** — one title, Start class primary |
| D. Planning P5 — attention without duplicate labels | **Pass** — state header only |
| E. Workspace capture + context | **Pass** — dimmed planner, tab entry |
| F. Note | **Pass** — + Note unchanged from Pass 1 |
