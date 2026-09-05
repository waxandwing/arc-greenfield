import type { Plan, Section, Workspace } from "./domain";

/**
 * Transitional compatibility: old workspaces may not have explicit Sections yet.
 * We derive one Section per Course without mutating stored data. New setup should
 * persist real Sections so shared Courses can diverge cleanly by teaching instance.
 */
export function effectiveSections(workspace: Workspace): Section[] {
  if (workspace.sections?.length) return workspace.sections;
  return workspace.courses.map((course) => ({
    id: `derived:${course.id}`,
    courseId: course.id,
    name: course.name,
    periodLabel: course.periodLabel,
    color: course.color
  }));
}

export function sectionPlans(workspace: Workspace, section: Section, date: string): Plan[] {
  return workspace.plans.filter((plan) => {
    if (plan.location !== "calendar" || plan.type === "unit") return false;
    if (plan.courseId !== section.courseId) return false;
    if (plan.sectionId && plan.sectionId !== section.id) return false;
    return plan.date === date;
  });
}

export function carryoverPlans(workspace: Workspace, section: Section, date: string): Plan[] {
  return workspace.plans.filter((plan) => {
    if (plan.location !== "calendar" || plan.type !== "lesson") return false;
    if (plan.courseId !== section.courseId) return false;
    if (plan.sectionId && plan.sectionId !== section.id) return false;
    if (!plan.date || plan.date >= date) return false;
    const delivery = plan.sectionDelivery?.[section.id];
    return !delivery || delivery.state === "not-started" || delivery.state === "in-progress";
  });
}

export function isAfterSchoolPlan(plan: Plan): boolean {
  return plan.type === "note" && plan.details.surface === "after-school";
}

export function afterSchoolPlans(workspace: Workspace, date: string): Plan[] {
  return workspace.plans.filter((plan) => plan.location === "calendar" && plan.date === date && isAfterSchoolPlan(plan));
}
