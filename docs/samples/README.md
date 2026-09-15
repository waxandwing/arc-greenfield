# Curriculum import samples

These files match Arc’s curriculum CSV parser (`CURRICULUM_CSV_FIELDS` in `src/planning/curriculumImport.ts`). They are for teachers and coaches—not loaded automatically by the app.

## `arc-curriculum-import-sample.csv`

A realistic multi-course outline (AP Art History and Biology Honors) with lessons, an optional unit row, and mixed item types (`Lesson`, `Activity`, `Assessment`, `Project`).

### How to use it in Arc

1. In Arc Plan, open **Import curriculum** (curriculum CSV lane).
2. Enter a **Source name** (for example `arc-curriculum-import-sample.csv`) so re-imports stay traceable.
3. Upload this file with **Choose a CSV file**, or paste its contents into **CSV content**.
4. Choose **Review proposal**, fix any flagged rows, then **Confirm** when the preview matches what you want.

Parsing and review do not write to your plan until you confirm. Imported lessons stay **unscheduled** until you place them on the calendar.

### Column reference

| Column | Required | Notes |
| --- | --- | --- |
| Course | Yes | Groups rows into one course (case-insensitive title match). |
| Order | No | Positive whole number; lesson sequence within the unit when set. |
| Unit | Yes | Unit title shared by rows in that unit. |
| Unit Length | No | Planning hint only (for example `2 weeks`, `10 days`). |
| Item Type | Yes | `Unit` for a unit-only row; `Lesson`, `Activity`, `Project`, or `Assessment` for lessons. |
| Title | Yes | Lesson or unit title. Use quotes if the title contains commas. |
| Item Length | No | For example `45 min` or `2 class periods`. |
| Content/Resources | No | If this is a single `http://` or `https://` URL, Arc attaches it as a lesson link. |
| Homework/Next Up | No | Becomes “Next: …” in lesson directions. |
| Important Notes | No | Added to lesson directions. |

Header aliases (for example `Type` for Item Type, `Notes` for Important Notes) are accepted; duplicate canonical headers are not.
