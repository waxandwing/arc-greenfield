import test from "node:test";
import assert from "node:assert/strict";
import type { Plan } from "../lib/domain";
import { minimumUnitEndDate, reviewUnitEndDate } from "../lib/unit-range";

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

test("Unit cannot end before its start", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit" });
  const review = reviewUnitEndDate(unit, [], "2026-09-07");
  assert.equal(review.allowed, false);
  assert.match(review.reason ?? "", /cannot end before it starts/i);
});

test("scheduled child Lesson sets the minimum Unit end", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit" });
  const children = [
    plan({ id: "a", title: "Palette", type: "lesson", parentUnitId: "unit", date: "2026-09-09" }),
    plan({ id: "b", title: "Khafre", type: "lesson", parentUnitId: "unit", date: "2026-09-15" })
  ];
  assert.equal(minimumUnitEndDate(unit, children), "2026-09-15");
});

test("Unit cannot shrink past an existing scheduled child", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit", endDate: "2026-09-18" });
  const children = [plan({ id: "lesson", title: "Temple", type: "lesson", parentUnitId: "unit", date: "2026-09-15" })];
  const review = reviewUnitEndDate(unit, children, "2026-09-12");
  assert.equal(review.allowed, false);
  assert.equal(review.minimumEndDate, "2026-09-15");
  assert.match(review.reason ?? "", /scheduled Lesson keeps this Unit open/i);
});

test("Unit can shrink to the last scheduled child date exactly", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit", endDate: "2026-09-18" });
  const children = [plan({ id: "lesson", title: "Temple", type: "lesson", parentUnitId: "unit", date: "2026-09-15" })];
  const review = reviewUnitEndDate(unit, children, "2026-09-15");
  assert.equal(review.allowed, true);
});

test("Unit can extend without moving its Lessons", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit", endDate: "2026-09-12" });
  const children = [plan({ id: "lesson", title: "Temple", type: "lesson", parentUnitId: "unit", date: "2026-09-10" })];
  const before = structuredClone(children);
  const review = reviewUnitEndDate(unit, children, "2026-09-22");
  assert.equal(review.allowed, true);
  assert.deepEqual(children, before);
});

test("unscheduled Unit must be placed before its range can be resized", () => {
  const unit = plan({ id: "unit", title: "Future idea", type: "unit", date: null, endDate: null, location: "fridge" });
  const review = reviewUnitEndDate(unit, [], "2026-09-20");
  assert.equal(review.allowed, false);
  assert.match(review.reason ?? "", /schedule the Unit/i);
});
