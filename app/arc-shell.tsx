"use client";

import { useEffect, useMemo, useState } from "react";
import {
  emptyWorkspace,
  type ArcView,
  type Plan,
  type PlanLocation,
  type PlanType,
  type PriorityTier,
  type Workspace
} from "../lib/domain";
import { applyCut, createClipboard, pasteClipboard, type ArcClipboard, type PasteTarget } from "../lib/clipboard";
import { applyInstructionalShift, checkpointQuarter, copyLessonNext, extendLesson, previewInstructionalShift, reuseWeek, tackLesson } from "../lib/efficiency-operations";
import { deleteSelection, detachLesson, movePlan, movePlanToCalendarDate, nestLesson } from "../lib/plan-operations";
import { collectPlanTree, orderedUnitChildren } from "../lib/plan-tree";
import { crossOutPriority, deletePriority, linkPriorityToPlan, movePriority, reorderPriority, togglePriorityCircle } from "../lib/priority-operations";
import { resolveArcShortcut } from "../lib/shortcuts";
import { availableQuarterRanges } from "../lib/view-ranges";
import { canRedo, canUndo, commitWorkspace, createWorkspaceHistory, redoWorkspace, undoWorkspace, type WorkspaceHistory } from "../lib/workspace-history";
import { loadWorkspace, saveWorkspace } from "../lib/workspace-store";
import { MonthView } from "./month-view";
import { QuarterView } from "./quarter-view";
import { WeekPlanner } from "./week-planner";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const VIEW_LABELS: Array<{ id: ArcView; label: string }> = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "semester", label: "Semester" },
  { id: "year", label: "Year" }
];
const PRIORITY_TIERS: PriorityTier[] = ["must", "should", "could"];
const YEAR_MARKERS = ["☺", "✂", "♕", "$", "‼", "abc", "🔗", "☆", "⚑"] as const;
type FolderId = "fridge" | "shift" | "more";
type Dragging = { kind: "plan" | "priority"; id: string } | null;

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

function shiftDate(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function shiftMonth(value: Date, months: number) {
  const next = new Date(value);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  return next;
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

function monthKeys(start: string, end: string) {
  const out: string[] = [];
  const cursor = parseDate(`${start.slice(0, 7)}-01`);
  const last = parseDate(`${end.slice(0, 7)}-01`);
  while (cursor <= last && out.length < 14) {
    out.push(dateKey(cursor).slice(0, 7));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

function monthGrid(monthKey: string) {
  const start = parseDate(`${monthKey}-01`);
  const firstDow = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - firstDow);
  return Array.from({ length: 42 }, (_, index) => {
    const date = shiftDate(gridStart, index);
    return { key: dateKey(date), date, inside: date.getMonth() === start.getMonth() };
  });
}

function isTypingTarget(target: EventTarget | null) {
  return Boolean((target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable='true']"));
}

function isInstructional(workspace: Workspace, value: string) {
  const day = parseDate(value).getDay();
  if (day === 0 || day === 6) return false;
  return !workspace.calendar.noSchoolDates.some((item) => item.date === value);
}

function normalizedWorkspace(raw: Workspace): Workspace {
  const defaults = emptyWorkspace();
  return {
    ...defaults,
    ...raw,
    calendar: { ...defaults.calendar, ...raw.calendar },
    preferences: { ...defaults.preferences, ...raw.preferences },
    checkpoints: raw.checkpoints ?? []
  };
}

export function ArcShell({ buildId, gitSha, onOpenSetup }: { buildId: string; gitSha: string; onOpenSetup: () => void }) {
  const [history, setHistory] = useState<WorkspaceHistory>(() => createWorkspaceHistory(emptyWorkspace()));
  const workspace = history.present;
  const [ready, setReady] = useState(false);
  const [activeView, setActiveView] = useState<ArcView>("week");
  const [activeFolder, setActiveFolder] = useState<FolderId | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [dayDate, setDayDate] = useState(() => dateKey(new Date()));
  const [quarterIndex, setQuarterIndex] = useState(0);
  const [activeCourseId, setActiveCourseId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<ArcClipboard | null>(null);
  const [pasteTarget, setPasteTarget] = useState<PasteTarget | null>(null);
  const [saveLabel, setSaveLabel] = useState("Not saved yet");
  const [dragging, setDragging] = useState<Dragging>(null);
  const [trashHot, setTrashHot] = useState(false);
  const [fridgeTitle, setFridgeTitle] = useState("");
  const [fridgeKind, setFridgeKind] = useState<PlanType>("idea");
  const [fridgeCourseId, setFridgeCourseId] = useState("");
  const [priorityDrafts, setPriorityDrafts] = useState<Record<PriorityTier, string>>({ must: "", should: "", could: "" });
  const [resourceDraft, setResourceDraft] = useState({ label: "", url: "" });
  const [childTitle, setChildTitle] = useState("");

  const days = useMemo(() => weekDays(weekAnchor), [weekAnchor]);
  const weekLabel = `${days[0].month} ${days[0].number} – ${days[4].month} ${days[4].number}`;
  const quarterRanges = useMemo(() => availableQuarterRanges(workspace.calendar), [workspace.calendar]);
  const activeQuarter = quarterRanges[Math.min(quarterIndex, Math.max(0, quarterRanges.length - 1))] ?? null;
  const selectedCourseId = activeCourseId || workspace.preferences.courseFilterId || workspace.courses[0]?.id || "";
  const selectedPlan = workspace.plans.find((plan) => plan.id === selectedPlanId) ?? null;
  const focusUnit = selectedPlan?.type === "unit"
    ? selectedPlan
    : selectedPlan?.parentUnitId
      ? workspace.plans.find((plan) => plan.id === selectedPlan.parentUnitId && plan.type === "unit") ?? null
      : null;

  const viewWorkspace = useMemo(() => {
    const courseFilter = workspace.preferences.courseFilterId;
    const contentFilter = workspace.preferences.contentFilter ?? "everything";
    const courses = courseFilter ? workspace.courses.filter((course) => course.id === courseFilter) : workspace.courses;
    let plans = courseFilter ? workspace.plans.filter((plan) => !plan.courseId || plan.courseId === courseFilter) : workspace.plans;
    if (contentFilter === "units") {
      const unitIds = new Set(plans.filter((plan) => plan.type === "unit").map((plan) => plan.id));
      plans = plans.filter((plan) => plan.type === "unit" || Boolean(plan.parentUnitId && unitIds.has(plan.parentUnitId)));
    }
    if (contentFilter === "lessons") {
      const lessons = plans.filter((plan) => plan.type === "lesson");
      const owners = new Set(lessons.map((plan) => plan.parentUnitId).filter(Boolean));
      plans = plans.filter((plan) => plan.type === "lesson" || owners.has(plan.id));
    }
    if (contentFilter === "ideas") plans = plans.filter((plan) => plan.location === "fridge" || plan.location === "ideas" || plan.type === "idea");
    return { ...workspace, courses, plans };
  }, [workspace]);

  const shiftFromDate = pasteTarget?.location === "calendar" && pasteTarget.date ? pasteTarget.date : days[0].key;
  const shiftPreview = useMemo(() => selectedCourseId
    ? previewInstructionalShift(workspace, [selectedCourseId], shiftFromDate)
    : null,
  [workspace, selectedCourseId, shiftFromDate]);

  useEffect(() => {
    const loaded = normalizedWorkspace(loadWorkspace());
    setHistory(createWorkspaceHistory(loaded));
    const home = loaded.preferences.landingView === "last-used" ? loaded.preferences.lastUsedView : loaded.preferences.landingView;
    setActiveView(home || "week");
    setActiveFolder(loaded.preferences.openFolder ?? null);
    if (loaded.courses[0]) {
      setActiveCourseId(loaded.preferences.courseFilterId || loaded.courses[0].id);
      setFridgeCourseId(loaded.courses[0].id);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const state = saveWorkspace(workspace);
      setSaveLabel(`Saved on this device · ${new Date(state.savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [workspace, ready]);

  function updateWorkspace(updater: (current: Workspace) => Workspace) {
    setHistory((currentHistory) => commitWorkspace(currentHistory, { ...updater(currentHistory.present), updatedAt: new Date().toISOString() }));
  }

  function replaceWorkspace(next: Workspace) {
    setHistory((currentHistory) => commitWorkspace(currentHistory, { ...next, updatedAt: new Date().toISOString() }));
  }

  function updatePreferences(patch: Partial<Workspace["preferences"]>) {
    setHistory((current) => ({ ...current, present: { ...current.present, preferences: { ...current.present.preferences, ...patch }, updatedAt: new Date().toISOString() } }));
  }

  function changeView(view: ArcView) {
    setActiveView(view);
    updatePreferences({ lastUsedView: view });
  }

  function homeView() {
    const home = workspace.preferences.landingView === "last-used" ? workspace.preferences.lastUsedView : workspace.preferences.landingView;
    changeView(home || "week");
  }

  function toggleFolder(folder: FolderId) {
    const next = activeFolder === folder ? null : folder;
    setActiveFolder(next);
    updatePreferences({ openFolder: next });
    if (next === "fridge") setPasteTarget({ date: null, courseId: null, location: "fridge" });
  }

  function openFridgeForDrop() {
    if (activeFolder === "fridge") return;
    setActiveFolder("fridge");
    updatePreferences({ openFolder: "fridge" });
    setPasteTarget({ date: null, courseId: null, location: "fridge" });
  }

  function saveNow() {
    const state = saveWorkspace(workspace);
    setSaveLabel(`Saved on this device · ${new Date(state.savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
  }

  function undo() { setHistory((current) => undoWorkspace(current)); setSelectedPlanId(null); }
  function redo() { setHistory((current) => redoWorkspace(current)); setSelectedPlanId(null); }

  function makePlan(title: string, type: PlanType, courseId: string | null, date: string | null, location: PlanLocation, parentUnitId: string | null = null, childOrder: number | null = null): Plan {
    return {
      id: crypto.randomUUID(), type, title: title.trim(), courseId, date,
      endDate: type === "unit" ? date : null, location, parentUnitId, childOrder,
      fixedDate: false, continuationOfId: null, notes: "", resources: [], details: {}
    };
  }

  function addPlan(title: string, type: PlanType, courseId: string | null, date: string | null, location: PlanLocation) {
    if (!title.trim()) return;
    const plan = makePlan(title, type, courseId, date, location);
    updateWorkspace((current) => ({ ...current, plans: [...current.plans, plan] }));
    setSelectedPlanId(plan.id);
  }

  function addChildLesson(unit: Plan, title: string) {
    if (!title.trim()) return;
    const siblings = orderedUnitChildren(workspace.plans, unit.id);
    const lesson = makePlan(title, "lesson", unit.courseId, unit.date, unit.location, unit.id, siblings.length);
    updateWorkspace((current) => ({ ...current, plans: [...current.plans, lesson] }));
    setSelectedPlanId(lesson.id);
  }

  function movePlanToDate(id: string, date: string, courseId: string) {
    updateWorkspace((current) => ({ ...current, plans: movePlanToCalendarDate(current.plans, id, date, courseId) }));
    setPasteTarget({ date, courseId, location: "calendar" });
    setDayDate(date);
  }

  function returnToFridge(id: string) {
    updateWorkspace((current) => {
      const plan = current.plans.find((item) => item.id === id);
      const plans = plan?.parentUnitId ? detachLesson(current.plans, id, { kind: "fridge" }) : movePlan(current.plans, id, { kind: "fridge" });
      return { ...current, plans };
    });
    setPasteTarget({ date: null, courseId: workspace.plans.find((plan) => plan.id === id)?.courseId ?? null, location: "fridge" });
  }

  function renamePlan(id: string, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    updateWorkspace((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === id ? { ...plan, title: trimmed } : plan) }));
  }

  function patchPlan(id: string, patch: Partial<Plan>) {
    updateWorkspace((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === id ? { ...plan, ...patch } : plan) }));
  }

  function deletePlan(id: string) {
    updateWorkspace((current) => {
      const deletedIds = new Set(collectPlanTree(current.plans, id).map((plan) => plan.id));
      return {
        ...current,
        plans: deleteSelection(current.plans, id),
        priorities: current.priorities.map((priority) => priority.linkedPlanId && deletedIds.has(priority.linkedPlanId)
          ? { ...priority, linkedPlanId: null }
          : priority)
      };
    });
    if (selectedPlanId === id) setSelectedPlanId(null);
  }

  function toggleUnit(unitId: string) {
    const collapsed = new Set(workspace.preferences.collapsedUnitIds);
    collapsed.has(unitId) ? collapsed.delete(unitId) : collapsed.add(unitId);
    updatePreferences({ collapsedUnitIds: [...collapsed] });
  }

  function reorderUnitChild(unitId: string, childId: string, direction: -1 | 1) {
    updateWorkspace((current) => {
      const children = orderedUnitChildren(current.plans, unitId);
      const index = children.findIndex((child) => child.id === childId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= children.length) return current;
      [children[index], children[target]] = [children[target], children[index]];
      const order = new Map(children.map((child, childIndex) => [child.id, childIndex]));
      return { ...current, plans: current.plans.map((plan) => order.has(plan.id) ? { ...plan, childOrder: order.get(plan.id)! } : plan) };
    });
  }

  function nestSelectedLesson(unitId: string, lessonId: string) {
    updateWorkspace((current) => ({ ...current, plans: nestLesson(current.plans, lessonId, unitId) }));
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
    if (plan.date) setDayDate(plan.date);
  }

  function selectRangeDate(date: string) {
    if (!selectedCourseId) return;
    setPasteTarget({ courseId: selectedCourseId, date, location: "calendar" });
    setDayDate(date);
  }

  function addFridgeItem() {
    if (!fridgeTitle.trim()) return;
    const needsCourse = fridgeKind === "unit" || fridgeKind === "lesson";
    if (needsCourse && !fridgeCourseId) return;
    addPlan(fridgeTitle, fridgeKind, fridgeCourseId || null, null, "fridge");
    setFridgeTitle("");
  }

  function addPriority(tier: PriorityTier) {
    const title = priorityDrafts[tier].trim();
    if (!title) return;
    updateWorkspace((current) => ({ ...current, priorities: [...current.priorities, { id: crypto.randomUUID(), title, tier, completed: false, circled: false, crossedOutAt: null, linkedPlanId: null, scope: "school" }] }));
    setPriorityDrafts((current) => ({ ...current, [tier]: "" }));
  }

  function linkPlanToTier(planId: string, tier: PriorityTier) {
    const plan = workspace.plans.find((item) => item.id === planId);
    if (!plan) return;
    updateWorkspace((current) => {
      const existing = current.priorities.find((priority) => priority.linkedPlanId === planId);
      if (existing) return movePriority(current, existing.id, tier);
      const priorityId = crypto.randomUUID();
      const withPriority = { ...current, priorities: [...current.priorities, { id: priorityId, title: plan.title, tier, completed: false, circled: false, crossedOutAt: null, linkedPlanId: planId, scope: "school" as const }] };
      return linkPriorityToPlan(withPriority, priorityId, planId);
    });
  }

  function applyShift() {
    if (!selectedCourseId || !shiftPreview || shiftPreview.movableRootIds.length === 0) return;
    updateWorkspace((current) => applyInstructionalShift(
      current,
      previewInstructionalShift(current, [selectedCourseId], shiftFromDate)
    ));
  }

  function runTack(id: string) { updateWorkspace((current) => tackLesson(current, id)); }
  function runExtend(id: string) { const result = extendLesson(workspace, id); if (result.continuationId) { replaceWorkspace(result.workspace); setSelectedPlanId(result.continuationId); } }
  function runCopyNext(id: string) { const result = copyLessonNext(workspace, id); if (result.copyId) { replaceWorkspace(result.workspace); setSelectedPlanId(result.copyId); } }
  function runReuseWeek() { const result = reuseWeek(workspace, days[0].key); if (result.createdIds.length) replaceWorkspace(result.workspace); }
  function runQuarterCheckpoint() { if (activeQuarter) replaceWorkspace(checkpointQuarter(workspace, activeQuarter.id)); }

  function goPrevious() {
    if (activeView === "day") setDayDate(dateKey(shiftDate(parseDate(dayDate), -1)));
    if (activeView === "week") setWeekAnchor((current) => shiftDate(current, -7));
    if (activeView === "month") setMonthAnchor((current) => shiftMonth(current, -1));
    if (activeView === "quarter") setQuarterIndex((current) => Math.max(0, current - 1));
    if (activeView === "semester") setQuarterIndex((current) => Math.max(0, current - 2));
  }

  function goNext() {
    if (activeView === "day") setDayDate(dateKey(shiftDate(parseDate(dayDate), 1)));
    if (activeView === "week") setWeekAnchor((current) => shiftDate(current, 7));
    if (activeView === "month") setMonthAnchor((current) => shiftMonth(current, 1));
    if (activeView === "quarter") setQuarterIndex((current) => Math.min(Math.max(0, quarterRanges.length - 1), current + 1));
    if (activeView === "semester") setQuarterIndex((current) => Math.min(Math.max(0, quarterRanges.length - 1), current + 2));
  }

  function goToday() {
    const now = new Date();
    setDayDate(dateKey(now)); setWeekAnchor(now); setMonthAnchor(now);
    const today = dateKey(now);
    const index = quarterRanges.findIndex((quarter) => quarter.start <= today && quarter.end >= today);
    if (index >= 0) setQuarterIndex(index);
  }

  function onDragStartBubble(event: React.DragEvent) {
    window.setTimeout(() => {
      const planId = event.dataTransfer.getData("text/arc-plan");
      const priorityId = event.dataTransfer.getData("text/arc-priority");
      if (planId) setDragging({ kind: "plan", id: planId });
      else if (priorityId) setDragging({ kind: "priority", id: priorityId });
    }, 0);
  }

  function dropTrash() {
    if (!dragging) return;
    if (dragging.kind === "plan") deletePlan(dragging.id);
    else updateWorkspace((current) => deletePriority(current, dragging.id));
    setDragging(null); setTrashHot(false);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const action = resolveArcShortcut(event);
      if (!action) return;
      if (isTypingTarget(event.target) && action !== "escape" && action !== "save") return;
      if (action === "escape") { setSelectedPlanId(null); return; }
      if (action === "save") { event.preventDefault(); saveNow(); return; }
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

  const fridgeRoots = workspace.plans.filter((plan) => (plan.location === "fridge" || plan.location === "ideas") && !plan.parentUnitId);

  return (
    <main className="arcWorkspace" onDragStart={onDragStartBubble} onDragEnd={() => { setDragging(null); setTrashHot(false); }}>
      <header className="arcWorkspaceHeader">
        <button className="arcLogoHome" type="button" onClick={homeView} aria-label="Arc home"><img src="/arc.png" alt="" /></button>
        <div className="arcWorkspaceTitle"><small>{activeView}</small><strong>{activeView === "week" ? weekLabel : activeView === "month" ? monthAnchor.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : activeView === "day" ? parseDate(dayDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : activeView === "quarter" ? activeQuarter?.label ?? "Quarter" : activeView === "semester" ? "Semester" : "School Year"}</strong><span>{workspace.teacherName || "Your planning desk"}</span></div>
        <div className="arcSaveStatus"><span>{saveLabel}</span><code>{buildId} · {gitSha.slice(0, 7)}</code></div>
      </header>

      <section className="arcStage">
        <nav className="arcToolTabs" aria-label="Planning folders">
          <button type="button" className="fridgeTab" aria-pressed={activeFolder === "fridge"} onDragEnter={() => { if (dragging?.kind === "plan") openFridgeForDrop(); }} onClick={() => toggleFolder("fridge")}>Fridge</button>
          <button type="button" className="shiftTab" aria-pressed={activeFolder === "shift"} onClick={() => toggleFolder("shift")}>Shift</button>
          <button type="button" className="moreTab" aria-pressed={activeFolder === "more"} onClick={() => toggleFolder("more")}>More</button>
        </nav>

        <div className={`arcPlanningFrame${activeFolder ? " folderOpen" : ""}`}>
          <aside className="arcFolder" aria-hidden={!activeFolder} onDragOver={(event) => { if (activeFolder === "fridge") event.preventDefault(); }} onDrop={(event) => { if (activeFolder !== "fridge") return; event.preventDefault(); const id = event.dataTransfer.getData("text/arc-plan"); if (id) returnToFridge(id); }}>
            {activeFolder === "fridge" && <div className="arcFolderInner">
              <div className="arcFolderHead"><h2>Fridge Door</h2><button type="button" onClick={() => toggleFolder("fridge")}>×</button></div>
              <p className="arcFolderIntro">Keep the magnet. Decide where it belongs later.</p>
              <div className="fridgeComposer">
                <div className="fridgeKind">{(["idea", "note", "lesson", "unit"] as PlanType[]).map((kind) => <button type="button" key={kind} className={fridgeKind === kind ? "active" : ""} onClick={() => setFridgeKind(kind)}>{kind}</button>)}</div>
                <input value={fridgeTitle} onChange={(event) => setFridgeTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addFridgeItem(); }} placeholder={`${fridgeKind} title`} />
                <select value={fridgeCourseId} onChange={(event) => setFridgeCourseId(event.target.value)}><option value="">No class</option>{workspace.courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
                <button className="addFridge" type="button" onClick={addFridgeItem}>Add to Fridge</button>
              </div>
              <div className="arcFolderScroll">
                {fridgeRoots.map((plan) => { const course = workspace.courses.find((item) => item.id === plan.courseId); const children = plan.type === "unit" ? orderedUnitChildren(workspace.plans, plan.id) : []; return <div key={plan.id}><button type="button" draggable className="fridgeMagnet" style={{ ["--magnet-color" as string]: course?.color || "#eeb834" }} onDragStart={(event) => { event.dataTransfer.setData("text/arc-plan", plan.id); event.dataTransfer.effectAllowed = "move"; }} onClick={() => selectPlan(plan)}><small>{plan.type}</small><strong>{plan.title}</strong><span>{course?.name ?? "Loose planning"}{plan.type === "unit" ? ` · ${children.length} lessons` : ""}</span></button>{children.length > 0 && <div className="fridgeUnitChildren">{children.map((child) => <button key={child.id} type="button" draggable onDragStart={(event) => { event.dataTransfer.setData("text/arc-plan", child.id); event.dataTransfer.effectAllowed = "move"; }} onClick={() => selectPlan(child)}>{child.title}</button>)}</div>}</div>; })}
                {fridgeRoots.length === 0 && <p className="emptyNote">Nothing on the Fridge yet.</p>}
              </div>
              <div />
            </div>}

            {activeFolder === "shift" && <div className="arcFolderInner">
              <div className="arcFolderHead"><h2>Shift</h2><button type="button" onClick={() => toggleFolder("shift")}>×</button></div>
              <p className="arcFolderIntro">Plans move. Fixed dates do not.</p>
              <div className="arcFolderScroll">
                <label className="rangeCoursePicker"><span>Class</span><select value={selectedCourseId} onChange={(event) => setActiveCourseId(event.target.value)}>{workspace.courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
                <p><strong>From:</strong> {shiftFromDate}</p>
                <p><strong>{shiftPreview?.affectedPlanIds.length ?? 0}</strong> plan object{(shiftPreview?.affectedPlanIds.length ?? 0) === 1 ? "" : "s"} can move one instructional day.</p>
                {(shiftPreview?.blockedRootIds.length ?? 0) > 0 && <p><strong>{shiftPreview?.blockedRootIds.length}</strong> root plan{shiftPreview?.blockedRootIds.length === 1 ? " is" : "s are"} blocked.</p>}
                {shiftPreview && shiftPreview.conflicts.length > 0 && <div className="shiftConflictList" role="status"><strong>Resolve before Shift</strong>{shiftPreview.conflicts.slice(0, 6).map((conflict) => { const plan = workspace.plans.find((item) => item.id === conflict.planId); return <span key={`${conflict.rootId}-${conflict.planId}-${conflict.kind}`}>{plan?.title ?? "Plan"} · {conflict.kind === "fixed-date" ? "fixed date" : `collision on ${conflict.targetDate}`}</span>; })}</div>}
                <button type="button" className="primaryAction" disabled={!shiftPreview || shiftPreview.movableRootIds.length === 0} onClick={applyShift}>Apply safe Shift</button>
              </div><div />
            </div>}

            {activeFolder === "more" && <div className="arcFolderInner">
              <div className="arcFolderHead"><h2>More</h2><button type="button" onClick={() => toggleFolder("more")}>×</button></div>
              <p className="arcFolderIntro">Preferences and deliberate planning tools.</p>
              <div className="arcFolderScroll">
                <button type="button" className="secondary" onClick={onOpenSetup}>School + classes setup</button>
                <label className="rangeCoursePicker"><span>Home view</span><select value={workspace.preferences.landingView} onChange={(event) => updatePreferences({ landingView: event.target.value as ArcView | "last-used" })}><option value="last-used">Last used</option>{VIEW_LABELS.map((view) => <option value={view.id} key={view.id}>{view.label}</option>)}</select></label>
                <label><input type="checkbox" checked={workspace.preferences.lapsedDayXsVisible !== false} onChange={(event) => updatePreferences({ lapsedDayXsVisible: event.target.checked })} /> Yellow X on elapsed school days</label>
                <button type="button" className="secondary" onClick={runReuseWeek}>Reuse this week → next week</button>
                {activeQuarter && <button type="button" className="secondary" onClick={runQuarterCheckpoint}>Checkpoint {activeQuarter.label}</button>}
                <p className="emptyNote">Sub Plans and Student Leaders remain intentionally outside the first beta gate.</p>
              </div><div />
            </div>}
          </aside>

          <section className="arcCalendarShell">
            <div className="arcCalendarToolbar">
              <div className="arcCalendarToolbarLeft">
                <div className="arcFilters">
                  <select aria-label="Class filter" value={workspace.preferences.courseFilterId ?? ""} onChange={(event) => { const value = event.target.value || null; updatePreferences({ courseFilterId: value }); if (value) setActiveCourseId(value); }}><option value="">All classes</option>{workspace.courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
                  <select aria-label="Content filter" value={workspace.preferences.contentFilter ?? "everything"} onChange={(event) => updatePreferences({ contentFilter: event.target.value as Workspace["preferences"]["contentFilter"] })}><option value="everything">Everything</option><option value="units">Units</option><option value="lessons">Lessons</option><option value="ideas">Fridge</option></select>
                </div>
              </div>
              <div className="arcCalendarToolbarRight">
                <button type="button" onClick={undo} disabled={!canUndo(history)}>Undo</button><button type="button" onClick={redo} disabled={!canRedo(history)}>Redo</button>
                <button type="button" onClick={() => copySelection("copy")} disabled={!selectedPlanId}>Copy</button><button type="button" onClick={() => copySelection("cut")} disabled={!selectedPlanId}>Cut</button><button type="button" onClick={pasteSelection} disabled={!clipboard || !pasteTarget}>Paste</button>
                <button type="button" onClick={goPrevious}>←</button><button type="button" onClick={goToday}>Today</button><button type="button" onClick={goNext}>→</button>
                {VIEW_LABELS.map((view) => <button type="button" key={view.id} className={activeView === view.id ? "active" : ""} disabled={(view.id === "quarter" || view.id === "semester" || view.id === "year") && quarterRanges.length === 0} onClick={() => changeView(view.id)}>{view.label}</button>)}
                <button type="button" className="primaryTool" onClick={saveNow}>Save now</button>
              </div>
            </div>

            <div className="arcCalendarViewport">
              {activeView === "week" && <WeekPlanner workspace={viewWorkspace} days={days} weekLabel={weekLabel} selectedPlanId={selectedPlanId} pasteTarget={pasteTarget?.location === "calendar" ? { ...pasteTarget, location: "calendar" } : null} onSelectPlan={selectPlan} onSelectDate={(courseId, date) => { setPasteTarget({ courseId, date, location: "calendar" }); setDayDate(date); }} onMovePlan={movePlanToDate} onRenamePlan={renamePlan} onAddPlan={(title, type, courseId, date) => addPlan(title, type, courseId, date, "calendar")} onAddChildLesson={addChildLesson} onToggleUnit={toggleUnit} onDeletePlan={deletePlan} onReturnToIdeas={returnToFridge} onNestLesson={nestSelectedLesson} />}
              {activeView === "month" && selectedCourseId && <MonthView workspace={viewWorkspace} anchor={monthAnchor} courseId={selectedCourseId} selectedPlanId={selectedPlanId} pasteTargetDate={pasteTarget?.location === "calendar" && pasteTarget.courseId === selectedCourseId ? pasteTarget.date : null} onSelectPlan={selectPlan} onSelectDate={selectRangeDate} onMovePlan={movePlanToDate} onAddPlan={(title, type, date) => addPlan(title, type, selectedCourseId, date, "calendar")} onNestLesson={nestSelectedLesson} />}
              {activeView === "quarter" && activeQuarter && selectedCourseId && <QuarterView workspace={viewWorkspace} range={activeQuarter} courseId={selectedCourseId} selectedPlanId={selectedPlanId} pasteTargetDate={pasteTarget?.location === "calendar" && pasteTarget.courseId === selectedCourseId ? pasteTarget.date : null} onSelectPlan={selectPlan} onSelectDate={selectRangeDate} onMovePlan={movePlanToDate} onAddPlan={(title, type, date) => addPlan(title, type, selectedCourseId, date, "calendar")} onNestLesson={nestSelectedLesson} />}
              {activeView === "day" && <DayView workspace={viewWorkspace} date={dayDate} onSelectPlan={selectPlan} />}
              {activeView === "semester" && <SemesterView workspace={viewWorkspace} quarterRanges={quarterRanges} quarterIndex={quarterIndex} onSelectPlan={selectPlan} />}
              {activeView === "year" && <YearView workspace={viewWorkspace} onSelectPlan={selectPlan} onSelectDate={(date) => { setDayDate(date); setPasteTarget({ date, courseId: selectedCourseId || null, location: "calendar" }); }} onAddMarker={(symbol) => updateWorkspace((current) => ({ ...current, yearMarkers: [...current.yearMarkers, { id: crypto.randomUUID(), symbol, date: dayDate, courseId: selectedCourseId || null, note: "" }] }))} />}
            </div>

            <section className="arcPriority" aria-label="Must Should Could">
              <div className="arcPriorityHeader">
                <button type="button" className="must" onClick={() => updatePreferences({ prioritiesExpanded: true })}>Must</button>
                <button type="button" className="should" onClick={() => updatePreferences({ prioritiesExpanded: true })}>Should</button>
                <button type="button" className="could" onClick={() => updatePreferences({ prioritiesExpanded: true })}>Could</button>
                <button type="button" className="priorityToggle" aria-expanded={workspace.preferences.prioritiesExpanded ?? false} onClick={() => updatePreferences({ prioritiesExpanded: !workspace.preferences.prioritiesExpanded })}>{workspace.preferences.prioritiesExpanded ? "⌄" : "⌃"}</button>
              </div>
              <div className="arcPriorityBody" hidden={!workspace.preferences.prioritiesExpanded}>
                {PRIORITY_TIERS.map((tier) => <div key={tier} className="priorityLane priorityDropTarget" onDragOver={(event) => { event.preventDefault(); event.currentTarget.classList.add("dragOver"); }} onDragLeave={(event) => event.currentTarget.classList.remove("dragOver")} onDrop={(event) => { event.preventDefault(); event.currentTarget.classList.remove("dragOver"); const priorityId = event.dataTransfer.getData("text/arc-priority"); const planId = event.dataTransfer.getData("text/arc-plan"); if (priorityId) updateWorkspace((current) => movePriority(current, priorityId, tier)); else if (planId) linkPlanToTier(planId, tier); }}>
                  {workspace.priorities.filter((priority) => priority.tier === tier).map((priority) => <div key={priority.id} className={`priorityCard${priority.completed ? " completed" : ""}${priority.circled ? " circled" : ""}`} draggable onDragStart={(event) => { event.dataTransfer.setData("text/arc-priority", priority.id); event.dataTransfer.effectAllowed = "move"; }}>
                    <button type="button" className="priorityCircle" aria-label={priority.circled ? "Remove red circle" : "Red circle this task"} onClick={() => updateWorkspace((current) => togglePriorityCircle(current, priority.id))}>{priority.circled ? "○" : ""}</button>
                    <button type="button" className="priorityText" title={priority.completed ? "Restore task" : "Cross out task"} onClick={() => updateWorkspace((current) => crossOutPriority(current, priority.id))}>{priority.title}</button>
                    {priority.completed ? <button type="button" className="priorityDelete" aria-label="Delete crossed-out task" onClick={() => updateWorkspace((current) => deletePriority(current, priority.id))}>−</button> : <span />}
                  </div>)}
                  <div className="priorityAdd"><input value={priorityDrafts[tier]} onChange={(event) => setPriorityDrafts((current) => ({ ...current, [tier]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") addPriority(tier); }} placeholder={`Add to ${tier}`} /><button type="button" onClick={() => addPriority(tier)}>＋</button></div>
                </div>)}
              </div>
            </section>

            {selectedPlan && <MagnetEditor plan={selectedPlan} unit={focusUnit} workspace={workspace} childTitle={childTitle} setChildTitle={setChildTitle} resourceDraft={resourceDraft} setResourceDraft={setResourceDraft} onClose={() => setSelectedPlanId(null)} onRename={renamePlan} onPatch={patchPlan} onMoveDate={movePlanToDate} onSelectChild={(id) => setSelectedPlanId(id)} onTack={runTack} onExtend={runExtend} onCopyNext={runCopyNext} onFridge={returnToFridge} onDelete={deletePlan} onAddChild={addChildLesson} onReorderChild={reorderUnitChild} onDetachChild={(id) => updateWorkspace((current) => ({ ...current, plans: detachLesson(current.plans, id, { kind: "fridge" }) }))} />}
          </section>
        </div>

        {dragging && <div className={`arcTrash${trashHot ? " hot" : ""}`} onDragOver={(event) => { event.preventDefault(); setTrashHot(true); }} onDragLeave={() => setTrashHot(false)} onDrop={(event) => { event.preventDefault(); dropTrash(); }}>Trash · Undo available</div>}
      </section>
    </main>
  );
}

function MagnetEditor({ plan, unit, workspace, childTitle, setChildTitle, resourceDraft, setResourceDraft, onClose, onRename, onPatch, onMoveDate, onSelectChild, onTack, onExtend, onCopyNext, onFridge, onDelete, onAddChild, onReorderChild, onDetachChild }: {
  plan: Plan; unit: Plan | null; workspace: Workspace; childTitle: string; setChildTitle: (value: string) => void;
  resourceDraft: { label: string; url: string }; setResourceDraft: (value: { label: string; url: string }) => void;
  onClose: () => void; onRename: (id: string, title: string) => void; onPatch: (id: string, patch: Partial<Plan>) => void;
  onMoveDate: (id: string, date: string, courseId: string) => void; onSelectChild: (id: string) => void;
  onTack: (id: string) => void; onExtend: (id: string) => void; onCopyNext: (id: string) => void; onFridge: (id: string) => void; onDelete: (id: string) => void;
  onAddChild: (unit: Plan, title: string) => void; onReorderChild: (unitId: string, childId: string, direction: -1 | 1) => void; onDetachChild: (id: string) => void;
}) {
  const focus = unit ?? plan;
  const children = focus.type === "unit" ? orderedUnitChildren(workspace.plans, focus.id) : [];
  return <aside className="arcMagnetEditor" aria-label={focus.type === "unit" ? "Unit Focus" : "Magnet details"}>
    <header><h3>{focus.type === "unit" ? "Unit Focus" : "Magnet details"}</h3><button type="button" onClick={onClose}>×</button></header>
    <div className="editorBody">
      <label>Title<input defaultValue={plan.title} key={plan.id + plan.title} onBlur={(event) => onRename(plan.id, event.target.value)} /></label>
      <label>Notes<textarea defaultValue={plan.notes} key={plan.id + plan.notes} rows={3} onBlur={(event) => onPatch(plan.id, { notes: event.target.value })} /></label>
      {plan.type !== "idea" && <label><span><input type="checkbox" checked={plan.fixedDate} onChange={(event) => onPatch(plan.id, { fixedDate: event.target.checked })} /> Fixed date</span></label>}
      {plan.courseId && <label>Move / schedule<input type="date" value={plan.date ?? ""} onChange={(event) => { if (event.target.value && plan.courseId) onMoveDate(plan.id, event.target.value, plan.courseId); }} /></label>}
      {plan.type === "lesson" && <div className="editorQuickActions"><button type="button" disabled={plan.fixedDate || !plan.date} onClick={() => onTack(plan.id)}>Tack →</button><button type="button" disabled={!plan.date} onClick={() => onExtend(plan.id)}>Extend +1 day</button><button type="button" disabled={!plan.date} onClick={() => onCopyNext(plan.id)}>Copy → next</button></div>}
      <div className="editorQuickActions"><button type="button" onClick={() => onFridge(plan.id)}>Return to Fridge</button><button type="button" onClick={() => onDelete(plan.id)}>Delete</button></div>
      <div className="editorUnitList"><strong>Resources</strong>{plan.resources.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer">{resource.label}</a>)}<div className="priorityAdd"><input value={resourceDraft.label} onChange={(event) => setResourceDraft({ ...resourceDraft, label: event.target.value })} placeholder="Label" /><input value={resourceDraft.url} onChange={(event) => setResourceDraft({ ...resourceDraft, url: event.target.value })} placeholder="https://" /><button type="button" onClick={() => { if (!resourceDraft.label.trim() || !resourceDraft.url.trim()) return; onPatch(plan.id, { resources: [...plan.resources, { id: crypto.randomUUID(), label: resourceDraft.label.trim(), url: resourceDraft.url.trim() }] }); setResourceDraft({ label: "", url: "" }); }}>＋</button></div></div>
      {focus.type === "unit" && <div className="editorUnitList"><strong>Lesson sequence</strong>{children.map((child, index) => <div className="editorUnitChild" key={child.id}><button type="button" onClick={() => onSelectChild(child.id)}>{index + 1}. {child.title}</button><div><button type="button" disabled={index === 0} onClick={() => onReorderChild(focus.id, child.id, -1)}>↑</button><button type="button" disabled={index === children.length - 1} onClick={() => onReorderChild(focus.id, child.id, 1)}>↓</button><button type="button" onClick={() => onDetachChild(child.id)}>Fridge</button></div></div>)}<div className="priorityAdd"><input value={childTitle} onChange={(event) => setChildTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && childTitle.trim()) { onAddChild(focus, childTitle); setChildTitle(""); } }} placeholder="Add lesson" /><button type="button" onClick={() => { if (!childTitle.trim()) return; onAddChild(focus, childTitle); setChildTitle(""); }}>＋</button></div></div>}
    </div>
  </aside>;
}

function DayView({ workspace, date, onSelectPlan }: { workspace: Workspace; date: string; onSelectPlan: (plan: Plan) => void }) {
  const noSchool = workspace.calendar.noSchoolDates.find((item) => item.date === date);
  return <section className="arcDayView"><h2>{parseDate(date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2>{noSchool && <p>{noSchool.label || "No school"} · planning remains available.</p>}{workspace.courses.map((course) => { const plans = workspace.plans.filter((plan) => plan.location === "calendar" && plan.courseId === course.id && (plan.date === date || (plan.type === "unit" && plan.date && plan.date <= date && (plan.endDate ?? plan.date) >= date))); return <section className="dayCourse" style={{ ["--course-color" as string]: course.color }} key={course.id}><h3>{course.name} {course.periodLabel}</h3>{plans.map((plan) => <button type="button" className="dayPlan" key={plan.id} onClick={() => onSelectPlan(plan)}>{plan.type} · {plan.title}</button>)}{plans.length === 0 && <span className="emptyNote">Nothing planned.</span>}</section>; })}</section>;
}

function SemesterView({ workspace, quarterRanges, quarterIndex, onSelectPlan }: { workspace: Workspace; quarterRanges: ReturnType<typeof availableQuarterRanges>; quarterIndex: number; onSelectPlan: (plan: Plan) => void }) {
  if (!quarterRanges.length) return <section className="arcSemesterView"><h2>Semester</h2><p>Add real quarter dates in Setup first.</p></section>;
  const startIndex = quarterIndex >= 2 ? 2 : 0;
  const ranges = quarterRanges.slice(startIndex, startIndex + 2);
  const start = ranges[0]?.start; const end = ranges[ranges.length - 1]?.end;
  const units = workspace.plans.filter((plan) => plan.type === "unit" && plan.location === "calendar" && plan.date && start && end && plan.date <= end && (plan.endDate ?? plan.date) >= start);
  return <section className="arcSemesterView"><h2>{startIndex === 0 ? "Semester 1" : "Semester 2"}</h2><div className="semesterTracks">{units.map((unit) => { const course = workspace.courses.find((item) => item.id === unit.courseId); return <div className="semesterUnit" key={unit.id}><span>{course?.name}</span><button type="button" style={{ ["--course-color" as string]: course?.color || "#eeb834" }} onClick={() => onSelectPlan(unit)}>{unit.title}</button></div>; })}</div></section>;
}

function YearView({ workspace, onSelectPlan, onSelectDate, onAddMarker }: { workspace: Workspace; onSelectPlan: (plan: Plan) => void; onSelectDate: (date: string) => void; onAddMarker: (symbol: typeof YEAR_MARKERS[number]) => void }) {
  const ranges = availableQuarterRanges(workspace.calendar);
  if (!ranges.length || !workspace.calendar.firstStudentDay || !workspace.calendar.lastStudentDay) return <section className="arcYearView"><h2>Year Map</h2><p>Add the real school-year and quarter dates in Setup first.</p></section>;
  const today = dateKey(new Date());
  return <section className="arcYearView"><h2>Year Map</h2><div className="yearMarkerRow" aria-label="Year markers">{YEAR_MARKERS.map((symbol) => <button type="button" key={symbol} onClick={() => onAddMarker(symbol)}>{symbol}</button>)}</div><div className="yearQuarters">{ranges.slice(0, 4).map((range, index) => <section className={`yearQuarter q${index + 1}`} key={range.id}><header>{range.label} · {range.start.slice(5)}–{range.end.slice(5)}</header><div className="yearMiniMonths">{monthKeys(range.start, range.end).map((monthKey) => <div className="yearMiniMonth" key={monthKey}><h4>{parseDate(`${monthKey}-01`).toLocaleDateString(undefined, { month: "long" })}</h4><div className="yearMiniGrid">{monthGrid(monthKey).map((day) => { const noSchool = workspace.calendar.noSchoolDates.some((item) => item.date === day.key); const passed = day.inside && day.key < today && isInstructional(workspace, day.key) && workspace.preferences.lapsedDayXsVisible !== false; const marker = workspace.yearMarkers.find((item) => item.date === day.key); return <button type="button" key={day.key} className={`yearMiniDay${day.inside ? "" : " outside"}${noSchool ? " noSchool" : ""}${passed ? " pastInstructional" : ""}`} onClick={() => onSelectDate(day.key)} title={marker ? `${day.key} · ${marker.symbol} ${marker.note}` : day.key}>{marker?.symbol ?? day.date.getDate()}</button>; })}</div></div>)}</div></section>)}</div><div className="semesterTracks">{workspace.plans.filter((plan) => plan.type === "unit" && plan.location === "calendar").map((unit) => { const course = workspace.courses.find((item) => item.id === unit.courseId); return <div className="semesterUnit" key={unit.id}><span>{course?.name}</span><button type="button" style={{ ["--course-color" as string]: course?.color || "#eeb834" }} onClick={() => onSelectPlan(unit)}>{unit.title}</button></div>; })}</div></section>;
}
