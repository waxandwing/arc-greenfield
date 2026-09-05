export type ArcView = "day" | "week" | "month" | "quarter" | "semester" | "year";

export type PlanType = "unit" | "lesson" | "note";
export type PlanLocation = "calendar" | "ideas";
export type PriorityTier = "must" | "should" | "could";
export type ArcObjectLocation = "fridge" | "taskbar" | "calendar";

export type TaskContext = {
  tier: PriorityTier;
  notes?: string;
  startTime?: string;
  durationMinutes?: number;
  targetDate?: string;
  completed?: boolean;
};

export type Course = {
  id: string;
  name: string;
  periodLabel: string;
  color: string;
};

export type SchoolCalendar = {
  firstStudentDay: string | null;
  lastStudentDay: string | null;
  quarterBoundaries: Array<{ id: string; label: string; start: string; end: string }>;
  noSchoolDates: Array<{ id: string; date: string; label: string }>;
  weekendsVisible: boolean;
};

export type Plan = {
  id: string;
  type: PlanType;
  title: string;
  courseId: string | null;
  date: string | null;
  endDate: string | null;
  location: PlanLocation;
  /** Canonical interaction location. Optional for backwards-compatible stored workspaces. */
  arcLocation?: ArcObjectLocation;
  /** Task Bar metadata belongs to the same object and survives movement to/from calendar and Fridge. */
  taskContext?: TaskContext | null;
  parentUnitId: string | null;
  childOrder: number | null;
  fixedDate: boolean;
  continuationOfId: string | null;
  notes: string;
  resources: Array<{ id: string; label: string; url: string }>;
  details: Record<string, string>;
};

/**
 * Legacy pre-progressive-depth task records. New task creation should use Plan.taskContext.
 * Kept temporarily so stored beta workspaces can be migrated without silent loss.
 */
export type Priority = {
  id: string;
  title: string;
  tier: PriorityTier;
  completed: boolean;
  scope: "school" | "personal";
};

export type YearMarker = {
  id: string;
  symbol: "☺" | "✂" | "♕" | "$" | "‼" | "abc" | "🔗" | "☆" | "⚑";
  date: string;
  courseId: string | null;
  note: string;
};

export type WorkspacePreferences = {
  landingView: ArcView | "last-used";
  lastUsedView: ArcView;
  dayVisibleInSwitcher: boolean;
  collapsedUnitIds: string[];
};

export type Workspace = {
  schemaVersion: 2;
  id: string;
  ownerId: string | null;
  teacherName: string;
  roles: string[];
  courses: Course[];
  calendar: SchoolCalendar;
  plans: Plan[];
  /** Legacy only. Reconciled UI migrates these into plans and stops creating new Priority records. */
  priorities: Priority[];
  yearMarkers: YearMarker[];
  preferences: WorkspacePreferences;
  updatedAt: string;
};

export function emptyWorkspace(): Workspace {
  return {
    schemaVersion: 2,
    id: crypto.randomUUID(),
    ownerId: null,
    teacherName: "",
    roles: [],
    courses: [],
    calendar: {
      firstStudentDay: null,
      lastStudentDay: null,
      quarterBoundaries: [],
      noSchoolDates: [],
      weekendsVisible: false
    },
    plans: [],
    priorities: [],
    yearMarkers: [],
    preferences: {
      landingView: "week",
      lastUsedView: "week",
      dayVisibleInSwitcher: true,
      collapsedUnitIds: []
    },
    updatedAt: new Date().toISOString()
  };
}
