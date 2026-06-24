import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TripCockpit } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import { useWorkspaceCockpitReplacement } from "./use-workspace-cockpit-replacement";
import type { TripWorkspaceState } from "@/src/trip/workspace/use-trip-workspace-state";

describe("useWorkspaceCockpitReplacement", () => {
  it("normalizes the API cockpit trip and resets workspace side effects", () => {
    const replaceWorkspaceRecords = vi.fn();
    const resetBackendExpenseSummary = vi.fn();
    const setIsCockpitLoaded = vi.fn();
    const setTripState = vi.fn<(state: TripWorkspaceState) => void>();
    const cockpit: TripCockpit = {
      trip: {
        ...seedTrip,
        activePlanVariantId: "plan-rain",
        mainTripPlanId: undefined,
      },
      suggestions: [],
      tasks: [],
      stopNotes: [],
      expenseSummary: null,
    };

    const { result } = renderHook(() =>
      useWorkspaceCockpitReplacement({
        replaceWorkspaceRecords,
        resetBackendExpenseSummary,
        setIsCockpitLoaded,
        setTripState,
      }),
    );

    act(() => result.current(cockpit));

    expect(setTripState).toHaveBeenCalledWith({
      trip: expect.objectContaining({
        activePlanVariantId: "plan-rain",
        mainTripPlanId: "plan-rain",
      }),
      past: [],
      future: [],
    });
    expect(replaceWorkspaceRecords).toHaveBeenCalledWith(cockpit);
    expect(resetBackendExpenseSummary).toHaveBeenCalledTimes(1);
    expect(setIsCockpitLoaded).toHaveBeenCalledWith(true);
  });
});
