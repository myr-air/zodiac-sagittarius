import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { InlineItineraryItemPatch } from "@/src/trip/itinerary-items";
import type { StopPlaceResolutionState } from "@/src/trip/places";
import type { Trip } from "@/src/trip/types";
import type { ItineraryDialogState } from "./itinerary-dialog-state";

interface UseWorkspaceItineraryAddCommandsParams {
  canEdit: boolean;
  setContextRailVisibility: (open: boolean) => void;
  setDialogState: Dispatch<SetStateAction<ItineraryDialogState>>;
  setStopPlaceResolution: Dispatch<SetStateAction<StopPlaceResolutionState>>;
  setTripPlanError: (message: string | null) => void;
  trip: Trip;
  tripPlanErrorMessage: string;
  updateItineraryItemInline: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => Promise<void>;
}

export function useWorkspaceItineraryAddCommands({
  canEdit,
  setContextRailVisibility,
  setDialogState,
  setStopPlaceResolution,
  setTripPlanError,
  trip,
  tripPlanErrorMessage,
  updateItineraryItemInline,
}: UseWorkspaceItineraryAddCommandsParams) {
  const addStop = useCallback(
    (day?: string, parentItemId?: string | null) => {
      if (!canEdit) return;
      setStopPlaceResolution({ state: "idle", candidates: [] });
      setContextRailVisibility(false);
      setDialogState({ mode: "create", day, parentItemId: parentItemId ?? null });
    },
    [canEdit, setContextRailVisibility, setDialogState, setStopPlaceResolution],
  );

  const addSubActivity = useCallback(
    async (parentItemId: string) => {
      const parentItem = trip.itineraryItems.find((item) => item.id === parentItemId);
      if (!parentItem) return;
      if (!parentItem.isPlanBlock) {
        try {
          setTripPlanError(null);
          await updateItineraryItemInline(parentItem.id, { isPlanBlock: true });
        } catch {
          setTripPlanError(tripPlanErrorMessage);
          return;
        }
      }
      addStop(parentItem.day, parentItem.id);
    },
    [
      addStop,
      setTripPlanError,
      trip,
      tripPlanErrorMessage,
      updateItineraryItemInline,
    ],
  );

  return {
    addStop,
    addSubActivity,
  };
}
