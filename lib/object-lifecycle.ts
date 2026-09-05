import type { Plan, PriorityTier } from "./domain";

export type ArcObjectLocation = "fridge" | "taskbar" | "calendar";

export type TaskContext = {
  tier: PriorityTier;
  notes?: string;
  startTime?: string;
  durationMinutes?: number;
  targetDate?: string;
};

export type ArcPlanningObject = Plan & {
  arcLocation?: ArcObjectLocation;
  taskContext?: TaskContext | null;
};

function normalizeLocation(plan: ArcPlanningObject): ArcObjectLocation {
  if (plan.arcLocation) return plan.arcLocation;
  return plan.location === "calendar" ? "calendar" : "fridge";
}

export function objectLocation(plan: ArcPlanningObject): ArcObjectLocation {
  return normalizeLocation(plan);
}

export function moveObjectToFridge(plan: ArcPlanningObject): ArcPlanningObject {
  return {
    ...plan,
    arcLocation: "fridge",
    location: "ideas",
    // Canonical rule: richer calendar/task data stays attached and is merely hidden by simpler surfaces.
  };
}

export function moveObjectToTaskBar(plan: ArcPlanningObject, tier: PriorityTier): ArcPlanningObject {
  return {
    ...plan,
    arcLocation: "taskbar",
    location: "ideas",
    taskContext: {
      ...(plan.taskContext ?? {}),
      tier
    }
  };
}

export function moveObjectToCalendar(
  plan: ArcPlanningObject,
  input: { date: string; courseId: string | null }
): ArcPlanningObject {
  return {
    ...plan,
    arcLocation: "calendar",
    location: "calendar",
    date: input.date,
    courseId: input.courseId
  };
}

export function updateTaskContext(
  plan: ArcPlanningObject,
  patch: Partial<TaskContext>
): ArcPlanningObject {
  return {
    ...plan,
    taskContext: {
      tier: plan.taskContext?.tier ?? "should",
      ...plan.taskContext,
      ...patch
    }
  };
}
