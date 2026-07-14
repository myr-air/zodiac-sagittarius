import { describe, expect, it } from "vitest";
import {
  planningViewToPhase,
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

  it("returns context rail support for Phase 3 views", () => {
    expect(workspaceViewSupportsContextRail("route-builder")).toBe(false);
    expect(workspaceViewSupportsContextRail("detail-planner")).toBe(true);
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

describe("planningViewToPhase", () => {
  it("maps phase-name views directly to Phase", () => {
    expect(planningViewToPhase("dreamer")).toBe("dreamer");
    expect(planningViewToPhase("flexible-hunter")).toBe("flexible-hunter");
    expect(planningViewToPhase("route-builder")).toBe("route-builder");
    expect(planningViewToPhase("detail-planner")).toBe("detail-planner");
    expect(planningViewToPhase("group-wrangler")).toBe("group-wrangler");
    expect(planningViewToPhase("on-trip-companion")).toBe("on-trip-companion");
  });

  it("returns null for sub-view PlanningViews", () => {
    expect(planningViewToPhase("overview")).toBeNull();
    expect(planningViewToPhase("itinerary")).toBeNull();
    expect(planningViewToPhase("map")).toBeNull();
    expect(planningViewToPhase("timeline")).toBeNull();
    expect(planningViewToPhase("bookings")).toBeNull();
    expect(planningViewToPhase("photos")).toBeNull();
    expect(planningViewToPhase("members")).toBeNull();
    expect(planningViewToPhase("expenses")).toBeNull();
    expect(planningViewToPhase("settings")).toBeNull();
    expect(planningViewToPhase("budget")).toBeNull();
  });
});
