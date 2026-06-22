import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import type { StopPlaceResolutionState } from "@/src/trip/places";
import type { WorkspaceContextRailPrimaryTab } from "@/src/trip/workspace/context-rail-tabs";
import type { ItineraryItem, Trip } from "@/src/trip/types";
import { buildPromotedFoodRecommendationStop } from "../promote-food-recommendation";
import type { ItineraryDialogState } from "./itinerary/itinerary-dialog-state";

interface UseWorkspaceItineraryUiActionsParams {
  canEdit: boolean;
  createStop: (values: StopFormValues) => Promise<void>;
  dialogState: ItineraryDialogState;
  setContextRailPreferredTab: (tab: WorkspaceContextRailPrimaryTab) => void;
  setContextRailVisibility: (open: boolean) => void;
  setDialogDeleteItem: Dispatch<SetStateAction<ItineraryItem | null>>;
  setDialogState: Dispatch<SetStateAction<ItineraryDialogState>>;
  setSelectedItemId: (itemId: string) => void;
  setStopPlaceResolution: Dispatch<SetStateAction<StopPlaceResolutionState>>;
  trip: Trip;
}

export function useWorkspaceItineraryUiActions({
  canEdit,
  createStop,
  dialogState,
  setContextRailPreferredTab,
  setContextRailVisibility,
  setDialogDeleteItem,
  setDialogState,
  setSelectedItemId,
  setStopPlaceResolution,
  trip,
}: UseWorkspaceItineraryUiActionsParams) {
  const selectItem = useCallback(
    (itemId: string) => {
      setContextRailPreferredTab("notes");
      setSelectedItemId(itemId);
    },
    [setContextRailPreferredTab, setSelectedItemId],
  );

  const openItemDetails = useCallback(
    (itemId: string) => {
      setContextRailPreferredTab("notes");
      setSelectedItemId(itemId);
      setContextRailVisibility(true);
    },
    [setContextRailPreferredTab, setContextRailVisibility, setSelectedItemId],
  );

  const promoteFoodRecommendation = useCallback(
    async (item: ItineraryItem) => {
      if (!canEdit) return;
      const promotedStop = buildPromotedFoodRecommendationStop(item);
      if (!promotedStop) return;
      await createStop(promotedStop);
    },
    [canEdit, createStop],
  );

  const deleteSelectedStop = useCallback(async () => {
    /* v8 ignore next */
    if (dialogState?.mode !== "edit" || !canEdit) return;
    setDialogDeleteItem(dialogState.item);
  }, [canEdit, dialogState, setDialogDeleteItem]);

  const editItem = useCallback(
    (itemId: string) => {
      const item = trip.itineraryItems.find(
        (candidate) => candidate.id === itemId,
      );
      if (item) {
        setStopPlaceResolution({ state: "idle", candidates: [] });
        setDialogState({ mode: "edit", item });
      }
    },
    [setDialogState, setStopPlaceResolution, trip.itineraryItems],
  );

  return {
    deleteSelectedStop,
    editItem,
    openItemDetails,
    promoteFoodRecommendation,
    selectItem,
  };
}
