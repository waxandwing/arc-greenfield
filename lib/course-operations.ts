import type { Workspace } from "./domain";

export function removeCourseSafely(workspace: Workspace, courseId: string): Workspace {
  if (!workspace.courses.some((course) => course.id === courseId)) return workspace;

  const remainingCourses = workspace.courses.filter((course) => course.id !== courseId);
  const fallbackCourseId = remainingCourses[0]?.id ?? null;

  return {
    ...workspace,
    courses: remainingCourses,
    plans: workspace.plans.map((plan) => {
      if (plan.courseId !== courseId) return plan;
      return {
        ...plan,
        courseId: fallbackCourseId,
        location: "ideas" as const
      };
    })
  };
}
