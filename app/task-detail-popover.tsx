"use client";

import { useState } from "react";
import type { Plan, PriorityTier, TaskContext } from "../lib/domain";

const TIERS: Array<{ id: PriorityTier; label: string }> = [
  { id: "must", label: "Must Do" },
  { id: "should", label: "Should Do" },
  { id: "could", label: "Could Do" }
];

type Props = {
  plan: Plan;
  onUpdateTask: (id: string, patch: Partial<TaskContext>) => void;
  onMoveTier: (id: string, tier: PriorityTier) => void;
  onSchedule: () => void;
  onPutInFridge: () => void;
  onClose: () => void;
};

export function TaskDetailPopover({ plan, onUpdateTask, onMoveTier, onSchedule, onPutInFridge, onClose }: Props) {
  const [notes, setNotes] = useState(plan.taskContext?.notes ?? "");
  const [startTime, setStartTime] = useState(plan.taskContext?.startTime ?? "");
  const [duration, setDuration] = useState(plan.taskContext?.durationMinutes?.toString() ?? "");

  function commitDrafts() {
    const patch: Partial<TaskContext> = {};
    if (notes !== (plan.taskContext?.notes ?? "")) patch.notes = notes;
    if (startTime !== (plan.taskContext?.startTime ?? "")) patch.startTime = startTime || undefined;
    const parsedDuration = duration ? Number(duration) : undefined;
    if (parsedDuration !== plan.taskContext?.durationMinutes) patch.durationMinutes = parsedDuration;
    if (Object.keys(patch).length) onUpdateTask(plan.id, patch);
  }

  function closeWithCommit() {
    commitDrafts();
    onClose();
  }

  return (
    <div
      className="taskDetailPopover"
      role="dialog"
      aria-label={`Task details for ${plan.title}`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          closeWithCommit();
        }
      }}
    >
      <label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={commitDrafts} /></label>
      <div className="taskDetailPair">
        <label>Time<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} onBlur={commitDrafts} /></label>
        <label>Minutes<input type="number" min="0" step="5" value={duration} onChange={(event) => setDuration(event.target.value)} onBlur={commitDrafts} /></label>
      </div>
      <div className="taskDetailActions">
        <select
          value={plan.taskContext?.tier ?? "should"}
          onChange={(event) => {
            commitDrafts();
            onMoveTier(plan.id, event.target.value as PriorityTier);
          }}
          aria-label={`Move ${plan.title} to task tier`}
        >
          {TIERS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
        <button type="button" onClick={() => { commitDrafts(); onSchedule(); }}>Schedule…</button>
        <button type="button" onClick={() => { commitDrafts(); onPutInFridge(); }}>Put in Fridge</button>
        <button type="button" onClick={closeWithCommit}>Done</button>
      </div>
    </div>
  );
}
