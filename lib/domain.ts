export type ArcView = "day" | "week" | "month" | "quarter" | "semester" | "year";

export type PlanType = "unit" | "lesson" | "note" | "idea";
export type PlanLocation = "calendar" | "fridge" | "ideas";
export type PriorityTier = "must" | "should" | "could";
export type ContentFilter = "everything" | "units" | "lessons" | "ideas";
export type ArcColorScheme = "studio" | "sunroom" | "blueprint" | "clay";
export type CourseMeetingPattern =
  | { kind: "weekdays"; weekdays: number[] }
  | { kind: "rotation"; labels: string[] };

export type Course = {
  id: string;
  name: string;
  periodLabel: string;
  color: string;
  meetingPattern?: CourseMeetingPattern;
};

export type SchoolCalendar = {
  firstStudentDay: string | null;
  lastStudentDay: string | null;
  quarterBoundaries: Array<{ id: string; label: string; start: string; end: string }>;
  noSchoolDates: Array<{ id: string; date: string; label: string }>;
  weekendsVisible: boolean;
  rotation?: {
    anchorDate: string;
    labels: string[];
  } | null;
};

export type Plan = {
  id: string;
  type: PlanType;
  title: string;
  courseId: string | null;
  date: string | null;
  endDate: string | null;
  location: PlanLocation;
  parentUnitId: string | null;
  childOrder: number | null;
  fixedDate: boolean;
  continuationOfId: string | null;
  notes: string;
  resources: Array<{ id: string; label: string; url: string }>;
  details: Record<string, string>;
};

export type Priority = {
  id: string;
  title: string;
  tier: PriorityTier;
  completed: boolean;
  scope: "school" | "personal";
  circled?: boolean;
  crossedOutAt?: string | null;
  linkedPlanId?: string | null;
};

export type YearMarker = {
  id: string;
  symbol: "☺" | "✂" | "♕" | "$" | "‼" | "abc" | "🔗" | "☆" | "⚑";
  date: string;
  courseId: string | null;
  note: string;
};

export type WorkspaceCheckpoint = {
  id: string;
  label: string;
  quarterId: string;
  createdAt: string;
  plans: Plan[];
  preferences: WorkspacePreferences;
};

export type WorkspacePreferences = {
  landingView: ArcView | "last-used";
  lastUsedView: ArcView;
  dayVisibleInSwitcher: boolean;
  collapsedUnitIds: string[];
  openFolder?: "shift" | "fridge" | "more" | null;
  prioritiesExpanded?: boolean;
  lapsedDayXsVisible?: boolean;
  courseFilterId?: string | null;
  contentFilter?: ContentFilter;
  colorScheme?: ArcColorScheme;
  compactMode?: boolean;
  darkMode?: boolean;
  tutorialCompleted?: boolean;
  helpMarksVisible?: boolean;
  firstTimeHelpEnabled?: boolean;
  exploredHelpIds?: string[];
  exploreWelcomeDismissed?: boolean;
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
  priorities: Priority[];
  yearMarkers: YearMarker[];
  preferences: WorkspacePreferences;
  checkpoints?: WorkspaceCheckpoint[];
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
      weekendsVisible: false,
      rotation: null
    },
    plans: [],
    priorities: [],
    yearMarkers: [],
    preferences: {
      landingView: "week",
      lastUsedView: "week",
      dayVisibleInSwitcher: true,
      collapsedUnitIds: [],
      openFolder: null,
      prioritiesExpanded: false,
      lapsedDayXsVisible: true,
      courseFilterId: null,
      contentFilter: "everything",
      colorScheme: "studio",
      compactMode: false,
      darkMode: false,
      tutorialCompleted: false,
      helpMarksVisible: true,
      firstTimeHelpEnabled: true,
      exploredHelpIds: [],
      exploreWelcomeDismissed: false
    },
    checkpoints: [],
    updatedAt: new Date().toISOString()
  };
}
