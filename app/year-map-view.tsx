"use client";

import type { Workspace } from "../lib/domain";
import { quarterForDate, yearMonths } from "../lib/view-ranges";

const YEAR_MARKERS = ["☺", "✂", "♕", "$", "‼", "abc", "🔗", "☆", "⚑"] as const;

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthGrid(monthKey: string) {
  const start = parseDate(`${monthKey}-01`);
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { key: dateKey(date), date, inside: date.getMonth() === start.getMonth() };
  });
}

function instructional(workspace: Workspace, value: string) {
  const date = parseDate(value);
  if (date.getDay() === 0 || date.getDay() === 6) return false;
  return !workspace.calendar.noSchoolDates.some((item) => item.date === value);
}

export function YearMapView({
  workspace,
  selectedCourseId,
  selectedDate,
  onSelectPlan,
  onSelectDate,
  onAddMarker
}: {
  workspace: Workspace;
  selectedCourseId: string;
  selectedDate: string;
  onSelectPlan: (plan: Workspace["plans"][number]) => void;
  onSelectDate: (date: string) => void;
  onAddMarker: (symbol: typeof YEAR_MARKERS[number]) => void;
}) {
  const months = yearMonths(workspace.calendar);
  if (!months.length) return <section className="arcYearView"><h2>Year Map</h2><p>Add the real school-year dates in Setup first.</p></section>;
  const today = dateKey(new Date());
  const ranges = workspace.calendar.quarterBoundaries.filter((range) => range.start && range.end && range.start <= range.end);

  return (
    <section className="arcYearView truthfulYearMap">
      <header className="yearMapHeader">
        <div><p className="eyebrow">Year Map</p><h2>{workspace.calendar.firstStudentDay?.slice(0, 4)}–{workspace.calendar.lastStudentDay?.slice(2, 4)}</h2><p>Each month appears once. Quarter color changes on the actual boundary date.</p></div>
        <div className="yearMarkerRow" aria-label="Year markers">{YEAR_MARKERS.map((symbol) => <button type="button" key={symbol} onClick={() => onAddMarker(symbol)}>{symbol}</button>)}</div>
      </header>

      <div className="yearQuarterLegend">{ranges.map((range, index) => <span className={`q${index + 1}`} key={range.id}><b>{range.label}</b>{range.start.slice(5)}–{range.end.slice(5)}</span>)}</div>

      <div className="yearMonthMatrix">
        {months.map((month) => <article className="yearMiniMonth truthfulMonth" key={month.key}>
          <header><h4>{month.date.toLocaleDateString(undefined, { month: "long" })}</h4><span>{month.quarterIds.map((id) => ranges.find((range) => range.id === id)?.label ?? id).join(" → ")}</span></header>
          <div className="yearMiniGrid">{monthGrid(month.key).map((day) => {
            const withinYear = Boolean(workspace.calendar.firstStudentDay && workspace.calendar.lastStudentDay && day.key >= workspace.calendar.firstStudentDay && day.key <= workspace.calendar.lastStudentDay);
            const noSchool = workspace.calendar.noSchoolDates.find((item) => item.date === day.key);
            const passed = day.inside && withinYear && day.key < today && instructional(workspace, day.key) && workspace.preferences.lapsedDayXsVisible !== false;
            const marker = workspace.yearMarkers.find((item) => item.date === day.key && (!item.courseId || item.courseId === selectedCourseId));
            const quarterId = quarterForDate(workspace.calendar, day.key);
            const quarterIndex = ranges.findIndex((range) => range.id === quarterId);
            const quarterClass = quarterIndex >= 0 ? ` q${quarterIndex + 1}` : "";
            const selected = day.key === selectedDate;
            return <button type="button" key={day.key} className={`yearMiniDay${day.inside ? "" : " outside"}${withinYear ? "" : " outsideYear"}${noSchool ? " noSchool" : ""}${passed ? " pastInstructional" : ""}${selected ? " selected" : ""}${quarterClass}`} onClick={() => onSelectDate(day.key)} title={noSchool ? `${day.key} · ${noSchool.label}` : marker ? `${day.key} · ${marker.symbol} ${marker.note}` : day.key}>{marker?.symbol ?? day.date.getDate()}</button>;
          })}</div>
        </article>)}
      </div>

      <div className="yearUnitTracks"><h3>Curriculum arcs</h3>{workspace.plans.filter((plan) => plan.type === "unit" && plan.location === "calendar").map((unit) => { const course = workspace.courses.find((item) => item.id === unit.courseId); return <button type="button" className="yearUnitArc" style={{ ["--course-color" as string]: course?.color || "#eeb834" }} key={unit.id} onClick={() => onSelectPlan(unit)}><span>{course?.name}</span><strong>{unit.title}</strong><small>{unit.date?.slice(5)}–{(unit.endDate ?? unit.date)?.slice(5)}</small></button>; })}</div>
    </section>
  );
}
