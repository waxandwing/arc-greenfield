# Arc B00.5 — Core Prune and Hardening Audit

**Status:** Core architecture GREEN after repository verification. Visual B01 integration is intentionally not claimed Green by this document.

**Scope:** Remove executable archaeology, establish one owner for persistent behavior, harden Calendar ↔ Ideas relocation and Undo, reduce duplicate CSS/data projections/date logic, raise compiler/test standards, and preserve B01 v20 as the separate visual reference authority.

## Non-negotiable boundaries

- No deployment was enabled or performed.
- No B01 visual redesign was authorized or attempted here.
- Historical donor commits remain available; legacy UI is not copied into canonical.
- Unit / Lesson / Note semantics remain canonical domain semantics.
- Navigation preference is persistent but intentionally excluded from user-content Undo history.

## Canonical owners after B00.5

| Concern | Owner | Rule |
| --- | --- | --- |
| Workspace schema | `lib/domain.ts` | One canonical state model. No UI-specific persistent object copies. |
| Persistent content mutation | `lib/workspace-controller.ts` | UI sends commands; meaningful commands create one history entry. |
| Calendar ↔ Ideas relocation | `lib/workspace-plan-operations.ts` | Unit trees move together; an independently parked child detaches cleanly. |
| Unit tree mechanics | `lib/plan-tree.ts` | Tree collection, shift, clone, delete, child ordering. |
| Calendar date movement | `lib/plan-operations.ts` | One relocation implementation; true no-ops preserve identity. |
| Local date math | `lib/date-utils.ts` | Local calendar dates never depend on UTC string conversion. |
| School-day rules | `lib/school-calendar.ts` | Consumes canonical date utilities. |
| Month/Quarter projections | `lib/plan-selectors.ts` + `lib/view-ranges.ts` | Shared projection truth; Month and Quarter no longer duplicate helpers. |
| History | `lib/workspace-history.ts` | Generic past/present/future snapshots with course-integrity repair. |
| Local persistence | `lib/workspace-store.ts` | Invalid payloads are quarantined; save failures return explicit status. |
| Ideas UI-local state | `app/ideas-workbench.tsx` | Draft/filter presentation state only; persistent Plan mutations route to controller. |
| Week composition | `app/week-planner.tsx` | Presentation and transient editor state; domain ownership selectors are shared. |
| Base visual tokens / shell | `app/globals.css` | Canonical global foundation and component-neutral tokens. |
| Interaction styling | `app/arc-interactions.css` | Selection, actions, editors, priorities, pointer affordances. |
| Range styling | `app/range-views.css` + `app/range-interactions.css` | Month/Quarter structure and range interaction presentation. |
| Decorative enhancement | `app/arc-visual-language.css` | Decoration only; no structural ownership overrides. |
| Onboarding presentation | `app/onboarding-screen.css` | Readable, tokenized component styling with deterministic type stack. |
| Build identity | `CANONICAL_BUILD.json` | Single build-ID source consumed by `app/page.tsx`. |

## Removed or collapsed

- Removed obsolete `app/week-planner.css`; its live interaction rules now have one owner.
- Removed dead prototype selectors from `globals.css`, including old setup cards/grids, legacy Week controls, old magnet editor, and old primary-action patch rules.
- Removed the unused shortcut-label catalog.
- Removed the unused priority-count helper and its test-only existence.
- Removed duplicated local date parsers/formatters from plan movement, plan trees, school calendar, range generation, and shell week calculations.
- Removed duplicated Month/Quarter Unit span, owner, child, and short-date helpers.
- Removed structural selector overrides from the decorative visual-language layer.
- Removed a CSS rule that accidentally replaced sticky top-bar positioning.
- Removed a priority pseudo-element that could become a fourth grid child in a three-column heading.
- Removed an unnecessary login `!important` override.
- Replaced a minified onboarding proof stylesheet with readable component CSS and local tokens.
- Removed phantom Fraunces usage; Arc now owns Montserrat through `next/font` and uses the intentional Georgia display stack.

## Behavior hardening

### Calendar ↔ Ideas

- Moving a Unit to Ideas moves the Unit tree as one semantic operation.
- Moving an individual child Lesson to Ideas detaches it from its Unit rather than creating a cross-location parent relationship.
- Restoring a Unit to the calendar preserves child date offsets relative to the Unit anchor.
- Invalid or already-satisfied moves are true no-ops and do not create Undo noise.

### Undo / Redo

- Persistent content changes pass through one controller boundary.
- One meaningful command produces one history entry.
- No-op mutations preserve object identity and do not add history entries.
- Last-used navigation view persists outside content Undo; Undo/Redo preserve the current navigation preference.

### Persistence

- Malformed or unsupported saved payloads are copied to an invalid-workspace quarantine key before Arc falls back to a clean workspace.
- Device-storage write failures no longer throw unhandled errors.
- The shell surfaces a save-failure state rather than falsely reporting “Saved.”
- Re-entering Setup and removing a course uses `removeCourseSafely`, preventing saved plans from retaining orphaned course references.

## CSS / presentation hardening

The previous code relied on load order to resolve competing definitions of selectors such as `.magnetActions`, `.priorityHeading`, `.viewSwitcher`, selected states, and paste targets. B00.5 assigns those behaviors to explicit owners.

Repository tests now enforce:

- zero `!important` declarations in all app CSS, including nested CSS modules;
- retired prototype selectors do not return to global CSS;
- the decorative visual-language file cannot reclaim structural selectors such as view switching, selection, paste targeting, magnet actions, or priority headings;
- the removed Week patch stylesheet cannot be re-imported.

The remaining decorative layer contains only artwork-like pseudo-elements and optional motion enhancement. Structural geometry does not depend on it.

## Compiler / build standards

`tsconfig.json` now enables:

- `strict`;
- `noUnusedLocals`;
- `noUnusedParameters`;
- `noFallthroughCasesInSwitch`;
- `forceConsistentCasingInFileNames`.

The repository verification workflow runs install → typecheck → tests → production build → canonical-build-contract check.

## File-by-file audit disposition

### Changed because ownership or quality was materially wrong

`CANONICAL_BUILD.json`, `app/arc-entry.tsx`, `app/arc-interactions.css`, `app/arc-shell.tsx`, `app/arc-visual-language.css`, `app/globals.css`, `app/ideas-workbench.tsx`, `app/layout.tsx`, `app/login/login.module.css`, `app/month-view.tsx`, `app/onboarding-screen.css`, `app/onboarding-screen.tsx`, `app/page.tsx`, `app/quarter-view.tsx`, `app/range-views.css`, `app/week-planner.tsx`, `lib/date-utils.ts`, `lib/plan-operations.ts`, `lib/plan-selectors.ts`, `lib/plan-tree.ts`, `lib/priority-operations.ts`, `lib/school-calendar.ts`, `lib/shortcuts.ts`, `lib/view-ranges.ts`, `lib/workspace-controller.ts`, `lib/workspace-plan-operations.ts`, `lib/workspace-store.ts`, and the B00.5 tests/docs.

### Inspected and intentionally left unchanged

- Access routing and internal redirect validation.
- Supabase auth configuration and server-client cookie bridge.
- OAuth callback and sign-out routes.
- Beta-access middleware boundary and beta gate behavior.
- `next.config.mjs` (`reactStrictMode` on; framework signature header disabled).
- `vercel.json` retains `deploymentEnabled: false`; B00.5 does not authorize deployment.
- Existing generic history snapshot implementation and course-reference repair remain the correct owners.
- Range quick-add transient composer state is local by design.
- Login product copy remains concise and consistent with Arc voice; it was not converted into generic SaaS language.

## Automated acceptance evidence

B00.5 is not complete unless all of the following pass on the branch head:

1. `npm install`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`
5. canonical-build-contract existence check

The final PR must remain unmerged until these checks pass on the final documentation/code head.

## USE / MINE / PASS after hardening

**USE**
- Greenfield domain model
- workspace history
- course-integrity repair
- local persistence owner
- canonical date utilities
- shared plan projections
- workspace controller command boundary
- Calendar ↔ Ideas relocation seam

**MINE**
- Historical Core collision/overlap behavior
- Shift date behavior and preview/apply semantics
- useful keyboard/tap alternatives not yet represented in canonical
- exact five-day workspace behavior pending provenance

**PASS**
- old Core page composition
- split-pane Fridge geometry that squeezes the calendar
- portal/MutationObserver priority architecture
- old standalone Shift styling shell
- executable version-by-version CSS archaeology
- dormant controls or duplicate state models

## Explicitly deferred — not hidden

These are **not** failures of B00.5, but they are not Green product completion either:

- Wiring the approved B01 v20 / Figma furniture composition to this clean controller layer.
- SettingsFurniture / FridgeFurniture / TaskBarFurniture final visual ownership in the B01 interface.
- Shift engine transplant and its collision/no-school rules.
- Full collision/overlap policy migration from historical Core.
- Remaining Day / Year / additional view product work outside the current greenfield Week/Month/Quarter surface.
- Exact historical five-day workspace donor provenance.
- Final rendered B01 desktop/mobile visual QA. This must occur before any B01 preview is presented as Green.

## Release assessment

**B00.5 core architecture:** GREEN when final CI is green.  
**Behavior family — Calendar ↔ Ideas + Undo:** GREEN at domain/controller level.  
**CSS ownership / executable archaeology:** GREEN for the audited greenfield surface.  
**B01 visual integration:** YELLOW / separate next phase.  
**Production deployment:** NOT AUTHORIZED.
