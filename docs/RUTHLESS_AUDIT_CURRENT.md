# Arc ruthless audit — reconstructed workspace

Status: **NO-GO**

Exact branch: `rebuild/workspace-operations`

Engineering gate at this checkpoint:
- TypeScript: PASS
- behavioral tests: PASS
- production build: PASS
- canonical build contract: PASS

Those are prerequisites only, not product-readiness points.

## What is materially better

- Desktop shell is architected as one viewport instead of a scrolling dashboard.
- Fridge / Shift / More are attached folder tabs whose opened folder reflows the calendar smaller.
- Calendar navigation and horizon controls live on the calendar surface.
- Arc logo remains the real `/arc.png` asset.
- Unit is a real tree across move / Fridge / delete / copy / cut / paste.
- Cut preserves IDs; Copy creates IDs; Cut is one-shot and safe after Undo-before-paste.
- Week, Month and Quarter all support direct plan movement and Lesson → Unit nesting.
- Fridge holds Idea / Note / Lesson / Unit magnets.
- Must / Should / Could is one collapsible surface with red-circle, cross-out, explicit delete and plan linking.
- Trash appears during drag and deletion participates in workspace history/Undo.
- Tack, Extend +1 instructional day, Copy next, Reuse week and Quarter checkpoint are restored.
- Six horizon options exist.
- Year Map includes quarter-separated mini months and the uploaded yellow-X treatment for elapsed instructional days.
- Magnet Details / Unit Focus opens in the current planning context rather than changing horizon.
- landing view, class filter and content filter preferences exist.
- Save now + Cmd/Ctrl-S use truthful local persistence language.

## Critical blockers

1. **One style owner is not yet true.** `workspace-rebuild.css` is loaded after several older Arc CSS files. This is a regression risk and violates the architecture rule even if the rendered result happens to look correct.
2. **Rendered proof is absent.** Exact 1366×768, 1440×900, smaller laptop, 200% zoom, keyboard, reduced-motion and touch behavior have not been visually verified on this branch.
3. **Onboarding calendar sourcing is incomplete.** District/school lookup, real calendar upload extraction and manual fallback must be one coherent setup flow; no fake lookup results.
4. **Shift is not schedule-smart enough.** It skips weekends/no-school dates and protects fixed trees, but does not yet preflight collisions or understand A/B, block, rotating, campus-specific or per-course meeting calendars.
5. **Month/Quarter keyboard planning is incomplete.** Drag works and clipboard works, but date cells are not yet full keyboard paste/move targets. A non-drag structural path must equal drag capability.
6. **Unit duration editing is incomplete.** A Unit can move as a tree, but in-context start/end editing and structural Extend/Tack at Unit scale are not yet complete.
7. **Day is too shallow.** It lists the day's objects but still lacks the full teaching loop: Taught, quick reflection, resources-in-use, next lesson and fixed-date status in one teaching surface.
8. **Semester is too passive.** It is a trajectory view, but direct structural movement/copying is not yet at Month/Quarter parity.
9. **Year boundary months need refinement.** A month intersecting two quarters can be represented under both quarter sections; it needs one mini-month with day-level quarter delineation or an equally unambiguous rule.
10. **Elapsed-day X control is global, not per-day.** The user asked for the option to cross out lapsed school days; current source toggles the treatment globally rather than supporting individual override/state.
11. **Fridge opening during drag is clumsy.** Calendar → Fridge works when the folder is already open; dragging over the Fridge tab should open the folder so the gesture is complete.
12. **Unit Focus child selection has a dead-looking path.** Reorder and detach work, but the child-title control inside Unit Focus does not yet become the selected Lesson detail editor.
13. **Linked-priority cleanup is incomplete.** Deleting a linked plan can leave a priority pointing at a missing plan ID unless reconciled.
14. **Authenticated persistence is not complete.** Local persistence is truthful, but account ownership, hard-reload server persistence, Drive mirror/reconcile and two-account isolation remain release blockers.
15. **School-calendar stress behavior is incomplete.** no-school dates exist, but long accumulated datasets, changed calendars after planning, and reconnect/reconciliation are not proven.

## Recovered niche behavior from early Arc history

Restored now:
- Tack;
- Extend +1 instructional day;
- Copy to next instructional day;
- Reuse this week → next week;
- Quarter checkpoint;
- Unit Focus / explicit Lesson sequence;
- Fridge magnet model;
- fixed-date protection;
- class/content filters;
- fixed or last-used landing view;
- Year-only markers;
- lightweight Magnet Details rather than formal lesson-plan pages;
- Save now shortcut.

Still valuable but not yet complete:
- course-tint progression through a Unit's Lesson sequence;
- richer fixed-plan visualization and Shift before/after preview;
- prior-year reuse beyond one-week duplication;
- selective Google Calendar context that remains visually distinct from Arc plans;
- compact and dark modes once the standard shell is stable.

Intentionally later under current product authority:
- Sub Plans;
- Student Leaders;
- template management/import libraries;
- shared planning/collaboration;
- optional teacher-controlled AI.

## Raised release decision

This branch is a much stronger foundation than the recovery HTML lineage, but it is **not beta-ready**. Do not merge or deploy until the critical blockers above are resolved and the exact rendered build clears the raised 30-person simulated panel gate.
