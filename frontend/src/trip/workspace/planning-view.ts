import type { Phase } from "./phase";

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
  | "budget"
  | "dreamer"
  | "flexible-hunter"
  | "route-builder"
  | "detail-planner"
  | "group-wrangler"
  | "on-trip-companion";

const PHASE_VIEWS: Set<string> = new Set([
  "dreamer",
  "flexible-hunter",
  "route-builder",
  "detail-planner",
  "group-wrangler",
  "on-trip-companion",
]);

export function planningViewToPhase(view: PlanningView): Phase | null {
  return PHASE_VIEWS.has(view) ? (view as Phase) : null;
}

export function workspaceViewSupportsContextRail(view: PlanningView): boolean {
  return view === "overview" || view === "itinerary" || view === "timeline" || view === "detail-planner";
}

export function workspaceViewShouldSyncBackendExpenseSummary(
  view: PlanningView,
): boolean {
  if (view === "dreamer" || view === "flexible-hunter" || view === "budget") return false;
  return view === "expenses" || workspaceViewSupportsContextRail(view);
}
