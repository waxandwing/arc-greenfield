import type { ArcView, WorkspacePreferences } from "./domain";

export type CurrentPlannerView = "week" | "month" | "quarter";

export function isCurrentPlannerView(view: ArcView): view is CurrentPlannerView {
  return view === "week" || view === "month" || view === "quarter";
}

export function isPlannerViewAvailable(view: CurrentPlannerView, quarterAvailable: boolean): boolean {
  return view !== "quarter" || quarterAvailable;
}

export function resolveCurrentPlannerView(view: ArcView, quarterAvailable: boolean): CurrentPlannerView {
  if (isCurrentPlannerView(view) && isPlannerViewAvailable(view, quarterAvailable)) return view;
  return "week";
}

export function resolvePlannerHome(preferences: WorkspacePreferences, quarterAvailable: boolean): CurrentPlannerView {
  const requested = preferences.landingView === "last-used"
    ? preferences.lastUsedView
    : preferences.landingView;
  return resolveCurrentPlannerView(requested, quarterAvailable);
}

export function currentLandingChoices(quarterAvailable: boolean): Array<{ value: WorkspacePreferences["landingView"]; label: string }> {
  return [
    { value: "last-used", label: "Last used" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    ...(quarterAvailable ? [{ value: "quarter" as const, label: "Quarter" }] : [])
  ];
}
