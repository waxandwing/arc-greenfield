"use client";

import { useMemo, useState } from "react";

type CourseOption = { id: string; name: string; periodLabel?: string };

type Props = {
  title: string;
  courses: CourseOption[];
  initialCourseId?: string | null;
  initialDate?: string | null;
  onSchedule: (date: string, courseId: string) => void;
  onCancel: () => void;
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ScheduleObjectPopover({ title, courses, initialCourseId, initialDate, onSchedule, onCancel }: Props) {
  const fallbackCourseId = useMemo(() => {
    if (initialCourseId && courses.some((course) => course.id === initialCourseId)) return initialCourseId;
    return courses[0]?.id ?? "";
  }, [courses, initialCourseId]);
  const [courseId, setCourseId] = useState(fallbackCourseId);
  const [date, setDate] = useState(initialDate ?? localDateKey());

  return (
    <div
      className="schedulePopover"
      role="dialog"
      aria-label={`Schedule ${title}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <div className="schedulePopoverHeading">
        <strong>Put it on the calendar</strong>
        <button type="button" onClick={onCancel} aria-label="Close scheduling chooser">×</button>
      </div>
      <label>
        Date
        <input autoFocus type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label>
        Class
        <select value={courseId} onChange={(event) => setCourseId(event.target.value)} disabled={!courses.length}>
          {!courses.length && <option value="">No classes yet</option>}
          {courses.map((course) => <option key={course.id} value={course.id}>{course.name}{course.periodLabel ? ` · ${course.periodLabel}` : ""}</option>)}
        </select>
      </label>
      <div className="schedulePopoverActions">
        <button type="button" className="primaryScheduleAction" disabled={!date || !courseId} onClick={() => onSchedule(date, courseId)}>Place on calendar</button>
        <button type="button" className="quietButton" onClick={onCancel}>Cancel</button>
      </div>
      <p>Full planning details stay attached to this same object. Scheduling changes placement, not identity.</p>
    </div>
  );
}
