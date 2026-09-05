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

function safeResourceUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function CalendarObjectDetails({ plan, courses, onRename, onMove, onPatch, onClose }: Props) {
  const [title, setTitle] = useState(plan.title);
  const [notesDraft, setNotesDraft] = useState(plan.notes);
  const [standardsDraft, setStandardsDraft] = useState(plan.details.standards ?? "");
  const [resourceLabel, setResourceLabel] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceError, setResourceError] = useState<string | null>(null);

  function commitTitle() {
    const next = title.trim();
    if (!next || next === plan.title) return;
    onRename(plan.id, next);
  }

  function commitLongText() {
    const patch: Partial<Plan> = {};
    if (notesDraft !== plan.notes) patch.notes = notesDraft;
    if (standardsDraft !== (plan.details.standards ?? "")) patch.details = { ...plan.details, standards: standardsDraft };
    if (Object.keys(patch).length) onPatch(plan.id, patch);
  }

  function closeWithCommit() {
    commitTitle();
    commitLongText();
    onClose();
  }

  function move(date: string, courseId: string) {
    if (!date || !courseId) return;
    commitLongText();
    onMove(plan.id, date, courseId);
  }

  function addResource() {
    if (!resourceLabel.trim() || !resourceUrl.trim()) return;
    const safeUrl = safeResourceUrl(resourceUrl);
    if (!safeUrl) {
      setResourceError("Use a valid http:// or https:// link.");
      return;
    }
    commitLongText();
    onPatch(plan.id, {
      resources: [...plan.resources, { id: crypto.randomUUID(), label: resourceLabel.trim(), url: safeUrl }]
    });
    setResourceLabel("");
    setResourceUrl("");
    setResourceError(null);
  }

  return (
    <section
      className="calendarObjectDetails"
      role="dialog"
      aria-label={`Full details for ${plan.title}`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          closeWithCommit();
        }
      }}
    >
      <header className="calendarObjectDetailsHeader">
        <div>
          <span>{plan.type === "unit" ? "Unit" : plan.type === "lesson" ? "Lesson" : "Note"}</span>
          <strong>Full planning details</strong>
        </div>
        <button type="button" onClick={closeWithCommit} aria-label="Close full details">×</button>
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
        <textarea value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} onBlur={commitLongText} placeholder="What do you need to remember when you get here?" />
      </label>

      <label>
        Standards / alignment
        <textarea value={standardsDraft} onChange={(event) => setStandardsDraft(event.target.value)} onBlur={commitLongText} placeholder="Optional" />
      </label>

      <label className="calendarFixedRow">
        <input type="checkbox" checked={plan.fixedDate} onChange={(event) => { commitLongText(); onPatch(plan.id, { fixedDate: event.target.checked }); }} />
        <span><strong>Keep this date fixed</strong><small>Shift and recovery must respect this anchor unless you explicitly override it.</small></span>
      </label>

      <div className="calendarResources">
        <div className="calendarResourcesHeading"><strong>Resources</strong><span>{plan.resources.length}</span></div>
        {plan.resources.map((resource) => (
          <div className="calendarResourceRow" key={resource.id}>
            <a href={resource.url} target="_blank" rel="noreferrer">{resource.label}</a>
            <button type="button" onClick={() => { commitLongText(); onPatch(plan.id, { resources: plan.resources.filter((item) => item.id !== resource.id) }); }}>Remove</button>
          </div>
        ))}
        <div className="calendarResourceAdder">
          <input value={resourceLabel} onChange={(event) => setResourceLabel(event.target.value)} placeholder="Resource name" />
          <input value={resourceUrl} onChange={(event) => { setResourceUrl(event.target.value); setResourceError(null); }} placeholder="https://…" aria-invalid={Boolean(resourceError)} aria-describedby={resourceError ? `resource-error-${plan.id}` : undefined} />
          <button type="button" onClick={addResource}>Add</button>
        </div>
        {resourceError && <p className="calendarResourceError" id={`resource-error-${plan.id}`} role="alert">{resourceError}</p>}
      </div>

      {plan.taskContext && (
        <div className="retainedTaskContext">
          <strong>Task Bar information retained</strong>
          <span>{plan.taskContext.tier}{plan.taskContext.startTime ? ` · ${plan.taskContext.startTime}` : ""}{plan.taskContext.durationMinutes ? ` · ${plan.taskContext.durationMinutes} min` : ""}</span>
        </div>
      )}

      <footer className="calendarObjectDetailsFooter">
        <span>Same object. More planning depth.</span>
        <button type="button" onClick={closeWithCommit}>Done</button>
      </footer>
    </section>
  );
}
