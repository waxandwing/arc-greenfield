"use client";

import { useEffect, useMemo, useState } from "react";
import type { Plan, PlanType, Workspace } from "../lib/domain";
import { applyCut, createClipboard, pasteClipboard, type ArcClipboard, type PasteTarget } from "../lib/clipboard";
import { resolveArcShortcut } from "../lib/shortcuts";
import { availableQuarterRanges } from "../lib/view-ranges";
import {
  commitWorkspaceReplacement,
  dispatchWorkspaceCommand,
  redoWorkspaceCommand,
  undoWorkspaceCommand,
  type WorkspaceCommand
} from "../lib/workspace-controller";
import { canRedo, canUndo, createWorkspaceHistory, type WorkspaceHistory } from "../lib/workspace-history";
import { loadWorkspace, saveWorkspace } from "../lib/workspace-store";
import { IdeasWorkbench } from "./ideas-workbench";
import { MonthView } from "./month-view";
import { PriorityWorkbench } from "./priority-workbench";
import { QuarterView } from "./quarter-view";
import { WeekPlanner } from "./week-planner";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
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
    return {
      label,
      key: dateKey(date),
      number: date.getDate(),
      month: date.toLocaleDateString(undefined, { month: "short" })
    };
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
  const [history, setHistory] = useState<WorkspaceHistory>(() => createWorkspaceHistory(loadWorkspace()));
  const workspace = history.present;
  const [ready, setReady] = useState(false);
  const [activeView, setActiveView] = useState<PlannerView>("week");
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
    setActiveCourseId(loaded.courses[0]?.id ?? "");
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

  function dispatch(command: WorkspaceCommand) {
    setHistory((current) => dispatchWorkspaceCommand(current, command));
  }

  function addPlan(title: string, planType: PlanType, courseId: string | null, date: string | null, location: "calendar" | "ideas") {
    const id = crypto.randomUUID();
    dispatch({ type: "plan.create", id, title, planType, courseId, date, location });
    setSelectedPlanId(id);
  }

  function addChildLesson(unit: Plan, title: string) {
    const id = crypto.randomUUID();
    dispatch({ type: "plan.add-child", id, unitId: unit.id, title });
    setSelectedPlanId(id);
  }

  function movePlanToDate(id: string, date: string, courseId: string) {
    dispatch({ type: "plan.move-to-calendar", planId: id, date, courseId });
    setPasteTarget({ courseId, date, location: "calendar" });
  }

  function deletePlan(id: string) {
    dispatch({ type: "plan.delete", planId: id });
    if (selectedPlanId === id) setSelectedPlanId(null);
  }

  function returnPlanToIdeas(id: string) {
    const courseId = workspace.plans.find((plan) => plan.id === id)?.courseId ?? null;
    dispatch({ type: "plan.move-to-ideas", planId: id });
    setPasteTarget({ courseId, date: null, location: "ideas" });
  }

  function copySelection(mode: "copy" | "cut") {
    if (!selectedPlanId) return;
    const nextClipboard = createClipboard(workspace, selectedPlanId, mode);
    if (!nextClipboard) return;
    setClipboard(nextClipboard);
    if (mode === "cut") {
      setHistory((current) => commitWorkspaceReplacement(current, applyCut(current.present, nextClipboard)));
      setSelectedPlanId(null);
    }
  }

  function pasteSelection() {
    if (!clipboard || !pasteTarget) return;
    const result = pasteClipboard(workspace, clipboard, pasteTarget);
    if (!result.pastedRootId) return;
    setHistory((current) => commitWorkspaceReplacement(current, result.workspace));
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

  function undo() {
    setHistory((current) => undoWorkspaceCommand(current));
    setSelectedPlanId(null);
  }

  function redo() {
    setHistory((current) => redoWorkspaceCommand(current));
    setSelectedPlanId(null);
  }

  function goPrevious() {
    if (activeView === "week") setWeekAnchor((current) => shiftDate(current, -7));
    else if (activeView === "month") setMonthAnchor((current) => shiftMonth(current, -1));
    else setQuarterIndex((current) => Math.max(0, current - 1));
  }

  function goNext() {
    if (activeView === "week") setWeekAnchor((current) => shiftDate(current, 7));
    else if (activeView === "month") setMonthAnchor((current) => shiftMonth(current, 1));
    else setQuarterIndex((current) => Math.min(Math.max(0, quarterRanges.length - 1), current + 1));
  }

  function goToday() {
    const now = new Date();
    setWeekAnchor(now);
    setMonthAnchor(now);
    const today = dateKey(now);
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
        <button className="arcBrand" type="button" aria-label="Arc home">
          <span className="arcBrandEyebrow">Wax &amp; Wing</span>
          <span className="arcBrandWord">Arc</span>
        </button>
        <div className="arcMeta">
          <span>{saveLabel}</span>
          <code>{buildId} · {gitSha.slice(0, 7)}</code>
        </div>
      </header>

      <section className="deskPage">
        <div className="deskToolbar">
          <div>
            <p className="eyebrow">Planning desk</p>
            <h1>{workspace.teacherName ? `${workspace.teacherName}’s ${activeView}` : `Your ${activeView}`}</h1>
          </div>
          <div className="deskActions" aria-label="Planner actions">
            <button type="button" onClick={undo} disabled={!canUndo(history)}>Undo</button>
            <button type="button" onClick={redo} disabled={!canRedo(history)}>Redo</button>
            <span className="actionDivider" aria-hidden="true" />
            <button type="button" onClick={() => copySelection("copy")} disabled={!selectedPlanId}>Copy</button>
            <button type="button" onClick={() => copySelection("cut")} disabled={!selectedPlanId}>Cut</button>
            <button type="button" onClick={pasteSelection} disabled={!clipboard || !pasteTarget}>Paste</button>
            <span className="actionDivider" aria-hidden="true" />
            <button type="button" aria-label="Previous range" onClick={goPrevious}>←</button>
            <button type="button" className="todayButton" onClick={goToday}>Today</button>
            <button type="button" aria-label="Next range" onClick={goNext}>→</button>
          </div>
        </div>

        <div className="viewControlBar">
          <div className="viewSwitcher" aria-label="Planner view">
            <button type="button" className={activeView === "week" ? "active" : ""} onClick={() => setActiveView("week")}>Week</button>
            <button type="button" className={activeView === "month" ? "active" : ""} onClick={() => setActiveView("month")}>Month</button>
            <button type="button" className={activeView === "quarter" ? "active" : ""} disabled={quarterRanges.length === 0} title={quarterRanges.length === 0 ? "Add quarter dates in Setup first" : undefined} onClick={() => setActiveView("quarter")}>Quarter</button>
          </div>
          {activeView !== "week" && (
            <label className="rangeCoursePicker">
              <span>Class</span>
              <select value={selectedCourseId} onChange={(event) => setActiveCourseId(event.target.value)}>
                {workspace.courses.map((course) => <option key={course.id} value={course.id}>{course.name}{course.periodLabel ? ` · ${course.periodLabel}` : ""}</option>)}
              </select>
            </label>
          )}
          {activeView === "quarter" && quarterRanges.length > 1 && (
            <label className="rangeCoursePicker">
              <span>Quarter</span>
              <select value={Math.min(quarterIndex, quarterRanges.length - 1)} onChange={(event) => setQuarterIndex(Number(event.target.value))}>
                {quarterRanges.map((quarter, index) => <option value={index} key={quarter.id}>{quarter.label}</option>)}
              </select>
            </label>
          )}
          <button type="button" className="quietButton" onClick={onOpenSetup}>Setup</button>
        </div>

        <div className="deskGrid">
          <section className="calendarDesk" aria-label={`${activeView} planning workspace`}>
            {activeView === "week" && (
              <WeekPlanner
                workspace={workspace}
                days={days}
                weekLabel={weekLabel}
                selectedPlanId={selectedPlanId}
                pasteTarget={pasteTarget}
                onSelectPlan={selectPlan}
                onSelectDate={(courseId, date) => setPasteTarget({ courseId, date, location: "calendar" })}
                onMovePlan={movePlanToDate}
                onRenamePlan={(planId, title) => dispatch({ type: "plan.rename", planId, title })}
                onAddPlan={(title, planType, courseId, date) => addPlan(title, planType, courseId, date, "calendar")}
                onAddChildLesson={addChildLesson}
                onToggleUnit={(unitId) => dispatch({ type: "unit.toggle-collapsed", unitId })}
                onDeletePlan={deletePlan}
                onReturnToIdeas={returnPlanToIdeas}
              />
            )}

            {activeView === "month" && selectedCourseId && (
              <MonthView
                workspace={workspace}
                anchor={monthAnchor}
                courseId={selectedCourseId}
                selectedPlanId={selectedPlanId}
                pasteTargetDate={pasteTarget?.location === "calendar" && pasteTarget.courseId === selectedCourseId ? pasteTarget.date : null}
                onSelectPlan={selectPlan}
                onSelectDate={selectRangeDate}
                onMovePlan={movePlanToDate}
                onAddPlan={(title, planType, date) => addPlan(title, planType, selectedCourseId, date, "calendar")}
              />
            )}

            {activeView === "quarter" && activeQuarter && selectedCourseId && (
              <QuarterView
                workspace={workspace}
                range={activeQuarter}
                courseId={selectedCourseId}
                selectedPlanId={selectedPlanId}
                pasteTargetDate={pasteTarget?.location === "calendar" && pasteTarget.courseId === selectedCourseId ? pasteTarget.date : null}
                onSelectPlan={selectPlan}
                onSelectDate={selectRangeDate}
                onMovePlan={movePlanToDate}
                onAddPlan={(title, planType, date) => addPlan(title, planType, selectedCourseId, date, "calendar")}
              />
            )}
          </section>

          <aside className="workbench" aria-label="Planning workbench">
            <IdeasWorkbench
              workspace={workspace}
              days={days}
              selectedPlanId={selectedPlanId}
              isPasteTarget={pasteTarget?.location === "ideas"}
              onSelectPlan={selectPlan}
              onSelectTarget={(courseId) => setPasteTarget({ courseId, date: null, location: "ideas" })}
              onCreateIdea={(id, title, courseId) => {
                dispatch({ type: "plan.create", id, title, planType: "lesson", courseId, date: null, location: "ideas" });
                setSelectedPlanId(id);
              }}
              onMoveToCalendar={movePlanToDate}
              onDeletePlan={deletePlan}
              onMoveToIdeas={returnPlanToIdeas}
            />
            <PriorityWorkbench
              priorities={workspace.priorities}
              onAdd={(tier, title) => dispatch({ type: "priority.add", id: crypto.randomUUID(), tier, title })}
              onToggle={(priorityId) => dispatch({ type: "priority.toggle", priorityId })}
              onRename={(priorityId, title) => dispatch({ type: "priority.rename", priorityId, title })}
              onDelete={(priorityId) => dispatch({ type: "priority.delete", priorityId })}
              onMove={(priorityId, tier) => dispatch({ type: "priority.move", priorityId, tier })}
              onReorder={(priorityId, direction) => dispatch({ type: "priority.reorder", priorityId, direction })}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
