import {
  applyImportedItemsToItineraryPath,
  type ItineraryImportApplyTarget,
} from "@/src/trip/itinerary-paths";
import {
  emptyItineraryExportRecords,
  type PendingItineraryImport,
} from "@/src/trip/workspace/itinerary-import-model";
import { buildImportedPlanRecordsForTripPlan } from "@/src/trip/workspace/itinerary-import-record-mapping";
import type {
  ItineraryItem,
  Trip,
} from "@/src/trip/types";

interface WorkspaceItineraryImportApplyInputContext {
  pendingItineraryImport: PendingItineraryImport;
  target: ItineraryImportApplyTarget;
  trip: Trip;
}

interface WorkspaceLocalItineraryImportApplyInputContext
  extends WorkspaceItineraryImportApplyInputContext {
  preview?: WorkspaceItineraryImportPreview;
}

export interface WorkspaceItineraryImportPreview {
  appliedImportedItems: ItineraryItem[];
  deletedItems: ItineraryItem[];
  previewImportedItems: ItineraryItem[];
  previewTrip: Trip;
}

export function buildWorkspaceItineraryImportPreview({
  pendingItineraryImport,
  target,
  trip,
}: WorkspaceItineraryImportApplyInputContext): WorkspaceItineraryImportPreview {
  const previewTrip = applyImportedItemsToItineraryPath(
    trip,
    pendingItineraryImport.items,
    target,
  );
  const currentIds = new Set(trip.itineraryItems.map((item) => item.id));
  const previewIds = new Set(previewTrip.itineraryItems.map((item) => item.id));
  const deletedItems = trip.itineraryItems.filter(
    (item) => !previewIds.has(item.id),
  );
  const previewImportedItems = previewTrip.itineraryItems.filter(
    (item) => !currentIds.has(item.id),
  );
  const appliedImportedItems = previewTrip.itineraryItems.slice(
    -pendingItineraryImport.items.length,
  );

  return {
    appliedImportedItems,
    deletedItems,
    previewImportedItems,
    previewTrip,
  };
}

export function importedRecordsForApplyTarget(
  pendingItineraryImport: PendingItineraryImport,
  target: ItineraryImportApplyTarget,
) {
  return target.recordMode === "clone-linked"
    ? pendingItineraryImport.records
    : emptyItineraryExportRecords();
}

export function buildWorkspaceLocalItineraryImportApplyInput({
  pendingItineraryImport,
  preview,
  target,
  trip,
}: WorkspaceLocalItineraryImportApplyInputContext) {
  const importPreview =
    preview ??
    buildWorkspaceItineraryImportPreview({
      pendingItineraryImport,
      target,
      trip,
    });
  const importedPlanRecords = buildImportedPlanRecordsForTripPlan({
    appliedImportedItems: importPreview.appliedImportedItems,
    importedItems: pendingItineraryImport.items,
    records: importedRecordsForApplyTarget(pendingItineraryImport, target),
    targetTrip: importPreview.previewTrip,
    tripPlanId: target.tripPlanId || trip.activePlanVariantId,
  });

  return {
    ...importPreview,
    importedPlanRecords,
    nextSelectedItemId: importPreview.appliedImportedItems[0]?.id ?? "",
  };
}
