import { renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  useWorkspaceSelectedTripPlanState,
  useWorkspaceSelectedTripPlanSync,
} from "./use-workspace-selected-trip-plan";
import {
  tripWithOnlyMainPlan,
  tripWithPlans,
} from "@/src/trip/workspace/selected-trip-plan.test-fixtures";
import { selectedTripPlanStorageKey } from "@/src/trip/workspace/selected-trip-plan";
import { tripRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { tripFixture } from "@/src/trip/trip-fixtures";

describe("useWorkspaceSelectedTripPlan", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", tripRoutes.itinerary(tripFixture.trip.id));
  });

  it("initializes selected trip plan state from the browser-aware resolver", () => {
    const trip = tripWithPlans();
    window.sessionStorage.setItem(selectedTripPlanStorageKey(trip.id), "plan-rain");

    const { result } = renderHook(() =>
      useWorkspaceSelectedTripPlanState(trip),
    );

    expect(result.current[0]).toBe("plan-rain");
  });

  it("syncs restored sessions to an available plan and remembers the resolved id", async () => {
    const trip = tripWithOnlyMainPlan();
    const { result } = renderHook(() => {
      const [selectedTripPlanId, setSelectedTripPlanId] = useState("plan-rain");
      useWorkspaceSelectedTripPlanSync({
        isApiMode: false,
        sessionRestored: true,
        setSelectedTripPlanId,
        trip,
      });
      return selectedTripPlanId;
    });

    await waitFor(() => expect(result.current).toBe("plan-main"));
    expect(window.sessionStorage.getItem(selectedTripPlanStorageKey(trip.id))).toBe(
      "plan-main",
    );
  });

  it("does not sync local sessions until a session is restored", async () => {
    const trip = tripWithOnlyMainPlan();
    const { result } = renderHook(() => {
      const [selectedTripPlanId, setSelectedTripPlanId] = useState("plan-rain");
      useWorkspaceSelectedTripPlanSync({
        isApiMode: false,
        sessionRestored: false,
        setSelectedTripPlanId,
        trip,
      });
      return selectedTripPlanId;
    });

    await Promise.resolve();
    expect(result.current).toBe("plan-rain");
    expect(window.sessionStorage.getItem(selectedTripPlanStorageKey(trip.id))).toBeNull();
  });
});
