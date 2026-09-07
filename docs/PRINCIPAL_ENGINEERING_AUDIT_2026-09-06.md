# Arc Principal Engineering Audit — 2026-09-06

Authority audited: `develop @ 1eff100cf373b592ceb3f98afa3a5238c637291b`.

This is an internal adversarial review using multiple simulated expert lenses. It is not a claim that outside professionals were hired or participated.

## Review lenses

1. Principal frontend engineer — component ownership, state boundaries, React composition, failure isolation.
2. Staff domain engineer — canonical calendar/planning truth, mutation safety, identity, persistence.
3. Accessibility specialist — keyboard parity, semantic structure, reduced motion, reflow, touch targets.
4. Reliability engineer — fail-closed behavior, rollback, reload continuity, stale-state handling.
5. Design-systems engineer — token ownership, CSS layering, component presentation boundaries.
6. Security/privacy-minded application engineer — source validation, storage trust, external-input boundaries.
7. Performance engineer — unnecessary rerender/state duplication, oversized runtime surfaces, avoidable global work.
8. Ruthless maintenance reviewer — dead files, stale exports, duplicate public APIs, historical residue.

## Findings

### GREEN — single current application root
`src/main.tsx -> src/App.tsx -> AppFrame -> WorkspaceStage` is the live shell path. No second live application root was found in `develop`.

### GREEN — calendar/planning truth is projection-driven
Day, Week, Month, Quarter, Semester, and Year Map consume shared canonical calendar/planning state rather than maintaining view-specific schedule copies.

### GREEN — mutation safety and persistence
Current calendar, class, Unit, Lesson, Section-schedule and recovery paths validate dependent state before accepting consequential changes. Lesson + Shift persistence uses an atomic save/rollback boundary. Invalid restored storage is surfaced instead of silently promoted to trusted state.

### GREEN — accessibility/runtime evidence
The exact pre-merge cleanup head passed contracts, strict typecheck, production build, browser/a11y, Phase 2 independent RGAV, Phase 3 school identity, source calendar review, official-source handoff, Read Dates proposal review, and live NCES browser gates. The squash-merged `develop` tree is the same verified tree and its post-merge specialist workflows also passed.

### GREEN — dead-code enforcement
TypeScript now fails unused locals/parameters and fallthrough cases. The first stricter run found one dead planning fixture; it was removed rather than exempted.

### GREEN — retired visual debug residue
The unused BuildFingerprint stylesheet and unconditional global import were removed.

### CORRECTED — asset integration branch drift
`design/b01-canonical-week-asset-match` had no unique commits and was one commit behind `develop`; it was safely fast-forwarded to the cleaned authority before asset integration begins.

### CORRECTED — retired Easel API leakage
The canonical naming contract reserves Easel for legacy/history. Two legacy teaching-continuity modules were still re-exported from the current `src/planning/index.ts` public API. Their barrel exports were removed. The directly tested legacy modules/contracts remain preserved as QA/donor evidence until Classroom implementation explicitly replaces or migrates them.

### ACCEPTABLE WITH WATCH — `useArcWorkspace.ts`
The hook is large and owns orchestration across calendar, planning, Units, Lessons, Shift and persistence. The audit did not find a second competing state owner or evidence that extraction would currently improve correctness enough to justify churn. Do not split it merely to reduce line count. Extract only when a distinct responsibility earns an independent tested boundary.

### YELLOW — repository branch count
Historical branch count remains high. Connected GitHub permissions do not expose delete-ref, so physical deletion cannot be completed here. The existing Git prune audit classifies safe-delete, archive/mining and review-before-delete families. Active merge surface is clean: protected `develop`, the asset-match branch, and explicitly active work branches only.

## Non-negotiable maintenance rules after this audit

- `develop` remains implementation authority unless the Master Operating Document says otherwise.
- No obsolete Next `app/ + lib/` branch may be merged wholesale.
- No live product surface may create a second calendar/planning source of truth.
- Every consequential mutation must fail closed or provide explicit rollback/recovery.
- Invalid persisted data must never silently replace trusted state.
- No feature may depend on drag as its only meaningful interaction path.
- Retired Easel vocabulary must not re-enter current public product APIs; legacy QA evidence may retain historical naming until deliberately migrated.
- Asset integration must preserve live HTML semantics and dynamic content; artwork may not become baked UI truth.
- New CSS/component/state abstractions must justify why an existing owner cannot hold the behavior.
- Strict typecheck, contracts, production build, browser/a11y and relevant specialist/RGAV gates are required before merge.

## Release judgment

Core component/functionality architecture is GREEN for continued asset integration. This does not mean B01 visual matching is Green; it means the current implementation foundation is sufficiently coherent and verified to receive canonical assets without first requiring another architectural rewrite.
