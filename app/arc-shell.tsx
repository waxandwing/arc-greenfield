"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyWorkspace, type Plan, type PlanType, type Workspace } from "../lib/domain";
import { applyCut, createClipboard, pasteClipboard, type ArcClipboard, type PasteTarget } from "../lib/clipboard";
import { movePlanToCalendarDate } from "../lib/plan-operations";
import { deletePlanTree, movePlanTreeToIdeas, orderedUnitChildren } from "../lib/plan-tree";
import { deletePriority, movePriority, renamePriority, reorderPriority } from "../lib/priority-operations";
import { resolveArcShortcut } from "../lib/shortcuts";
import { availableQuarterRanges } from "../lib/view-ranges";
import { canRedo, canUndo, commitWorkspace, createWorkspaceHistory, redoWorkspace, undoWorkspace, type WorkspaceHistory } from "../lib/workspace-history";
import { loadWorkspace, saveWorkspace } from "../lib/workspace-store";
import { MonthView } from "./month-view";
import { PriorityWorkbench } from "./priority-workbench";
import { QuarterView } from "./quarter-view";
import { WeekPlanner } from "./week-planner";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
type PlannerView = "week" | "month" | "quarter";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function shiftMonth(date: Date, months: number) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  return next;
}

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
}

export function ArcShell({ buildId, gitSha, onOpenSetup }: { buildId: string; gitSha: string; onOpenSetup: () => void }) {
  const [history, setHistory] = useState<WorkspaceHistory>(() => createWorkspaceHistory(emptyWorkspace()));
  const workspace = history.present;
  const [ready, setReady] = useState(false);
  const [activeView, setActiveView] = useState<PlannerView>("week");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaCourseId, setIdeaCourseId] = useState("");
  const [activeCourseId, setActiveCourseId] = useState("");
  const [saveLabel, setSaveLabel] = useState("Not saved yet");
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [quarterIndex, setQuarterIndex] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<ArcClipboard | null>(null);
  const [pasteTarget, setPasteTarget] = useState<PasteTarget | null>(null);

  const days = useMemo(() => weekDays(weekAnchor), [weekAnchor]);
  const weekLabel = `${days[0].month} ${days[0].number} – ${days[4].month} ${days[4].number}`;
  const quarterRanges = useMemo(() => availableQuarterRanges(workspace.calendar), [workspace.calendar]);
  const activeQuarter = quarterRanges[Math.min(quarterIndex, Math.max(0, quarterRanges.length - 1))] ?? null;
  const selectedCourseId = activeCourseId || workspace.courses[0]?.id || "";

  useEffect(() => {
    const loaded = loadWorkspace();
    setHistory(createWorkspaceHistory(loaded));
    if (loaded.courses[0]) {
      setIdeaCourseId(loaded.courses[0].id);
      setActiveCourseId(loaded.courses[0].id);
    }
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

  function addChildLesson(unit: Plan, title: string) {
    if (!title.trim()) return;
    const existing = orderedUnitChildren(workspace.plans, unit.id);
    const lesson = makePlan(title, "lesson", unit.courseId, unit.date, unit.location, unit.id, existing.length);
    updateWorkspace((current) => ({ ...current, plans: [...current.plans, lesson] }));
    setSelectedPlanId(lesson.id);
  }

  function movePlanToDate(id: string, date: string, courseId: string) {
    updateWorkspace((current) => ({ ...current, plans: movePlanToCalendarDate(current.plans, id, date, courseId) }));
    setPasteTarget({ courseId, date, location: "calendar" });
  }

  function moveIdeaToDate(id: string, date: string) {
    const plan = workspace.plans.find((item) => item.id === id);
    const courseId = plan?.courseId ?? workspace.courses[0]?.id;
    if (!courseId) return;
    movePlanToDate(id, date, courseId);
  }

  function renamePlan(id: string, title: string) {
    if (!title.trim()) return;
    updateWorkspace((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === id ? { ...plan, title: title.trim() } : plan) }));
  }

  function deletePlan(id: string) {
    updateWorkspace((current) => ({ ...current, plans: deletePlanTree(current.plans, id) }));
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
    setClipboard(result.nextClipboard);
  }

  function selectPlan(plan: Plan) {
    setSelectedPlanId(plan.id);
    setPasteTarget({ courseId: plan.courseId, date: plan.date, location: plan.location });
  }

  function selectRangeDate(date: string) {
    if (!selectedCourseId) return;
    setPasteTarget({ courseId: selectedCourseId, date, location: "calendar" });
  }

  function togglePriority(id: string) {
    updateWorkspace((current) => ({ ...current, priorities: current.priorities.map((priority) => priority.id === id ? { ...priority, completed: !priority.completed } : priority) }));
  }

  function goPrevious() {
    if (activeView === "week") setWeekAnchor((current) => shiftDate(current, -7));
    if (activeView === "month") setMonthAnchor((current) => shiftMonth(current, -1));
    if (activeView === "quarter") setQuarterIndex((current) => Math.max(0, current - 1));
  }

  function goNext() {
    if (activeView === "week") setWeekAnchor((current) => shiftDate(current, 7));
    if (activeView === "month") setMonthAnchor((current) => shiftMonth(current, 1));
    if (activeView === "quarter") setQuarterIndex((current) => Math.min(Math.max(0, quarterRanges.length - 1), current + 1));
  }

  function goToday() {
    setWeekAnchor(new Date());
    setMonthAnchor(new Date());
    const today = dateKey(new Date());
    const currentQuarterIndex = quarterRanges.findIndex((quarter) => quarter.start <= today && quarter.end >= today);
    if (currentQuarterIndex >= 0) setQuarterIndex(currentQuarterIndex);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const action = resolveArcShortcut(event);
      if (!action) return;
      if (isTypingTarget(event.target) && action !== "escape") return;
      if (action === "escape") { setSelectedPlanId(null); return; }
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
        <button className="arcBrand" type="button" onClick={() => setActiveView("week")} aria-label="Arc home"><span className="arcBrandEyebrow">Wax &amp; Wing</span><span className="arcBrandWord">Arc</span></button>
        <div className="arcMeta"><span>{saveLabel}</span><code>{buildId} · {gitSha.slice(0, 7)}</code></div>
      </header>

      <section className="deskPage">
        <div className="deskToolbar">
          <div><p className="eyebrow">Planning desk</p><h1>{workspace.teacherName ? `${workspace.teacherName}’s ${activeView}` : `Your ${activeView}`}</h1></div>
          <div className="deskActions" aria-label="Planner actions"><button type="button" onClick={undo} disabled={!canUndo(history)}>Undo</button><button type="button" onClick={redo} disabled={!canRedo(history)}>Redo</button><span className="actionDivider" /><button type="button" onClick={() => copySelection("copy")} disabled={!selectedPlanId}>Copy</button><button type="button" onClick={() => copySelection("cut")} disabled={!selectedPlanId}>Cut</button><button type="button" onClick={pasteSelection} disabled={!clipboard || !pasteTarget}>Paste</button><span className="actionDivider" /><button type="button" onClick={goPrevious}>←</button><button type="button" className="todayButton" onClick={goToday}>Today</button><button type="button" onClick={goNext}>→</button></div>
        </div>

        <div className="viewControlBar">
          <div className="viewSwitcher" aria-label="Planner view"><button type="button" className={activeView === "week" ? "active" : ""} onClick={() => setActiveView("week")}>Week</button><button type="button" className={activeView === "month" ? "active" : ""} onClick={() => setActiveView("month")}>Month</button><button type="button" className={activeView === "quarter" ? "active" : ""} disabled={quarterRanges.length === 0} title={quarterRanges.length === 0 ? "Add quarter dates in Setup first" : undefined} onClick={() => setActiveView("quarter")}>Quarter</button></div>
          {activeView !== "week" && <label className="rangeCoursePicker"><span>Class</span><select value={selectedCourseId} onChange={(e) => setActiveCourseId(e.target.value)}>{workspace.courses.map((course) => <option key={course.id} value={course.id}>{course.name}{course.periodLabel ? ` · ${course.periodLabel}` : ""}</option>)}</select></label>}
          {activeView === "quarter" && quarterRanges.length > 1 && <label className="rangeCoursePicker"><span>Quarter</span><select value={Math.min(quarterIndex, quarterRanges.length - 1)} onChange={(e) => setQuarterIndex(Number(e.target.value))}>{quarterRanges.map((quarter, index) => <option value={index} key={quarter.id}>{quarter.label}</option>)}</select></label>}
          <button type="button" className="quietButton" onClick={onOpenSetup}>Setup</button>
        </div>

        <div className="deskGrid">
          <section className="calendarDesk" aria-label={`${activeView} planning workspace`}>
            {activeView === "week" && <WeekPlanner workspace={workspace} days={days} weekLabel={weekLabel} selectedPlanId={selectedPlanId} pasteTarget={pasteTarget} onSelectPlan={selectPlan} onSelectDate={(courseId, date) => setPasteTarget({ courseId, date, location: "calendar" })} onMovePlan={movePlanToDate} onRenamePlan={renamePlan} onAddPlan={(title, type, courseId, date) => addPlan(title, type, courseId, date, "calendar")} onAddChildLesson={addChildLesson} onToggleUnit={toggleUnit} onDeletePlan={deletePlan} onReturnToIdeas={returnPlanToIdeas} />}

            {activeView === "month" && selectedCourseId && <MonthView workspace={workspace} anchor={monthAnchor} courseId={selectedCourseId} selectedPlanId={selectedPlanId} pasteTargetDate={pasteTarget?.location === "calendar" && pasteTarget.courseId === selectedCourseId ? pasteTarget.date : null} onSelectPlan={selectPlan} onSelectDate={selectRangeDate} onMovePlan={movePlanToDate} />}

            {activeView === "quarter" && activeQuarter && selectedCourseId && <QuarterView workspace={workspace} range={activeQuarter} courseId={selectedCourseId} selectedPlanId={selectedPlanId} pasteTargetDate={pasteTarget?.location === "calendar" && pasteTarget.courseId === selectedCourseId ? pasteTarget.date : null} onSelectPlan={selectPlan} onSelectDate={selectRangeDate} onMovePlan={movePlanToDate} />}
          </section>

          <aside className="workbench" aria-label="Planning workbench">
            <section className={pasteTarget?.location === "ideas" ? "ideasPanel pasteTarget" : "ideasPanel"} onClick={() => setPasteTarget({ courseId: ideaCourseId || null, date: null, location: "ideas" })} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/arc-plan"); if (id) returnPlanToIdeas(id); }}><div className="ideasHeading"><div><p className="eyebrow">Ideas</p><h2>Things worth keeping.</h2></div><span>{workspace.plans.filter((plan) => plan.location === "ideas" && plan.parentUnitId === null).length}</span></div><div className="ideaAdder"><input value={ideaTitle} onClick={(e) => e.stopPropagation()} onChange={(e) => setIdeaTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addIdea(); }} placeholder="Catch an idea…" /><select aria-label="Class for new idea" value={ideaCourseId} onClick={(e) => e.stopPropagation()} onChange={(e) => setIdeaCourseId(e.target.value)}><option value="" disabled>Class</option>{workspace.courses.map((course) => <option value={course.id} key={course.id}>{course.name}</option>)}</select><button type="button" disabled={!ideaCourseId} onClick={(e) => { e.stopPropagation(); addIdea(); }}>＋</button></div><div className="ideaList">{workspace.plans.filter((plan) => plan.location === "ideas" && plan.parentUnitId === null).map((plan) => { const course = workspace.courses.find((item) => item.id === plan.courseId); const children = plan.type === "unit" ? orderedUnitChildren(workspace.plans, plan.id) : []; return <article key={plan.id} className={`${plan.type === "unit" ? "ideaCard unitIdea" : "ideaCard"}${selectedPlanId === plan.id ? " selected" : ""}`} draggable onDragStart={(e) => e.dataTransfer.setData("text/arc-plan", plan.id)} onClick={(e) => { e.stopPropagation(); selectPlan(plan); }}><div className="ideaCardHeader"><strong>{plan.title}</strong>{course && <span style={{ borderColor: course.color }}>{course.name}</span>}</div>{plan.type === "unit" && <small className="ideaUnitMeta">Unit · {children.length} lesson{children.length === 1 ? "" : "s"}</small>}<div className="ideaDates">{days.map((day) => <button type="button" key={day.key} onClick={(e) => { e.stopPropagation(); moveIdeaToDate(plan.id, day.key); }}>{day.label}</button>)}</div><button type="button" className="ideaDelete" onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}>Delete</button></article>; })}{workspace.plans.every((plan) => plan.location !== "ideas" || plan.parentUnitId !== null) && <p className="emptyNote">Loose thoughts can live here before they have a date.</p>}</div></section>
            <PriorityWorkbench priorities={workspace.priorities} onAdd={(tier, title) => updateWorkspace((current) => ({ ...current, priorities: [...current.priorities, { id: crypto.randomUUID(), title, tier, completed: false, scope: "school" }] }))} onToggle={togglePriority} onRename={(id, title) => updateWorkspace((current) => renamePriority(current, id, title))} onDelete={(id) => updateWorkspace((current) => deletePriority(current, id))} onMove={(id, tier) => updateWorkspace((current) => movePriority(current, id, tier))} onReorder={(id, direction) => updateWorkspace((current) => reorderPriority(current, id, direction))} />
          </aside>
        </div>
      </section>
    </main>
  );
}
