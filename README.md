# Arc

Calendar-first teacher planning for plans that change.

This repository is the implementation source for Arc. Product and UX authority live in the canonical Google Drive Product Spec. Visual authority lives in the canonical Wax & Wing Brand System. GitHub issues translate those authorities into implementation work.

**Arc wood desk (Kelly):** The Teaching week desk is on branch `cursor/arc-production-integration`, not `main`. Start here: [`docs/overnight/ARC-CURSOR-RESTRUCTURE-HANDOFF.md`](https://github.com/waxandwing/arc-greenfield/blob/cursor/arc-production-integration/docs/overnight/ARC-CURSOR-RESTRUCTURE-HANDOFF.md) on that branch (preview steps, project folder vs wrong branch).

## Branch authority

- `main` — protected release branch. Do not develop directly here.
- `develop` — integrated pre-release source of truth. Branch protection is currently being tightened under issue #30; until that lands, treat direct pushes as prohibited by team policy.
- `feature/**` — isolated implementation work. Rebase/adapt to current `develop` before integration.
- `audit/**` — temporary hostile-audit and verification lanes.
- `archive/**` — preserved historical checkpoints only.

Old Easel branches and repositories are historical reference. Easel is no longer a separate product. Its surviving classroom-teaching behavior belongs to Arc Live Classroom.

## Authority order

When implementation sources disagree:

1. canonical Product Spec
2. canonical Brand System and approved Arc assets
3. current verified `develop`
4. implementation issues/PRs that explicitly cite the current authorities
5. README operating rules
6. historical branches, comments, and prototypes

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
- `src/planning/**` — Course/Section/Unit/Lesson identity, delivery state, Shift/Recovery, object actions, planning persistence.
- `src/app/**` — application orchestration, hydration order, reconciliation, React adapter state.
- `src/components/**` — presentation and interaction only.
- `src/styles/**` — perceptual system only.

`src/app/useArcWorkspace.ts` is currently being decomposed under issue #30. Do not add new Fridge, Voice, Personal, School Notes, Catch Up, or Live Classroom transaction policy to that hook.

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
- Live Classroom is a temporary Arc teaching mode, never a second planner or state store.

## Persistence

Browser persistence is currently local-first. Loaders distinguish `empty`, `restored`, `invalid`, and `unavailable` and must fail closed.

Operations that span multiple stores must use an explicit transaction boundary with compensating rollback where required. UI code must not invent its own partial-save semantics.

Current transaction/persistence hardening is tracked in issue #30.

## Accessibility contract

Accessibility is structural, not a polish pass.

- use semantic HTML and native controls where possible;
- no ARIA role without its required interaction behavior;
- no state communicated only by color, opacity, position, or motion;
- core body/interface text stays at least 16px; smaller text is metadata only and must remain readable;
- interactive targets must remain usable by keyboard and touch;
- drag is optional enhancement; every drag action requires equivalent non-drag behavior;
- focus must remain visible and predictable;
- reduced-motion preferences are respected;
- 320px/reflow/high-zoom behavior is a release concern;
- browser interaction proof is separate from source compilation;
- automated accessibility checks are evidence, not absolution.

The permanent browser accessibility gate is being established under issue #30. Draft PR #29 contains the first hostile Day keyboard/touch/reflow proof and a repaired focus-order defect.

## Verification

Repository Node version is declared in `.node-version`.

Local full gate:

```bash
npm ci
npm run build
```

The build contract is intentionally decomposable:

```bash
npm run test:contracts
npm run typecheck
npm run build:bundle
```

CI reports separate gates for:

- domain contracts
- TypeScript
- production bundle
- browser accessibility/interaction
- Arc Plan navigation spine (`npm run test:plan-navigation` against a running preview)

`tests/run-contracts.mjs` verifies that every discovered `*.contract.ts` file is represented in the contract runner. Adding a contract that CI does not execute must fail the gate.

### Skip setup (demo calendar)

To open Arc straight on **My Teaching Day** with prefilled AP / 2D / 3D content (same data as plan smokes):

- **URL:** add `?demo=1` or `?demo=gauntlet` (first visit, or when local storage is empty).
- **Reset and re-seed:** `?demo=1&demoReset=1` overwrites saved data and reloads.
- **Build flag:** set `VITE_ARC_DEMO=true` before `npm run build` so empty browsers auto-seed without a query string.

Onboarding, first-capture prompt, and progressive setup are skipped once the demo bundle is written.

Example preview URL: `http://127.0.0.1:4173/?demo=1`

### Local desk preview (integration branch)

The Arc **desk** build lives on `cursor/arc-production-integration`, not on `main`.

**Run all commands from the repo root** (the folder that contains `package.json`). Running `git` or `npm` from home (`~`) fails with “not a git repository” and missing `package.json`. If the repo is already on disk, `cd` to that clone first.

```bash
git clone https://github.com/waxandwing/arc-greenfield.git
cd arc-greenfield
git fetch origin
git checkout cursor/arc-production-integration
git pull origin cursor/arc-production-integration
npm install
npm run preview:desk
```

Open `http://127.0.0.1:4173/?demo=1&demoReset=1`. Still seeing cream **CALENDAR** chrome? [docs/overnight/KELLY-STILL-SEEING-OLD-CALENDAR.md](docs/overnight/KELLY-STILL-SEEING-OLD-CALENDAR.md). See [docs/LOCAL-PREVIEW.md](docs/LOCAL-PREVIEW.md) for dev server, smokes, and aliases (`dev:desk`, `start:desk`).

**Work on your Mac (not cloud VM):** bookmark [docs/WORK-FROM-GITHUB-LOCALLY.md](docs/WORK-FROM-GITHUB-LOCALLY.md) and the full handoff [docs/overnight/ARC-CURSOR-RESTRUCTURE-HANDOFF.md](docs/overnight/ARC-CURSOR-RESTRUCTURE-HANDOFF.md).

## Integration rule

No material feature is GREEN merely because it compiles.

The default milestone cadence is:

```text
implementation
→ hostile break pass
→ repair
→ independent clean audit
→ second independent clean audit on the exact final head
→ GREEN
```

Any material code change resets the clean-pass count.

## Deployment

GitHub Actions is the canonical source/build verification gate. Do not use a deployment result as a substitute for source or browser-interaction proof.

Vercel is not an implementation authority and should not be allowed to mutate product architecture. Current deployment policy may change independently of repository truth.

## Current hardening authority

Issue #30 — Infrastructure + accessibility constitution — owns the current backend/a11y cleanup: branch policy, permanent browser gates, orchestration decomposition, persistence vocabulary, contract discovery, CI/runtime hygiene, and reusable accessibility interaction rules.

## Release wall

Nothing moves to `main` until the relevant product, functional, visual, accessibility, persistence, account-isolation, regression, exact-build, browser-interaction, and dependency-lock gates are explicitly cleared.
