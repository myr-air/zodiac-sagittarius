import { StopDialog } from "@/src/features/itinerary/components";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import {
  deriveManualActivityPathOptions,
  type ManualActivityPathOption,
} from "@/src/trip/itinerary-paths";
import type { ItineraryItem, Trip } from "@/src/trip/types";
import {
  placeAutocompleteSuggestions,
  type StopPlaceResolutionState,
} from "@/src/trip/places";
import type { ItineraryDialogState } from "./hooks/itinerary/itinerary-dialog-state";

export interface WorkspaceStopDialogProps {
  createStop: (values: StopFormValues) => void | Promise<void>;
  deleteSelectedStop: () => void | Promise<void>;
  dialogState: ItineraryDialogState;
  promoteFoodRecommendation: (item: ItineraryItem) => void | Promise<void>;
  selectedDay: string;
  setDialogState: (state: ItineraryDialogState) => void;
  setStopPlaceResolution: (state: StopPlaceResolutionState) => void;
  stopPlaceResolution: StopPlaceResolutionState;
  trip: Trip;
  updateSelectedStop: (values: StopFormValues) => void | Promise<void>;
}

export function WorkspaceStopDialog({
  createStop,
  deleteSelectedStop,
  dialogState,
  promoteFoodRecommendation,
  selectedDay,
  setDialogState,
  setStopPlaceResolution,
  stopPlaceResolution,
  trip,
  updateSelectedStop,
}: WorkspaceStopDialogProps) {
  if (!dialogState) return null;

  const parentItemActivity =
    dialogState.mode === "create" && dialogState.parentItemId
      ? trip.itineraryItems.find((item) => item.id === dialogState.parentItemId)?.activity
      : undefined;

  return (
    <StopDialog
      key={
        dialogState.mode === "edit"
          ? `edit-${dialogState.item.id}`
          : `create-stop-${dialogState.createSequence ?? 0}`
      }
      mode={dialogState.mode}
      startDate={trip.startDate}
      endDate={trip.endDate}
      initialItem={dialogState.mode === "edit" ? dialogState.item : undefined}
      initialDay={
        dialogState.mode === "create"
          ? (dialogState.day ?? selectedDay)
          : undefined
      }
      initialParentItemId={
        dialogState.mode === "create" ? dialogState.parentItemId : undefined
      }
      manualPathOptions={manualPathOptionsForDialog(trip, dialogState)}
      parentItemActivity={parentItemActivity}
      onClose={() => {
        setStopPlaceResolution({ state: "idle", candidates: [] });
        setDialogState(null);
      }}
      onDelete={dialogState.mode === "edit" ? deleteSelectedStop : undefined}
      onPromoteFoodRecommendation={
        dialogState.mode === "edit"
          ? () => void promoteFoodRecommendation(dialogState.item)
          : undefined
      }
      onSubmit={dialogState.mode === "edit" ? updateSelectedStop : createStop}
      placeSuggestions={placeAutocompleteSuggestions(trip)}
      placeResolution={stopPlaceResolution}
    />
  );
}

function manualPathOptionsForDialog(
  trip: Trip,
  dialogState: ItineraryDialogState,
): ManualActivityPathOption[] | undefined {
  if (dialogState?.mode !== "edit") return undefined;
  return deriveManualActivityPathOptions(trip, dialogState.item.id);
}
