import { StopDialog } from "@/src/features/itinerary/components";
import { deriveManualActivityPathOptions } from "@/src/trip/itinerary-paths";
import type {
  ItineraryImportApplyTarget,
  ItineraryPathOption,
  ManualActivityPathOption,
} from "@/src/trip/itinerary-paths";
import type {
  ItineraryItem,
  PlanVariant,
  Trip,
} from "@/src/trip/types";
import type { StopFormValues } from "@/src/features/itinerary/components";
import type { StopPlaceResolutionState } from "@/src/trip/places";
import { TripWorkspaceDeleteDialog } from "@/src/trip/workspace/TripWorkspaceDeleteDialog";
import { TripWorkspaceImportDialog } from "@/src/trip/workspace/TripWorkspaceImportDialog";
import type { PendingItineraryImport } from "@/src/trip/workspace/itinerary-import-model";
import type { ItineraryDialogState } from "./hooks/itinerary/itinerary-dialog-state";

export interface WorkspaceDialogsProps {
  applyPendingItineraryImport: (target: ItineraryImportApplyTarget) => Promise<void>;
  clearPendingItineraryImport: () => void;
  createStop: (values: StopFormValues) => void | Promise<void>;
  currentMemberId: string;
  deleteSelectedStop: () => void | Promise<void>;
  deleteStop: (itemId: string) => void | Promise<void>;
  dialogDeleteItem: ItineraryItem | null;
  dialogState: ItineraryDialogState;
  importPathOptions: ItineraryPathOption[];
  pendingItineraryImport: PendingItineraryImport | null;
  promoteFoodRecommendation: (item: ItineraryItem) => void | Promise<void>;
  selectedDay: string;
  selectedTripPathId: string;
  selectedTripPlanId: string;
  setDialogDeleteItem: (item: ItineraryItem | null) => void;
  setDialogState: (state: ItineraryDialogState) => void;
  setStopPlaceResolution: (state: StopPlaceResolutionState) => void;
  stopPlaceResolution: StopPlaceResolutionState;
  trip: Trip;
  tripPlanOptions: PlanVariant[];
  updateSelectedStop: (values: StopFormValues) => void | Promise<void>;
  deleteCancelLabel: string;
  deleteConfirmLabel: string;
  deleteTitleForActivity: (activity: string) => string;
  deleteBodyForActivity: (activity: string) => string;
}

export function WorkspaceDialogs({
  applyPendingItineraryImport,
  clearPendingItineraryImport,
  createStop,
  currentMemberId,
  deleteSelectedStop,
  deleteStop,
  dialogDeleteItem,
  dialogState,
  importPathOptions,
  pendingItineraryImport,
  promoteFoodRecommendation,
  selectedDay,
  selectedTripPathId,
  selectedTripPlanId,
  setDialogDeleteItem,
  setDialogState,
  setStopPlaceResolution,
  stopPlaceResolution,
  trip,
  tripPlanOptions,
  updateSelectedStop,
  deleteCancelLabel,
  deleteConfirmLabel,
  deleteTitleForActivity,
  deleteBodyForActivity,
}: WorkspaceDialogsProps) {
  return (
    <>
      {dialogState ? (
        <StopDialog
          key={
            dialogState.mode === "edit"
              ? `edit-${dialogState.item.id}`
              : "create-stop"
          }
          mode={dialogState.mode}
          startDate={trip.startDate}
          endDate={trip.endDate}
          initialItem={
            dialogState.mode === "edit" ? dialogState.item : undefined
          }
          initialDay={
            dialogState.mode === "create"
              ? (dialogState.day ?? selectedDay)
              : undefined
          }
          initialParentItemId={
            dialogState.mode === "create"
              ? dialogState.parentItemId
              : undefined
          }
          manualPathOptions={manualPathOptionsForDialog(trip, dialogState)}
          onClose={() => {
            setStopPlaceResolution({ state: "idle", candidates: [] });
            setDialogState(null);
          }}
          onDelete={
            dialogState.mode === "edit" ? deleteSelectedStop : undefined
          }
          onPromoteFoodRecommendation={
            dialogState.mode === "edit"
              ? () => void promoteFoodRecommendation(dialogState.item)
              : undefined
          }
          onSubmit={
            dialogState.mode === "edit" ? updateSelectedStop : createStop
          }
          placeResolution={stopPlaceResolution}
        />
      ) : null}
      {pendingItineraryImport ? (
        <TripWorkspaceImportDialog
          currentTripPathId={selectedTripPathId}
          importedItems={pendingItineraryImport.items}
          memberId={currentMemberId}
          pathOptions={importPathOptions}
          records={pendingItineraryImport.records}
          tripPlanOptions={tripPlanOptions}
          tripPlanId={selectedTripPlanId}
          startDate={trip.startDate}
          onApply={(target) => void applyPendingItineraryImport(target)}
          onClose={clearPendingItineraryImport}
        />
      ) : null}
      <TripWorkspaceDeleteDialog
        item={dialogDeleteItem}
        cancelLabel={deleteCancelLabel}
        confirmLabel={deleteConfirmLabel}
        titleForActivity={deleteTitleForActivity}
        bodyForActivity={deleteBodyForActivity}
        onCancel={() => setDialogDeleteItem(null)}
        onConfirm={async (itemId) => {
          setDialogDeleteItem(null);
          await deleteStop(itemId);
        }}
      />
    </>
  );
}

function manualPathOptionsForDialog(
  trip: Trip,
  dialogState: ItineraryDialogState,
): ManualActivityPathOption[] | undefined {
  if (dialogState?.mode !== "edit") return undefined;
  return deriveManualActivityPathOptions(trip, dialogState.item.id);
}
