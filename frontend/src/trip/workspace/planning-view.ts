export type PlanningView =
  | "overview"
  | "itinerary"
  | "map"
  | "timeline"
  | "bookings"
  | "photos"
  | "members"
  | "expenses"
  | "settings"
  | "dreamer"
  | "flexible-hunter"
  | "route-builder"
  | "detail-planner"
  | "group-wrangler"
  | "on-trip-companion";

export function workspaceViewSupportsContextRail(view: PlanningView): boolean {
  return view === "overview" || view === "itinerary" || view === "timeline" || view === "detail-planner";
}

export function workspaceViewShouldSyncBackendExpenseSummary(
  view: PlanningView,
): boolean {
  if (view === "dreamer" || view === "flexible-hunter" || view === "budget") return false;
  return view === "expenses" || workspaceViewSupportsContextRail(view);
}
