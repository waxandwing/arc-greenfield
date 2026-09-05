# ARC Founder Laws

Status: **current implementation authority**

These rules are explicit product direction. They outrank older prototypes, archived build notes, and generic application conventions until Kelly explicitly changes them.

## 0. Deployment law
- **Do not deploy Arc to Vercel.**
- No Vercel production deployment, preview deployment, branch deployment, release automation, or accidental publish step is authorized.
- Development may continue in isolated Git branches, draft pull requests, Figma, local/file previews, and canonical Drive documents.
- A GitHub pull request is for review/testing only and is not permission to deploy.
- Deployment remains blocked until Kelly explicitly reverses this rule.

## 1. Calendar is the center
- Arc is a calendar-centered teaching workspace.
- The calendar must remain visually and geometrically true while supporting furniture opens and closes.
- Furniture may not overlay, permanently squeeze, or reflow the calendar.

## 2. No left rail
- There is no permanent full-height left navigation rail.
- Low-frequency controls such as settings, help, rosters, setup, connections, appearance, and accessibility live in edge furniture.
- Edge furniture is opened from a tab at the outer wall / outer edge of the planner.

## 3. Furniture behaves like drawers
- Fridge and settings surfaces slide in from an outer edge.
- Drawer surfaces occupy wall space outside the planner surface.
- They do not overlay the calendar.
- They do not change the calendar's dimensions or weekday geometry.

## 4. Fridge is the canonical name
- User-facing name: **Fridge**.
- It is the place for things a teacher is proud of, wants to keep, wants to reuse, or is not ready to schedule.
- The magnet metaphor is intentional.
- Older user-facing labels such as a generic Ideas panel do not override Fridge.

## 5. Task Bar is the only persistent task surface
- The persistent task surface is **Must Do / Should Do / Could Do**.
- It is the **Task Bar**.
- There is no separate Plan strip.
- Task Bar and Fridge are separate concepts and should not be nested into one another.

## 6. Stable object lifecycle
A planning object keeps the same identity while its visible capability increases with context.

**Fridge → Task Bar → Calendar**

- Fridge: lightweight capture and limited visible information.
- Task Bar: can expose task notes and time information.
- Calendar: can expose full planning customization.
- Moving an object backward must not destroy richer data it already owns.
- Simpler contexts may hide fields that are not relevant there, but hidden data remains persisted.
- An explicit advanced/override path may expose retained fields when needed.
- Moving is not copying unless the teacher explicitly chooses Copy.

## 7. Object visual grammar
- Unit: larger magnet-like structural object.
- Lesson: sticky-note / paper-slip object.
- Idea / Note: a third, visibly lighter-weight object.
- The three must be distinguishable without relying only on color.

## 8. Selection is contextual
- Selecting a Unit, Lesson, Note, or other calendar object opens a small contextual toolbar near that object.
- Appropriate actions include Move, Copy, Shift where fully supported, Put in Fridge/Drawer, and Delete.
- Do not show a giant editor by default.
- Do not expose a control that is visually convincing but functionally fake.

## 9. Classes are not a navigation tab
- Classes do not exist as a permanent application destination.
- Day view is the natural period/class-oriented lens.
- Class isolation is desirable but remains an interaction to solve without creating a competing planning silo.
- Advanced setup may place period/class structures within the calendar itself.

## 10. Weekend law
### Week
- Default Week is Monday through Friday.
- When the teacher intentionally enables weekends, Week may render Sunday through Saturday and Sunday becomes the first column.

### Year / Year Map
- Year Map is attendance/school-year oriented.
- It remains Monday through Friday.
- Every attendance week starts with Monday in the first column.
- Weekends do not appear in the Year Map attendance grid.

## 11. Events outside instructional truth
- Arc must not invent local school events.
- Verified, imported, or teacher-entered events such as meetings may live in Notes or an optional After School section.
- Google/external events remain distinguishable from Arc instructional objects.

## 12. No silent data loss
- Move, Shift, Unplace, Fridge placement, Task Bar placement, Calendar placement, Undo, and recovery preserve stable identity and history unless the teacher explicitly chooses a destructive action.
- Delete is distinct from Move/Unplace.
- Fixed dates do not drift silently.

## 13. Conflict rule
If a requested implementation conflicts with one of these laws, stop and flag the conflict before changing the product. A founder instruction can explicitly replace a law; old Figma frames or old code cannot.

## 14. Current reconciliation implementation status
The branch `codex/reconcile-founder-laws` is an isolated working branch, not a release branch.

Already implemented there:
- Fridge is outer-edge drawer furniture rather than a permanent right-side workbench.
- Settings is outer-edge drawer furniture rather than a left rail.
- Task Bar is horizontal and separate from Fridge.
- Week reads the persisted weekend preference: Mon–Fri by default, Sun–Sat/Sunday-first when enabled.
- Stable planning objects retain the same identity across Fridge, Task Bar, and Calendar.
- Legacy Priority records are migrated into stable Task Bar objects rather than silently disappearing.
- Calendar objects use contextual selection actions rather than permanent action rows.
- Unit, Lesson, and Idea/Note receive distinct physical-language treatment.
- CI/typecheck/test/build remain mandatory before any merge decision.
