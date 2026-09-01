import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace } from "../lib/domain";
import { onboardingCompletedCount, onboardingReady, onboardingStepComplete, schoolYearRangeValid } from "../lib/onboarding-state";

test("onboarding requires a teacher name before the You step is complete", () => {
  const workspace = emptyWorkspace();
  assert.equal(onboardingStepComplete(workspace, "you"), false);
  workspace.teacherName = "  Kelly  ";
  assert.equal(onboardingStepComplete(workspace, "you"), true);
});

test("onboarding classes step requires at least one real class", () => {
  const workspace = emptyWorkspace();
  workspace.teacherName = "Kelly";
  assert.equal(onboardingStepComplete(workspace, "classes"), false);
  workspace.courses.push({ id: "course-1", name: "AP Art History", periodLabel: "2", color: "#53788A" });
  assert.equal(onboardingStepComplete(workspace, "classes"), true);
});

test("school year requires both dates in chronological order", () => {
  const workspace = emptyWorkspace();
  workspace.calendar.firstStudentDay = "2026-08-10";
  assert.equal(schoolYearRangeValid(workspace), false);
  workspace.calendar.lastStudentDay = "2027-05-28";
  assert.equal(schoolYearRangeValid(workspace), true);
  workspace.calendar.lastStudentDay = "2026-08-01";
  assert.equal(schoolYearRangeValid(workspace), false);
});

test("onboarding does not report ready until the real school-year range exists", () => {
  const workspace = emptyWorkspace();
  workspace.teacherName = "Kelly";
  workspace.courses.push({ id: "course-1", name: "AP Art History", periodLabel: "2", color: "#53788A" });
  assert.equal(onboardingCompletedCount(workspace), 2);
  assert.equal(onboardingReady(workspace), false);
  workspace.calendar.firstStudentDay = "2026-08-10";
  assert.equal(onboardingCompletedCount(workspace), 2);
  assert.equal(onboardingReady(workspace), false);
  workspace.calendar.lastStudentDay = "2027-05-28";
  assert.equal(onboardingCompletedCount(workspace), 3);
  assert.equal(onboardingReady(workspace), true);
});
