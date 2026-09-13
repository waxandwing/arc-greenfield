# Arc Import + Onboarding Implementation Notes

Date: 2026-09-13

Branch: `codex/arc-multiprep-arctable-integration`

Starting HEAD: `a8ec1be`
Authority: `ARC_IMPORT_SYSTEM_SPEC.md`, `ARC_ONBOARDING_SPEC.md`, current Arc Multi-Prep Figma, and current governance/contracts

## Baseline

The working tree was clean at `a8ec1be`. Before implementation, the following were observed passing:

- `npm run test:contracts`
- `npm run typecheck`
- `npm run build`
- `npm run test:browser-plan`
- `npm run test:browser-a11y`
- `node tests/phase2-planning-truth.mjs`
- `node tests/phase2-recovery-undo-continuity.mjs`
- `node tests/arctable-continuity.smoke.mjs`
- `node tests/phase2-object-actions-section-divergence.mjs`
- `node tests/phase2-calendar-edge-planning-truth.mjs`
- `node tests/phase2-nondrag-keyboard-parity.mjs`

No pre-existing test failure was observed.

## Existing foundations to reuse

### Canonical planning truth

- `SchoolCalendar` and its governed source-proposal/review path already separate source acquisition from confirmed calendar truth.
- `PlanningWorkspace` is the canonical Course, Section, and planning-note store.
- `UnitWorkspace` is the canonical Unit store.
- `LessonWorkspace` is the canonical Lesson and Section-delivery store.
- Canonical Lessons already support directions, materials, phases, and resource references.
- Capture is a real persisted object with a stable ID. Promotion to Lesson preserves that ID and text.
- Repeated Sections already share one canonical Course by `courseId`.
- ArcTable continuity projects from canonical planning truth and remains out of scope for architectural replacement.

### UI and navigation

- `CalendarSetup`, `ClassSetup`, `UnitSetup`, and `LessonSetup` are reusable detailed editors.
- `SchoolIdentitySearch` and `SourceCalendarReview` are reusable calendar-import entry and review surfaces.
- `WorkspacePanel` is the existing Capture surface and promotion path.
- `SettingsFurnitureContent` and `WorkspaceStage` are the current shared entry-point seams.
- The current edge-to-edge Arc Plan shell is retained. New work must not restore the journal spine, notebook page, visible Fridge, or legacy permanent furniture.

## Missing or incomplete capabilities

- No independent capability-based setup state exists.
- First-run currently falls directly into the full calendar editor rather than a resumable minimum setup flow.
- Planning time is inferred in Day from a missing numeric period; no explicit teaching-day block model exists.
- No curriculum CSV parser, candidate model, ambiguity model, preview receipt, or re-import comparison exists.
- Courses, Units, and Lessons have no import provenance or local-edit comparison metadata.
- No atomic persistence boundary currently spans planning workspace, Units, and Lessons.
- There is no shared Import entry point in Settings or Workspace.
- There are no governed progressive prompts for missing bell times or curriculum.

## Canonical write boundaries

Current browser keys are:

- `arc.calendar.v1`
- `arc.planningWorkspace.v1`
- `arc.units.v1`
- `arc.lessons.v1`
- `arc.shift.v1`
- `arc.captures.v1`

Current writes occur through `useArcWorkspace`:

- calendar confirmation calls `saveCalendarToBrowser`
- Course/Section confirmation calls `savePlanningWorkspaceToBrowser`
- Unit confirmation calls `saveUnitsToBrowser`
- Lesson confirmation uses the existing Lesson + Shift transactional persistence helper
- Capture saves immediately; Capture promotion compensates if the second save fails

The curriculum importer must not call the three canonical planning writers independently. It needs a validated transaction that snapshots the three storage values, writes the complete candidate set, and rolls all three back if any write fails. In-memory React state must update only after that transaction reports success.

## Dangerous mutation paths

- Reusing `useClasses`, `useUnits`, and `useLessons` sequentially would expose partial imported truth if a later write failed.
- Matching Courses, Units, or Lessons by title alone would collapse legitimate repeated content.
- Treating parse/classify/review state as canonical would violate the confirmation boundary.
- Re-import without a stable source fingerprint could overwrite local Lesson edits.
- Persisting one binary `onboardingComplete` flag would hide partial validity and force unnecessary re-entry.
- Keeping the numeric-period gap heuristic as product truth would continue to mislabel non-teaching blocks.

## Implementation boundary

The implementation will add the smallest coherent seams:

1. independent setup capability assessment and resumable draft state;
2. an optional, backward-compatible explicit teaching-day schedule inside `PlanningWorkspace`;
3. a progressive first-run surface that writes only confirmed stages and lands in the real Day view;
4. one shared import candidate/review domain and a hostile CSV parser;
5. import provenance attached minimally to imported Course, Unit, and Lesson records;
6. an atomic multi-store curriculum commit with rollback and receipt;
7. Settings/Workspace entry points and contextual prompts that use the same importer;
8. contract, browser, accessibility, and regression evidence.

Date-aware curriculum placement remains YELLOW unless the supplied source contains reliable date semantics and the preview can prove school-calendar safety. Google Drive, LMS/SIS, billing, collaboration, AI generation, and deployment remain out of scope.
