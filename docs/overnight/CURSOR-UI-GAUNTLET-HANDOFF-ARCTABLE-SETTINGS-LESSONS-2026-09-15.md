# Cursor handoff — Arc UI Gauntlet: desk + ArcTable + Settings + lesson interaction

**Date:** 2026-09-15
**Target:** `main`
**Purpose:** Turn the current hard UI audits into implementation rules. This is a comprehension and interruption-resilience pass, not a visual redesign.

## North star

**Arc should feel like the teacher already knew how to use it.**

Every visible surface must justify itself by doing at least one of three jobs:

1. **Orient me** — where am I / what is happening now?
2. **Help me act** — what is the next useful thing I can do?
3. **Help me recover** — how do I undo, return, or find what moved?

If a control does none of those, remove, demote, or reveal it contextually.

---

# GLOBAL P0 RULES

## 1. One object = one obvious job

- Planner = scheduled teaching.
- IDEAS = unscheduled planning material.
- TO-DOS = teacher obligations, not teaching content.
- Quick Capture = get the thought out immediately.
- ArcTable = teach/present/live-class control.
- Settings = configuration.

Do not make the user learn overlapping object ownership.

## 2. Resolve IDEAS vs TRAY

Current desk code exposes both `IDEAS` and `TRAY` concepts for overlapping loose planning material. This is a mental-model collision.

**Required:** choose one teacher-facing noun. Prefer **IDEAS** throughout the desk unless a genuinely different function is proven.

Do not show `TRAY` as a second top-level destination for the same material.

## 3. Separate time navigation from utilities

DAY / WEEK / MONTH / YEAR answer **where am I in time?**

SETTINGS answers **configure Arc**.

Do not make SETTINGS feel like the fifth calendar view merely because it is physically adjacent. Keep the tactile tab art but visually and semantically separate it from calendar-scale navigation.

## 4. Default Week cognitive-load budget

At first glance, Week should have:

- 1 dominant heading
- 1 dominant planning surface
- 1 current-time cue
- 1 obvious quick-capture affordance
- 1 obvious Start Class affordance
- 0 dead controls
- 0 duplicate commands
- 0 required command syntax
- 0 instructional paragraphs required for normal use

---

# DESK / HEADER

## P0 — remove dead navigation

`DeskPlannerHeadRow` currently renders Previous and Next buttons around Today, but both are disabled.

**Required:** remove them until they work, or implement a real navigation contract. Do not render permanently dead controls.

## P0 — Search must state scope

A blank search field with an accessible label of `Search plan` is visually ambiguous.

**Required:** visible scope such as `Find a lesson, unit, note…` if global. Group results by type. Do not require scope selection before search.

## P1 — rename Enlarge

`Enlarge` describes geometry, not the user's goal.

Prefer a quiet expand icon with accessible label such as `Open calendar` / `Focus calendar`, or remove the text label if the icon is sufficiently conventional and accessible.

---

# QUICK CAPTURE

## P0 — remove required-looking command syntax

Current sticky placeholder/hint teaches `u / l / i / n` prefixes directly in the primary UI.

The parser can remain as a power-user feature, but the default experience must be:

1. type thought
2. Enter
3. visibly saved

No syntax knowledge required.

Default destination can be IDEAS. Classification can happen later.

Move prefix help into optional help/coach-mark documentation after basic capture works.

## P0 — verify identity, not duplication

The current save flow persists the capture and then spawns a desk Post-it.

Confirm the spawned physical object and the stored capture are two views of the **same underlying item**, or establish explicit lifecycle rules. Do not create two independently editable records that merely look like copies.

---

# LESSON INTERACTION GAUNTLET

## P0 — lesson body must have one primary click behavior

Current `LessonTile` behavior is split:

- clicking the lesson title opens the planning surface
- clicking the lesson article/body toggles action reveal
- contextual menu contains Move / Important
- Start Class may appear separately depending on date/status

This is too much location-dependent meaning for one paper object.

**Required contract:**

- click/tap lesson object = **open lesson**
- drag lesson object = **move lesson** when drag is supported
- visible/contextual overflow = secondary actions
- Start Class = visible contextual CTA only when relevant
- important = menu/contextual action
- recovery/resume = contextual state action

Do not require the user to learn that the title is the open target but the paper body is the action-reveal target.

### Touch requirement

A first tap must not merely reveal hidden controls when the user's natural expectation is to open the lesson. Essential actions cannot depend on hover.

## P0 — selected, current, in-progress, important must remain distinct

Lesson visual grammar must distinguish:

- selected lesson
- today's/current lesson
- in-progress delivery
- important flag
- fixed-date constraint
- section-specific override

Do not encode several meanings through the same border/highlight treatment. Color cannot be the sole carrier.

## P0 — Start Class discoverability

`canStartClass` currently depends on delivery state and focus date.

That is logically reasonable, but the UI needs to explain absence when a teacher expects to start something.

Do not silently hide the action in an apparently startable lesson without a comprehensible reason.

Where appropriate, show a contextual disabled/secondary explanation such as `Open today to start` rather than making the action vanish.

## P1 — unit click should not unexpectedly throw user into Month

Current Unit span action opens the unit in **Month at unit start**.

That is a large navigation jump from Week and may violate user expectation that clicking the unit opens/focuses the unit itself.

Reconsider contract:

- default click = unit detail/focus while retaining orientation
- explicit `Show in Month` = navigation action if useful

Do not hide a cross-view jump behind the unit object itself.

## P1 — recovery language

In-progress lesson recovery should use teacher language tied to the interrupted lesson: e.g. **Resume**, **Pick up here**, or a clearly named recovery action.

Avoid product/system vocabulary.

## Lesson gauntlet scenarios

1. Teacher clicks a lesson expecting details.
2. Teacher drags it one day forward.
3. Teacher tries to move fixed-date lesson.
4. Teacher starts today's class.
5. Teacher returns from ArcTable and sees lesson status changed.
6. Teacher was interrupted mid-lesson and needs to resume tomorrow.
7. Teacher marks lesson Important.
8. Teacher uses touch only, no hover.
9. Teacher uses keyboard only.
10. Teacher clicks Unit and does not lose orientation unexpectedly.

Pass only if each outcome is predictable before the click.

---

# SETTINGS GAUNTLET

Current top-level sections:

- My school year
- My teaching day
- My courses
- Planning
- Desk setup
- ArcTable
- Accessibility & display
- Data / import / reuse

This is too many conceptual buckets for a utility panel, especially when some contain explanation rather than editable settings.

## P0 — Settings must be controls, not mixed documentation

`ArcTable` and `Accessibility & display` currently contain explanatory copy with no direct action in the section itself.

**Required:** either provide the relevant control there or remove/merge the section. Do not create a heading that promises configurability but only explains where another setting lives.

## P0 — reduce top-level grouping

Recommended high-level grouping to test:

### School & classes
- Calendar dates
- Terms
- Courses & sections
- Teaching day

### Planning
- default planner view
- weekends
- units/lessons/import entry points where appropriate

### Desk
- Arrange Desk
- object visibility
- object sizes
- ArcTable visibility
- notes visibility

### Accessibility & display
- actual accessibility/display controls only

### Data & reuse
- curriculum import / future reuse tools

The exact labels can change, but aim for ~4–5 coherent groups, not 8 mixed ones.

## P0 — use the same nouns as the desk

Current Desk setup uses `Tray`, while the desk teaches `IDEAS`.

Resolve this globally.

Likewise, do not expose `MSC` internally; user-facing language is **Must / Should / Could** or **To-dos** depending on final product naming.

## P1 — rename Edit Workspace

The setting says `Edit Workspace`, while the interaction is specifically rearranging physical desk furniture.

Prefer **Arrange desk** / **Edit desk layout**.

The edit-mode toolbar exit should be explicit: **Done arranging**, not `Pin it down` as the sole exit label.

Personality can remain in secondary copy, but mode exit must optimize clarity.

## P1 — settings changes should explain immediate effect

For default view, weekends, sizes, visibility, etc. changes should either:

- apply immediately and visibly, or
- explicitly say when they will apply.

Avoid Save buttons for reversible preference changes unless persistence requires one.

## Settings gauntlet scenarios

1. Hide ArcTable, then find how to restore it.
2. Turn weekends on/off and return to Week.
3. Change default planner view and understand when it applies.
4. Arrange desk and safely exit arrangement mode.
5. Add/edit classes without losing the route back to Settings/Week.
6. Find import without already knowing setup taxonomy.
7. Keyboard-navigate the whole surface.

---

# ARCTABLE GAUNTLET

## What already exists and should be preserved

Repo has a Playwright `teacher-monitor-ux.verify.mjs` that verifies:

- Teacher Monitor fits viewport at 1440×1000
- three-column board / center-stage / controls structure
- timer honesty (`10:00` for 10-minute idle timer)
- media surface presence
- tool panel open / outside-click close
- Settings entry
- Return to ArcTable path from Settings
- no overall page scroll in tested viewport

Treat this as functional regression coverage, **not final usability approval**.

## P0 — live class hierarchy must be ruthless

During instruction the teacher's priority stack should be:

1. what students are doing now
2. time remaining / cleanup if active
3. current phase and next phase
4. projected media/student
5. immediate classroom utility (person/pass)
6. planning/settings only as escape routes

Do not let configuration controls compete with the live lesson.

## P0 — distinguish Teacher Monitor from Student projection instantly

The teacher must never wonder which screen is student-visible.

Teacher Monitor should carry an unmistakable persistent teacher-only cue.

Student preview should say clearly that it is a preview before the teacher projects/switches.

Do not rely on layout difference alone.

## P0 — Plan View during class needs a return contract

`Plan View` can be useful, but it is a context switch during live instruction.

Required:

- leaving ArcTable must preserve live session state
- Plan View must display a persistent `Return to ArcTable` / `Return to class` affordance
- returning must restore timer/tool/session state accurately

Existing Settings test already verifies a Return to ArcTable affordance. Apply the same certainty to Plan View.

## P0 — Settings during class should not become a rabbit hole

Current ArcTable header exposes Settings while live.

If it opens full Arc Settings, keep `Return to ArcTable` pinned and visually dominant.

Consider whether class-critical settings belong in ArcTable itself while global configuration stays secondary.

A teacher should not accidentally end up several setup screens away while a timer is running.

## P0 — timer/cleanup state must survive navigation

Test explicitly:

1. start 10-minute timer
2. leave to Plan View
3. return
4. remaining time is correct
5. start cleanup
6. open People/Pass/Media
7. close panel
8. cleanup remains correct

No reset through view transitions.

## P1 — control rail is dense

Teacher controls currently include timer, phase stepper, materials, voice expectation, board lock, student preview, cleanup controls plus the People/Pass/Media furniture tabs.

That is powerful but potentially overexposed.

Prioritize by moment:

- Timer and phase = always available
- Cleanup = prominent when active / one-touch to start
- Materials + voice = visible but quieter
- board lock / preview / configuration = secondary
- People/Pass/Media = contextual utility tabs

Do not make every capability equally loud.

## P1 — `End Class` needs consequence clarity

Keep a deliberate completion/recovery flow. Ending class changes lesson delivery state and may create resume data.

Confirmation is justified here, unlike routine reversible desk actions.

Show exactly what will happen to the lesson/session when ending.

## ArcTable live-class scenarios

1. Start class from today's lesson.
2. Start/pause/resume timer.
3. Move to next phase without losing student directions.
4. Pick a student and project selection.
5. Issue/return a pass.
6. Project media.
7. Start cleanup with minimal clicks.
8. Open Plan View mid-timer and return.
9. Open Settings mid-class and return.
10. Preview Student view and clearly know it is preview.
11. End class as completed.
12. End class as interrupted and resume later.
13. Keyboard-only tool use.
14. Smart Board/touch use without hover.

---

# CROSS-SURFACE CONTINUITY

This is the part most likely to make Arc feel magical or maddening.

## Lesson → ArcTable → lesson

The same lesson must retain identity and state across:

Week lesson object → Start Class → ArcTable live session → End/Interrupt → Week lesson object.

Verify:

- title/course/section remain correct
- timer does not alter planning dates
- completed lesson visually becomes completed
- interrupted lesson becomes resumable
- resume note returns to the lesson
- no duplicate lesson record is created

## Settings → desk

Settings changes should be reflected on return without the teacher wondering whether Save was required.

## Capture → IDEAS → planner

The same captured item should travel through the system, not leave unexplained copies behind.

---

# REQUIRED CURSOR IMPLEMENTATION ORDER

Do not redesign everything simultaneously.

### Pass 1 — eliminate semantic contradictions
1. IDEAS vs TRAY naming
2. Settings separated from calendar-scale navigation
3. remove dead prev/next arrows
4. remove visible quick-capture command syntax
5. lesson body opens lesson
6. `Arrange desk` / `Done arranging` terminology

### Pass 2 — continuity + recovery
7. drag/drop placement feedback + named Undo
8. lesson → ArcTable → lesson state continuity
9. Plan View / Settings → Return to ArcTable
10. timer/cleanup state across navigation
11. capture identity through IDEAS/planner

### Pass 3 — information hierarchy
12. simplify Settings groups
13. reduce ArcTable controls by priority
14. clarify Search scope
15. unify Today/current/selected grammar
16. review lesson state grammar

### Pass 4 — visual/material pass
17. apply canonical Kelly assets
18. polish without changing the behavior contract
19. run Teaching Week pixel gate

---

# ACCEPTANCE GATE

Do not call UI Green because the routes work or because Playwright passes.

For every primary object/control ask:

- Can I predict what happens before I click?
- Does the whole object behave the way it looks like it should?
- If something moves, do I know where it went?
- If Arc automated something, can I see what happened?
- Can I undo or return immediately?
- Does touch work without hover?
- Can keyboard users perform the same primary task?
- Is the teacher's live task more visually important than configuration?

## Final standard

**A teacher should not need to learn Arc's taxonomy in order to benefit from Arc.**

The product model should become obvious through use.