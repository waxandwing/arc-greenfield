"use client";

import type { Plan, Workspace } from "../lib/domain";
import { availableQuarterRanges } from "../lib/view-ranges";

export function SemesterView({ workspace, quarterRanges, quarterIndex, onSelectPlan }: {
  workspace: Workspace;
  quarterRanges: ReturnType<typeof availableQuarterRanges>;
  quarterIndex: number;
  onSelectPlan: (plan: Plan) => void;
}) {
  if (!quarterRanges.length) return <section className="arcSemesterView"><h2>Semester</h2><p>Add real quarter dates in Setup first.</p></section>;

  const startIndex = quarterIndex >= 2 ? 2 : 0;
  const ranges = quarterRanges.slice(startIndex, startIndex + 2);
  const start = ranges[0]?.start;
  const end = ranges[ranges.length - 1]?.end;
  const units = workspace.plans.filter((plan) =>
    plan.type === "unit" &&
    plan.location === "calendar" &&
    plan.date && start && end &&
    plan.date <= end &&
    (plan.endDate ?? plan.date) >= start
  );

  return (
    <section className="arcSemesterView">
      <h2>{startIndex === 0 ? "Semester 1" : "Semester 2"}</h2>
      <div className="semesterTracks">
        {units.map((unit) => {
          const course = workspace.courses.find((item) => item.id === unit.courseId);
          return <div className="semesterUnit" key={unit.id}><span>{course?.name}</span><button type="button" style={{ ["--course-color" as string]: course?.color || "#eeb834" }} onClick={() => onSelectPlan(unit)}>{unit.title}</button></div>;
        })}
      </div>
    </section>
  );
}
