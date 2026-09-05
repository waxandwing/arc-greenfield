"use client";

import { useState } from "react";
import type { Plan } from "../lib/domain";

type CourseOption = { id: string; name: string; periodLabel?: string };

type Props = {
  plan: Plan;
  courses: CourseOption[];
  onRename: (id: string, title: string) => void;
  onMove: (id: string, date: string, courseId: string) => void;
  onPatch: (id: string, patch: Partial<Plan>) => void;
  onClose: () => void;
};

export function CalendarObjectDetails({ plan, courses, onRename, onMove, onPatch, onClose }: Props) {
  const [title, setTitle] = useState(plan.title);
  const [resourceLabel, setResourceLabel] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");

  function commitTitle() {
    const next = title.trim();
    if (!next || next === plan.title) return;
    onRename(plan.id, next);
  }

  function move(date: string, courseId: string) {
    if (!date || !courseId) return;
    onMove(plan.id, date, courseId);
  }

  function addResource() {
    if (!resourceLabel.trim() || !resourceUrl.trim()) return;
    onPatch(plan.id, {
      resources: [...plan.resources, { id: crypto.randomUUID(), label: resourceLabel.trim(), url: resourceUrl.trim() }]
    });
    setResourceLabel("");
    setResourceUrl("");
  }

  return (
    <section className="calendarObjectDetails" role="dialog" aria-label={`Full details for ${plan.title}`} onClick={(event) => event.stopPropagation()}>
      <header className="calendarObjectDetailsHeader">
        <div>
          <span>{plan.type === "unit" ? "Unit" : plan.type === "lesson" ? "Lesson" : "Note"}</span>
          <strong>Full planning details</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Close full details">×</button>
      </header>

      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={commitTitle} onKeyDown={(event) => { if (event.key === "Enter") commitTitle(); }} />
      </label>

      <div className="calendarObjectDetailsPair">
        <label>
          Date
          <input type="date" value={plan.date ?? ""} onChange={(event) => move(event.target.value, plan.courseId ?? courses[0]?.id ?? "")} />
        </label>
        <label>
          Class
          <select value={plan.courseId ?? ""} onChange={(event) => move(plan.date ?? "", event.target.value)}>
            <option value="" disabled>Choose class</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}{course.periodLabel ? ` · ${course.periodLabel}` : ""}</option>)}
          </select>
        </label>
      </div>

      <label>
        Notes
        <textarea value={plan.notes} onChange={(event) => onPatch(plan.id, { notes: event.target.value })} placeholder="What do you need to remember when you get here?" />
      </label>

      <label>
        Standards / alignment
        <textarea value={plan.details.standards ?? ""} onChange={(event) => onPatch(plan.id, { details: { ...plan.details, standards: event.target.value } })} placeholder="Optional" />
      </label>

      <label className="calendarFixedRow">
        <input type="checkbox" checked={plan.fixedDate} onChange={(event) => onPatch(plan.id, { fixedDate: event.target.checked })} />
        <span><strong>Keep this date fixed</strong><small>Shift and recovery must respect this anchor unless you explicitly override it.</small></span>
      </label>

      <div className="calendarResources">
        <div className="calendarResourcesHeading"><strong>Resources</strong><span>{plan.resources.length}</span></div>
        {plan.resources.map((resource) => (
          <div className="calendarResourceRow" key={resource.id}>
            <a href={resource.url} target="_blank" rel="noreferrer">{resource.label}</a>
            <button type="button" onClick={() => onPatch(plan.id, { resources: plan.resources.filter((item) => item.id !== resource.id) })}>Remove</button>
          </div>
        ))}
        <div className="calendarResourceAdder">
          <input value={resourceLabel} onChange={(event) => setResourceLabel(event.target.value)} placeholder="Resource name" />
          <input value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} placeholder="https://…" />
          <button type="button" onClick={addResource}>Add</button>
        </div>
      </div>

      {plan.taskContext && (
        <div className="retainedTaskContext">
          <strong>Task Bar information retained</strong>
          <span>{plan.taskContext.tier}{plan.taskContext.startTime ? ` · ${plan.taskContext.startTime}` : ""}{plan.taskContext.durationMinutes ? ` · ${plan.taskContext.durationMinutes} min` : ""}</span>
        </div>
      )}

      <footer className="calendarObjectDetailsFooter">
        <span>Same object. More planning depth.</span>
        <button type="button" onClick={onClose}>Done</button>
      </footer>
    </section>
  );
}
