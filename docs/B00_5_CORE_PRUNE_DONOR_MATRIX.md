# B00.5 — Core Prune + Behavioral Salvage

Status: controlled engineering pass. No visual redesign. No new product semantics. No Vercel deployment.

## Architecture target

- `ArcShell -> Planner -> Calendar -> View -> SectionLane -> Unit -> Lesson / Note`
- Sibling furniture owners: `SettingsFurniture`, `FridgeFurniture`, `TaskBarFurniture`
- Service/domain owners beneath UI: `WorkspaceDomain`, workspace mutation operations, persistence, history/undo, school-calendar/date utilities, Shift, collision/placement.
- UI surfaces request domain mutations; they do not directly mutate canonical Plan fields.

## Engineering rule

Every new CSS rule, component, state field, persistence field, or interaction pathway must justify why an existing primitive cannot own the behavior. Every canonical state mutation must pass through one workspace mutation seam and be undoable unless a documented exception exists.

## Donor matrix

| Behavior / concern | Decision | Canonical owner / destination | Donor evidence | Notes |
|---|---|---|---|---|
| Workspace domain: Course, Unit/Lesson/Note Plan, location, parent-child links, priorities, calendar preferences | USE | `lib/domain.ts` | greenfield main | Canonical truth. Do not create UI-specific duplicate object models. |
| Durable local workspace store + schema migration | USE | existing greenfield store/migration layer | greenfield lineage | Keep as persistence owner; UI never writes localStorage directly. |
| Generic undo/redo history | USE | `lib/workspace-history.ts` | greenfield | One history action per user intent. |
| Calendar -> Ideas / Fridge relocation | USE + HARDEN | `lib/workspace-plan-operations.ts` | greenfield `plan-operations.ts`, `plan-tree.ts`; old Core behavior as behavioral reference | Canonical relocation seam added in B00.5. |
| Ideas / Fridge -> Calendar relocation | USE + HARDEN | `lib/workspace-plan-operations.ts` | greenfield `movePlanToCalendarDate`; old Core movement behavior | Unit tree moves preserve relative offsets. |
| Unit/Lesson tree collection and grouped movement | USE | `lib/plan-tree.ts` | greenfield, concept mined from old Core | Canonical implementation is cleaner than old page-local logic. |
| Individual child Lesson sent to Ideas | USE | `lib/workspace-plan-operations.ts` | behavior reconciled during B00.5 | Detach from Unit; Unit remains calendar-owned. |
| Unit sent to Ideas | USE | `lib/workspace-plan-operations.ts` + `plan-tree.ts` | old Core grouped move + greenfield tree | Preserve Unit tree as one grouped object. |
| Multi-object selection/copy/cut/paste | USE / MINE as needed | greenfield clipboard + workspace history | greenfield current code, old Core group behavior | Prefer greenfield implementation; mine only missing teacher-specific movement rules. |
| Overlap/conflict detection | MINE | future placement service | old Core Aug 12 | Extract rules; do not copy component-local alerts/UI. |
| Unit resize/stretch | MINE | future placement/date operation | old Core Aug 12 | Preserve date math; rebuild interaction against canonical Plan. |
| Shift preview/apply | MINE | future Shift service | old Core Shift lineage | Extract school-day/date calculations only. |
| Shift rollback | PASS old one-off snapshot / USE generic history | workspace history | old Core + greenfield | Generic history supersedes bespoke snapshot architecture. |
| Keyboard alternatives for movement/undo | MINE + USE | `lib/shortcuts.ts` + canonical operations | old Core keyboard behavior; greenfield shortcuts | Every drag action requires a non-drag path. |
| Priority state and move/reorder operations | USE | `lib/priority-operations.ts` | greenfield | Old Aug 24 priority portal architecture is PASS. |
| Old Aug 24 priority portal / DOM observer sync | PASS | none | `2a949f8...` | Duplicated local state, portal into prototype, seeded text sync. Mine no architecture. |
| Fridge wide split-pane geometry | PASS | current furniture owner later | `dde72177...`, `595d25...`, `44dfee...` | Conflicts with B01 rule: furniture must not squeeze/reflow fixed calendar geometry. |
| Fridge persisted width/zoom | MINE only if current product still requires it | furniture preference, not workspace Plan state | `dde72177...` | Width behavior cannot own calendar geometry. |
| Brain Dump -> Shopping List -> Calendar workflow | PASS | none | old Core | Explicitly excluded by desktop migration scope. |
| Old Core page composition / sidebar / drawer architecture | PASS | none | Aug 12 Core | Behavioral donor only. |
| B01 v20 executable override archaeology | PASS after extraction | canonical B00.5 shell/furniture CSS | Drive B01 v20 reference | Freeze as proof/reference; do not progressively patch. |
| B01 final geometry, typography, furniture composition | USE as visual authority | clean canonical CSS/owners | Drive B01 v20 + approved Figma | Extract final intended result, not historical patches. |
| Exact five-day workspace screenshot implementation | MINE pending provenance | none yet | unresolved historical donor | Do not delete historical Aug 9–29 branches/commits until traced. |

## Safe prune boundary

Safe to remove from the *new canonical runtime* after final intended behavior/appearance is extracted:

- superseded visual shells and duplicate CSS generations;
- old dashboard framing and split-pane Fridge geometry;
- DOM-observer/portal hardening prototypes that duplicate canonical state;
- dormant controls and hidden alternative architectures;
- Vercel-only preview scaffolding not required for local development;
- decorative assets whose only job is to fake responsive UI geometry.

Do **not** delete historical donor commits/branches yet. Preserve all Aug 9–29 Core/Fridge/Shift/persistence material until behavior provenance is complete.

## B00.5 acceptance checks

1. One canonical Workspace/Plan model.
2. Calendar and Ideas/Fridge read from the same Workspace truth.
3. Calendar <-> Ideas relocation goes through one domain seam.
4. Moving a Unit moves its tree as one user action.
5. Moving an individual child Lesson to Ideas detaches it cleanly.
6. Undo restores the entire relocation in one action.
7. Persistence remains outside UI components.
8. No current B01 visual redesign is introduced by this pass.
9. Decorative assets can be removed without breaking structural geometry in the later B01 shell rebuild.
10. Historical donors remain available until provenance work is closed.
