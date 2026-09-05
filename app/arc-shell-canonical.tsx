"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Plan, PlanType, PriorityTier, Section, TaskContext, WorkspacePreferences } from "../lib/domain";
import { applyCut, createClipboard, cutBlocker, pasteClipboard, type ArcClipboard, type PasteTarget } from "../lib/clipboard";
import { dateKey, weekDisplayDates } from "../lib/calendar-display";
import { effectiveSections } from "../lib/day-context";
import { applyLiveOutcome, canWriteLiveOutcome, type LiveOutcome } from "../lib/live-classroom";
import { moveObjectToTaskBar, updateTaskContext } from "../lib/object-lifecycle";
import { calendarMoveBlocker, movePlanToCalendarDate } from "../lib/plan-operations";
import { collectPlanTree, deletePlanTree, movePlanTreeToIdeas, orderedUnitChildren, unitUnplaceBlocker } from "../lib/plan-tree";
import { resolvePlannerHome, type CurrentPlannerView } from "../lib/navigation-preferences";
import { resolveArcShortcut } from "../lib/shortcuts";
import { useArcStore } from "../lib/arc-store";
import { availableQuarterRanges } from "../lib/view-ranges";
import { canRedo, canUndo } from "../lib/workspace-history";
import { DayView } from "./day-view";
import { FridgeDrawer } from "./fridge-drawer";
import { LiveClassroom } from "./live-classroom";
import { MonthView } from "./month-view";
import { QuarterView } from "./quarter-view";
import { SettingsDrawer } from "./settings-drawer";
import { TaskBar } from "./task-bar";
import { WeekPlanner } from "./week-planner";

function shiftDate(date: Date, days: number) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function shiftMonth(date: Date, months: number) { const next = new Date(date); next.setDate(1); next.setMonth(next.getMonth() + months); return next; }
function isTypingTarget(target: EventTarget | null) { const element = target as HTMLElement | null; return Boolean(element?.closest("input, textarea, select, [contenteditable='true']")); }
function planList(plans: Array<{ title: string; date: string | null }>) { return plans.map((plan) => plan.date ? `${plan.title} (${plan.date})` : plan.title).join(", "); }

type LiveSession = { planId: string; sectionId: string; date: string };

export function ArcShellCanonical({ buildId, gitSha, onOpenSetup }: { buildId: string; gitSha: string; onOpenSetup: () => void }) {
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

  const [activeView, setActiveView] = useState<CurrentPlannerView>("week");
  const [activeCourseId, setActiveCourseId] = useState("");
  const [dayAnchor, setDayAnchor] = useState(() => new Date());
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [quarterIndex, setQuarterIndex] = useState(0);
  const [clipboard, setClipboard] = useState<ArcClipboard | null>(null);
  const [pasteTarget, setPasteTarget] = useState<PasteTarget | null>(null);
  const [fridgeOpen, setFridgeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [interactionNotice, setInteractionNotice] = useState<string | null>(null);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const fridgePullRef = useRef<HTMLButtonElement | null>(null);
  const settingsPullRef = useRef<HTMLButtonElement | null>(null);
  const noticeReturnRef = useRef<HTMLElement | null>(null);

  const days = useMemo(() => weekDisplayDates(weekAnchor, workspace.calendar.weekendsVisible), [weekAnchor, workspace.calendar.weekendsVisible]);
  const dayKey = dateKey(dayAnchor);
  const weekLabel = days.length ? `${days[0].month} ${days[0].number} – ${days[days.length - 1].month} ${days[days.length - 1].number}` : "Week";
  const quarterRanges = useMemo(() => availableQuarterRanges(workspace.calendar), [workspace.calendar]);
  const activeQuarter = quarterRanges[Math.min(quarterIndex, Math.max(0, quarterRanges.length - 1))] ?? null;
  const selectedCourseId = activeCourseId || workspace.courses[0]?.id || "";
  const saveLabel = lastSavedAt ? `Saved here · ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Not saved yet";
  const livePlan = liveSession ? workspace.plans.find((plan) => plan.id === liveSession.planId) ?? null : null;
  const liveSection = liveSession ? effectiveSections(workspace).find((section) => section.id === liveSession.sectionId) ?? null : null;

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!ready) return;
    if (!activeCourseId && workspace.courses[0]) setActiveCourseId(workspace.courses[0].id);
    setActiveView(resolvePlannerHome(workspace.preferences, quarterRanges.length > 0));
  }, [ready]);

  function showNotice(message: string) {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) noticeReturnRef.current = document.activeElement;
    setInteractionNotice(message);
  }
  function dismissNotice() { setInteractionNotice(null); window.requestAnimationFrame(() => noticeReturnRef.current?.focus()); }
  function persistView(view: CurrentPlannerView) {
    setActiveView(view);
    updateWorkspace((current) => ({ ...current, preferences: { ...current.preferences, lastUsedView: view } }));
  }
  function setLandingView(view: WorkspacePreferences["landingView"]) {
    updateWorkspace((current) => ({ ...current, preferences: { ...current.preferences, landingView: view } }));
  }
  function goHome() { persistView(resolvePlannerHome(workspace.preferences, quarterRanges.length > 0)); }

  function makePlan(title: string, type: PlanType, courseId: string | null, date: string | null, location: "calendar" | "ideas", sectionId: string | null = null, details: Record<string, string> = {}, parentUnitId: string | null = null, childOrder: number | null = null): Plan {
    return { id: crypto.randomUUID(), type, title: title.trim(), courseId, sectionId, date, endDate: type === "unit" ? date : null, location, arcLocation: location === "calendar" ? "calendar" : "fridge", taskContext: null, sectionDelivery: {}, parentUnitId, childOrder, fixedDate: false, continuationOfId: null, notes: "", resources: [], details };
  }
  function addPlan(title: string, type: PlanType, courseId: string | null, date: string | null, location: "calendar" | "ideas", sectionId: string | null = null, details: Record<string, string> = {}) {
    if (!title.trim()) return;
    const plan = makePlan(title, type, courseId, date, location, sectionId, details);
    updateWorkspace((current) => ({ ...current, plans: [...current.plans, plan] }));
    selectObject(plan.id);
  }
  function addChildLesson(unit: Plan, title: string) {
    if (!title.trim()) return;
    const existing = orderedUnitChildren(workspace.plans, unit.id);
    const lesson = makePlan(title, "lesson", unit.courseId, unit.date, unit.location, unit.sectionId ?? null, {}, unit.id, existing.length);
    lesson.arcLocation = unit.arcLocation ?? (unit.location === "calendar" ? "calendar" : "fridge");
    updateWorkspace((current) => ({ ...current, plans: [...current.plans, lesson] }));
    selectObject(lesson.id);
  }
  function addTaskObject(tier: PriorityTier, title: string) {
    if (!title.trim()) return;
    const plan = moveObjectToTaskBar(makePlan(title, "note", null, null, "ideas"), tier);
    updateWorkspace((current) => ({ ...current, plans: [...current.plans, plan] }));
    selectObject(plan.id);
  }
  function movePlanToDate(id: string, date: string, courseId: string) {
    const blocker = calendarMoveBlocker(workspace.plans, id, date);
    if (blocker) { showNotice(`Arc kept this placement fixed. Move blocked by: ${planList(blocker.fixedPlans)}.`); selectObject(id); return; }
    updateWorkspace((current) => ({ ...current, plans: movePlanToCalendarDate(current.plans, id, date, courseId) }));
    setPasteTarget({ courseId, date, location: "calendar" }); setInteractionNotice(null);
  }
  function renamePlan(id: string, title: string) { if (title.trim()) updateWorkspace((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === id ? { ...plan, title: title.trim() } : plan) })); }
  function patchPlan(id: string, patch: Partial<Plan>) { updateWorkspace((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === id ? { ...plan, ...patch } : plan) })); }
  function deletePlan(id: string) {
    const tree = collectPlanTree(workspace.plans, id); const root = tree.find((plan) => plan.id === id); if (!root) return;
    const blocker = unitUnplaceBlocker(workspace.plans, id); if (blocker) { showNotice(`Arc did not delete “${root.title}.” Scheduled child Lessons still depend on it.`); return; }
    if (!window.confirm(`Delete “${root.title}”? This removes the object rather than putting it in the Fridge.`)) return;
    updateWorkspace((current) => ({ ...current, plans: deletePlanTree(current.plans, id) })); if (selectedPlanId === id) selectObject(null);
  }
  function putInFridge(id: string) {
    const blocker = unitUnplaceBlocker(workspace.plans, id); if (blocker) { showNotice(`Arc kept this Unit on the calendar because scheduled child Lessons still depend on it.`); return; }
    updateWorkspace((current) => ({ ...current, plans: movePlanTreeToIdeas(current.plans, id) })); setPasteTarget({ courseId: null, date: null, location: "ideas" });
  }
  function moveToTask(id: string, tier: PriorityTier) {
    const blocker = unitUnplaceBlocker(workspace.plans, id); if (blocker) { showNotice("Arc did not move this Unit into the Task Bar while child Lessons remain scheduled."); return; }
    updateWorkspace((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === id ? moveObjectToTaskBar(plan, tier) : plan) }));
  }
  function patchTask(id: string, patch: Partial<TaskContext>) { updateWorkspace((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === id ? updateTaskContext(plan, patch) : plan) })); }
  function toggleWeekends() { updateWorkspace((current) => ({ ...current, calendar: { ...current.calendar, weekendsVisible: !current.calendar.weekendsVisible } })); }
  function toggleUnit(unitId: string) { updateWorkspace((current) => { const collapsed = new Set(current.preferences.collapsedUnitIds); collapsed.has(unitId) ? collapsed.delete(unitId) : collapsed.add(unitId); return { ...current, preferences: { ...current.preferences, collapsedUnitIds: [...collapsed] } }; }); }

  function copySelection(mode: "copy" | "cut") {
    if (!selectedPlanId) return;
    if (mode === "cut") { const blocker = cutBlocker(workspace, selectedPlanId); if (blocker) { showNotice("Arc did not Cut this fixed object. Copy remains available."); return; } }
    const next = createClipboard(workspace, selectedPlanId, mode); if (!next) { showNotice("Arc could not safely copy that selection."); return; }
    setClipboard(next); if (mode === "cut") { replaceWorkspace(applyCut(workspace, next)); selectObject(null); }
  }
  function pasteSelection() {
    if (!clipboard || !pasteTarget) return;
    const result = pasteClipboard(workspace, clipboard, pasteTarget); if (!result.pastedRootId) { showNotice("Arc did not Paste because the destination is not safe."); return; }
    replaceWorkspace(result.workspace); selectObject(result.pastedRootId); setClipboard(result.nextClipboard);
  }
  function selectPlan(plan: Plan) { selectObject(plan.id); setPasteTarget({ courseId: plan.courseId, date: plan.date, location: plan.location }); }

  function launchLive(plan: Plan, section: Section) { setLiveSession({ planId: plan.id, sectionId: section.id, date: dayKey }); }
  function writeLiveOutcome(outcome: LiveOutcome) {
    if (!liveSession || !livePlan || !liveSection) return;
    if (!canWriteLiveOutcome(workspace, livePlan.id, liveSection.id, liveSession.date)) { showNotice("Arc stopped this write because the lesson or class context changed. Return to Day and reopen it."); setLiveSession(null); return; }
    updateWorkspace((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === livePlan.id ? applyLiveOutcome(plan, liveSection.id, liveSession.date, outcome) : plan) }));
    setLiveSession(null); persistView("day");
  }

  function goPrevious() { if (activeView === "day") setDayAnchor((d) => shiftDate(d, -1)); if (activeView === "week") setWeekAnchor((d) => shiftDate(d, -7)); if (activeView === "month") setMonthAnchor((d) => shiftMonth(d, -1)); if (activeView === "quarter") setQuarterIndex((i) => Math.max(0, i - 1)); }
  function goNext() { if (activeView === "day") setDayAnchor((d) => shiftDate(d, 1)); if (activeView === "week") setWeekAnchor((d) => shiftDate(d, 7)); if (activeView === "month") setMonthAnchor((d) => shiftMonth(d, 1)); if (activeView === "quarter") setQuarterIndex((i) => Math.min(Math.max(0, quarterRanges.length - 1), i + 1)); }
  function goToday() { const now = new Date(); setDayAnchor(now); setWeekAnchor(now); setMonthAnchor(now); const today = dateKey(now); const q = quarterRanges.findIndex((quarter) => quarter.start <= today && quarter.end >= today); if (q >= 0) setQuarterIndex(q); }
  function closeFridge() { setFridgeOpen(false); window.requestAnimationFrame(() => fridgePullRef.current?.focus()); }
  function closeSettings() { setSettingsOpen(false); window.requestAnimationFrame(() => settingsPullRef.current?.focus()); }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const action = resolveArcShortcut(event); if (!action) return; if (isTypingTarget(event.target) && action !== "escape") return;
      if (action === "escape") { if (interactionNotice) return dismissNotice(); if (liveSession) return setLiveSession(null); if (fridgeOpen) return closeFridge(); if (settingsOpen) return closeSettings(); selectObject(null); return; }
      if (action === "undo") { event.preventDefault(); storeUndo(); return; }
      if (action === "redo") { event.preventDefault(); storeRedo(); return; }
      if (action === "copy") { event.preventDefault(); copySelection("copy"); return; }
      if (action === "cut") { event.preventDefault(); copySelection("cut"); return; }
      if (action === "paste") { event.preventDefault(); pasteSelection(); return; }
      if (action === "delete" && selectedPlanId) { event.preventDefault(); deletePlan(selectedPlanId); }
    }
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!ready) return <main className="loadingShell">Opening Arc…</main>;
  if (liveSession && livePlan && liveSection) return <main className="arcApp"><LiveClassroom plan={livePlan} section={liveSection} date={liveSession.date} onOutcome={writeLiveOutcome} onLeave={() => { setLiveSession(null); persistView("day"); }} /></main>;

  return (
    <main className="arcApp">
      <header className="arcTopbar">
        <button className="arcBrand" type="button" onClick={goHome} aria-label="Arc home"><span className="arcBrandEyebrow">Wax &amp; Wing</span><span className="arcBrandWord">Arc</span></button>
        <div className="arcMeta"><span>{saveLabel}</span><code>{buildId} · {gitSha.slice(0, 7)}</code></div>
      </header>
      <section className="deskPage reconciledDeskPage">
        <div className="deskToolbar"><div><p className="eyebrow">Planning desk</p><h1>{workspace.teacherName ? `${workspace.teacherName}’s ${activeView}` : `Your ${activeView}`}</h1></div><div className="deskActions"><button onClick={storeUndo} disabled={!canUndo(history)}>Undo</button><button onClick={storeRedo} disabled={!canRedo(history)}>Redo</button><button onClick={() => copySelection("copy")} disabled={!selectedPlanId}>Copy</button><button onClick={() => copySelection("cut")} disabled={!selectedPlanId}>Cut</button><button onClick={pasteSelection} disabled={!clipboard || !pasteTarget}>Paste</button><button onClick={goPrevious}>←</button><button className="todayButton" onClick={goToday}>Today</button><button onClick={goNext}>→</button></div></div>
        {interactionNotice && <div className="interactionNotice" role="alert"><span>{interactionNotice}</span><button onClick={dismissNotice}>Dismiss</button></div>}
        <div className="viewControlBar"><div className="viewSwitcher" aria-label="Planner view">{(["day","week","month","quarter"] as CurrentPlannerView[]).map((view) => <button key={view} type="button" className={activeView === view ? "active" : ""} disabled={view === "quarter" && quarterRanges.length === 0} onClick={() => persistView(view)}>{view[0].toUpperCase()+view.slice(1)}</button>)}</div>{activeView !== "day" && activeView !== "week" && <label className="rangeCoursePicker"><span>Class</span><select value={selectedCourseId} onChange={(event) => setActiveCourseId(event.target.value)}>{workspace.courses.map((course) => <option key={course.id} value={course.id}>{course.name} · {course.periodLabel}</option>)}</select></label>}</div>
        <div className="plannerStage">
          <button ref={settingsPullRef} type="button" className="edgePullTab settingsPullTab" onClick={() => { setFridgeOpen(false); setSettingsOpen(true); }} aria-expanded={settingsOpen}>Settings</button>
          <SettingsDrawer open={settingsOpen} weekendsVisible={workspace.calendar.weekendsVisible} landingView={workspace.preferences.landingView} quarterAvailable={quarterRanges.length > 0} onClose={closeSettings} onToggleWeekends={toggleWeekends} onLandingViewChange={setLandingView} onOpenSetup={onOpenSetup} />
          <section className="calendarDesk canonicalCalendarDesk" aria-label={`${activeView} planning workspace`}>
            {activeView === "day" && <DayView workspace={workspace} date={dayKey} selectedPlanId={selectedPlanId} onSelectPlan={selectPlan} onAddPlan={(title,type,courseId,date,sectionId,details) => addPlan(title,type,courseId,date,"calendar",sectionId ?? null,details ?? {})} onLaunchLive={launchLive} />}
            {activeView === "week" && <WeekPlanner workspace={workspace} days={days} weekLabel={weekLabel} selectedPlanId={selectedPlanId} pasteTarget={pasteTarget} onSelectPlan={selectPlan} onSelectDate={(courseId,date)=>setPasteTarget({courseId,date,location:"calendar"})} onMovePlan={movePlanToDate} onRenamePlan={renamePlan} onPatchPlan={patchPlan} onAddPlan={(title,type,courseId,date)=>addPlan(title,type,courseId,date,"calendar")} onAddChildLesson={addChildLesson} onToggleUnit={toggleUnit} onDeletePlan={deletePlan} onReturnToIdeas={putInFridge} />}
            {activeView === "month" && selectedCourseId && <MonthView workspace={workspace} anchor={monthAnchor} courseId={selectedCourseId} selectedPlanId={selectedPlanId} pasteTargetDate={pasteTarget?.location === "calendar" && pasteTarget.courseId === selectedCourseId ? pasteTarget.date : null} onSelectPlan={selectPlan} onSelectDate={(date)=>setPasteTarget({courseId:selectedCourseId,date,location:"calendar"})} onMovePlan={movePlanToDate} onAddPlan={(title,type,date)=>addPlan(title,type,selectedCourseId,date,"calendar")} />}
            {activeView === "quarter" && activeQuarter && selectedCourseId && <QuarterView workspace={workspace} range={activeQuarter} courseId={selectedCourseId} selectedPlanId={selectedPlanId} pasteTargetDate={pasteTarget?.location === "calendar" && pasteTarget.courseId === selectedCourseId ? pasteTarget.date : null} onSelectPlan={selectPlan} onSelectDate={(date)=>setPasteTarget({courseId:selectedCourseId,date,location:"calendar"})} onMovePlan={movePlanToDate} onAddPlan={(title,type,date)=>addPlan(title,type,selectedCourseId,date,"calendar")} />}
          </section>
          <button ref={fridgePullRef} type="button" className="edgePullTab fridgePullTab" onClick={() => { setSettingsOpen(false); setFridgeOpen(true); }} aria-expanded={fridgeOpen}>Fridge</button>
          <FridgeDrawer open={fridgeOpen} plans={workspace.plans} courses={workspace.courses} selectedPlanId={selectedPlanId} onClose={closeFridge} onCreate={(title,type)=>addPlan(title,type,null,null,"ideas")} onSelect={selectPlan} onDelete={deletePlan} onMoveToTaskBar={moveToTask} onDropObject={putInFridge} onSchedule={movePlanToDate} />
        </div>
        <TaskBar plans={workspace.plans} courses={workspace.courses} onCreate={addTaskObject} onMoveTier={moveToTask} onUpdateTask={patchTask} onPutInFridge={putInFridge} onSchedule={movePlanToDate} onSelect={selectPlan} />
      </section>
    </main>
  );
}
