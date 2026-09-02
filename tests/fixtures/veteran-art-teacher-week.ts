import { emptyWorkspace, type Plan, type Workspace } from "../../lib/domain";

function plan(input: Partial<Plan> & Pick<Plan, "id" | "type" | "title">): Plan {
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    courseId: input.courseId ?? null,
    date: input.date ?? null,
    endDate: input.endDate ?? null,
    location: input.location ?? "calendar",
    parentUnitId: input.parentUnitId ?? null,
    childOrder: input.childOrder ?? null,
    fixedDate: input.fixedDate ?? false,
    continuationOfId: input.continuationOfId ?? null,
    notes: input.notes ?? "",
    resources: input.resources ?? [],
    details: input.details ?? {}
  };
}

/**
 * Canonical fixture for Arc merge/audit work.
 *
 * Trace targets:
 * - A2K-MOV-002 movement consequence preview
 * - A2K-MOV-005 normal class divergence
 * - A2K-CAL-004 closures remain visible
 * - A2K-A11Y-001 keyboard/pointer command parity
 * - A2K-GATE-001 vertical-slice integrity
 */
export function veteranArtTeacherWeekFixture(): Workspace {
  const workspace = emptyWorkspace();
  workspace.teacherName = "Veteran Art Teacher";
  workspace.calendar = {
    firstStudentDay: "2026-08-10",
    lastStudentDay: "2027-05-28",
    weekendsVisible: false,
    noSchoolDates: [
      { id: "labor-day", date: "2026-09-07", label: "Labor Day" },
      { id: "testing-friday", date: "2026-09-18", label: "Campus testing schedule" }
    ],
    quarterBoundaries: [
      { id: "q1", label: "Q1", start: "2026-08-10", end: "2026-10-09" },
      { id: "q2", label: "Q2", start: "2026-10-12", end: "2026-12-18" },
      { id: "q3", label: "Q3", start: "2027-01-04", end: "2027-03-12" },
      { id: "q4", label: "Q4", start: "2027-03-15", end: "2027-05-28" }
    ],
    rotation: {
      anchorDate: "2026-08-10",
      labels: ["A", "B"]
    }
  };

  workspace.courses = [
    {
      id: "studio-art-p2",
      name: "Studio Art",
      periodLabel: "Period 2",
      color: "#AAC7D0",
      meetingPattern: { kind: "weekdays", weekdays: [1, 2, 3, 4, 5] }
    },
    {
      id: "ap-art-history-p4",
      name: "AP Art History",
      periodLabel: "Period 4",
      color: "#F0D538",
      meetingPattern: { kind: "weekdays", weekdays: [1, 2, 3, 4, 5] }
    },
    {
      id: "three-d-art-p6",
      name: "3D Art",
      periodLabel: "Period 6 · A day",
      color: "#DF8968",
      meetingPattern: { kind: "rotation", labels: ["A"] }
    }
  ];

  workspace.plans = [
    plan({
      id: "studio-seeing-drawing",
      type: "unit",
      title: "Seeing + Drawing",
      courseId: "studio-art-p2",
      date: "2026-09-14",
      endDate: "2026-09-25"
    }),
    plan({
      id: "studio-contour",
      type: "lesson",
      title: "Blind contour warm-up",
      courseId: "studio-art-p2",
      date: "2026-09-14",
      parentUnitId: "studio-seeing-drawing",
      childOrder: 0,
      notes: "Two slow drawings. Keep eyes on the object, not the page.",
      resources: [{ id: "contour-ref", label: "Contour reference", url: "https://example.com/contour" }]
    }),
    plan({
      id: "studio-negative-space",
      type: "lesson",
      title: "Negative space chairs",
      courseId: "studio-art-p2",
      date: "2026-09-15",
      parentUnitId: "studio-seeing-drawing",
      childOrder: 1
    }),
    plan({
      id: "studio-value-demo",
      type: "lesson",
      title: "Value scale + form demo",
      courseId: "studio-art-p2",
      date: "2026-09-16",
      parentUnitId: "studio-seeing-drawing",
      childOrder: 2,
      notes: "Set out charcoal before Period 2."
    }),
    plan({
      id: "studio-portfolio-check",
      type: "lesson",
      title: "Portfolio check",
      courseId: "studio-art-p2",
      date: "2026-09-21",
      parentUnitId: "studio-seeing-drawing",
      childOrder: 3,
      fixedDate: true
    }),
    plan({
      id: "ap-mesopotamia-unit",
      type: "unit",
      title: "Ancient Mesopotamia",
      courseId: "ap-art-history-p4",
      date: "2026-09-14",
      endDate: "2026-09-23"
    }),
    plan({
      id: "ap-white-temple",
      type: "lesson",
      title: "White Temple + ziggurat",
      courseId: "ap-art-history-p4",
      date: "2026-09-14",
      parentUnitId: "ap-mesopotamia-unit",
      childOrder: 0
    }),
    plan({
      id: "ap-votive-figures",
      type: "lesson",
      title: "Votive figures: cautious claims",
      courseId: "ap-art-history-p4",
      date: "2026-09-15",
      parentUnitId: "ap-mesopotamia-unit",
      childOrder: 1
    }),
    plan({
      id: "ap-unit-check",
      type: "lesson",
      title: "Mesopotamia assessment",
      courseId: "ap-art-history-p4",
      date: "2026-09-21",
      parentUnitId: "ap-mesopotamia-unit",
      childOrder: 2,
      fixedDate: true
    }),
    plan({
      id: "three-d-paper-structure",
      type: "unit",
      title: "Paper + Structure",
      courseId: "three-d-art-p6",
      date: "2026-09-14",
      endDate: "2026-09-28"
    }),
    plan({
      id: "three-d-slot-joints",
      type: "lesson",
      title: "Slot-joint practice",
      courseId: "three-d-art-p6",
      date: "2026-09-14",
      parentUnitId: "three-d-paper-structure",
      childOrder: 0,
      notes: "Keep examples simple enough to verify construction at a glance."
    }),
    plan({
      id: "fridge-cyanotype",
      type: "idea",
      title: "Try cyanotype warm-up",
      courseId: "studio-art-p2",
      location: "fridge"
    }),
    plan({
      id: "fridge-prep-note",
      type: "note",
      title: "Order tracing paper before portrait unit",
      courseId: "studio-art-p2",
      location: "fridge"
    })
  ];

  workspace.priorities = [
    {
      id: "copies-mesopotamia",
      title: "Copy Mesopotamia review sheet",
      tier: "must",
      completed: false,
      scope: "school",
      circled: true,
      crossedOutAt: null,
      linkedPlanId: "ap-unit-check"
    },
    {
      id: "charge-cameras",
      title: "Charge classroom cameras",
      tier: "should",
      completed: false,
      scope: "school",
      circled: false,
      crossedOutAt: null,
      linkedPlanId: null
    }
  ];

  return workspace;
}
