# Arc Import System Spec

Date: 2026-09-13
Branch: `codex/arc-multiprep-arctable-integration`
Status: product-law / implementation-ready

## Purpose

Arc should let a teacher bring an existing teaching life into the planner without forcing manual reconstruction and without silently rewriting canonical planning truth.

**Primary law:** Arc proposes. Teacher confirms.

No importer may silently create, merge, overwrite, deduplicate, reschedule, or reinterpret Courses, Sections, Units, Lessons, fixed dates, or school-calendar state without a visible review step.

## Supported import lanes

### 1. School calendar
May include:
- instructional days
- holidays / no-school days
- teacher workdays
- testing days
- early-release days
- quarter / semester boundaries
- fixed school events

Current governed official-calendar source work should remain the basis for this lane.

### 2. Bell schedule
May include:
- period labels
- start/end times
- planning period
- lunch
- block / alternating schedule variants
- special-day schedules

Bell schedule data informs the Day view and planning-period lens. It must not alter Course/Lesson truth.

### 3. Courses + Sections
May include:
- Course name
- Section / period
- repeated Sections of the same Course
- optional room / meeting metadata where useful

Import must preserve the canonical relationship: multiple Sections may point to one Course.

### 4. Curriculum import
Initial production format: CSV.

Canonical CSV fields:
- Course
- Order
- Unit
- Unit Length
- Item Type
- Title
- Item Length
- Content/Resources
- Homework/Next Up
- Important Notes

The parser may propose Units/Lessons from these fields but must not invent unsupported structure.

### 5. Prior-year / prior-Arc reuse
A future-compatible lane for importing:
- Course
- Unit
- Lesson sequence
- selected resources/content

Prior-year reuse must create current-year planning truth without sharing mutable IDs with historical records.

### 6. Start from scratch
Import is optional. Arc remains fully usable without any import.

## Unified pipeline

Every import source should converge into one review pipeline:

`Choose source -> Parse -> Classify -> Flag ambiguity -> Review -> Resolve -> Preview changes -> Confirm -> Commit -> Verify`

### Stage A: Choose source
Teacher chooses one of:
- school calendar
- bell schedule
- Courses/Sections
- curriculum CSV
- prior Arc material
- skip

### Stage B: Parse
Arc reads source data into temporary import candidates.

**Nothing canonical is written here.**

Each candidate receives:
- source identifier
- temporary candidate ID
- detected type
- parsed fields
- confidence / ambiguity flags
- source row/page reference when available

### Stage C: Classify
Arc proposes canonical targets such as:
- CalendarDate
- Course
- Section
- Unit
- Lesson

The teacher can correct classification before import.

### Stage D: Ambiguity review
Examples requiring explicit review:
- two source rows appear to represent the same Course
- a Unit title repeats inside one Course
- dates fall on known no-school days
- a Section references a Course that does not yet exist
- CSV row lacks Item Type
- duplicate Lesson title may or may not be intentional
- fixed assessment conflicts with inferred sequence

Arc should say what it detected, not pretend certainty.

### Stage E: Preview
Before commit, show a human-readable summary:

- 3 Courses will be created
- 6 Sections will be linked
- 9 Units will be created
- 37 Lessons will be created
- 4 dates were skipped because school is closed
- 2 rows require a decision
- 1 potential duplicate was left separate

Preview should allow drilling into exact proposed changes.

### Stage F: Confirm
Teacher explicitly confirms import.

### Stage G: Commit
Commit should be atomic where practical. A failed import must not leave half-created curriculum truth.

### Stage H: Verify
After import:
- show what changed
- show what was skipped
- show unresolved items
- provide a direct route into the imported Course / date / Workspace context

## Duplicate and re-import law

### Never dedupe by title alone
`Intro to Color` may legitimately exist more than once.

### Stable import fingerprint
For imported records, retain a source fingerprint such as:
- source type
- source file/document identity when available
- source row identifier
- normalized structural path

This allows Arc to recognize a true re-import candidate without making title-based guesses.

### Re-import behavior
When a previously imported source returns:

Arc should classify each candidate as:
- unchanged
- new
- changed upstream
- changed locally
- conflict
- removed upstream

Then let the teacher choose what to do.

Do not silently overwrite a locally edited Lesson because a CSV changed.

## Canonical identity rules

- Imported Course gets a new Arc Course ID unless it is explicitly matched to an existing Course.
- Repeated Sections may point to one Course.
- Imported Unit belongs to exactly one canonical Course.
- Imported Lesson belongs to one Unit.
- Imported Lesson identity is new unless confirmed as a re-import match.
- Prior-year copy/reuse creates new current-year IDs.
- Section delivery state is never imported from curriculum CSV unless a future governed format explicitly supports it.

## Date placement law

If curriculum data includes dates or lengths:
- use confirmed instructional calendar truth
- skip / flag no-school days
- protect fixed dates
- never silently move a fixed assessment
- show placement preview before commit

If dates are absent:
- import curriculum as unscheduled canonical Course/Unit/Lesson structure
- place into Workspace / planning library rather than inventing calendar dates

## Error handling

### Recoverable row error
Import valid rows and hold invalid rows in a review queue only if the teacher explicitly chooses partial import.

### Fatal structural error
Do not write canonical data. Preserve the parsed review state so the teacher can correct and retry.

### Unsupported file/source
Explain what Arc could not read and retain the original source unchanged.

### Malformed data
Never coerce destructive guesses. Mark the field for review.

## UI requirements

The importer should feel like an editorial review surface, not a database wizard.

Avoid:
- spreadsheet-admin chrome
- red error badge swarms
- generic SaaS stepper overload
- hidden automatic mapping

Prefer:
- source on one side
- Arc proposal on the other
- clear structural grouping
- lightweight change summary
- visible uncertainty
- teacher confirmation at consequential steps

## Minimum viable implementation order

### Phase 1: Curriculum CSV preview-only parser
1. Parse canonical CSV fields.
2. Build temporary candidate model.
3. Group by Course -> Unit -> Lesson.
4. Surface malformed / ambiguous rows.
5. Preview proposed structure.
6. No writes yet.

### Phase 2: Confirmed curriculum commit
1. Create canonical Course/Unit/Lesson records.
2. Preserve source fingerprint.
3. Validate Unit/Course relationships.
4. Support unscheduled import.
5. Produce post-import receipt.

### Phase 3: Date-aware import
1. Respect instructional calendar.
2. Preview placement.
3. Protect no-school/fixed dates.
4. Support selected start date / quarter metadata without creating Quarter screens.

### Phase 4: Re-import and conflict handling
1. Match by fingerprint.
2. Detect local-vs-source changes.
3. Present explicit merge choices.
4. Never overwrite silently.

### Phase 5: Prior-year Arc reuse
1. Select Course/Unit/Lesson scope.
2. Clone into current year with fresh IDs.
3. Preserve content/resources where valid.
4. Do not carry Section delivery outcomes by default.

## Acceptance tests

Import cannot be GREEN until tests prove:
- title duplicates are not collapsed incorrectly
- repeated Sections share one Course when intentionally mapped
- invalid rows cannot corrupt canonical state
- no-school days are not silently scheduled
- fixed dates do not move
- unscheduled curriculum can exist without fake dates
- re-import does not overwrite local edits silently
- failed import leaves previous canonical data intact
- refresh preserves committed import truth
- imported Lessons remain valid across Day/Week/Month/Year/Workspace

## Explicit non-goals for first production pass

- LMS sync
- SIS sync
- marketplace/library browsing
- AI-generated curriculum
- automatic semantic restructuring without review
- Google Drive ingestion before the canonical parser/review boundary is stable

## Product question still open

How much of prior-year planning history should be visible during reuse? Default recommendation: import current reusable curriculum content, not old Section delivery history, unless the teacher explicitly asks for it.
