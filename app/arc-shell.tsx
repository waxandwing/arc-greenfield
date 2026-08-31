"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyWorkspace, type Course, type Plan, type PlanType, type PriorityTier, type Workspace } from "../lib/domain";
import { applyCut, createClipboard, pasteClipboard, type ArcClipboard, type PasteTarget } from "../lib/clipboard";
import { deletePlanTree, movePlanTreeToIdeas, orderedUnitChildren, shiftPlanTree } from "../lib/plan-tree";
import { resolveArcShortcut } from "../lib/shortcuts";
import { canRedo, canUndo, commitWorkspace, createWorkspaceHistory, redoWorkspace, undoWorkspace, type WorkspaceHistory } from "../lib/workspace-history";
import { loadWorkspace, saveWorkspace } from "../lib/workspace-store";

const COLORS = ["#2f6f73", "#557b93", "#d2a64a", "#d97965", "#6f7d5b", "#8a6d82"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function dayDelta(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

function weekDays(anchor = new Date()) {
  const day = anchor.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(anchor.getDate() + offset);
  return DAY_LABELS.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { label, key: dateKey(date), number: date.getDate(), month: date.toLocaleDateString(undefined, { month: "short" }) };
  });
}

function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
}

export function ArcShell({ buildId, gitSha }: { buildId: string; gitSha: string }) {
  const [history, setHistory] = useState<WorkspaceHistory>(() => createWorkspaceHistory(emptyWorkspace()));
  const workspace = history.present;
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<"setup" | "desk">("setup");
  const [draftCourse, setDraftCourse] = useState("");
  const [draftPeriod, setDraftPeriod] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaCourseId, setIdeaCourseId] = useState("");
  const [saveLabel, setSaveLabel] = useState("Not saved yet");
  const [cellDraft, setCellDraft] = useState<{ courseId: string; date: string; title: string } | null>(null);
  const [childDraft, setChildDraft] = useState<{ unitId: string; title: string } | null>(null);
  const [priorityDraft, setPriorityDraft] = useState<{ tier: PriorityTier; title: string } | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [editingPlan, setEditingPlan] = useState<{ id: string; title: string } | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<ArcClipboard | null>(null);
  const [pasteTarget, setPasteTarget] = useState<PasteTarget | null>(null);

  const days = useMemo(() => weekDays(weekAnchor), [weekAnchor]);
  const weekLabel = `${days[0].month} ${days[0].number} – ${days[4].month} ${days[4].number}`;

  useEffect(() => {
    const loaded = loadWorkspace();
    setHistory(createWorkspaceHistory(loaded));
    if (loaded.courses[0]) setIdeaCourseId(loaded.courses[0].id);
    if (loaded.teacherName && loaded.courses.length > 0 && loaded.calendar.firstStudentDay) setScreen("desk");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const state = saveWorkspace(workspace);
      setSaveLabel(`Saved here · ${new Date(state.savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [workspace, ready]);

  function updateWorkspace(updater: (current: Workspace) => Workspace) {
    setHistory((currentHistory) => {
      const next = { ...updater(currentHistory.present), updatedAt: new Date().toISOString() };
      return commitWorkspace(currentHistory, next);
    });
  }

  function replaceWorkspace(next: Workspace) {
    setHistory((currentHistory) => commitWorkspace(currentHistory, { ...next, updatedAt: new Date().toISOString() }));
  }

  function undo() {
    setHistory((current) => undoWorkspace(current));
    setSelectedPlanId(null);
  }

  function redo() {
    setHistory((current) => redoWorkspace(current));
    setSelectedPlanId(null);
  }

  function addCourse() {
    if (!draftCourse.trim()) return;
    const course: Course = {
      id: crypto.randomUUID(),
      name: draftCourse.trim(),
      periodLabel: draftPeriod.trim(),
      color: COLORS[workspace.courses.length % COLORS.length]
    };
    updateWorkspace((current) => ({ ...current, courses: [...current.courses, course] }));
    if (!ideaCourseId) setIdeaCourseId(course.id);
    setDraftCourse("");
    setDraftPeriod("");
  }

  function makePlan(title: string, type: PlanType, courseId: string | null, date: string | null, location: "calendar" | "ideas", parentUnitId: string | null = null, childOrder: number | null = null): Plan {
    return {
      id: crypto.randomUUID(),
      type,
      title: title.trim(),
      courseId,
      date,
      endDate: type === "unit" ? date : null,
      location,
      parentUnitId,
      childOrder,
      fixedDate: false,
      continuationOfId: null,
      notes: "",
      resources: [],
      details: {}
    };
  }

  function addPlan(title: string, type: PlanType, courseId: string | null, date: string | null, location: "calendar" | "ideas") {
    if (!title.trim()) return;
    const plan = makePlan(title, type, courseId, date, location);
    updateWorkspace((current) => ({ ...current, plans: [...current.plans, plan] }));
    setSelectedPlanId(plan.id);
  }

  function addIdea() {
    if (!ideaTitle.trim() || !ideaCourseId) return;
    addPlan(ideaTitle, "lesson", ideaCourseId, null, "ideas");
    setIdeaTitle("");
  }

  function saveCellDraft(type: "lesson" | "unit") {
    if (!cellDraft?.title.trim()) return;
    addPlan(cellDraft.title, type, cellDraft.courseId, cellDraft.date, "calendar");
    setCellDraft(null);
  }

  function addChildLesson(unit: Plan) {
    if (!childDraft?.title.trim() || childDraft.unitId !== unit.id) return;
    const existing = orderedUnitChildren(workspace.plans, unit.id);
    const lesson = makePlan(childDraft.title, "lesson", unit.courseId, unit.date, unit.location, unit.id, existing.length);
    updateWorkspace((current) => ({ ...current, plans: [...current.plans, lesson] }));
    setChildDraft(null);
    setSelectedPlanId(lesson.id);
  }

  function movePlanToDate(id: string, date: string, courseId: string) {
    const plan = workspace.plans.find((item) => item.id === id);
    if (!plan) return;
    if (plan.type === "unit" && plan.date) {
      replaceWorkspace({ ...workspace, plans: shiftPlanTree(workspace.plans, id, dayDelta(plan.date, date), courseId) });
    } else {
      updateWorkspace((current) => ({
        ...current,
        plans: current.plans.map((item) => item.id === id ? { ...item, courseId, date, location: "calendar" as const } : item)
      }));
    }
    setPasteTarget({ courseId, date, location: "calendar" });
  }

  function moveIdeaToDate(id: string, date: string) {
    const plan = workspace.plans.find((item) => item.id === id);
    const courseId = plan?.courseId ?? workspace.courses[0]?.id;
    if (!courseId) return;
    movePlanToDate(id, date, courseId);
  }

  function savePlanEdit() {
    if (!editingPlan?.title.trim()) return;
    updateWorkspace((current) => ({
      ...current,
      plans: current.plans.map((plan) => plan.id === editingPlan.id ? { ...plan, title: editingPlan.title.trim() } : plan)
    }));
    setEditingPlan(null);
  }

  function deletePlan(id: string) {
    updateWorkspace((current) => ({ ...current, plans: deletePlanTree(current.plans, id) }));
    if (editingPlan?.id === id) setEditingPlan(null);
    if (selectedPlanId === id) setSelectedPlanId(null);
  }

  function returnPlanToIdeas(id: string) {
    updateWorkspace((current) => ({ ...current, plans: movePlanTreeToIdeas(current.plans, id) }));
    setPasteTarget({ courseId: workspace.plans.find((plan) => plan.id === id)?.courseId ?? null, date: null, location: "ideas" });
  }

  function toggleUnit(unitId: string) {
    updateWorkspace((current) => {
      const collapsed = new Set(current.preferences.collapsedUnitIds);
      if (collapsed.has(unitId)) collapsed.delete(unitId); else collapsed.add(unitId);
      return { ...current, preferences: { ...current.preferences, collapsedUnitIds: [...collapsed] } };
    });
  }

  function copySelection(mode: "copy" | "cut") {
    if (!selectedPlanId) return;
    const nextClipboard = createClipboard(workspace, selectedPlanId, mode);
    if (!nextClipboard) return;
    setClipboard(nextClipboard);
    if (mode === "cut") {
      replaceWorkspace(applyCut(workspace, nextClipboard));
      setSelectedPlanId(null);
    }
  }

  function pasteSelection() {
    if (!clipboard || !pasteTarget) return;
    const result = pasteClipboard(workspace, clipboard, pasteTarget);
    if (!result.pastedRootId) return;
    replaceWorkspace(result.workspace);
    setSelectedPlanId(result.pastedRootId);
  }

  function addPriority() {
    if (!priorityDraft?.title.trim()) return;
    updateWorkspace((current) => ({
      ...current,
      priorities: [...current.priorities, {
        id: crypto.randomUUID(), title: priorityDraft.title.trim(), tier: priorityDraft.tier, completed: false, scope: "school"
      }]
    }));
    setPriorityDraft(null);
  }

  function togglePriority(id: string) {
    updateWorkspace((current) => ({
      ...current,
      priorities: current.priorities.map((priority) => priority.id === id ? { ...priority, completed: !priority.completed } : priority)
    }));
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const action = resolveArcShortcut(event);
      if (!action) return;
      if (isTypingTarget(event.target) && action !== "escape") return;

      if (action === "escape") {
        setSelectedPlanId(null);
        setEditingPlan(null);
        setCellDraft(null);
        setChildDraft(null);
        return;
      }

      if (action === "undo") { event.preventDefault(); undo(); return; }
      if (action === "redo") { event.preventDefault(); redo(); return; }
      if (action === "copy") { event.preventDefault(); copySelection("copy"); return; }
      if (action === "cut") { event.preventDefault(); copySelection("cut"); return; }
      if (action === "paste") { event.preventDefault(); pasteSelection(); return; }
      if (action === "delete" && selectedPlanId) { event.preventDefault(); deletePlan(selectedPlanId); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!ready) return <main className="loadingShell">Opening Arc…</main>;

  return (
    <main className="arcApp">
      <header className="arcTopbar">
        <button className="arcBrand" type="button" onClick={() => setScreen("desk")} aria-label="Arc home">
          <span className="arcBrandEyebrow">Wax &amp; Wing</span>
          <span className="arcBrandWord">Arc</span>
        </button>
        <div className="arcMeta"><span>{saveLabel}</span><code>{buildId} · {gitSha.slice(0, 7)}</code></div>
      </header>

      {screen === "setup" ? (
        <section className="setupPage">
          <div className="setupCopy"><p className="eyebrow">Set up your desk</p><h1>Three things. Then plan.</h1><p>Arc needs your name, the classes you actually teach, and the rough bounds of your school year. That is enough to begin.</p></div>
          <div className="setupGrid">
            <section className="setupCard"><span className="stepNumber">1</span><h2>You</h2><label><span>Your name</span><input value={workspace.teacherName} onChange={(e) => updateWorkspace((current) => ({ ...current, teacherName: e.target.value }))} placeholder="What should Arc call you?" /></label></section>
            <section className="setupCard wideCard">
              <span className="stepNumber">2</span><h2>Classes</h2>
              <div className="courseAdder"><input value={draftCourse} onChange={(e) => setDraftCourse(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCourse(); }} placeholder="Course name" /><input value={draftPeriod} onChange={(e) => setDraftPeriod(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCourse(); }} placeholder="Period / block" /><button type="button" onClick={addCourse}>Add class</button></div>
              <div className="courseChips">{workspace.courses.map((course) => <span className="courseChip" key={course.id} style={{ borderColor: course.color }}><i style={{ background: course.color }} />{course.name}{course.periodLabel ? ` · ${course.periodLabel}` : ""}<button type="button" aria-label={`Remove ${course.name}`} onClick={() => updateWorkspace((current) => ({ ...current, courses: current.courses.filter((item) => item.id !== course.id) }))}>×</button></span>)}</div>
            </section>
            <section className="setupCard"><span className="stepNumber">3</span><h2>School year</h2><div className="datePair"><label><span>First student day</span><input type="date" value={workspace.calendar.firstStudentDay ?? ""} onChange={(e) => updateWorkspace((current) => ({ ...current, calendar: { ...current.calendar, firstStudentDay: e.target.value || null } }))} /></label><label><span>Last student day</span><input type="date" value={workspace.calendar.lastStudentDay ?? ""} onChange={(e) => updateWorkspace((current) => ({ ...current, calendar: { ...current.calendar, lastStudentDay: e.target.value || null } }))} /></label></div></section>
          </div>
          <div className="setupFooter"><p>No school dates, quarters, imports, and deeper preferences come later.</p><button className="primaryAction" type="button" disabled={!workspace.teacherName.trim() || workspace.courses.length === 0 || !workspace.calendar.firstStudentDay} onClick={() => setScreen("desk")}>Open my desk</button></div>
        </section>
      ) : (
        <section className="deskPage">
          <div className="deskToolbar">
            <div><p className="eyebrow">Planning desk</p><h1>{workspace.teacherName ? `${workspace.teacherName}’s week` : "Your week"}</h1></div>
            <div className="deskActions" aria-label="Planner actions">
              <button type="button" onClick={undo} disabled={!canUndo(history)}>Undo</button><button type="button" onClick={redo} disabled={!canRedo(history)}>Redo</button>
              <span className="actionDivider" />
              <button type="button" onClick={() => copySelection("copy")} disabled={!selectedPlanId}>Copy</button><button type="button" onClick={() => copySelection("cut")} disabled={!selectedPlanId}>Cut</button><button type="button" onClick={pasteSelection} disabled={!clipboard || !pasteTarget}>Paste</button>
              <span className="actionDivider" />
              <button type="button" onClick={() => setWeekAnchor((current) => shiftDate(current, -7))}>←</button><button type="button" className="todayButton" onClick={() => setWeekAnchor(new Date())}>Today</button><button type="button" onClick={() => setWeekAnchor((current) => shiftDate(current, 7))}>→</button>
            </div>
          </div>

          <div className="deskGrid">
            <section className="calendarDesk" aria-label="Week planning workspace">
              <div className="calendarHeader"><div><span className="viewName">{weekLabel}</span><strong>Select, drag, cut, copy, or paste. Units carry their lessons with them.</strong></div><button type="button" className="quietButton" onClick={() => setScreen("setup")}>Setup</button></div>
              <div className="weekHeader"><span />{days.map((day) => <div key={day.key}><span>{day.label}</span><b>{day.number}</b></div>)}</div>
              <div className="classRows">
                {workspace.courses.map((course) => (
                  <div className="classRow" key={course.id}>
                    <div className="classLabel"><i style={{ background: course.color }} /><span>{course.name}</span><small>{course.periodLabel}</small></div>
                    <div className="dayCells">
                      {days.map((day, dayIndex) => {
                        const plans = workspace.plans.filter((plan) => plan.location === "calendar" && plan.courseId === course.id && plan.parentUnitId === null && plan.date === day.key);
                        const editing = cellDraft?.courseId === course.id && cellDraft.date === day.key;
                        const target = pasteTarget?.location === "calendar" && pasteTarget.courseId === course.id && pasteTarget.date === day.key;
                        return (
                          <div className={target ? "dayCell pasteTarget" : "dayCell"} key={day.key} onClick={() => setPasteTarget({ courseId: course.id, date: day.key, location: "calendar" })} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/arc-plan"); if (id) movePlanToDate(id, day.key, course.id); }}>
                            <div className="cellPlans">
                              {plans.map((plan) => {
                                const selected = selectedPlanId === plan.id;
                                const collapsed = workspace.preferences.collapsedUnitIds.includes(plan.id);
                                const children = plan.type === "unit" ? orderedUnitChildren(workspace.plans, plan.id) : [];
                                return (
                                  <article className={`${plan.type === "unit" ? "lessonMagnet unitMagnet" : "lessonMagnet"}${selected ? " selected" : ""}`} key={plan.id} draggable={editingPlan?.id !== plan.id} onDragStart={(e) => { e.dataTransfer.setData("text/arc-plan", plan.id); e.dataTransfer.effectAllowed = "move"; }} onClick={(e) => { e.stopPropagation(); setSelectedPlanId(plan.id); setPasteTarget({ courseId: plan.courseId, date: plan.date, location: plan.location }); }}>
                                    {editingPlan?.id === plan.id ? (
                                      <div className="magnetEditor"><input autoFocus value={editingPlan.title} onChange={(e) => setEditingPlan({ id: plan.id, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") savePlanEdit(); if (e.key === "Escape") setEditingPlan(null); }} /><div><button type="button" onClick={savePlanEdit}>Save</button><button type="button" onClick={() => setEditingPlan(null)}>Cancel</button></div></div>
                                    ) : (
                                      <>
                                        <div className="magnetTitleRow">{plan.type === "unit" && <button type="button" className="disclosureButton" aria-label={collapsed ? "Expand unit" : "Collapse unit"} aria-expanded={!collapsed} onClick={(e) => { e.stopPropagation(); toggleUnit(plan.id); }}>{collapsed ? "▸" : "▾"}</button>}<strong>{plan.title}</strong>{plan.type === "unit" && <span className="unitCount">{children.length}</span>}</div>
                                        {plan.type === "unit" && !collapsed && <div className="unitChildren">{children.map((child) => <button type="button" key={child.id} className={selectedPlanId === child.id ? "unitChild selected" : "unitChild"} onClick={(e) => { e.stopPropagation(); setSelectedPlanId(child.id); setPasteTarget({ courseId: child.courseId, date: child.date, location: child.location }); }}><span>{child.title}</span><small>{child.date ?? "Ideas"}</small></button>)}{childDraft?.unitId === plan.id ? <div className="childComposer"><input autoFocus value={childDraft.title} onChange={(e) => setChildDraft({ unitId: plan.id, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") addChildLesson(plan); if (e.key === "Escape") setChildDraft(null); }} placeholder="Lesson title" /><button type="button" onClick={() => addChildLesson(plan)}>Add</button></div> : <button type="button" className="addChild" onClick={(e) => { e.stopPropagation(); setChildDraft({ unitId: plan.id, title: "" }); }}>＋ lesson</button>}</div>}
                                        <div className="magnetActions" aria-label={`Actions for ${plan.title}`}><button type="button" title="Edit" onClick={() => setEditingPlan({ id: plan.id, title: plan.title })}>Edit</button><button type="button" title="Move earlier" disabled={dayIndex === 0} onClick={() => movePlanToDate(plan.id, days[dayIndex - 1]?.key ?? day.key, course.id)}>←</button><button type="button" title="Move later" disabled={dayIndex === days.length - 1} onClick={() => movePlanToDate(plan.id, days[dayIndex + 1]?.key ?? day.key, course.id)}>→</button><button type="button" title="Return to Ideas" onClick={() => returnPlanToIdeas(plan.id)}>Ideas</button><button type="button" className="dangerAction" title="Delete" onClick={() => deletePlan(plan.id)}>×</button></div>
                                      </>
                                    )}
                                  </article>
                                );
                              })}
                            </div>
                            {editing ? <div className="cellComposer"><input autoFocus value={cellDraft.title} onChange={(e) => setCellDraft({ ...cellDraft, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Escape") setCellDraft(null); }} placeholder="What are you planning?" /><div className="cellComposerActions"><button type="button" onClick={() => saveCellDraft("lesson")}>Lesson</button><button type="button" className="secondaryComposerAction" onClick={() => saveCellDraft("unit")}>Unit</button></div></div> : <button type="button" className="cellAdd" aria-label={`Add to ${course.name} on ${day.label}`} onClick={(e) => { e.stopPropagation(); setCellDraft({ courseId: course.id, date: day.key, title: "" }); }}>＋</button>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="workbench" aria-label="Planning workbench">
              <section className={pasteTarget?.location === "ideas" ? "ideasPanel pasteTarget" : "ideasPanel"} onClick={() => setPasteTarget({ courseId: ideaCourseId || null, date: null, location: "ideas" })} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/arc-plan"); if (id) returnPlanToIdeas(id); }}>
                <div className="ideasHeading"><div><p className="eyebrow">Ideas</p><h2>Things worth keeping.</h2></div><span>{workspace.plans.filter((plan) => plan.location === "ideas" && plan.parentUnitId === null).length}</span></div>
                <div className="ideaAdder"><input value={ideaTitle} onClick={(e) => e.stopPropagation()} onChange={(e) => setIdeaTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addIdea(); }} placeholder="Catch an idea…" /><select aria-label="Class for new idea" value={ideaCourseId} onClick={(e) => e.stopPropagation()} onChange={(e) => setIdeaCourseId(e.target.value)}><option value="" disabled>Class</option>{workspace.courses.map((course) => <option value={course.id} key={course.id}>{course.name}</option>)}</select><button type="button" disabled={!ideaCourseId} onClick={(e) => { e.stopPropagation(); addIdea(); }}>＋</button></div>
                <div className="ideaList">{workspace.plans.filter((plan) => plan.location === "ideas" && plan.parentUnitId === null).map((plan) => { const course = workspace.courses.find((item) => item.id === plan.courseId); const children = plan.type === "unit" ? orderedUnitChildren(workspace.plans, plan.id) : []; return <article key={plan.id} className={`${plan.type === "unit" ? "ideaCard unitIdea" : "ideaCard"}${selectedPlanId === plan.id ? " selected" : ""}`} draggable onDragStart={(e) => e.dataTransfer.setData("text/arc-plan", plan.id)} onClick={(e) => { e.stopPropagation(); setSelectedPlanId(plan.id); setPasteTarget({ courseId: plan.courseId, date: null, location: "ideas" }); }}><div className="ideaCardHeader"><strong>{plan.title}</strong>{course && <span style={{ borderColor: course.color }}>{course.name}</span>}</div>{plan.type === "unit" && <small className="ideaUnitMeta">Unit · {children.length} lesson{children.length === 1 ? "" : "s"}</small>}<div className="ideaDates">{days.map((day) => <button type="button" key={day.key} onClick={(e) => { e.stopPropagation(); moveIdeaToDate(plan.id, day.key); }}>{day.label}</button>)}</div><button type="button" className="ideaDelete" onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}>Delete</button></article>; })}{workspace.plans.every((plan) => plan.location !== "ideas" || plan.parentUnitId !== null) && <p className="emptyNote">Loose thoughts can live here before they have a date.</p>}</div>
              </section>

              <section className="priorityPanel" aria-label="Must should could priorities"><p className="eyebrow">Must · Should · Could</p>{(["must", "should", "could"] as const).map((tier) => <div key={tier} className="priorityTier"><div className="priorityHeading"><span>{tier}</span><button type="button" aria-label={`Add ${tier} priority`} onClick={() => setPriorityDraft({ tier, title: "" })}>＋</button></div><div className="priorityList">{workspace.priorities.filter((priority) => priority.tier === tier).map((priority) => <label className={priority.completed ? "priorityItem done" : "priorityItem"} key={priority.id}><input type="checkbox" checked={priority.completed} onChange={() => togglePriority(priority.id)} /><span>{priority.title}</span></label>)}</div>{priorityDraft?.tier === tier && <div className="priorityComposer"><input autoFocus value={priorityDraft.title} onChange={(e) => setPriorityDraft({ tier, title: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") addPriority(); if (e.key === "Escape") setPriorityDraft(null); }} placeholder={`Add a ${tier}`} /><button type="button" onClick={addPriority}>Add</button></div>}</div>)}</section>
            </aside>
          </div>
        </section>
      )}
    </main>
  );
}
