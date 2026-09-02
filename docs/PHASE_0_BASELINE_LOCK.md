# Arc — Phase 0 Baseline Lock

Status: ACTIVE SOURCE-OF-TRUTH MAP

Purpose: merge the Arc R&D direction into the current Arc implementation without restarting the product or losing approved visual/interaction work.

## Authority order

1. Locked R&D decisions / A2K product principles control teacher agency, continuity behavior, accessibility, privacy, and movement semantics.
2. The approved Arc brand work and current calendar shell control visual identity, logo, palette family, typography roles, calendar-first composition, and tactile planning language.
3. Canonical domain/operation code controls what is actually implemented.
4. Rendered interaction evidence controls whether a behavior is considered working.
5. Implementation detail may change, but may not override the four layers above.

## Baseline decision

Do NOT restart Arc.

The current reconstruction already contains useful pieces of the required continuity spine. Phase 0 therefore classifies the existing work as KEEP / ADAPT / MOVE / REPLACE / DEFER / REMOVE and protects the working behavior while the data/event model becomes more explicit.

## Brand lock

KEEP / LOCKED:
- exact Arc logo and current approved logo treatment;
- warm paper calendar composition;
- existing Arc asset-derived palette family;
- League Spartan / Georgia role split already established in the current product direction;
- left attached folder/tab language;
- calendar as dominant product canvas;
- lesson/unit magnets as tactile planning objects;
- yellow painted elapsed-day X asset;
- existing Arc color-scheme customization concept, provided every scheme stays inside the approved Arc asset family.

The R&D memory-color appendix is a semantic WORKING model, not permission to repaint Arc or create a second visual identity. Any additional teal/plum/green memory accents must be evaluated as annotations within the locked Arc system. Labels must carry meaning even when color is present.

## Product-center lock

KEEP / LOCKED:
- Day / Week / Month / Quarter / Year as calendar projections;
- calendar navigation remains the product home;
- opening a Unit or Lesson must preserve the selected calendar horizon;
- panels/tools return focus/context to the calendar;
- Easel may temporarily become the foreground teaching surface, but closing it must return to the prior Arc calendar context.

REMOVE / FORBID:
- competing dashboard home;
- separate Revolution product navigation;
- large AI destination;
- generic SaaS card-grid shell;
- any tutorial that displaces the calendar as the normal product center.

## Current code mapping

### KEEP — already aligned enough to protect

- `lib/plan-operations.ts`
  - Unit tree movement, Lesson nesting/detach, Fridge movement, deletion semantics.
  - Treat as migration evidence and the seed for canonical movement commands.

- `lib/clipboard.ts`
  - Copy creates new IDs; Cut preserves identity; Unit hierarchy survives cross-view paste.
  - Keep behavior. Later migrate implementation onto Operation/Event lineage.

- `lib/efficiency-operations.ts`
  - school-day truth, per-course weekday patterns, rotation anchor logic, Shift preflight, Tack, Extend, Copy-next.
  - Keep as calendar/movement-engine seed.

- `lib/view-ranges.ts`
  - real quarter boundaries and single-instance Year months.
  - Keep and move toward calendar-engine ownership.

- Fridge model
  - Idea / Note / Lesson / Unit loose objects.
  - Keep as first-class movement destination, not a decorative sidebar.

- Week / Month / Quarter structural editing
  - keep current Unit/Lesson tree interactions and keyboard target work while command parity is built underneath.

- Day teaching surface
  - keep active Unit, Lesson, resources, Taught state, notes/reflection, next Lesson.
  - adapt to occurrence/planned-vs-taught memory model instead of treating `details` strings as final domain truth.

- owner-aware local storage
  - keep as current trust floor.
  - not equivalent to server/cloud persistence.

- full-screen folder-push shell
  - keep recognizable Arc composition and attached folder behavior.

### ADAPT — right product idea, wrong or incomplete architecture

- `Plan` model
  - Current broad object is doing too many jobs.
  - Migrate toward explicit Unit + Lesson + Occurrence + MemoryNote + PrepItem + Operation while preserving stable teacher-visible objects and migration compatibility.

- Shift / movement
  - Current preflight is valuable but mutates Workspace directly after approval.
  - Evolve to command → impact plan → teacher approval → event(s) → projection → reversible operation history.

- Undo history
  - Current workspace snapshot history is useful recovery evidence.
  - Evolve consequential mutations toward compensating Operation reversal so displaced/protected/provenance state is restored intentionally.

- school calendar
  - current first/last day, no-school dates, weekday/rotation rules survive.
  - move into a dedicated calendar-engine abstraction; later add source-backed district/file import.

- Month
  - current teaching view remains useful implementation evidence.
  - blueprint requires eventual whole-life layers, privacy projection, multi-day/timed event anatomy, keyboard calendar-grid semantics, and agenda alternative.

- Quarter / Year
  - keep overview-first unit arcs and real boundaries.
  - avoid turning either into tiny Week.

- Must / Should / Could
  - keep one collapsed/expanded contextual strip and plan linking.
  - reduce permanence where teacher behavior does not call for it; never become a second task database.

- Brain / fast capture
  - current Fridge composer covers part of this need.
  - future capture should support idea/note/resource/voice without forced classification.

- Color preferences
  - keep user choice, but only inside Arc brand authority.
  - accessibility meaning must never depend on hue alone.

### MOVE — keep capability but change ownership/location

- range math → `calendar-engine` module.
- Shift/Tack/Extend/Copy-next planning → `movement-engine` module.
- durable object truth → domain repository rather than component/workspace-local mutation.
- selected range/date/panel/focus → shell/router state, not domain truth.
- accessibility preferences → user preference service.
- rendered Day/Week/Month/Quarter/Year objects → projection layer fed by canonical domain events.

### REPLACE — transitional implementation that must not become the long-term model

- direct persistent date edits from UI components;
- broad `Plan.details` strings as authoritative teaching-memory state;
- snapshot-only consequential history as the final Undo model;
- per-view movement callbacks that can diverge from a single movement command;
- localStorage as final persistence architecture;
- current forced first-run tutorial gate.

### REMOVE

- retired CSS/component layers already identified by architecture tests;
- stale `ideas` duplicate location after migration to Fridge is complete;
- any dead prototype component kept only as historical fallback;
- global/parallel palette or style authorities;
- production tutorial/view-switcher behavior that competes with the calendar.

### DEFER

- large AI surface;
- district-suite/admin breadth;
- student-level analytics;
- broad collaboration;
- Student Leaders;
- ArcPal changes inside the Arc core branch;
- dark/compact mode release polishing until the primary mode clears the core gates.

## Getting to Know Arc — contextual help contract

Replace the current forced linear tutorial with an invitational, reactive help system.

### First useful entry

After minimal setup, Arc should open the actual calendar rather than forcing an eight-step tour.

A lightweight optional invitation may appear inside calendar context:

**GETTING TO KNOW ARC**

**This is your planning desk.**

1. Click anything that looks useful.
2. Arc will explain it the first time.
3. Try things freely; examples/help may be dismissed at any time.

Actions:
- Explore Arc
- Skip and start planning

This invitation must not block the calendar and must be dismissible immediately.

### Contextual first-interaction explanations

Retain the content already written in the linear tutorial, redistributed to the actual feature where it is first used.

Suggested mapping:

- Calendar / range navigation
  - Calendar is home. Day teaches; Week moves instruction precisely; Month/Quarter/Year reveal larger patterns.

- Fridge
  - Holds Idea / Note / Lesson / Unit before a date or after displacement. Returning something to Fridge does not delete it.

- Unit
  - Units own ordered Lessons. Moving/copying/cutting a Unit carries the tree.

- Lesson
  - A Lesson may belong to a Unit without being dated. Selecting it opens details without changing the current horizon.

- Move / keyboard move
  - Drag when convenient; keyboard/menu movement must use the same command and preview.

- Shift
  - Preview consequences before commit. Fixed/protected items stay visible and conflicts are explained.

- Must / Should / Could
  - Attention strip, not another task system. Red-circle and completion remain distinct.

- Day
  - Teach-from-it surface: active Unit, Lesson, resources, prep/notes, actual teaching state, and next Lesson.

- Undo / Save
  - Undo is part of normal planning. Save/sync wording must state the real persistence state.

- Accessibility / keyboard
  - Help should reveal shortcuts when relevant rather than requiring a separate tutorial chapter.

### Help marks

Each major feature may expose a small `?` help affordance:
- clearly visible while Explore Arc is active;
- quieter afterward;
- visible/reachable by keyboard focus, not hover-only;
- individually reopenable without restarting the whole experience.

### Help + guidance settings

Add to More / Help and guidance:
- Show help marks
- Show first-time explanations
- Explore Arc again
- Review explored features
- keyboard shortcuts / quick actions entry

A global Help entry remains available even if local `?` marks are hidden.

### Progress

Allowed: quiet factual progress such as `Explored 6 of 9 planning tools` inside Help.

Forbidden:
- badges;
- confetti;
- streaks;
- required completion;
- giant onboarding checklist;
- language implying an experienced teacher has failed to learn Arc.

### Sample content rule

If Arc offers an exploration board, it must be clearly isolated from real class data and disposable. Prefer contextual sample/preview content over contaminating the real workspace with demo plans.

## Accessibility lock

The contextual-help change must improve—not weaken—the current accessibility direction:
- no drag-only core action;
- help marks keyboard reachable;
- contextual help named for screen readers;
- no required timed disappearance;
- reduced-motion mode removes animated shifting but preserves position/outline/text preview;
- color always paired with label/icon/pattern/state text;
- 200% zoom may use internal two-dimensional canvas scrolling, but essential controls remain reachable;
- screen-reader/calendar semantics and focus return remain release blockers until manually verified with VoiceOver/Safari and NVDA/Chrome.

## Phase 0 findings that change the ranked plan

1. Remove the forced first-run tutorial gate before calling onboarding complete.
2. Preserve the tutorial content by converting it into contextual first-use help + persistent Help.
3. Lock brand assets/palette/shell before domain migration.
4. Keep current Unit/Fridge/clipboard/Shift behaviors as parity fixtures.
5. Begin Phase 1 by introducing explicit occurrence/operation types alongside the current Plan model; do not big-bang replace all view code.
6. Build movement impact-set parity before adding more visible movement controls.
7. Treat screen-reader/manual accessibility evidence as a real remaining gate; current automated tests are necessary but insufficient.

## Phase 0 exit criteria

Phase 0 is complete only when:
- this map and R&D IDs are the implementation authority;
- approved logo/brand/shell regression evidence is captured;
- existing code has KEEP / ADAPT / MOVE / REPLACE / DEFER / REMOVE disposition;
- forced tutorial is removed from normal first-run flow and contextual-help replacement is specified/testable;
- current key behaviors have regression fixtures before domain migration;
- no production deployment occurs during the merge work.
