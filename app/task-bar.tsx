"use client";

import { useState } from "react";
import type { Plan, PriorityTier, TaskContext } from "../lib/domain";
import { objectLocation } from "../lib/object-lifecycle";
import { ScheduleObjectPopover } from "./schedule-object-popover";
import { TaskDetailPopover } from "./task-detail-popover";

const TIERS: Array<{ id: PriorityTier; label: string }> = [
  { id: "must", label: "Must Do" },
  { id: "should", label: "Should Do" },
  { id: "could", label: "Could Do" }
];

type Props = {
  plans: Plan[];
  courses: Array<{ id: string; name: string; periodLabel?: string }>;
  onCreate: (tier: PriorityTier, title: string) => void;
  onMoveTier: (id: string, tier: PriorityTier) => void;
  onUpdateTask: (id: string, patch: Partial<TaskContext>) => void;
  onPutInFridge: (id: string) => void;
  onSchedule: (id: string, date: string, courseId: string) => void;
  onSelect: (plan: Plan) => void;
};

export function TaskBar({ plans, courses, onCreate, onMoveTier, onUpdateTask, onPutInFridge, onSchedule, onSelect }: Props) {
  const [draft, setDraft] = useState<{ tier: PriorityTier; title: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const taskPlans = plans.filter((plan) => objectLocation(plan) === "taskbar" && !plan.parentUnitId);

  function saveDraft() {
    if (!draft?.title.trim()) return;
    onCreate(draft.tier, draft.title.trim());
    setDraft(null);
  }

  return (
    <section className="taskBar" aria-label="Must Do Should Do Could Do task bar">
      <div className="taskBarLabel">
        <span>Task Bar</span>
        <small>Move what matters now.</small>
      </div>
      <div className="taskBarTiers">
        {TIERS.map((tier) => {
          const items = taskPlans.filter((plan) => (plan.taskContext?.tier ?? "should") === tier.id);
          return (
            <section
              className={`taskBarTier taskBarTier-${tier.id}`}
              key={tier.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/arc-plan");
                if (id) onMoveTier(id, tier.id);
              }}
              aria-label={tier.label}
            >
              <header className="taskTierHeader">
                <strong>{tier.label}</strong>
                <button type="button" aria-label={`Add ${tier.label} task`} onClick={() => setDraft({ tier: tier.id, title: "" })}>＋</button>
              </header>

              <div className="taskTierItems">
                {items.map((plan) => {
                  const expanded = expandedId === plan.id;
                  const scheduling = schedulingId === plan.id;
                  return (
                    <article
                      key={plan.id}
                      className={plan.taskContext?.completed ? "taskObject completed" : "taskObject"}
                      draggable={!expanded && !scheduling}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/arc-plan", plan.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() => onSelect(plan)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if ((event.key === "Enter" || event.key === " ") && !expanded && !scheduling) {
                          event.preventDefault();
                          onSelect(plan);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="taskCompleteMark"
                        aria-label={plan.taskContext?.completed ? `Mark ${plan.title} not done` : `Cross out ${plan.title}`}
                        aria-pressed={Boolean(plan.taskContext?.completed)}
                        onClick={(event) => {
                          event.stopPropagation();
                          onUpdateTask(plan.id, { completed: !plan.taskContext?.completed });
                        }}
                      >
                        <span aria-hidden="true" />
                      </button>
                      <div className="taskObjectBody">
                        <strong>{plan.title}</strong>
                        {(plan.taskContext?.startTime || plan.taskContext?.durationMinutes) && (
                          <small>{plan.taskContext?.startTime ?? ""}{plan.taskContext?.startTime && plan.taskContext?.durationMinutes ? " · " : ""}{plan.taskContext?.durationMinutes ? `${plan.taskContext.durationMinutes} min` : ""}</small>
                        )}
                      </div>
                      <button
                        type="button"
                        className="taskMore"
                        aria-expanded={expanded || scheduling}
                        aria-label={`Task details for ${plan.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSchedulingId(null);
                          setExpandedId(expanded ? null : plan.id);
                        }}
                      >•••</button>

                      {expanded && !scheduling && (
                        <TaskDetailPopover
                          plan={plan}
                          onUpdateTask={onUpdateTask}
                          onMoveTier={onMoveTier}
                          onSchedule={() => {
                            setExpandedId(null);
                            setSchedulingId(plan.id);
                          }}
                          onPutInFridge={() => {
                            onPutInFridge(plan.id);
                            setExpandedId(null);
                          }}
                          onClose={() => setExpandedId(null)}
                        />
                      )}

                      {scheduling && (
                        <div className="taskDetailPopover" onClick={(event) => event.stopPropagation()}>
                          <ScheduleObjectPopover
                            title={plan.title}
                            courses={courses}
                            initialCourseId={plan.courseId}
                            initialDate={plan.date ?? plan.taskContext?.targetDate}
                            onCancel={() => setSchedulingId(null)}
                            onSchedule={(date, courseId) => {
                              onSchedule(plan.id, date, courseId);
                              setSchedulingId(null);
                            }}
                          />
                        </div>
                      )}
                    </article>
                  );
                })}
                {items.length === 0 && <p className="taskTierEmpty">Drop something here.</p>}
              </div>

              {draft?.tier === tier.id && (
                <div className="taskAddRow">
                  <input autoFocus value={draft.title} onChange={(event) => setDraft({ tier: tier.id, title: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") saveDraft(); if (event.key === "Escape") setDraft(null); }} placeholder={`Add to ${tier.label}`} />
                  <button type="button" onClick={saveDraft}>Add</button>
                  <button type="button" className="quietButton" onClick={() => setDraft(null)}>Cancel</button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
