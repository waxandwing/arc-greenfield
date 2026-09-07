# Arc

Calendar-first teacher planning for plans that change.

This repository is the implementation source for Arc. The canonical **ARC Master Operating Document — Production Authority** is the top project authority. The Product Spec, Desktop Interaction Blueprint, Brand System, canonical assets, Bug Fix Log, and current B01–B12 execution checkpoints are subordinate truth documents and must remain consistent with the Master.

## Branch authority

- `main` — protected release/source branch. Do not develop directly here.
- `develop` — protected integrated pre-release implementation authority.
- feature/design/reconcile branches — isolated implementation work. They must start from or reconcile back to current `develop` before integration.
- `audit/**` — temporary hostile-audit and verification lanes only.
- `archive/**` — preserved historical checkpoints only.

Old Easel branches and repositories are historical reference. Easel is no longer a separate product. The surviving classroom-teaching concept is **Live Classroom** and remains a future Arc teaching surface rather than a second planner.

## Authority order

When sources disagree, resolve them in this order:

1. ARC Master Operating Document — Production Authority
2. explicit founder decisions recorded after the last Master reconciliation
3. canonical Product Spec / Desktop Interaction Blueprint / Brand System / approved Arc assets, as constrained by the Master
4. current verified protected `develop`
5. current B01–B12 implementation issue/PR for the active batch
6. Bug Fix Log and discrepancy register for unresolved structural defects
7. README operating rules
8. historical branches, comments, prototypes, rejected previews, and archived artifacts

Historical code does not become authority because it still compiles.

## Current execution state

- B01 — Green / frozen
- B02 — Green / frozen
- B03/B04 — Green / frozen
- B05/B06 — Green / frozen
- B07 — active: Interaction Engine Reconciliation, issue #96
- B08+ — not authorized to expand until their governed batch begins

A material regression in a frozen batch reopens only the affected evidence; it does not authorize unrelated redesign.

## Architecture

Arc keeps one canonical planning truth. Views are lenses over that truth, not independent models.

```text
UI / React
    ↓
application commands + orchestration
    ↓
domain rules
    ↓
persistence adapters
```

A component is not a state store. A view is not a second domain model. React must not invent transaction policy. Domain modules must not depend on presentation code.

Primary ownership:

- `src/calendar/**` — school-calendar truth, date geometry, calendar persistence, projections.
- `src/planning/**` — Course/Section/Unit/Lesson identity, Notes/Task Bar truth, delivery state, Shift/Recovery, object actions, planning persistence.
- `src/app/**` — application orchestration, hydration order, reconciliation, React adapter state.
- `src/components/**` — presentation and interaction only.
- `src/styles/**` — perceptual system and semantic visual tokens only.

Task Bar uses canonical `PlanningWorkspace` Note state; it is not a second task store. Fridge behavior must reuse the canonical planning transaction path. Live Classroom currently has only a dormant exact-context extension seam and no customer-facing placeholder behavior.

## Trust rules

- calendar stays at the center;
- one shared Course/Unit/Lesson plan; Sections carry sparse teaching divergence;
- missing calendar truth is unknown, never silently instructional;
- fixed dates and fixed anchors stay protected;
- preview before consequence;
- no silent loss, cascade deletion, hidden auto-repair, fake saves, or success-adjacent UI after a rejected mutation;
- completed/skipped teaching history is preserved unless an explicit later product rule authorizes otherwise;
- Shift changes only its target Section;
- Undo must refuse to overwrite newer truth;
- destructive upstream edits fail closed when they would orphan protected downstream state;
- keyboard/touch/non-drag operation is a product requirement, not optional polish;
- Live Classroom is a future temporary teaching mode, never a second planner or state store.

## Accessibility contract

Accessibility is structural.

- semantic HTML and native controls where possible;
- no ARIA role without its required behavior;
- no state communicated only by color, opacity, position, or motion;
- core interface text remains readable and governed by the Brand/accessibility rules;
- interactive targets must remain usable by keyboard and touch;
- drag, where introduced, requires equivalent non-drag behavior;
- focus must remain visible, deterministic, and recover after transient UI closes;
- reduced-motion preferences are respected;
- 320/390px reflow, small-laptop behavior, and 200–400% zoom are release concerns;
- browser interaction proof is separate from source compilation;
- automated accessibility checks are evidence, not absolution.

## Verification

Repository Node version is declared in `.node-version`.

Local full gate:

```bash
npm ci
npm run build
```

The build contract remains decomposable:

```bash
npm run test:contracts
npm run typecheck
npm run build:bundle
```

CI must preserve the frozen regression gates for completed batches while the active batch adds its own primary and meaningfully independent rendered/runtime evidence.

No material feature is Green merely because it compiles. Default milestone cadence:

```text
implementation
→ hostile break pass
→ repair
→ rendered/runtime audit
→ independent clean audit
→ unchanged repeat after final material change
→ GREEN
```

Any material change resets the relevant clean-pass count.

## Deployment

GitHub Actions is the canonical source/build verification gate. A deployment result is never a substitute for source or browser-interaction proof.

Current Arc implementation work does **not** authorize Vercel, `main`, or production deployment. `vercel.json` retains the Git deployment guard. Deployment requires a separate explicit founder authorization.

## Current work

Issue #96 — **B07: Interaction engine reconciliation must reach Green** — is the active governed batch. It owns reconciliation of currently visible create/edit/move/unplace/delete/range/Shift/Undo/recovery behavior against canonical domain, history, persistence, Section, fixed-anchor, cross-view, and accessibility truth.

## Release wall

Nothing moves to `main` until the relevant product, functional, visual, accessibility, persistence, account-isolation, regression, exact-build, browser-interaction, dependency-lock, and founder-authorization gates are explicitly cleared.