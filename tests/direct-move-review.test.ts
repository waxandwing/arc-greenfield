import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan, type Workspace } from "../lib/domain";
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

function workspace(plans: Plan[], weekdays = [1, 2, 3, 4, 5]): Workspace {
  const value = emptyWorkspace();
  return {
    ...value,
    teacherName: "Test Teacher",
    courses: [{ id: "course-a", name: "Ceramics", periodLabel: "3", color: "#557b93", meetingPattern: { kind: "weekdays", weekdays } }],
    calendar: { ...value.calendar, firstStudentDay: "2026-08-10", lastStudentDay: "2027-05-28" },
    plans
  };
}

test("review names the fixed child that blocks a Unit move", () => {
  const unit = plan({ id: "unit", title: "Egypt", type: "unit" });
  const assessment = plan({ id: "assessment", title: "District assessment", type: "lesson", parentUnitId: "unit", fixedDate: true });
  const review = reviewDirectCalendarMove(workspace([unit, assessment]), "unit", "2026-09-15", "course-a");
  assert.equal(review.allowed, false);
  assert.equal(review.protectedPlanId, "assessment");
  assert.match(review.reason ?? "", /District assessment is fixed inside this Unit/i);
});

test("review names the conflicting Lesson instead of failing silently", () => {
  const lesson = plan({ id: "lesson", title: "Discussion", type: "lesson" });
  const quiz = plan({ id: "quiz", title: "Quiz", type: "lesson", date: "2026-09-09" });
  const review = reviewDirectCalendarMove(workspace([lesson, quiz]), "lesson", "2026-09-09", "course-a");
  assert.equal(review.allowed, false);
  assert.equal(review.conflictingPlanId, "quiz");
  assert.match(review.reason ?? "", /Quiz is already scheduled there/i);
});

test("loose Lesson cannot move to a day its class does not meet", () => {
  const lesson = plan({ id: "lesson", title: "Wheel demo", type: "lesson", date: "2026-09-07" });
  const review = reviewDirectCalendarMove(workspace([lesson], [1, 3, 5]), "lesson", "2026-09-08", "course-a");
  assert.equal(review.allowed, false);
  assert.equal(review.invalidMeetingPlanId, "lesson");
  assert.match(review.reason ?? "", /Wheel demo would land on Tue, Sep 8, when Ceramics does not meet/i);
});

test("Unit move is blocked when a nested Lesson would land on a non-meeting day", () => {
  const unit = plan({ id: "unit", title: "Clay Foundations", type: "unit", date: "2026-09-07", endDate: "2026-09-11" });
  const lesson = plan({ id: "lesson", title: "Pinch pots", type: "lesson", parentUnitId: "unit", childOrder: 0, date: "2026-09-09" });
  const review = reviewDirectCalendarMove(workspace([unit, lesson], [1, 3, 5]), "unit", "2026-09-08", "course-a");
  assert.equal(review.allowed, false);
  assert.equal(review.invalidMeetingPlanId, "lesson");
  assert.match(review.reason ?? "", /Pinch pots would land on Thu, Sep 10, when Ceramics does not meet/i);
});

test("safe direct move reviews as allowed", () => {
  const lesson = plan({ id: "lesson", title: "Discussion", type: "lesson" });
  const review = reviewDirectCalendarMove(workspace([lesson]), "lesson", "2026-09-09", "course-a");
  assert.equal(review.allowed, true);
  assert.equal(review.reason, null);
});
