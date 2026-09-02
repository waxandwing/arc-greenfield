import test from "node:test";
import assert from "node:assert/strict";
import type { Plan } from "../lib/domain";
import { emptyMovementImpactSet, legacyPlanToOccurrence } from "../lib/continuity-domain";

function lesson(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "lesson-1",
    type: "lesson",
    title: "Contour warm-up",
    courseId: "studio-art-p2",
    date: "2026-09-14",
    endDate: null,
    location: "calendar",
    parentUnitId: "unit-1",
    childOrder: 0,
    fixedDate: false,
    continuationOfId: null,
    notes: "",
    resources: [],
    details: {},
    ...overrides
  };
}

test("moving a legacy lesson changes its planned date without changing occurrence identity", () => {
  const before = legacyPlanToOccurrence(lesson({ date: "2026-09-14" }));
  const after = legacyPlanToOccurrence(lesson({ date: "2026-09-16" }));
  assert.ok(before && after);
  assert.equal(before.occurrenceId, after.occurrenceId);
  assert.equal(before.lessonId, after.lessonId);
  assert.equal(before.plannedDate, "2026-09-14");
  assert.equal(after.plannedDate, "2026-09-16");
});

test("an undated Fridge lesson remains an uncommitted occurrence", () => {
  const occurrence = legacyPlanToOccurrence(lesson({ location: "fridge", date: null }));
  assert.equal(occurrence?.state, "UNCOMMITTED");
  assert.equal(occurrence?.plannedDate, null);
});

test("a scheduled lesson parked on the Fridge preserves its prior schedule context", () => {
  const occurrence = legacyPlanToOccurrence(lesson({ location: "fridge", date: "2026-09-14" }));
  assert.equal(occurrence?.state, "PARKED");
  assert.equal(occurrence?.plannedDate, "2026-09-14");
});

test("legacy taught state maps to actual occurrence state without changing lesson identity", () => {
  const occurrence = legacyPlanToOccurrence(lesson({
    details: { taught: "true", taughtOn: "2026-09-15" },
    fixedDate: true
  }));
  assert.equal(occurrence?.state, "TAUGHT");
  assert.equal(occurrence?.actualDate, "2026-09-15");
  assert.equal(occurrence?.protected, true);
  assert.equal(occurrence?.lessonId, "lesson-1");
});

test("non-Lesson legacy plans do not fabricate instructional occurrences", () => {
  assert.equal(legacyPlanToOccurrence({ ...lesson(), type: "unit" }), null);
  assert.equal(legacyPlanToOccurrence({ ...lesson(), type: "note" }), null);
  assert.equal(legacyPlanToOccurrence({ ...lesson(), type: "idea" }), null);
});

test("movement impact sets start explicit and empty rather than implying success", () => {
  assert.deepEqual(emptyMovementImpactSet(), {
    landing: [], shifted: [], protected: [], displaced: [], skipped: [], unchanged: [], warnings: [], errors: []
  });
});
