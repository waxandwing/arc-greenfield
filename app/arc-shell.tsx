"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type Plan, type PlanType, type PriorityTier, type TaskContext } from "../lib/domain";
import { applyCut, createClipboard, cutBlocker, pasteClipboard, type ArcClipboard, type PasteTarget } from "../lib/clipboard";
import { dateKey, weekDisplayDates } from "../lib/calendar-display";
import { moveObjectToTaskBar, updateTaskContext } from "../lib/object-lifecycle";
import { calendarMoveBlocker, movePlanToCalendarDate } from "../lib/plan-operations";
import { collectPlanTree, deletePlanTree, movePlanTreeToIdeas, orderedUnitChildren, unitUnplaceBlocker } from "../lib/plan-tree";
import { resolveArcShortcut } from "../lib/shortcuts";
import { useArcStore } from "../lib/arc-store";
import { availableQuarterRanges } from "../lib/view-ranges";
import { canRedo, canUndo } from "../lib/workspace-history";
import { FridgeDrawer } from "./fridge-drawer";
import { MonthView } from "./month-view";
import { QuarterView } from "./quarter-view";
import { SettingsDrawer } from "./settings-drawer";
import { TaskBar } from "./task-bar";
import { WeekPlanner } from "./week-planner";

type PlannerView = "week" | "month" | "quarter";

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

function planList(plans: Array<{ title: string; date: string | null }>) {
  return plans.map((plan) => plan.date ? `${plan.title} (${plan.date})` : plan.title).join(", ");
}

export function ArcShell({ buildId, gitSha, onOpenSetup }: { buildId: string; gitSha: string; onOpenSetup: () => void }) {
  const history = useArcStore((state) => state.history);
  const workspace = history.present;
  const ready = useArcStore((state) => state.hydrated);
  const selectedPlanId = useArcStore((state) => state.selectedObjectId);
  const lastSavedAt = useArcStore((state) => state.lastSavedAt);
  const hydrate = useArcStore((state) => state.hydrate);
  const updateWorkspace = useArcStore((state) => state.commit);
  const replaceWorkspace = useArcStore((state) => state.replace);
  const selectObject = useArcStore((state) => state.selectObject);
  const storeUndo = useArcStore((state) => state.undo);
  const storeRedo = useArcStore((state) => state.redo);

  const [activeView, setActiveView] = useState<PlannerView>("week");
  const [activeCourseId, setActiveCourseId] = useState("");
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [quarterIndex, setQuarterIndex] = useState(0);
  const [clipboard, setClipboard] = useState<ArcClipboard | null>(null);
  const [pasteTarget, setPasteTarget] = useState<PasteTarget | null>(null);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [interactionNotice, setInteractionNotice] = useState<string | null>(null);
  const fridgePullRef = useRef<HTMLButtonElement | null>(null);
  const settingsPullRef = useRef<HTMLButtonElement | null>(null);
  const noticeReturnRef = useRef<HTMLElement | null>(null);

  const days = useMemo(() => weekDisplayDates(weekAnchor, workspace.calendar.weekendsVisible), [weekAnchor, workspace.calendar.weekendsVisible]);
  const weekLabel = days.length ? `${days[0].month} ${days[0].number} – ${days[days.length - 1].month} ${days[days.length - 1].number}` : "Week";
  const quarterRanges = useMemo(() => availableQuarterRanges(workspace.calendar), [workspace.calendar]);
  const activeQuarter = quarterRanges[Math.min(quarterIndex, Math.max(0, quarterRanges.length - 1))] ?? null;
  const selectedCourseId = activeCourseId || workspace.courses[0]?.id || "";
  const saveLabel = lastSavedAt ? `Saved here · ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Not saved yet";

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (ready && !activeCourseId && workspace.courses[0]) setActiveCourseId(workspace.courses[0].id);
  }, [ready, activeCourseId, workspace.courses]);

  function showInteractionNotice(message: string) {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      noticeReturnRef.current = document.activeElement;
    }
    setInteractionNotice(message);
  }

  function dismissInteractionNotice() {
    setInteractionNotice(null);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => noticeReturnRef.current?.focus());
    }
  }

  function undo() {
    storeUndo();
  }

  function redo() {
    storeRedo();
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
      arcLocation: location === "calendar" ? "calendar" : "fridge",
      taskContext: null,
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
    selectObject(plan.id);
  }

  function addFridgeObject(title: string, type: "note" | "lesson" | "unit") {
    addPlan(title, type, null, null, "ideas");
  }

  function addTaskObject(tier: PriorityTier, title: string) {
    if (!title.trim()) return;
    const plan = moveObjectToTaskBar(makePlan(title, "note", null, null, "ideas"), tier);
    updateWorkspace((current) => ({ ...current, plans: [...current.plans, plan] }));
    selectObject(plan.id);
  }

  function addChildLesson(unit: Plan, title: string) {
    if (!title.trim()) return;
    const existing = orderedUnitChildren(workspace.plans, unit.id);
    const lesson = makePlan(title, "lesson", unit.courseId, unit.date, unit.location, unit.id, existing.length);
    lesson.arcLocation = unit.arcLocation ?? (unit.location === "calendar" ? "calendar" : "fridge");
    updateWorkspace((current) => ({ ...current, plans: [...current.plans, lesson] }));
    selectObject(lesson.id);
  }

  function movePlanToDate(id: string, date: string, courseId: string) {
    const blocker = calendarMoveBlocker(workspace.plans, id, date);
    if (blocker) {
      showInteractionNotice(`Arc kept this placement fixed. Move blocked by: ${planList(blocker.fixedPlans)}. Change the fixed-date setting explicitly before moving it.`);
      selectObject(id);
      return;
    }

    updateWorkspace((current) => ({ ...current, plans: movePlanToCalendarDate(current.plans, id, date, courseId) }));
    setInteractionNotice(null);
    setPasteTarget({ courseId, date, location: "calendar" });
  }

  function renamePlan(id: string, title: string) {
    if (!title.trim()) return;
    updateWorkspace((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === id ? { ...plan, title: title.trim() } : plan) }));
  }

  function patchPlan(id: string, patch: Partial<Plan>) {
    updateWorkspace((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === id ? { ...plan, ...patch } : plan) }));
  }

  function deletePlan(id: string) {
    const tree = collectPlanTree(workspace.plans, id);
    const root = tree.find((plan) => plan.id === id);
    if (!root) return;

    const dependencyBlocker = unitUnplaceBlocker(workspace.plans, id);
    if (dependencyBlocker) {
      showInteractionNotice(`Arc did not delete “${root.title}.” Scheduled child Lessons still depend on this Unit: ${planList(dependencyBlocker.scheduledChildren)}. Reconcile those Lessons first.`);
      selectObject(id);
      return;
    }

    const attachedCount = Math.max(0, tree.length - 1);
    const consequence = attachedCount
      ? `Delete “${root.title}” and ${attachedCount} attached ${attachedCount === 1 ? "item" : "items"}? This cannot be undone after the Undo history is cleared.`
      : `Delete “${root.title}”? This removes the object rather than putting it back in the Fridge.`;
    if (typeof window !== "undefined" && !window.confirm(consequence)) return;
    updateWorkspace((current) => ({ ...current, plans: deletePlanTree(current.plans, id) }));
    setInteractionNotice(null);
    if (selectedPlanId === id) selectObject(null);
  }

  function putPlanInFridge(id: string) {
    const blocker = unitUnplaceBlocker(workspace.plans, id);
    if (blocker) {
      const unit = workspace.plans.find((plan) => plan.id === id);
      showInteractionNotice(`Arc kept “${unit?.title ?? "this Unit"}” on the calendar because these child Lessons are still scheduled: ${planList(blocker.scheduledChildren)}. Unplace or move the Lessons first.`);
      selectObject(id);
      return;
    }

    updateWorkspace((current) => ({ ...current, plans: movePlanTreeToIdeas(current.plans, id) }));
    const plan = workspace.plans.find((item) => item.id === id);
    setInteractionNotice(null);
    setPasteTarget({ courseId: plan?.courseId ?? null, date: null, location: "ideas" });
  }

  function movePlanToTaskTier(id: string, tier: PriorityTier) {
    const blocker = unitUnplaceBlocker(workspace.plans, id);
    if (blocker) {
      const unit = workspace.plans.find((plan) => plan.id === id);
      showInteractionNotice(`Arc did not move “${unit?.title ?? "this Unit"}” into the Task Bar. Its scheduled child Lessons keep their calendar placement: ${planList(blocker.scheduledChildren)}.`);
      selectObject(id);
      return;
    }

    updateWorkspace((current) => ({
      ...current,
      plans: current.plans.map((plan) => plan.id === id ? moveObjectToTaskBar(plan, tier) : plan)
    }));
    setInteractionNotice(null);
  }

  function patchTaskContext(id: string, patch: Partial<TaskContext>) {
    updateWorkspace((current) => ({
      ...current,
      plans: current.plans.map((plan) => plan.id === id ? updateTaskContext(plan, patch) : plan)
    }));
  }

  function toggleWeekends() {
    updateWorkspace((current) => ({ ...current, calendar: { ...current.calendar, weekendsVisible: !current.calendar.weekendsVisible } }));
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

    if (mode === "cut") {
      const blocker = cutBlocker(workspace, selectedPlanId);
      if (blocker) {
        showInteractionNotice(`Arc did not Cut this object because its fixed placement must stay anchored: ${planList(blocker.fixedPlans)}. Copy is still available.`);
        return;
      }
    }

    const nextClipboard = createClipboard(workspace, selectedPlanId, mode);
    if (!nextClipboard) {
      showInteractionNotice(`Arc could not ${mode === "cut" ? "Cut" : "Copy"} that selection without risking its canonical record.`);
      return;
    }
    setClipboard(nextClipboard);
    setInteractionNotice(null);
    if (mode === "cut") {
      replaceWorkspace(applyCut(workspace, nextClipboard));
      selectObject(null);
    }
  }

  function pasteSelection() {
    if (!clipboard || !pasteTarget) return;
    const result = pasteClipboard(workspace, clipboard, pasteTarget);
    if (!result.pastedRootId) {
      showInteractionNotice("Arc did not Paste because the destination would make object identity ambiguous or the clipboard is no longer safe to apply. The current plan was left unchanged.");
      return;
    }
    replaceWorkspace(result.workspace);
    selectObject(result.pastedRootId);
    setClipboard(result.nextClipboard);
    setInteractionNotice(null);
  }

  function selectPlan(plan: Plan) {
    selectObject(plan.id);
    setPasteTarget({ courseId: plan.courseId, date: plan.date, location: plan.location });
  }

  function selectRangeDate(date: string) {
    if (!selectedCourseId) return;
    setPasteTarget({ courseId: selectedCourseId, date, location: "calendar" });
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

  function closeFridge() {
    setFridgeOpen(false);
    window.requestAnimationFrame(() => fridgePullRef.current?.focus());
  }

  function closeSettings() {
    setSettingsOpen(false);
    window.requestAnimationFrame(() => settingsPullRef.current?.focus());
  }

  function openFridge() {
    if (settingsOpen) setSettingsOpen(false);
    setFridgeOpen(true);
  }

  function openSettings() {
    if (fridgeOpen) setFridgeOpen(false);
    setSettingsOpen(true);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const action = resolveArcShortcut(event);
      if (!action) return;
      if (isTypingTarget(event.target) && action !== "escape") return;
      if (action === "escape") {
        if (interactionNotice) { dismissInteractionNotice(); return; }
        if (fridgeOpen) { closeFridge(); return; }
        if (settingsOpen) { closeSettings(); return; }
        selectObject(null);
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
        <button className="arcBrand" type="button" onClick={() => setActiveView("week")} aria-label="Arc home"><span className="arcBrandEyebrow">Wax &amp; Wing</span><span className="arcBrandWord">Arc</span></button>
        <div className="arcMeta"><span>{saveLabel}</span><code>{buildId} · {gitSha.slice(0, 7)}</code></div>
      </header>

      <section className="deskPage reconciledDeskPage">
        <div className="deskToolbar">
          <div><p className="eyebrow">Planning desk</p><h1>{workspace.teacherName ? `${workspace.teacherName}’s ${activeView}` : `Your ${activeView}`}</h1></div>
          <div className="deskActions" aria-label="Planner actions"><button type="button" onClick={undo} disabled={!canUndo(history)}>Undo</button><button type="button" onClick={redo} disabled={!canRedo(history)}>Redo</button><span className="actionDivider" /><button type="button" onClick={() => copySelection("copy")} disabled={!selectedPlanId}>Copy</button><button type="button" onClick={() => copySelection("cut")} disabled={!selectedPlanId}>Cut</button><button type="button" onClick={pasteSelection} disabled={!clipboard || !pasteTarget}>Paste</button><span className="actionDivider" /><button type="button" onClick={goPrevious}>←</button><button type="button" className="todayButton" onClick={goToday}>Today</button><button type="button" onClick={goNext}>→</button></div>
        </div>

        {interactionNotice && (
          <div className="interactionNotice" role="alert">
            <span>{interactionNotice}</span>
            <button type="button" onClick={dismissInteractionNotice}>Dismiss</button>
          </div>
        )}

        <div className="viewControlBar">
          <div className="viewSwitcher" aria-label="Planner view"><button type="button" className={activeView === "week" ? "active" : ""} onClick={() => setActiveView("week")}>Week</button><button type="button" className={activeView === "month" ? "active" : ""} onClick={() => setActiveView("month")}>Month</button><button type="button" className={activeView === "quarter" ? "active" : ""} disabled={quarterRanges.length === 0} title={quarterRanges.length === 0 ? "Add quarter dates in Setup first" : undefined} onClick={() => setActiveView("quarter")}>Quarter</button></div>
          {activeView !== "week" && <label className="rangeCoursePicker"><span>Class</span><select value={selectedCourseId} onChange={(event) => setActiveCourseId(event.target.value)}>{workspace.courses.map((course) => <option key={course.id} value={course.id}>{course.name}{course.periodLabel ? ` · ${course.periodLabel}` : ""}</option>)}</select></label>}
          {activeView === "quarter" && quarterRanges.length > 1 && <label className="rangeCoursePicker"><span>Quarter</span><select value={Math.min(quarterIndex, quarterRanges.length - 1)} onChange={(event) => setQuarterIndex(Number(event.target.value))}>{quarterRanges.map((quarter, index) => <option value={index} key={quarter.id}>{quarter.label}</option>)}</select></label>}
        </div>

        <div className="plannerStage">
          <button ref={settingsPullRef} type="button" className="edgePullTab settingsPullTab" onClick={openSettings} aria-expanded={settingsOpen}>Settings</button>
          <SettingsDrawer open={settingsOpen} weekendsVisible={workspace.calendar.weekendsVisible} onClose={closeSettings} onToggleWeekends={toggleWeekends} onOpenSetup={onOpenSetup} />

          <section className="calendarDesk canonicalCalendarDesk" aria-label={`${activeView} planning workspace`}>
            {activeView === "week" && <WeekPlanner workspace={workspace} days={days} weekLabel={weekLabel} selectedPlanId={selectedPlanId} pasteTarget={pasteTarget} onSelectPlan={selectPlan} onSelectDate={(courseId, date) => setPasteTarget({ courseId, date, location: "calendar" })} onMovePlan={movePlanToDate} onRenamePlan={renamePlan} onPatchPlan={patchPlan} onAddPlan={(title, type, courseId, date) => addPlan(title, type, courseId, date, "calendar")} onAddChildLesson={addChildLesson} onToggleUnit={toggleUnit} onDeletePlan={deletePlan} onReturnToIdeas={putPlanInFridge} />}
            {activeView === "month" && selectedCourseId && <MonthView workspace={workspace} anchor={monthAnchor} courseId={selectedCourseId} selectedPlanId={selectedPlanId} pasteTargetDate={pasteTarget?.location === "calendar" && pasteTarget.courseId === selectedCourseId ? pasteTarget.date : null} onSelectPlan={selectPlan} onSelectDate={selectRangeDate} onMovePlan={movePlanToDate} onAddPlan={(title, type, date) => addPlan(title, type, selectedCourseId, date, "calendar")} />}
            {activeView === "quarter" && activeQuarter && selectedCourseId && <QuarterView workspace={workspace} range={activeQuarter} courseId={selectedCourseId} selectedPlanId={selectedPlanId} pasteTargetDate={pasteTarget?.location === "calendar" && pasteTarget.courseId === selectedCourseId ? pasteTarget.date : null} onSelectPlan={selectPlan} onSelectDate={selectRangeDate} onMovePlan={movePlanToDate} onAddPlan={(title, type, date) => addPlan(title, type, selectedCourseId, date, "calendar")} />}
          </section>

          <button ref={fridgePullRef} type="button" className="edgePullTab fridgePullTab" onClick={openFridge} aria-expanded={fridgeOpen}>Fridge</button>
          <FridgeDrawer open={fridgeOpen} plans={workspace.plans} courses={workspace.courses} selectedPlanId={selectedPlanId} onClose={closeFridge} onCreate={addFridgeObject} onSelect={selectPlan} onDelete={deletePlan} onMoveToTaskBar={movePlanToTaskTier} onDropObject={putPlanInFridge} onSchedule={movePlanToDate} />
        </div>

        <TaskBar plans={workspace.plans} courses={workspace.courses} onCreate={addTaskObject} onMoveTier={movePlanToTaskTier} onUpdateTask={patchTaskContext} onPutInFridge={putPlanInFridge} onSchedule={movePlanToDate} onSelect={selectPlan} />
      </section>
    </main>
  );
}
