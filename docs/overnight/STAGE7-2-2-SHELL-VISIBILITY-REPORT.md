# Stage 7.2.2 — Shell visibility lock

## Scope

Final visual correction pass only. No planning logic, navigation behavior, onboarding/import semantics, Move/Shift/Recovery, calendar behavior, or ArcTable styling changes.

## Verdict

| Area | Status |
|------|--------|
| Engineering | GREEN (full baseline + contracts) |
| Visual (thumbnail jury) | YELLOW → improved; human contact-sheet review still advised |

## Changes summary

- **Exterior vs interior:** Darker `--shell-exterior-base`, lighter pattern overlay (soft-light blend), stronger frame outline and shadow on `b01-furniture-composition`; cream planner inset rim on `arc-planner-object`.
- **Green frame:** Thicker `--shell-frame-border` / `--shell-planner-border`, larger inset radius, deeper outer/planner shadows (tokens).
- **Index tabs:** Taller tabs, stronger green rail, active tab projection off the rail, workspace/settings accent stripes preserved.
- **Week:** Taller course rows, wider left markers, stronger course tints and unit bands, quieter day-slot grid lines.
- **Month:** Softer cell borders, stronger course unit bands, quieter day-status copy.
- **Day / Class / Lesson:** Plan-state header bands per focus; class/lesson recede non-focus courses; lesson focus panel emphasis.
- **Workspace:** Overlay width/position tied to index rail; shared frame shadow language when open.

## Evidence

`docs/overnight/evidence/stage7-2-2-shell-visibility/` (00–13 contact sheet set).

## Tests

- `npm run build` (contracts + typecheck + bundle)
- Plan smokes: navigation, week, month, year, P5, move/shift, browser-plan, onboarding/import
- `npm run test:browser-a11y`
- `node tests/rgav-shell-independent.mjs`
- `git diff --check`

All passed on this branch after the pass.

## Recommendation

**NOT GREEN FOR FINAL VISUAL JURY** until Kelly confirms the contact sheet at thumbnail scale. Engineering is clean; remaining risk is subjective dominance of Year at small scale and Month still reading dense when fully populated.
