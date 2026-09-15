# Arc

Calendar-first teacher planning for plans that change.

This repository is the implementation source for Arc. Product and UX authority live in the canonical Google Drive Product Spec. Visual authority lives in the canonical Wax & Wing Brand System. Git history is implementation history, not product authority.

**Arc wood desk (Kelly) — current build on `main`:**

```bash
git clone https://github.com/waxandwing/arc-greenfield.git
cd arc-greenfield && npm install
npm run kelly:desk
```

Demo URL (after the server starts): `http://127.0.0.1:4173/?demo=1&demoReset=1`  
GitHub Pages: `https://waxandwing.github.io/arc-greenfield/?demo=1&demoReset=1`  
Confirm the bottom-right footer stamp shows **`desk-v2 · main · <sha>`**. Full handoff: [`docs/overnight/ARC-CURSOR-RESTRUCTURE-HANDOFF.md`](docs/overnight/ARC-CURSOR-RESTRUCTURE-HANDOFF.md).

## Branch authority

- `main` is the single current implementation authority.
- New work should use a short-lived branch only when isolation is useful, then land back on `main` and delete the branch.
- Do not create permanent parallel `develop`, `preview`, `release`, `design`, `audit`, or agent-coordination lanes for ordinary work.
- Historical branches are donors only. They do not outrank current `main` because they contain unique commits or still compile.
- The 2026-09-15 prune manifest in `docs/BRANCH_PRUNE_MANIFEST_2026-09-15.md` governs branch retirement.

The former product name **Easel** is retired. Its surviving teaching-continuity logic now lives directly under ArcTable naming in `src/planning/arcTableSession.ts` and `src/planning/arcTableTeachingOutcome.ts`.

## Authority order

When implementation sources disagree:

1. canonical Product Spec
2. canonical Brand System and approved Arc assets
3. current verified `main`
4. implementation issues or short-lived branches that explicitly cite the current authorities
5. README operating rules
6. historical branches, comments, prototypes, and archived reports

Historical code does not become authority because it still compiles.

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

A component is not a state store. A view is not a second domain model. React should not own transaction policy. Domain modules must not depend on React or presentation code.

Primary ownership:

- `src/calendar/**` — school-calendar truth, date geometry, calendar persistence, projections.
- `src/planning/**` — Course/Section/Unit/Lesson identity, delivery state, Shift/Recovery, ArcTable teaching continuity, object actions, planning persistence.
- `src/app/**` — application orchestration, hydration order, reconciliation, React adapter state.
- `src/components/**` — presentation and interaction only.
- `src/styles/**` — perceptual system only.

## Trust rules

- calendar stays at the center;
- one shared Course/Unit/Lesson plan; Sections carry actual teaching state;
- missing calendar truth is unknown, never silently instructional;
- fixed dates stay fixed;
- preview before consequence;
- no silent loss, cascade deletion, hidden auto-repair, or fake saves;
- completed/skipped teaching history is terminal unless an explicit future product rule says otherwise;
- Shift changes only its target Section;
- Undo must refuse to overwrite newer truth;
- destructive upstream edits fail closed when they would orphan protected downstream state;
- ArcTable is a temporary Arc teaching mode, never a second planner or state store.

## Persistence

Browser persistence is currently local-first. Loaders distinguish `empty`, `restored`, `invalid`, and `unavailable` and must fail closed.

Operations that span multiple stores must use an explicit transaction boundary with compensating rollback where required. UI code must not invent its own partial-save semantics.

## Accessibility contract

Accessibility is part of the interaction model, not cleanup work. Essential controls must remain keyboard/click/touch operable, focus visible, readable at zoom/small-laptop sizes, and understandable without relying on color, texture, handwriting, hover, or dragging alone.

## Verification

Core gate:

```bash
npm run build
```

This runs canonical contracts, TypeScript checks, and the production bundle. Desk/interaction changes should also run the relevant focused smoke suites documented in `package.json` and the current handoff.


## School load (NCES)

Calendar Setup always shows **Load school** before manual dates. Live lookup uses `/api/nces` (Vercel/server proxy to the NCES public-school layer). On static hosts such as GitHub Pages — or when the proxy is unreachable — Arc falls back to a small curated local school directory (`src/calendar/localSchoolDirectory.ts`) so teachers can still complete the identity step. Fallback results are labeled honestly; they never invent calendar dates.

## Working rule

Build the system, not the branch. Once a short-lived branch has landed on `main`, delete it. If historical code appears useful, mine the behavior or preserve a deliberate archive tag before branch deletion rather than keeping another permanent implementation lane.
