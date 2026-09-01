import type { Workspace } from "./domain";

export function repairOrphanedCoursePlans(workspace: Workspace): Workspace {
  const validCourseIds = new Set(workspace.courses.map((course) => course.id));
  const fallbackCourseId = workspace.courses[0]?.id ?? null;
  let changed = false;

  const plans = workspace.plans.map((plan) => {
    if (plan.courseId === null || validCourseIds.has(plan.courseId)) return plan;
    changed = true;
    return {
      ...plan,
      courseId: fallbackCourseId,
      location: "ideas" as const
    };
  });

  return changed ? { ...workspace, plans } : workspace;
}

export function removeCourseSafely(workspace: Workspace, courseId: string): Workspace {
  if (!workspace.courses.some((course) => course.id === courseId)) return repairOrphanedCoursePlans(workspace);

  const remainingCourses = workspace.courses.filter((course) => course.id !== courseId);
  return repairOrphanedCoursePlans({ ...workspace, courses: remainingCourses });
}
