import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useWorkspaceItineraryViewModel } from "./use-workspace-itinerary-view-model";
import {
  buildTripFixtureItineraryItem,
  tripFixture,
} from "@/src/trip/testing/fixtures/trip-fixtures";
import type { ItineraryItem, Trip } from "@/src/trip/types";

function item(id: string, day: string): ItineraryItem {
  return buildTripFixtureItineraryItem({
    id,
    day,
    activity: id,
  });
}

describe("useWorkspaceItineraryViewModel", () => {
  it("builds itinerary views and resolves the selected active item", () => {
    const trip: Trip = { ...tripFixture.trip, startDate: "2026-06-10" };
    const activeItem = item("active-1", "2026-06-11");
    const hiddenPlanItem = item("hidden-1", "2026-06-12");
    const latestTripRef = { current: tripFixture.trip };

    const { result } = renderHook(() =>
      useWorkspaceItineraryViewModel({
        activePlanItems: [activeItem],
        latestTripRef,
        mainPlanItems: [hiddenPlanItem],
        planItems: [hiddenPlanItem],
        selectedItemId: "active-1",
        trip,
      }),
    );

    expect(result.current.selectedItem).toBe(activeItem);
    expect(result.current.selectedDay).toBe("2026-06-11");
    expect(result.current.selectedItemIdForView).toBe("active-1");
    expect(result.current.itineraryView.dayGroups[0]?.day).toBe("2026-06-12");
    expect(result.current.mainItineraryView.dayGroups[0]?.day).toBe("2026-06-12");
    expect(latestTripRef.current).toBe(trip);
  });

  it("falls back to visible plan items and trip start date", () => {
    const trip: Trip = { ...tripFixture.trip, startDate: "2026-06-10" };
    const planItem = item("visible-1", "2026-06-13");
    const latestTripRef = { current: trip };

    const { result } = renderHook(() =>
      useWorkspaceItineraryViewModel({
        activePlanItems: [],
        latestTripRef,
        mainPlanItems: [],
        planItems: [planItem],
        selectedItemId: "missing",
        trip,
      }),
    );

    expect(result.current.selectedItem).toBe(planItem);
    expect(result.current.selectedDay).toBe("2026-06-13");
    expect(result.current.selectedItemIdForView).toBe("visible-1");
  });
});
