import type { Workspace } from "./domain";
import { objectLocation } from "./object-lifecycle";

export function repairOrphanedCoursePlans(workspace: Workspace): Workspace {
  const validCourseIds = new Set(workspace.courses.map((course) => course.id));
  const fallbackCourseId = workspace.courses[0]?.id ?? null;
  let changed = false;

  const plans = workspace.plans.map((plan) => {
    if (plan.courseId === null || validCourseIds.has(plan.courseId)) return plan;
    changed = true;

    const priorLocation = objectLocation(plan);
    const retainedTaskBar = priorLocation === "taskbar";

    return {
      ...plan,
      courseId: fallbackCourseId,
      // Losing a Course cannot leave an object claiming it is still actively
      // placed on that Course's calendar. Calendar/Fridge objects are parked in
      // the Fridge; Task Bar objects stay in the Task Bar. Rich fields, dates,
      // fixed anchors, IDs, hierarchy, and task metadata remain untouched.
      location: "ideas" as const,
      arcLocation: retainedTaskBar ? "taskbar" as const : "fridge" as const
    };
  });

  return changed ? { ...workspace, plans } : workspace;
}

export function removeCourseSafely(workspace: Workspace, courseId: string): Workspace {
  if (!workspace.courses.some((course) => course.id === courseId)) return repairOrphanedCoursePlans(workspace);

  const remainingCourses = workspace.courses.filter((course) => course.id !== courseId);
  return repairOrphanedCoursePlans({ ...workspace, courses: remainingCourses });
}
