# Arc — Current Ruthless Audit

Status: **NO-GO for external beta**

This score is based on the current reconstruction branch plus automated behavioral tests, a production build, and rendered Chromium checks at 1440×900 and 1366×768. Passing source checks alone does not count as product proof.

## Earned evidence

- TypeScript: PASS.
- Behavioral suite: 53/53 PASS at the first rendered checkpoint; additional Year-range tests were added in the next atomic cycle.
- Production Next build: PASS.
- Chromium first-run onboarding: PASS at 1440×900 and 1366×768.
- Chromium Fridge add/open interaction: PASS at both desktop sizes.
- Chromium Week ↔ Month switching: PASS at both desktop sizes.
- No document-level horizontal or vertical overflow at 1440×900 and 1366×768: PASS.
- Core Fridge, Shift, and Save controls appear in keyboard focus order: PASS.
- One planner stylesheet authority is locked by regression test: PASS.
- Unit tree movement / nesting / detach / deletion invariants: PASS in behavioral tests.
- Copy creates new IDs; Cut preserves IDs and is one-shot, including Cut → Undo → Paste defense: PASS.
- Shift preflight now blocks fixed trees and reports lesson collisions before safe apply: PASS in behavioral tests.
- School-year onboarding requires a real first + last student day and rejects reversed ranges: PASS.
- Manual no-school dates feed the same canonical calendar used by instructional-day movement: PASS.

## Current score

**Engineering integrity: 17/20**  
Strong canonical operations, history, tree integrity, build verification, and now real browser smoke tests. Cloud ownership/sync and richer schedule truth are still missing.

**Core teacher workflow: 25/35**  
Week, Month, Quarter, Fridge, Unit trees, MSC, Tack, Extend, Copy-next, reuse, checkpoints, and Shift have meaningful behavior. Day and Semester remain shallower than the strongest views. Year projection is being corrected for mid-month quarter boundaries.

**Usability + interaction clarity: 13/20**  
The full-screen planner now survives the two principal laptop sizes and core controls are keyboard reachable. This is not yet a full keyboard workflow, touch test, 200% zoom test, or screen-reader audit.

**Visual craft + product authenticity: 12/15**  
The planner has one workspace style authority and the calendar remains dominant. Rendered smoke checks prove containment, not art-direction excellence. Exact screenshot-by-screenshot visual critique is still required before this category can score higher.

**Persistence + trust: 4/10**  
Local persistence is truthful. Auth gate architecture exists. Authenticated user ownership, server persistence, Drive mirror/reconciliation, reconnect recovery, and two-account isolation are not yet proven.

### Total: **71/100 — NO-GO**

This is intentionally lower than a marketing score. The architecture is now worth building on, but Arc is not yet ready for an external teacher beta.

## Must Do — next cycle

1. Integrate and browser-test the single-month Year Map projection so a month crossing a quarter boundary is never duplicated.
2. Integrate and browser-test the richer Day teach-from-it loop: active Unit, today’s Lesson, resources, Taught state, short adjustment note, and next Lesson.
3. Expand Shift from weekends/no-school/fixed/collision truth to course meeting patterns and rotating/block schedules.
4. Complete non-drag structural movement in Month/Quarter, including keyboard target selection and Unit nesting paths.
5. Run rendered checks at 200% zoom, reduced motion, high contrast, and touch/mobile sizes.
6. Perform screenshot-level visual audit of every horizon and open folder state; fix hierarchy before adding secondary features.
7. Implement authenticated workspace ownership and hard-reload persistence, then test two-account isolation.
8. Add visible account/sign-out state only when auth is truly configured.
9. Resolve npm dependency vulnerabilities deliberately; do not use a blind force-upgrade.
10. Remove CSS/autoprefixer warnings and avoid accumulating dead or superseded implementation files.

## Explicitly not counted as complete

- Human beta research. Current persona panels are simulated only.
- Live Google login in an environment with real provider configuration.
- Google Drive persistence.
- Mobile/touch parity.
- 200% zoom accessibility.
- Dark mode / compact mode release quality.
- Advanced paid systems such as Sub Plans / Student Leaders.
- The new Day and Year components written after the rendered checkpoint; they must be integrated and pass the same gate before their score is earned.
