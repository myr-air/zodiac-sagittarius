import { describe, expect, it } from "vitest";
import {
  type PlanningView,
  workspaceViewShouldSyncBackendExpenseSummary,
  workspaceViewSupportsContextRail,
} from "../planning-view";

const allViews: PlanningView[] = [
  "overview",
  "itinerary",
  "map",
  "timeline",
  "bookings",
  "photos",
  "members",
  "expenses",
  "settings",
  "budget",
  "dreamer",
  "flexible-hunter",
  "route-builder",
  "detail-planner",
  "group-wrangler",
  "on-trip-companion",
];

describe("planning-view helpers", () => {
  it("keeps context rail support scoped to record-oriented views", () => {
    expect(
      allViews.filter((view) => workspaceViewSupportsContextRail(view)),
    ).toEqual(["overview", "itinerary", "timeline", "detail-planner"]);
  });

  it("syncs backend expense summaries for expenses and context rail views", () => {
    expect(
      allViews.filter((view) =>
        workspaceViewShouldSyncBackendExpenseSummary(view),
      ),
    ).toEqual(["overview", "itinerary", "timeline", "expenses", "detail-planner"]);
  });

  it("phase-specific identifiers are valid PlanningView values", () => {
    const phaseViews: PlanningView[] = [
      "dreamer", "flexible-hunter", "route-builder",
      "detail-planner", "group-wrangler", "on-trip-companion",
    ];
    for (const view of phaseViews) {
      expect(allViews).toContain(view);
    }
  });

  it("phase views do not sync backend expense summaries (except detail-planner)", () => {
    expect(workspaceViewShouldSyncBackendExpenseSummary("dreamer")).toBe(false);
    expect(workspaceViewShouldSyncBackendExpenseSummary("flexible-hunter")).toBe(false);
    expect(workspaceViewShouldSyncBackendExpenseSummary("budget")).toBe(false);
    expect(workspaceViewShouldSyncBackendExpenseSummary("route-builder")).toBe(false);
    expect(workspaceViewShouldSyncBackendExpenseSummary("detail-planner")).toBe(true);
    expect(workspaceViewShouldSyncBackendExpenseSummary("group-wrangler")).toBe(false);
    expect(workspaceViewShouldSyncBackendExpenseSummary("on-trip-companion")).toBe(false);
  });
});
