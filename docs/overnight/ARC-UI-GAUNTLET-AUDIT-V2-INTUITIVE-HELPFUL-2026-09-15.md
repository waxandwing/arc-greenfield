# Arc UI Gauntlet Audit V2 — intuitive, helpful, interruption-proof

**Date:** 2026-09-15  
**Scope:** Current Arc desk/planner UI on `main`. This is a product-usage audit, not a style audit.  
**Goal:** Arc should reduce teacher cognitive load under real school-day conditions: interruption, partial attention, changing schedules, unfinished thoughts, and mistakes.

## Executive verdict

**YELLOW/RED for intuitive use.**

The visual system is becoming recognizably Arc, but the interaction model still asks the teacher to understand too much of Arc's internal organization. The risk is no longer “generic SaaS.” The risk is a **beautiful, tactile system with too many semantic rules**.

Arc should not require the user to remember which furniture object, tab, command prefix, mode, or secondary surface owns an action.

### Hard gate

Every persistent UI element must do at least one of these jobs:

1. **Orient me** — where am I / what time context am I in?
2. **Help me act** — what useful thing can I do now?
3. **Help me recover** — what happened / how do I undo or get back?

If it does none of those, it is noise. If two elements do the same job equally loudly, one is probably redundant.

---

# Audit method

This pass uses ten lenses:

1. **Recognition over recall** — can the teacher recognize what to do without memorizing commands or rules?
2. **One primary path** — is there one obvious way to accomplish the common task?
3. **Semantic topology** — does physical location match conceptual ownership?
4. **Mode safety** — can the teacher tell when interaction rules changed?
5. **Interruption resilience** — can a half-finished task survive a student interruption?
6. **Error cost** — can mistakes be reversed without fear?
7. **Progressive disclosure** — are rare actions hidden until relevant?
8. **State legibility** — are current, selected, open, saved, moved, and disabled states distinguishable?
9. **Classroom reality** — keyboard, touch, Smart Board, low attention, distance, and no hover dependency.
10. **Language honesty** — does the UI use teacher language rather than Arc implementation language?

---

# P0 — must-fix comprehension failures

## P0-1 — IDEAS vs TRAY is a duplicated mental model

### Evidence

The desk maintains a persistent **IDEAS** drawer while also exposing a separate **TRAY** utility tab. The code explicitly says the TRAY panel reuses content when open and hides the IDEAS drawer so they are “never both.”

### Why this is a serious problem

The teacher should not have to learn that:

- IDEAS is a physical drawer on the desk,
- TRAY is a utility tab,
- both may represent overlapping loose planning material,
- opening one causes the other to disappear.

That is system knowledge, not teacher knowledge.

### Required decision

Choose one user-facing concept.

Recommended:

**IDEAS** is the concept and the physical object.

If a larger working view is needed, opening IDEAS can expand into a larger IDEAS surface. Do not rename the same material **TRAY** when it gets bigger.

### Acceptance

A teacher can answer “where do unscheduled ideas live?” with one word and one location.

---

## P0-2 — Temporal navigation and configuration are mixed in one tab stack

### Evidence

DAY / WEEK / MONTH / YEAR and SETTINGS are rendered in the same planner-edge navigation stack.

### Why this matters

DAY/WEEK/MONTH/YEAR answer **where am I in time?**

SETTINGS answers **how is Arc configured?**

Putting them in one stack implies they are peer destinations. They are not.

### Required behavior

Keep the tactile SETTINGS asset, but visually and spatially separate it from time navigation.

Examples:

- small gap after YEAR
- lower utility zone
- desk-edge utility tab outside the DAY/WEEK/MONTH/YEAR rhythm

The teacher should perceive two groups without reading labels.

### Acceptance

Scanning the edge communicates: **calendar views here; utility here**.

---

## P0-3 — Quick Capture still leaks command syntax into the primary workflow

### Evidence

The mustard sticky placeholder currently says:

`Write… u / l / i / n`

and the helper text teaches `u/l/i/n prefixes` for unit / lesson / idea / note.

### Why this violates the product promise

The fastest capture interaction is already good: text + Enter defaults to IDEAS.

Teaching command prefixes in the primary sticky changes capture from **get it out of my head** to **remember Arc syntax**.

Power-user syntax may exist. It should not be the beginner-facing model.

### Required behavior

Default UI:

- placeholder: **Jot something…** or **Write it down…**
- Enter saves immediately to IDEAS
- confirmation says exactly where it went

Advanced categorization:

- infer from natural language where safe, or
- reveal lightweight type controls after capture, or
- document keyboard prefixes as optional power-user shortcuts in Help

Do not print the command language on the sticky.

### Acceptance

A first-time user can capture successfully without knowing `u`, `l`, `i`, or `n` exist.

---

## P0-4 — Planner header contains dead controls and competing actions

### Evidence

The header permanently renders:

- Search
- disabled previous arrow
- Today
- disabled next arrow
- Enlarge

The previous/next buttons are rendered but hard-disabled.

Search has an empty visible placeholder. “Enlarge” describes geometry rather than a teacher goal.

### Why this matters

Disabled controls create visual noise and imply missing functionality. A blank search field consumes space without explaining its scope. The header competes with the actual Teaching Week content.

### Required behavior

- Remove prev/next controls until they function, or make them genuinely functional.
- Search should be an icon or compact field until invoked.
- If expanded, use a meaningful placeholder: **Find a lesson, unit, note…**
- Replace **Enlarge** with goal language such as **Open calendar** or an expand icon with accessible label.
- Week title/date must remain the dominant header information.

### Acceptance

No visible control is knowingly dead. Every persistent control earns its space.

---

## P0-5 — “Clean up” exists twice on the same IDEAS object

### Evidence

The IDEAS component creates:

- a Clean up button inside the open drawer toolbar
- a second Clean up tab portaled onto the desk surface

Both perform the same action: move desk post-its back into IDEAS.

### Why this matters

This violates one-primary-path and adds ambiguity about whether the two controls behave differently.

### Required behavior

Choose one persistent entry point.

Recommended:

- collapsed IDEAS: small contextual **Clean up** affordance only when loose desk post-its exist
- open IDEAS: the same action can appear inside the drawer, but the external duplicate should disappear while open

No two equally visible controls for the same command.

### Acceptance

At any moment there is one obvious Clean up action.

---

## P0-6 — Edit mode is clearer than before, but its exit language is still too clever

### Evidence

The edit toolbar explains:

`Desk edit mode — select objects, use arrow keys to move; planning drag is paused.`

Primary exit button: **Pin it down**.

A size option exposes **MSC size**.

### Problems

1. The explanatory sentence is doing too much work because the mode itself is not sufficiently self-evident.
2. **Pin it down** is brand-appropriate flavor but weak as a safety-critical exit label.
3. **MSC** is internal shorthand, not teacher language.
4. Reset uses a second-click text change (`Reset desk` → `Confirm reset desk`) but does not explain consequence.

### Required behavior

- Persistent mode badge/title: **Arrange desk**
- Primary exit: **Done arranging**
- Optional playful secondary microcopy can say “Pin it down” elsewhere, but not as the only exit meaning.
- Replace **MSC size** with **To-dos size**.
- Reset should say what it resets: **Reset desk layout**.
- Planning objects should visibly dim/lock while furniture editing is active.

### Acceptance

A user entering the mode by accident can exit without reading an instructional paragraph.

---

## P0-7 — The system still risks two representations of one captured thought

### Evidence

Quick Capture calls the persistence callback and then requests a spawned desk post-it. The current code therefore needs explicit verification that the spawned post-it is a visual representation of the same captured item rather than a second object with independent state.

### Why this matters

If one thought becomes both:

- a saved record in IDEAS / lesson / note destination, and
- a separately editable loose desk post-it,

then editing, moving, or deleting one can create “which one is real?” confusion.

### Required verification

Define identity semantics:

- one item, multiple views of the same ID, or
- one item that is moved from one container to another

Never silently duplicate content into independent objects.

### Acceptance

Editing or moving a captured thought cannot create divergent copies unless the user explicitly chooses **Copy**.

---

## P0-8 — Primary navigation includes too many conceptual dimensions

### Evidence

Current desk navigation includes:

- DAY
- WEEK
- MONTH
- YEAR
- SETTINGS
- PLANNING
- TRAY / IDEAS

### Problem

This combines:

- time scale
- configuration
- planning-period workflow
- unscheduled-material storage

into neighboring navigation systems.

### Required information architecture

Use three explicit categories even if visually subtle:

**Time**  
DAY / WEEK / MONTH / YEAR

**Work**  
IDEAS / Planning period when relevant

**Utility**  
Settings / Arrange desk / Help

Do not visually flatten all three into equal tabs.

### Acceptance

A user can predict what kind of thing will happen before clicking a tab.

---

# P1 — major friction / cognitive tax

## P1-1 — Search scope is still undefined

`aria-label="Search plan"` is not enough for visual users, and the field has no visible placeholder.

Recommended behavior:

- compact magnifier by default
- opening search reveals **Find a lesson, unit, note…**
- results grouped by recognizable teacher categories
- Enter opens result; Escape restores prior focus

Avoid asking user to choose a search scope first.

---

## P1-2 — Disabled state must explain availability only when it matters

Calendar views can be disabled with reasons in `title`, but title/hover is not a sufficient explanation for touch or keyboard users.

If a tab is unavailable:

- avoid showing it as disabled unless the unavailable state is meaningful now
- if attempted, provide short contextual explanation
- do not require hover to understand why

---

## P1-3 — “Planning” is too broad a noun for a destination

Arc itself is a planning product. A tab called **PLANNING** does not communicate what changes.

If this means planning-period workspace, call it something concrete:

- **Planning period**
- **Plan ahead**
- or remove the permanent tab and reveal the workflow contextually

The label should describe the teacher's goal, not the product category.

---

## P1-4 — Drawer behavior is only partially unified

Settings / Workspace / Tasks use a shared close/Escape pattern, which is good.

IDEAS uses a separate component and separate open state/event model.

Audit all utility surfaces for the same contract:

- Escape closes topmost utility
- trigger regains focus
- opening a competing utility closes the current one
- click outside behavior is consistent or intentionally absent
- no invisible state survives after surface closes

IDEAS should join that contract unless there is a deliberate spatial reason not to.

---

## P1-5 — “Close” is functional but weakly contextual

Surface headers use generic **Close** buttons.

This is acceptable for accessibility, but visible labels can be quieter and more spatial:

- close icon + accessible `Close Settings`
- close icon + accessible `Close Ideas`

Do not let repeated “Close” text become visual furniture.

---

## P1-6 — Recent action / recovery needs to become a first-class product behavior

Arc's differentiator is plans that change. Undo should not be an invisible implementation capability.

For consequential changes show a temporary, specific recovery affordance:

- **Moved “Cylinder Seal” to Tuesday — Undo**
- **Shifted 4 lessons around Friday closure — Review / Undo**
- **Moved note back to Ideas — Undo**

Do not use generic **Saved** or generic **Undo** with no object/action context.

---

## P1-7 — Drag affordance must communicate destination semantics, not just droppability

A highlighted drop target should answer:

- Will this become scheduled?
- Which class will own it?
- Which day will it land on?
- Will a multi-day lesson push something else?

For common single-item moves, lightweight preview is enough. For sequence shifts, footprint preview is required.

---

## P1-8 — The desk metaphor needs an affordance budget

Not every tactile object should wiggle, lift, hover, drag, open, and reveal controls.

Assign each object one primary physical behavior:

- planner tabs switch time scale
- IDEAS tab opens drawer
- post-it body edits text
- post-it drag moves it
- Start Class starts teaching
- Settings tab opens settings

Decorative tactile details must stay inert.

A physical-looking object with no action should not visually out-compete an interactive one.

---

# P2 — interruption resilience

## P2-1 — Preserve drafts automatically

If the teacher types into capture, note, lesson edit, or idea and gets interrupted before pressing Enter, the draft should survive reasonable navigation and temporary utility changes.

Do not punish classroom interruption with lost text.

---

## P2-2 — Return to exact prior context

After Settings, Help, search, calendar pop-out, or an enlarged/focused view closes:

- restore focus to the trigger
- preserve calendar position
- preserve selected class/lesson where appropriate
- do not reset Week scroll/position unexpectedly

---

## P2-3 — Avoid timeout-only meaning

Quick Capture currently clears its destination notice after roughly 1.4 seconds.

That may be too fast to function as the only evidence of where the thought went, especially during interruption or for screen-magnifier users.

The destination should also be spatially visible or recoverable after the transient message disappears.

---

## P2-4 — Do not make teacher infer synchronization

Whenever content appears in two surfaces (desk post-it + Ideas, planner object + focused editor, etc.), either:

- edits synchronize obviously, or
- the product clearly distinguishes **move**, **copy**, and **view**.

Invisible synchronization rules are cognitive debt.

---

# P2 — terminology cleanup

Replace or reconsider user-facing terms that expose implementation/product shorthand:

| Current | Better direction |
|---|---|
| Quick capture | **Jot** / keep Quick Capture only if testing supports it |
| Enlarge | **Open calendar** / expand icon |
| PLANNING | **Planning period** / **Plan ahead** if that is the actual destination |
| TRAY | **IDEAS** if same conceptual content |
| MSC size | **To-dos size** |
| Desk edit mode | **Arrange desk** |
| Pin it down | **Done arranging** as the primary exit |
| Search plan | **Find a lesson, unit, note…** |

Do not rename for novelty. Rename only where the current term forces the teacher to learn Arc.

---

# State-language matrix

These states must not collapse into the same visual treatment:

| State | Meaning | Must communicate |
|---|---|---|
| Today | actual current date | temporal anchor |
| Selected | user's current focus | interaction focus |
| Active view | Day/Week/Month/Year | navigation state |
| Open | utility/drawer is expanded | spatial state |
| Drag target | valid destination | prospective action |
| Recently moved | just changed | recovery opportunity |
| Disabled | unavailable | inability + reason if relevant |
| Edit mode | furniture is being arranged | changed interaction rules |

Color alone cannot carry these distinctions.

---

# Cognitive-load budget

For the default Week desk at rest:

- **1 dominant heading:** Teaching week
- **1 dominant work surface:** planner Week grid
- **1 primary current-time cue:** Today
- **1 obvious capture affordance:** jot sticky
- **1 obvious teach affordance:** Start Class
- **0 dead controls**
- **0 duplicated actions**
- **0 required command syntax**
- **0 instructional paragraphs needed to perform the normal workflow**

Utilities may remain visible as furniture, but they must stay visually subordinate until invoked.

---

# Error-cost matrix

## Low-risk reversible actions

Examples: move one post-it, reorder an idea, change view.

Behavior: perform immediately + Undo where consequential.

## Medium-risk broad actions

Examples: shift multiple lessons, tighten a unit, clear a populated drawer.

Behavior: preview consequence + execute + Undo.

## High-risk/destructive actions

Examples: permanently delete a unit with children, reset a customized desk if unrecoverable.

Behavior: explicit confirmation describing exactly what will be lost.

Do not use identical confirmation behavior for all three classes.

---

# Eight gauntlet scenarios

A build should not pass this audit based on component tests alone. Run these end-to-end.

## G1 — 7:25 AM cold open

Teacher opens Arc with 45 seconds before students enter.

Pass if teacher can identify:

- today
- first/current class
- lesson
- Start Class

without opening any utility.

## G2 — 10-second hallway capture

Teacher remembers: “Need clay tools before ceramics demo.”

Pass if:

- type phrase
- Enter
- visible save/destination confirmation
- no category syntax required
- teacher can walk away immediately

## G3 — capture under interruption

Teacher types half the thought, student interrupts, teacher changes view, returns.

Pass if draft is still present or intentionally autosaved.

## G4 — assembly breaks Wednesday

Move one lesson or sequence.

Pass if teacher sees:

- destination
- affected days
- no-school skip behavior if applicable
- specific Undo

## G5 — accidental Arrange Desk

Pass if user recognizes mode within one second and exits without moving teaching content.

## G6 — find a missing thought

Teacher asks: “Where did that clay note go?”

Pass if search/recent activity/Ideas makes it findable without remembering whether it was a note, idea, or post-it.

## G7 — keyboard-only planning

Pass if teacher can:

- move through major controls
- open/close Ideas and Settings
- switch view
- capture
- activate Start Class

with visible focus and no hover requirement.

## G8 — Smart Board / touch

Pass if primary controls have sufficient targets and no essential action depends on hover, tiny edge affordances, or right-click.

---

# Concrete source-level changes recommended now

## 1. `DeskPlannerHeadRow.tsx`

- remove hard-disabled previous/next arrows until functional
- collapse Search to compact affordance or give meaningful placeholder
- rename/demote Enlarge
- preserve Week title dominance

## 2. `DeskQuickCaptureSticky.tsx` / `quickCaptureCommand.ts`

- remove `u/l/i/n` syntax from primary placeholder/hint
- keep prefix parsing as optional power-user behavior if useful
- use plain first-use copy
- verify spawned post-it shares identity with saved record
- do not rely on 1.4s notice as sole destination evidence

## 3. `B01Furniture.tsx`

- resolve IDEAS vs TRAY naming duplication
- separate SETTINGS visually from time-scale tabs
- reconsider permanent PLANNING tab wording/placement
- make all utility surfaces obey one open/close/focus contract

## 4. `DeskGreenFoldersDrawer.tsx`

- remove duplicate simultaneous Clean up entry points
- expose Clean up contextually when loose items actually exist
- join shared utility Escape/focus behavior

## 5. `DeskEditToolbar.tsx`

- `Desk edit mode` → `Arrange desk`
- `MSC size` → `To-dos size`
- `Pin it down` → `Done arranging` as explicit primary exit
- `Reset desk` → `Reset desk layout`
- visually lock/dim planning interactions while active

---

# P0 implementation order

1. **Resolve IDEAS vs TRAY concept duplication.**
2. **Remove dead header controls and clarify Search/Open calendar.**
3. **Make Quick Capture syntax invisible to new users.**
4. **Separate calendar-view navigation from Settings utility.**
5. **Remove duplicate Clean up action.**
6. **Make Arrange Desk mode self-explanatory and safely escapable.**
7. **Verify capture identity semantics: no accidental duplicate objects.**
8. **Install specific Undo/recent-change feedback for consequential moves.**

Do these before another decorative UI pass.

---

# Strong keep list

Do not overcorrect and flatten Arc into conventional app chrome.

Keep:

- physical planner / paper metaphor
- Week as the default center
- DAY / WEEK / MONTH / YEAR physical tabs
- IDEAS as a real desk object
- tactile To-dos object
- Start Class as a spatial teaching affordance
- direct manipulation / drag where it is trustworthy
- one-step capture
- forgiving Undo philosophy
- teacher language

The answer is **clearer rules**, not less personality.

---

# Definition of Green

Arc is Green for intuitive/helpful UI only when a first-time teacher can complete the core workflow without being taught the product taxonomy:

1. open Week
2. know what is happening today
3. capture a thought
4. find that thought later
5. move a lesson safely
6. understand where it landed
7. undo the move
8. open Ideas
9. return to Week
10. start class

No command prefixes, internal vocabulary, duplicated destinations, hidden navigation rules, or dead controls should be required.

## North star

**Arc should feel like the teacher already knew how to use it.**

That is stricter than “easy to learn.”
