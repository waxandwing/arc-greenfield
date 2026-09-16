# Arc hard UI audit — intuitive + helpful

**Date:** 2026-09-15  
**Scope:** Current desk/planner interaction model on `main`; usability and comprehension first, visual polish second.  
**Goal:** A tired teacher should understand where they are, what matters now, where to put something, how to move it, and how to recover without learning Arc's internal model first.

## Executive verdict

Arc's structural direction is now much stronger, but the interface still risks becoming a **beautiful desk full of objects whose rules must be learned**. That is not intuitive enough.

The next UI pass should **reduce decisions, expose the next useful action, and make recovery obvious**. Do not add more chrome or new concepts. The product should feel calmer as capability increases.

### Five teacher questions

Every primary surface must answer these in under a few seconds:

1. **Where am I?**
2. **What matters now?**
3. **Where do I put this?**
4. **How do I move or change it?**
5. **How do I get back if I make a mistake?**

Anything that slows one of those answers should be removed, demoted, renamed, or revealed only when needed.

---

# P0 — comprehension / action failures

## P0-1 — Desk objects need self-evident jobs

**Problem:** Arc now has multiple physical objects: planner, IDEAS tray, TO-DOS, post-its, magnets, Start Class, settings, quick capture. The visual metaphor is strong, but visual distinctiveness is not the same as semantic clarity.

**Risk:** A teacher has to remember what object owns which action.

**Required behavior:**

- The planner owns **scheduled teaching**.
- IDEAS owns **unscheduled possibilities**.
- TO-DOS owns **teacher obligations**, not lessons.
- Quick capture owns **I need to get this out of my head now**.
- Start Class owns **present/teach**, not planning.
- Settings owns configuration only.

Do not allow the same action to appear equally prominently in several objects. If duplicate entry points are necessary, one must be clearly primary and the others contextual.

**Acceptance:** A new user can infer each object's job from the object itself and one short label. No tutorial paragraph should be required.

---

## P0-2 — Capture must be easier than organizing

**Problem:** Capture is only helpful if it lets the teacher defer categorization. If the first interaction asks where something belongs, what type it is, which class, which date, or what state it should have, Arc has recreated the cognitive burden it is meant to remove.

**Required behavior:**

- First action: type the thought.
- Enter saves immediately.
- Optional lightweight class/date parsing can happen from text, but must never block capture.
- Sorting can happen later.
- The user must see where the captured thing went.

**Helpful microcopy:** use verbs the teacher already understands: **Jot**, **Place**, **Move**, **Teach**, **Done**. Avoid system language like object, record, entity, workspace, projection, state, or surface in user-facing UI.

**Acceptance:** Thought → saved in one interaction; destination is visually obvious afterward.

---

## P0-3 — Dragging needs visible consequences and safe recovery

**Problem:** Arc's core promise depends on moving lessons and objects. A drag interaction that succeeds silently is not enough. Teachers need confidence that they did not accidentally destroy or overwrite a plan.

**Required behavior:**

- During drag, valid destinations visibly react.
- Invalid destinations explain why in plain language only when attempted.
- Drop shows a brief placement confirmation in context, not a toast detached from the object.
- Undo appears immediately after a consequential move and says what it will undo.
- Multi-day/unit moves must preview their footprint before drop.
- No-school-day skipping must be visually communicated when it changes the expected destination.

**Acceptance:** User always knows **what moved, where it landed, and how to reverse it**.

---

## P0-4 — Edit mode cannot feel like a different product

**Problem:** Desk edit/customization behavior introduces another mode. Modes are dangerous when the interface does not make entry, scope, and exit painfully clear.

**Required behavior:**

- Entering edit mode changes one unmistakable thing: an edit toolbar/state band.
- Only movable/resizable desk furniture receives edit affordances.
- Planning/calendar interactions should be visibly suspended or clearly distinct while editing furniture.
- Exit must be obvious and persistent.
- Changes should autosave or explicitly say when they are saved.

**Do not:** rely only on outlines/handles to communicate that the entire desk is now in a different interaction mode.

**Acceptance:** User cannot reasonably mistake “move my desk furniture” for “move my lesson.”

---

## P0-5 — Week must privilege teaching over management

**Problem:** Week is the product center. Every control added above or inside it competes with the teacher's actual sequence of classes and lessons.

**Required hierarchy:**

1. Week/date context
2. Courses + what is being taught
3. Today/current-day cue
4. Change/move affordances
5. Secondary management actions

Search, Enlarge, setup, recovery, notes, filters, and configuration must not outrank the teaching sequence.

**Acceptance:** On a normal laptop, the teacher can identify today's classes and planned lessons without scrolling or parsing a toolbar.

---

## P0-6 — Current day needs one language, not several

**Problem:** “Today” can appear as a button, a highlighter, a date state, a selected cell, and a current navigation anchor. Multiple competing visual treatments weaken recognition.

**Required behavior:**

Define one current-day grammar:

- Header control = **go to Today**
- Calendar marker = **this is Today**
- Selection = **this is what I selected**

Those must look related but not identical.

**Acceptance:** User can distinguish current date from selected date instantly.

---

## P0-7 — Navigation needs a reliable home and back path

**Problem:** Day → Class → Lesson → Workspace/Tray → Settings can create depth even when the desk feels spatial. Physical metaphors do not eliminate navigation depth.

**Required behavior:**

- DAY/WEEK/MONTH/YEAR always preserve orientation.
- Deep focus views must expose a clear parent path: lesson → class/day/week.
- Closing a drawer/modal returns focus and visual attention to the object that opened it.
- “Back” should describe the destination when ambiguity exists.
- Do not rely solely on browser Back for product navigation.

**Acceptance:** At every depth, the user can answer “how do I get back to my week?” without experimenting.

---

# P1 — friction that makes Arc feel harder than it is

## P1-1 — Too many equally loud micro-actions

Week cells and lesson objects should not show every possible action at all times.

Default visible actions should be the one or two most likely actions. Everything else belongs behind contextual reveal / More.

Prefer:

- click/tap object = open
- drag = move
- obvious contextual action = Teach / Start class when relevant
- More = rare actions

Do not print **Open / Move / More / Edit / Delete / Duplicate** as permanent chrome on every object.

---

## P1-2 — Search needs a clear scope

A bare Search field on a spatial desk is ambiguous.

The interface needs to make clear whether Search finds:

- lessons
- units
- notes
- ideas
- everything

Recommended default: global search with placeholder such as **Find a lesson, unit, note…** and scoped result grouping. Do not make the teacher choose a scope before searching.

---

## P1-3 — Empty states should teach the next move, not describe emptiness

Bad: **No notes in this view.**

Better: **Nothing here yet. Jot a note.**

But avoid filling the desk with instructional copy. Empty-state help should disappear permanently once the interaction has been learned or used.

---

## P1-4 — Drawers must behave like drawers

IDEAS, TO-DOS, settings, and tray surfaces should obey consistent spatial behavior:

- same open/close expectation
- same Escape behavior
- same focus return behavior
- clear ownership of the tab that opened them
- opening one utility should close a competing utility unless side-by-side use is intentional

Do not let each furniture object invent its own navigation contract.

---

## P1-5 — Avoid invisible automation

Arc may intelligently shift, skip no-school days, infer classes, or place objects. Helpful automation becomes frightening if the user cannot see what Arc did.

Use **preview before large change** and **Undo after change**.

Never silently move a sequence of lessons because the product “knows” the calendar.

---

## P1-6 — “Enlarge” is implementation language

If the calendar opens into a focused larger view, name the action for the user's goal rather than the geometry.

Candidates to test:

- **Open calendar**
- **Focus**
- icon-only expand with accessible label

If the button remains, it should be visually quiet and never compete with Week content.

---

# P2 — polish that improves trust

## P2-1 — Make clickability consistent

Physical appearance can create false affordances. If something looks like a tab, magnet, sticky, drawer pull, button, or handle, the interaction must match the implied physical behavior.

Decorative objects must not look more clickable than interactive ones.

---

## P2-2 — Hover cannot carry essential information

Smart Board, touch, and classroom use make hover-only discovery unacceptable.

Hover may enrich. It cannot be required to discover Move, Start class, open, or close behavior.

---

## P2-3 — Reduce confirmation noise

Routine reversible actions should not ask “Are you sure?”

Use immediate action + Undo.

Reserve confirmation for destructive, broad, or irreversible actions.

---

## P2-4 — Labels should use teacher language

Audit user-facing terminology for internal/product terms.

Prefer:

- Ideas
- To-dos
- Notes
- Week
- Lesson
- Unit
- Start class
- Move
- Copy
- Undo

Avoid exposing implementation vocabulary.

---

# Core teacher scenarios to test after each pass

## Scenario A — 7:25 AM, teacher opens Arc

Success means:

- today's position is obvious
- first class / current class is easy to locate
- no setup/admin UI interrupts the teaching plan
- teacher can start class from the same surface

## Scenario B — hallway thought

Teacher remembers something for next week.

Success means:

- capture in seconds
- no date/class required
- thought is visibly saved
- later sorting is obvious

## Scenario C — assembly destroys period 3

Success means:

- teacher can move affected lesson(s)
- Arc previews skipped/no-school implications
- moved lessons preserve sequence
- Undo is immediate

## Scenario D — planning period

Success means:

- unscheduled ideas and obligations are accessible
- planner remains context, not hidden behind utility UI
- teacher can drag an idea into the plan without switching mental models

## Scenario E — accidental furniture edit

Success means:

- user instantly knows they entered desk-edit mode
- lesson/calendar content cannot be accidentally manipulated as furniture
- exit is obvious
- no work is lost

## Scenario F — “Where did that go?”

Success means:

- recent move/capture can be found
- Undo or recent activity provides recovery
- no object silently disappears into a drawer/state

---

# Accessibility / classroom reality vetoes

These are not optional polish:

- keyboard operation for all primary actions
- visible focus on tactile objects
- touch targets suitable for Smart Board use
- no essential hover-only controls
- color is never the sole meaning carrier
- text on textured assets remains legible at real classroom viewing distances
- motion should confirm spatial change, not delay work
- reduced-motion path must preserve orientation

---

# Recommended repair sequence

1. **Define semantic ownership** for planner / Ideas / To-dos / Capture / Start Class.
2. **Simplify capture** to thought-first, categorize-later.
3. **Make move + Undo trustworthy** with destination previews.
4. **Harden mode clarity** for desk edit vs planning.
5. **Strip Week micro-actions** to primary + contextual reveal.
6. **Unify Today/current/selected state grammar.**
7. **Standardize drawer behavior and focus return.**
8. **Clarify global Search scope.**
9. **Rewrite empty states and internal vocabulary.**
10. **Run six teacher scenarios above before more visual decoration.**

---

# Definition of “intuitive and helpful”

Do not mark this pass complete because controls are prettier or fewer.

Arc passes when a teacher can use the main workflow without being taught these concepts explicitly:

- where unscheduled things live
- where scheduled things live
- how to capture quickly
- how to move something
- how to undo a mistake
- how to return to Week
- how to start teaching

The UI should reveal the product model through use rather than requiring the teacher to memorize it.

**North star:** Arc should feel simpler than the work it is managing.
