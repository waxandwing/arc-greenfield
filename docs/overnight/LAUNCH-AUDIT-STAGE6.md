# Launch audit — Stage 6

**Repo:** waxandwing/arc-greenfield  
**Branch:** `cursor/arc-production-integration`  
**HEAD:** `e31fabd` (Stage 5: governed onboarding + import in Arc Plan shell)  
**Date:** 2026-09-14  
**Scope:** End-to-end teacher journey audit; RED launch blockers only; no merge, deploy, final skin, Cross Out implementation, or broad Undo expansion.

## Journey exercised

| Step | Method | Result |
|------|--------|--------|
| New / returning user → Teaching Day | `test:plan-onboarding-import`, `test:import-onboarding`, gauntlet fixture smokes | PASS |
| Class → Lesson → Workspace → return | `test:plan-navigation`, view gates (Week/Month/Year) | PASS |
| Week → Month → Year | `test:plan-week`, `test:plan-month`, `test:plan-year`, `test:browser-plan` | PASS |
| Planning period → Needs attention → deep links | `test:plan-p5` | PASS |
| Move → Shift → recovery | `test:plan-move-shift`, phase2 recovery suite, `test:browser-plan` | PASS |
| Import → return to Plan | onboarding/import smokes | PASS |
| Start Class → ArcTable → Plan View → Return Live → End Class | `tests/arctable-continuity.smoke.mjs`, launch-audit evidence | PASS |

---

## A. Navigation & context spine

**Severity: GREEN**

- Teaching Day remains the home anchor; Class / Lesson focus preserves date, Section, and divergence cues.
- Workspace opens as a viewport-contained overlay without mutating persisted context or ArcTable live storage (all view gates).
- Stale `lessonId` / `sectionId` in persisted context fail closed to safe Week/Day focus (navigation smokes).
- Planning period deep links (stopped lesson → Lesson focus; section-behind → Week) and explicit return paths work (`test:plan-p5`).
- Cross-view continuity (Year → Month, refresh restores view/date/course/section) covered by continuity and RGAV gates.

No RED defects found in this category.

---

## B. Responsive (390px, 200%, 400%)

**Severity: GREEN (shell) / YELLOW (dense grids)**

| Surface | 390px document overflow | Region scroll | Launch classification |
|---------|-------------------------|---------------|------------------------|
| Week (gauntlet) | No (`scrollWidth` ≤ `clientWidth`) | No internal overflow on `.planning-week` | **Tolerable** — readable at narrow width in fixture |
| Year (gauntlet) | No document overflow | `.planning-year` `scrollWidth` 892 vs `clientWidth` 850 | **Tolerable horizontal scroll** — expected for three Course lanes; not shell-breaking |
| Onboarding / import review | Gates assert no document overflow | — | GREEN |
| ArcTable Teacher / Student | Gates assert no document overflow at 390px | — | GREEN |
| 200% / 400% zoom | `test:browser-a11y` shell stress | — | GREEN (automated); full 400% human visual sign-off remains YELLOW |

Evidence: `docs/overnight/evidence/launch-audit/week-390.png`, `year-390.png`, `scroll-metrics.json`.

No RED launch blockers (no clipped primary chrome or document-level horizontal trap on Week/Year at 390px).

---

## C. Accessibility

**Severity: GREEN**

- Landmarks, skip link, keyboard order, validation focus, dynamic row names, 44px touch targets, reduced motion, and runtime cleanliness: `test:browser-a11y` PASS.
- Phase 2 keyboard parity (move, unplace, recovery apply, undo) PASS.
- ArcTable live tools (timer, people, passes, media) expose labels and keyboard paths in continuity smoke.

No RED defects found.

---

## D. Move / Shift / Recovery

**Severity: GREEN++**

- Governed Move: preview → confirm; shared Lesson date persists; fixed Lessons surfaced in consequences (`test:plan-move-shift`, contracts).
- Section Shift / recovery: in-progress Section, resume note, fixed-anchor protection, explicit Apply, Undo, reload persistence (phase2 recovery + `test:browser-plan`).
- Needs-attention entry from Month (`Review recovery`) returns to recovery review without silent mutation.

Evidence: `docs/overnight/evidence/launch-audit/move-shift-recovery.png` (Shift review from Class focus).

No RED defects found.

---

## E. Onboarding & import

**Severity: GREEN (composed shell) / YELLOW (curriculum CSV scope)**

- First-run welcome → school year → classes → build my day → Teaching Day inside Plan shell: `test:plan-onboarding-import` PASS.
- Progressive onboarding + official calendar parse/review/commit/re-import/conflict: `test:import-onboarding` PASS.
- Curriculum CSV importer and prior-year reuse remain out of scope (documented YELLOW in completeness matrix).

No RED defects on the composed first-run path.

---

## F. ArcTable continuity

**Severity: GREEN++**

- Plan navigation does not create or corrupt `arc.arctable.live.v1` when no session is active; live sessions survive Plan View round trips (timer, passes, media, cleanup) — all view gates + `arctable-continuity.smoke.mjs`.
- End Class clears live storage only after explicit outcome; delivery state writes are Section-scoped; post–End Class return to Teaching Day and new session boundaries verified in continuity smoke.

Evidence: `plan-view-during-live-class.png`, `post-end-class-teaching-day.png`.

No RED defects found.

---

## G. Legacy visual architecture flags

**Severity: GREEN**

Automated DOM checks during evidence capture:

- No visible “Fridge” product copy on Plan surfaces (internal `b01` / `fridgeRoundTrip` compatibility names only).
- No journal spine, notebook page, or legacy permanent side-furniture selectors in DOM (`scroll-metrics.json` → `legacyDom`).
- Shell uses quiet utility rail + contextual Workspace/Settings/Tasks (aligned with Stage 5 / continuity reports).

No RED regressions toward retired notebook / Fridge chrome.

---

## Cross Out (product law — not implemented)

**BLOCKED BY PRODUCT LAW**

- No governed Lesson “Cross out” control or canonical state exists in UI or domain (`ARC_PLAN_COMPLETENESS_MATRIX` RED row).
- Not treated as a Stage 6 engineering RED fix without product definition (Section skip vs cancellation vs presentation-only).
- Safe for launch **if** marketing/copy does not promise Cross out.

---

## H. Recommendation

**READY FOR FINAL SKIN** — with explicit non-blockers:

1. **Cross Out** — product law decision before any launch copy references it.  
2. **YELLOW carry-forward** — narrow Undo breadth, Note in-place edit, curriculum CSV / prior-year reuse, bell-schedule modeling, 400% human visual pass on dense Month/Week/Year, optional URL/history for view transitions.  
3. **Year at 390px** — intentional inner horizontal scroll on Course lanes; acceptable for launch per matrix law.

No Stage 6 code RED fixes were required; baseline remained green at `e31fabd`.

---

## RED blockers (Stage 6)

| ID | Description | Status |
|----|-------------|--------|
| — | None identified on the audited journey | **None open** |

---

## YELLOW items (recorded)

- Lesson **Cross out** semantics undefined (see above).
- **Undo** beyond Shift + last Workspace round-trip.
- **Notes** create/delete without in-place edit.
- **Curriculum CSV** and prior-year Course/Unit reuse.
- **Bell schedule / explicit P5 setup** (P5 lens uses gap inference today).
- **400%** full manual visual acceptance on high-volume Month/Year.
- **Year/Week density** at 320–390px — inner scroll where grids exceed viewport (Year confirmed in metrics).
- **Capture delete** without confirm/undo (matrix YELLOW).

---

## GREEN systems (summary)

Multi-prep Day/Week/Month/Year projections; Planning period attention buckets; Move/Shift/Recovery/Undo; Workspace Capture identity; onboarding + official calendar import composition; persistence + stale-ID recovery; ArcTable optional live loop; a11y/keyboard/reflow gates; legacy shell retirement.

---

## Fixes made (Stage 6)

None — audit-only pass; no RED engineering changes.

---

## Files changed

| Path | Purpose |
|------|---------|
| `docs/overnight/LAUNCH-AUDIT-STAGE6.md` | This report |
| `docs/overnight/evidence/launch-audit/*` | Narrow Week/Year, Planning period, Move/Shift recovery, Plan View during live class, post–End Class Teaching Day, scroll metrics |

---

## Tests (full baseline — all PASS at audit time)

```text
npm run build
npm run test:plan-navigation
npm run test:plan-week
npm run test:plan-month
npm run test:plan-year
npm run test:plan-p5
npm run test:plan-move-shift
npm run test:plan-onboarding-import
npm run test:import-onboarding
npm run test:browser-plan
npm run test:browser-a11y
node tests/phase2-calendar-edge-planning-truth.mjs
node tests/phase2-nondrag-keyboard-parity.mjs
node tests/phase2-object-actions-section-divergence.mjs
node tests/phase2-planning-truth.mjs
node tests/phase2-recovery-undo-continuity.mjs
node tests/rgav-phase2-independent.mjs
node tests/arctable-continuity.smoke.mjs
git diff --check
```

No new regression tests added (no RED fixes).

---

## Evidence

| File | Shows |
|------|--------|
| `evidence/launch-audit/week-390.png` | Week at 390px |
| `evidence/launch-audit/year-390.png` | Year at 390px (inner lane scroll) |
| `evidence/launch-audit/planning-period-390.png` | P5 planning period + buckets |
| `evidence/launch-audit/move-shift-recovery.png` | Review Shift / recovery from Class |
| `evidence/launch-audit/plan-view-during-live-class.png` | Plan View while live session active |
| `evidence/launch-audit/post-end-class-teaching-day.png` | Teaching Day after End Class stop point |
| `evidence/launch-audit/scroll-metrics.json` | 390px scroll measurements + legacy DOM flags |

Additional proof remains in existing overnight evidence trees updated by CI smokes (`plan-navigation/`, `plan-move-shift/`, `arc-plan/`, `import-onboarding/`, etc.).
