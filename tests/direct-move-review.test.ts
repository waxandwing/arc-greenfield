import test from "node:test";
import assert from "node:assert/strict";
import type { Plan } from "../lib/domain";
import { reviewDirectCalendarMove } from "../lib/direct-move-review";

function plan(overrides: Partial<Plan> & Pick<Plan, "id" | "title" | "type">): Plan {
  const { id, title, type, ...rest } = overrides;
  return {
    id,
    title,
    type,
    courseId: "course-a",
    date: "2026-09-08",
    endDate: type === "unit" ? "2026-09-12" : null,
    location: "calendar",
    parentUnitId: null,
    childOrder: null,
    fixedDate: false,
    continuationOfId: null,
    notes: "",
    resources: [],
    details: {},
    ...rest
  };
}

test("review names the fixed child that blocks a Unit move", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit" });
  const assessment = plan({ id: "assessment", title: "District assessment", type: "lesson", parentUnitId: "unit", fixedDate: true });
  const review = reviewDirectCalendarMove([unit, assessment], "unit", "2026-09-15", "course-a");
  assert.equal(review.allowed, false);
  assert.equal(review.protectedPlanId, "assessment");
  assert.match(review.reason ?? "", /District assessment is fixed inside this Unit/i);
});

test("review names the conflicting Lesson instead of failing silently", () => {
  const lesson = plan({ id: "lesson", title: "Discussion", type: "lesson" });
  const quiz = plan({ id: "quiz", title: "Quiz", type: "lesson", date: "2026-09-09" });
  const review = reviewDirectCalendarMove([lesson, quiz], "lesson", "2026-09-09", "course-a");
  assert.equal(review.allowed, false);
  assert.equal(review.conflictingPlanId, "quiz");
  assert.match(review.reason ?? "", /Quiz is already scheduled there/i);
});

test("safe direct move reviews as allowed", () => {
  const lesson = plan({ id: "lesson", title: "Discussion", type: "lesson" });
  const review = reviewDirectCalendarMove([lesson], "lesson", "2026-09-09", "course-a");
  assert.equal(review.allowed, true);
  assert.equal(review.reason, null);
});
