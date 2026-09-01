import type { Workspace } from "./domain";

export type OnboardingStep = "you" | "classes" | "calendar";

export function schoolYearRangeValid(workspace: Workspace) {
  const start = workspace.calendar.firstStudentDay;
  const end = workspace.calendar.lastStudentDay;
  if (!start || !end) return false;
  return start <= end;
}

export function onboardingStepComplete(workspace: Workspace, step: OnboardingStep) {
  if (step === "you") return workspace.teacherName.trim().length > 0;
  if (step === "classes") return workspace.courses.length > 0;
  return schoolYearRangeValid(workspace);
}

export function onboardingReady(workspace: Workspace) {
  return onboardingStepComplete(workspace, "you") && onboardingStepComplete(workspace, "classes") && onboardingStepComplete(workspace, "calendar");
}

export function onboardingCompletedCount(workspace: Workspace) {
  return (["you", "classes", "calendar"] as const).filter((step) => onboardingStepComplete(workspace, step)).length;
}
