import type { TripApiClient } from "@/src/trip/api-client";
import {
  buildImportedItineraryItemCreateRequest,
  createImportedPlanRecordsViaApi,
} from "@/src/trip/workspace/itinerary-import-api";
import {
  buildImportedPlanRecordsForTripPlan,
  emptyItineraryExportRecords,
  mergeApiImportedPlanRecordsIntoTrip,
  mergeImportedStopNotes,
  mergeImportedTasks,
  type PendingItineraryImport,
} from "@/src/trip/workspace/itinerary-import-model";
import { nextClientMutationId } from "@/src/trip/local-ids";
import type {
  ExpenseSummary,
  ItineraryItem,
  StopNote,
  Trip,
  TripParticipantSession,
  TripTask,
} from "@/src/trip/types";
import type { ItineraryImportApplyTarget } from "@/src/trip/itinerary-paths";

interface ApplyApiImportInput {
  apiClient: TripApiClient;
  deletedItems: ItineraryItem[];
  participantSession: TripParticipantSession;
  pendingItineraryImport: PendingItineraryImport;
  previewImportedItems: ItineraryItem[];
  previewTrip: Trip;
  selectedTripPlanId: string;
  setBackendExpenseSummary: (
    summary: { tripPlanId: string; summary: ExpenseSummary } | null,
  ) => void;
  setContextRailVisibility: (open: boolean) => void;
  setItineraryImportError: (error: string | null) => void;
  setPendingItineraryImport: (pending: PendingItineraryImport | null) => void;
  setSelectedItemId: (itemId: string) => void;
  setStopNotes: (updater: (current: StopNote[]) => StopNote[]) => void;
  setTasks: (updater: (current: TripTask[]) => TripTask[]) => void;
  target: ItineraryImportApplyTarget;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export async function applyApiItineraryImport({
  apiClient,
  deletedItems,
  participantSession,
  pendingItineraryImport,
  previewImportedItems,
  previewTrip,
  selectedTripPlanId,
  setBackendExpenseSummary,
  setContextRailVisibility,
  setItineraryImportError,
  setPendingItineraryImport,
  setSelectedItemId,
  setStopNotes,
  setTasks,
  target,
  trip,
  updateApiTrip,
}: ApplyApiImportInput) {
  for (const item of deletedItems) {
    await apiClient.deleteItineraryItem(
      trip.id,
      item.id,
      participantSession.sessionToken,
    );
  }
  const createdItems: ItineraryItem[] = [];
  const createdItemIdsByImportId = new Map<string, string>();
  const createdItemIdsByPreviewId = new Map<string, string>();
  for (const item of previewImportedItems) {
    const importedItem = pendingItineraryImport.items[createdItems.length];
    const createdItem = await apiClient.createItineraryItem(
      trip.id,
      participantSession.sessionToken,
      buildImportedItineraryItemCreateRequest({
        clientMutationId: nextClientMutationId("itinerary-import-create"),
        createdItemIdsByImportId,
        createdItemIdsByPreviewId,
        item,
      }),
    );
    createdItems.push(createdItem);
    if (importedItem) {
      createdItemIdsByImportId.set(importedItem.id, createdItem.id);
    }
    createdItemIdsByPreviewId.set(item.id, createdItem.id);
  }
  const importedPlanRecords = buildImportedPlanRecordsForTripPlan({
    appliedImportedItems: createdItems,
    importedItems: pendingItineraryImport.items,
    records:
      target.recordMode === "clone-linked"
        ? pendingItineraryImport.records
        : emptyItineraryExportRecords(),
    targetTrip: previewTrip,
    tripPlanId: target.tripPlanId || trip.activePlanVariantId,
  });
  const createdPlanRecords = await createImportedPlanRecordsViaApi({
    apiClient,
    nextClientMutationId,
    sessionToken: participantSession.sessionToken,
    tripId: trip.id,
    records: importedPlanRecords,
  });
  const deletedIds = new Set(deletedItems.map((item) => item.id));
  updateApiTrip((current) =>
    mergeApiImportedPlanRecordsIntoTrip({
      createdItems,
      currentTrip: current,
      deletedItemIds: deletedIds,
      previewTrip,
      records: createdPlanRecords,
    }),
  );
  setTasks((current) => mergeImportedTasks(current, createdPlanRecords));
  setStopNotes((current) =>
    mergeImportedStopNotes(current, createdPlanRecords),
  );
  if (createdPlanRecords.expenses.length > 0) {
    setBackendExpenseSummary({
      tripPlanId: selectedTripPlanId,
      summary: await apiClient.getExpenseSummary(
        trip.id,
        participantSession.sessionToken,
        selectedTripPlanId,
      ),
    });
  }
  const nextSelectedItemId = createdItems[0]?.id ?? "";
  setSelectedItemId(nextSelectedItemId);
  if (!nextSelectedItemId) setContextRailVisibility(false);
  setPendingItineraryImport(null);
  setItineraryImportError(null);
}
