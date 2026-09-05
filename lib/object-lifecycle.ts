import type { ArcObjectLocation, Plan, Priority, PriorityTier, TaskContext, Workspace } from "./domain";

export type ArcPlanningObject = Plan;

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
    location: "ideas"
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

/** Convert legacy Priority records into stable planning objects once, preserving user-visible data. */
export function migrateLegacyPriorities(workspace: Workspace): Workspace {
  if (!workspace.priorities.length) return workspace;

  const existingIds = new Set(workspace.plans.map((plan) => plan.id));
  const migrated = workspace.priorities.map((priority: Priority): Plan => {
    const id = existingIds.has(priority.id) ? `legacy-priority-${priority.id}` : priority.id;
    return {
      id,
      type: "note",
      title: priority.title,
      courseId: null,
      date: null,
      endDate: null,
      location: "ideas",
      arcLocation: "taskbar",
      taskContext: {
        tier: priority.tier,
        completed: priority.completed
      },
      parentUnitId: null,
      childOrder: null,
      fixedDate: false,
      continuationOfId: null,
      notes: "",
      resources: [],
      details: {
        migratedFrom: "legacy-priority",
        legacyScope: priority.scope
      }
    };
  });

  return {
    ...workspace,
    plans: [...workspace.plans, ...migrated],
    priorities: []
  };
}
