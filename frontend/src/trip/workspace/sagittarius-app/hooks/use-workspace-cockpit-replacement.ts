import { useCallback } from "react";
import type { TripCockpit } from "@/src/trip/api-client";
import { normalizeTripPlanAliases } from "@/src/trip/trip-plans";
import type { TripWorkspaceState } from "@/src/trip/workspace/use-trip-workspace-state";

interface UseWorkspaceCockpitReplacementArgs {
  replaceWorkspaceRecords: (cockpit: TripCockpit) => void;
  resetBackendExpenseSummary: () => void;
  setIsCockpitLoaded: (isLoaded: boolean) => void;
  setTripState: (state: TripWorkspaceState) => void;
}

export function useWorkspaceCockpitReplacement({
  replaceWorkspaceRecords,
  resetBackendExpenseSummary,
  setIsCockpitLoaded,
  setTripState,
}: UseWorkspaceCockpitReplacementArgs) {
  return useCallback((cockpit: TripCockpit) => {
    setTripState({
      trip: normalizeTripPlanAliases(cockpit.trip),
      past: [],
      future: [],
    });
    replaceWorkspaceRecords(cockpit);
    resetBackendExpenseSummary();
    setIsCockpitLoaded(true);
  }, [
    replaceWorkspaceRecords,
    resetBackendExpenseSummary,
    setIsCockpitLoaded,
    setTripState,
  ]);
}
