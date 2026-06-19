import { describe, expect, it } from "vitest";
import {
  type PlanningView,
  workspaceViewShouldSyncBackendExpenseSummary,
  workspaceViewSupportsContextRail,
} from "./planning-view";

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
];

describe("planning-view helpers", () => {
  it("keeps context rail support scoped to record-oriented views", () => {
    expect(
      allViews.filter((view) => workspaceViewSupportsContextRail(view)),
    ).toEqual(["overview", "itinerary", "timeline"]);
  });

  it("syncs backend expense summaries for expenses and context rail views", () => {
    expect(
      allViews.filter((view) =>
        workspaceViewShouldSyncBackendExpenseSummary(view),
      ),
    ).toEqual(["overview", "itinerary", "timeline", "expenses"]);
  });
});
