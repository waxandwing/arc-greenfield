# Arc Onboarding Spec

Date: 2026-09-13
Branch: `codex/arc-multiprep-arctable-integration`
Status: product-law / implementation-ready

## Purpose

Arc onboarding should get a teacher into a believable version of their real teaching day quickly, then let deeper setup happen progressively.

Onboarding must not become a long wizard that blocks access to the planner.

**Primary law:** Minimum setup first. Real teaching context immediately. Deeper setup later.

## First-run outcome

A teacher should finish first-run setup with enough truth for Arc to answer:

- what day is this?
- what periods/classes do I teach?
- which period is planning?
- which repeated Sections share a Course?
- what calendar dates are instructional / non-instructional?

The teacher does NOT need to complete every profile, import, curriculum, or integration decision before using Arc.

## Recommended first-run flow

### Step 1: Welcome
Short explanation only.

Suggested framing:

`Arc is where your plan lives when the plan changes.`

Do not include a feature tour.

Primary actions:
- Set up my teaching day
- Import what I already have

Secondary:
- Start simple

### Step 2: School year
Ask only for what is needed to establish temporal truth.

Preferred path:
- choose district / school calendar source when available
- review school year and instructional dates

Fallback:
- school-year start/end dates
- no-school dates can be added later

Do not make Google connection mandatory.

### Step 3: What do you teach?
Create Courses and Sections together in teacher language.

Example:

`AP Art History`
- P1
- P4

`2D Art 1`
- P2
- P6

`3D Art 1`
- P3
- P7

The interface should make shared Course planning obvious without teaching the user database terminology.

Avoid asking the teacher to create duplicate Courses for repeated Sections.

### Step 4: Build my day
Establish period order.

For each slot:
- period label
- Section OR Planning OR Lunch / other non-teaching block
- optional start/end times

Planning period must be an explicit type, not inferred forever from a missing period number.

Bell times can be skipped and completed later.

### Step 5: Land in Arc
Do not show a generic `Setup complete` dashboard.

Open the actual Day view using the teacher's teaching day.

The first-run landing should look like the real product, not onboarding chrome.

## First-use teaching moment

Once the teacher lands in Arc, teach Capture by using it.

Prompt:

`Something you need to remember for class?`

The teacher types a short thought.

It enters Workspace immediately as a Capture.

Then offer:

`Know where it belongs?`

Choices:
- Place it
- Leave it here

This demonstrates Arc's actual workflow:

`Capture -> organize later -> place when ready`

No tutorial carousel is needed.

## Progressive setup

After first-run, Arc may quietly surface setup opportunities only when relevant.

Examples:

### Bring in curriculum
Trigger when the teacher has Courses but little/no Lesson structure.

Action:
- Import curriculum
- Add a Unit manually
- Not now

### Finish bell schedule
Trigger when period order exists but times are missing and time-aware features would benefit.

### Add school-calendar detail
Trigger before a date conflict matters.

### Reuse last year's Course
Trigger when creating a Course with prior Arc history available.

### Profile
Teacher name / role is optional unless required by a feature.

Do not block planning for profile completion.

## Import relationship

Onboarding uses the same canonical import boundary defined in `ARC_IMPORT_SYSTEM_SPEC.md`.

Onboarding must not create a second simplified importer with different truth rules.

Possible entry points:
- Import school calendar during Step 2
- Import Courses/Sections during Step 3
- Import bell schedule during Step 4
- Import curriculum after landing in Arc

All consequential imports still require preview + teacher confirmation.

## Returning teacher behavior

If valid Arc state already exists:
- never restart onboarding automatically
- resume prior planning context when possible
- incomplete setup remains available in Settings / contextual prompts

If setup is partially complete:
- use what is valid
- identify only the missing dependency
- do not force the teacher back through completed steps

## Setup state model

Track setup as independent capabilities, not one binary `onboardingComplete` flag.

Suggested capability flags:
- calendarEstablished
- coursesEstablished
- sectionsEstablished
- dayOrderEstablished
- planningPeriodEstablished
- bellTimesEstablished
- curriculumEstablished
- profileEstablished

Planner access should require only the smallest valid subset needed for the current surface.

## Navigation law during onboarding

The user should never feel trapped in a setup tunnel.

Rules:
- Back preserves entered state.
- Skip means genuinely skip, not postpone behind a modal wall.
- Exit returns to the best valid Arc surface.
- Re-enter setup at the unresolved step, not Step 1.
- Import review can be cancelled without losing prior setup.

## Tone

Teacher-literate, direct, low-pressure.

Avoid:
- `Let's personalize your productivity journey!`
- `You're almost there!`
- congratulatory confetti
- account-setup jargon
- LMS/SIS language unless required by an actual integration

Prefer questions teachers already know how to answer:
- What do you teach?
- When do you teach it?
- Which period is yours to plan?
- Want to bring in what you already have?

## Visual direction

Use current Arc / ArcTable Figma language.

Onboarding should feel like Arc temporarily asking for missing pieces, not a separate web app.

Use:
- strong type
- generous working space
- restrained tactile surfaces
- clear selected context
- minimal permanent chrome

Do not resurrect:
- journal pages
- Fridge
- legacy side furniture
- old notebook shell
- generic SaaS wizard cards
- progress-stepper overload

## Needs Attention relationship

Incomplete setup may feed the governed contextual attention system when it affects planning quality.

Good example:
`Your P5 planning period is set, but bell times are not. Add times when you're ready.`

Bad example:
`3 setup tasks overdue!`

Setup prompts must never manufacture urgency.

## Minimum viable implementation order

### Phase 1
- capability-based setup state
- Course + repeated Section setup
- explicit Planning block
- period order
- direct Day landing

### Phase 2
- first-use Capture teaching moment
- progressive setup prompts
- resume partial setup

### Phase 3
- school-calendar import entry point
- bell-schedule import entry point
- curriculum import entry point using canonical import pipeline

### Phase 4
- prior-year reuse entry point
- optional profile / integrations

## Acceptance tests

Onboarding cannot be GREEN until tests prove:
- teacher can reach Day view without completing optional profile fields
- repeated Sections can share one Course
- Planning is explicitly modeled
- skipped bell times do not break Day view
- partial setup survives refresh
- cancelling import does not lose setup
- returning user does not re-enter first-run onboarding
- first Capture persists immediately
- Capture can remain unclassified
- Capture can later promote/place without duplicate identity
- no onboarding step silently mutates existing canonical planning truth

## First public beta recommendation

Required before entry:
- school-year/calendar minimum
- Courses/Sections
- teaching-day order
- Planning-period identification

Optional after entry:
- exact bell times
- curriculum import
- profile
- prior-year reuse
- external integrations

This keeps Arc useful quickly without pretending unfinished setup is complete.
