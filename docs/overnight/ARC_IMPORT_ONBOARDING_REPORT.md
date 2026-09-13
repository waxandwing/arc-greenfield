# Arc Import + Onboarding Production Report

Date: 2026-09-13

Branch: `codex/arc-multiprep-arctable-integration`

Starting HEAD: `a8ec1be`
Final HEAD: recorded in the post-push terminal summary; a commit cannot contain its own SHA

Overall status: **GREEN** for progressive first-run onboarding, explicit Planning/day-order truth, curriculum CSV parse/review/confirm, atomic canonical commit, stable provenance, and re-import conflict protection. The intentionally narrower import lanes listed below remain **YELLOW** rather than being represented as finished.

## Product-law boundary

`Arc proposes. Teacher confirms.` is enforced in code and browser evidence:

```text
CSV file / pasted CSV
  → bounded parser
  → temporary row candidates
  → ambiguity hold
  → source / Arc proposal review
  → duplicate and re-import decisions
  → explicit Confirm import
  → validated Course + Unit + Lesson transaction
  → receipt
```

Parse, classification, ambiguity review, Back, and Cancel perform no canonical Course, Unit, or Lesson write. Confirmation validates all three next workspaces before writing. Browser storage is snapshotted and restored if any of the three writes fails. React state changes only after the transaction succeeds.

## Status matrix

| Capability | Product result | Status |
|---|---|---|
| Independent setup capabilities | Calendar, Courses, Sections, day order, Planning, bell times, curriculum, and profile are assessed independently from real truth | **GREEN++** |
| Returning teacher | Existing valid users bypass first-run; incomplete capability prompts stay contextual | **GREEN** |
| Partial onboarding | Confirmed stages and unconfirmed form drafts survive refresh; Back reopens the unresolved stage | **GREEN++** |
| Minimum first run | Welcome → school year → shared Course/repeated Sections → explicit day order/Planning → real Day | **GREEN++** |
| Optional setup | Bell times, curriculum, and profile do not block Day | **GREEN++** |
| Explicit Planning block | Planning/non-teaching/teaching types are canonical and persisted; Day uses explicit blocks when present | **GREEN++** |
| Older planning state | Workspaces without teaching-day data still hydrate and use the compatibility projection | **GREEN** |
| First-use Capture | Capture saves immediately, may remain loose, and offers the real Workspace placement path | **GREEN++** |
| Curriculum CSV acquisition | File picker and paste path feed one bounded parser; source content is never stored as canonical truth | **GREEN** |
| CSV parser | Canonical fields, aliases, quotes, escaped quotes, BOM, CRLF, whitespace, mixed supported item types, extra cells, missing fields, duplicate headers, row limit, and source-size limit covered | **GREEN++** |
| Ambiguity | Unsafe rows are held from proposal by default and explained; teacher may return to source and retry | **GREEN** |
| Proposed structure | Course → Unit → Lesson hierarchy, unscheduled placement, exact counts, held rows, and source references are visible before confirmation | **GREEN++** |
| Existing Course match | Same-title Course is never silently merged; teacher explicitly chooses existing Course or separate creation | **GREEN++** |
| Duplicate Lesson titles | Separate source rows remain separate Lessons with distinct IDs | **GREEN++** |
| Atomic canonical commit | Planning, Unit, and Lesson stores write as one compensating transaction with hostile failure/rollback coverage | **GREEN++** |
| Import provenance | Source type, source identity, row, structural path, stable fingerprint, source value hash, and import time persist on imported truth | **GREEN++** |
| Identical re-import | Unchanged Unit/Lessons are recognized and skipped without duplication | **GREEN++** |
| Changed/local conflict | Upstream change, local change, and conflict are distinct; Keep local / Use source / Create copy require explicit selection | **GREEN++** |
| Removed-upstream handling | Existing imported records absent from a later source are preserved; dedicated removal review is not implemented | **YELLOW** |
| Inline row correction | Ambiguous rows are held and explained, but classification/field editing happens by correcting the source and retrying | **YELLOW** |
| Date-aware curriculum placement | Canonical curriculum CSV has no governed date field, so import stays honestly unscheduled | **YELLOW** |
| School-calendar source | Existing official identity/proposal/review flow remains the shared lane | **GREEN** |
| Bell-schedule import | Shared Import routes to explicit manual day/bell setup; file parsing and alternate-day variants are not implemented | **YELLOW** |
| Course/Section import | Shared Import routes to the governed repeated-Section editor; a source-file parser is not implemented | **YELLOW** |
| Prior Arc reuse | Visible as unavailable; no mutable historical IDs are reused | **YELLOW** |
| Profile | Independent and optional; no profile UI was needed for planner access | **YELLOW** |
| External 12ui comparison | Required skill guidance was applied, but the `12ui` executable is not installed in this workspace; local image review and browser geometry were completed | **YELLOW** |

Known RED bugs: none observed in the completed verification suite.

## Canonical model changes

- `PlanningWorkspace.teachingDay` is optional for stored-state compatibility and contains ordered teaching, Planning, and non-teaching blocks with optional paired times.
- Imported `Course`, `Unit`, and `Lesson` records may carry one optional provenance object. Existing manual records remain valid without it.
- Lessons remain the one canonical Lesson model. Imported directions/resources/notes map into existing Lesson content fields; no importer-owned Lesson truth persists after confirmation.
- Curriculum without governed dates imports as unscheduled Unit/Lesson structure. It does not invent calendar placement.

## Progressive onboarding

- The welcome state uses the current Arc editorial/tactile family, not notebook or SaaS-wizard chrome.
- “Start simple” remains available and enters the existing manual calendar path without forcing the full sequence.
- The guided path persists draft inputs without committing them as canonical state.
- After explicit Planning is established, onboarding lands directly in Day.
- Quiet in-product prompts offer teaching-day completion and curriculum import only when relevant.
- The first Capture saves to the existing Workspace store and offers Place it / Leave it here; it does not create a tutorial-only object.

## Verification evidence

Contract coverage lives in:

- `src/planning/teachingDay.contract.ts`
- `src/planning/setupCapabilities.contract.ts`
- `src/planning/onboardingPersistence.contract.ts`
- `src/planning/curriculumImport.contract.ts`
- `src/planning/curriculumImportCommit.contract.ts`

End-to-end coverage lives in `tests/import-onboarding.smoke.mjs` and proves first run, partial refresh, repeated Sections, explicit Planning, optional bell times, Day landing, Capture persistence, file selection, no-write parse/review/cancel, explicit Course match, atomic commit, refresh, identical re-import, real local Lesson edit, changed upstream conflict, keep-local resolution, 200%/400% zoom, and 390px onboarding/import review.

Fresh screenshots are in `docs/overnight/evidence/import-onboarding/`:

1. `01-welcome.png`
2. `02-school-year.png`
3. `03-courses-sections.png`
4. `04-build-my-day.png`
5. `05-bell-time-ambiguity.png`
6. `06-first-day.png`
7. `07-first-capture.png`
8. `08-import-source.png`
9. `09-parse-result.png`
10. `10-ambiguity-review.png`
11. `11-proposed-structure.png`
12. `12-change-preview.png`
13. `13-duplicate-resolution.png`
14. `14-confirmed-receipt.png`
15. `15-reimport-conflict.png`
16. `16-390-onboarding.png`
17. `17-390-import-review.png`

Additional persistence evidence: `18-teaching-day-return.png` and `19-identical-reimport.png`.

### Observed final verification

- `npm run build` — 50 contract groups, type-check, and production bundle
- `node tests/import-onboarding.smoke.mjs`
- `node tests/arc-plan-continuity.smoke.mjs`
- `node tests/browser-a11y.smoke.mjs`
- `node tests/phase2-planning-truth.mjs`
- `node tests/phase2-nondrag-keyboard-parity.mjs`
- `node tests/phase2-object-actions-section-divergence.mjs`
- `node tests/phase2-recovery-undo-continuity.mjs`
- `node tests/phase2-calendar-edge-planning-truth.mjs`
- `node tests/arctable-continuity.smoke.mjs`
- `git diff --check`

No uncaptured command is represented as passing. Browser commands ran against the local Vite workspace only; no deployment was created.

## Guardrails

- No merge or deployment occurred.
- `main` and `design/v1-current-laws-reconciliation` were not modified.
- Vercel and Vercel configuration were not touched.
- ArcTable naming and continuity architecture were not changed.
- No LMS/SIS, Google Drive, billing, collaboration, AI-generation, or legacy notebook/Fridge appearance was introduced.
