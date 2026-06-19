import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
} from "@/src/trip/workspace/selected-trip-plan";
import type { Trip } from "@/src/trip/types";

interface UseWorkspaceSelectedTripPlanSyncOptions {
  isApiMode: boolean;
  sessionRestored: boolean;
  setSelectedTripPlanId: Dispatch<SetStateAction<string>>;
  trip: Trip;
}

export function useWorkspaceSelectedTripPlanState(initialTrip: Trip) {
  return useState(() => resolveSelectedTripPlanId(initialTrip));
}

export function useWorkspaceSelectedTripPlanSync({
  isApiMode,
  sessionRestored,
  setSelectedTripPlanId,
  trip,
}: UseWorkspaceSelectedTripPlanSyncOptions) {
  useEffect(() => {
    if (!sessionRestored && !isApiMode) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setSelectedTripPlanId((current) => {
        const nextTripPlanId = resolveSelectedTripPlanId(trip, current);
        rememberSelectedTripPlanId(trip, nextTripPlanId);
        return nextTripPlanId;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isApiMode, sessionRestored, setSelectedTripPlanId, trip]);
}
