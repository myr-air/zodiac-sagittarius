export type PlanningView =
  | "overview"
  | "itinerary"
  | "map"
  | "timeline"
  | "bookings"
  | "photos"
  | "members"
  | "expenses"
  | "settings";

export function workspaceViewSupportsContextRail(view: PlanningView): boolean {
  return view === "overview" || view === "itinerary" || view === "timeline";
}

export function workspaceViewShouldSyncBackendExpenseSummary(
  view: PlanningView,
): boolean {
  return view === "expenses" || workspaceViewSupportsContextRail(view);
}
