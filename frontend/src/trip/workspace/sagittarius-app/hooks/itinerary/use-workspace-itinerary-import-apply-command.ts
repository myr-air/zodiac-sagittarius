import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  applyImportedItemsToItineraryPath,
  type ItineraryImportApplyTarget,
} from "@/src/trip/itinerary-paths";
import {
  emptyItineraryExportRecords,
  type PendingItineraryImport,
} from "@/src/trip/workspace/itinerary-import-model";
import { buildImportedPlanRecordsForTripPlan } from "@/src/trip/workspace/itinerary-import-record-mapping";
import {
  mergeImportedRecordsIntoTripPlan,
  mergeImportedStopNotes,
  mergeImportedTasks,
} from "@/src/trip/workspace/itinerary-import-record-merge";
import type {
  ExpenseSummary,
  StopNote,
  Trip,
  TripParticipantSession,
  TripTask,
} from "@/src/trip/types";
import { applyApiItineraryImport } from "./apply-api-itinerary-import";

interface UseWorkspaceItineraryImportApplyCommandOptions {
  apiClient?: TripApiClient;
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  pendingItineraryImport: PendingItineraryImport | null;
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
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceItineraryImportApplyCommand({
  apiClient,
  commitTrip,
  isApiMode,
  participantSession,
  pendingItineraryImport,
  selectedTripPlanId,
  setBackendExpenseSummary,
  setContextRailVisibility,
  setItineraryImportError,
  setPendingItineraryImport,
  setSelectedItemId,
  setStopNotes,
  setTasks,
  trip,
  updateApiTrip,
}: UseWorkspaceItineraryImportApplyCommandOptions) {
  return useCallback(async (target: ItineraryImportApplyTarget) => {
    if (!pendingItineraryImport) return;
    try {
      const previewTrip = applyImportedItemsToItineraryPath(
        trip,
        pendingItineraryImport.items,
        target,
      );
      const currentIds = new Set(trip.itineraryItems.map((item) => item.id));
      const previewIds = new Set(
        previewTrip.itineraryItems.map((item) => item.id),
      );
      const deletedItems = trip.itineraryItems.filter(
        (item) => !previewIds.has(item.id),
      );
      const previewImportedItems = previewTrip.itineraryItems.filter(
        (item) => !currentIds.has(item.id),
      );
      const appliedImportedItems = previewTrip.itineraryItems.slice(
        -pendingItineraryImport.items.length,
      );

      if (isApiMode && apiClient && participantSession) {
        await applyApiItineraryImport({
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
        });
        return;
      }

      const nextSelectedItemId = appliedImportedItems[0]?.id ?? "";
      const importedPlanRecords = buildImportedPlanRecordsForTripPlan({
        appliedImportedItems,
        importedItems: pendingItineraryImport.items,
        records:
          target.recordMode === "clone-linked"
            ? pendingItineraryImport.records
            : emptyItineraryExportRecords(),
        targetTrip: previewTrip,
        tripPlanId: target.tripPlanId || trip.activePlanVariantId,
      });
      commitTrip(
        () =>
          mergeImportedRecordsIntoTripPlan(previewTrip, importedPlanRecords),
        nextSelectedItemId,
      );
      setTasks((current) => mergeImportedTasks(current, importedPlanRecords));
      setStopNotes((current) =>
        mergeImportedStopNotes(current, importedPlanRecords),
      );
      if (!nextSelectedItemId) setContextRailVisibility(false);
      setPendingItineraryImport(null);
      setItineraryImportError(null);
    } catch (caught) {
      setItineraryImportError(
        caught instanceof Error ? caught.message : "Import itinerary ไม่สำเร็จ",
      );
    }
  }, [
    apiClient,
    commitTrip,
    isApiMode,
    participantSession,
    pendingItineraryImport,
    selectedTripPlanId,
    setBackendExpenseSummary,
    setContextRailVisibility,
    setItineraryImportError,
    setPendingItineraryImport,
    setSelectedItemId,
    setStopNotes,
    setTasks,
    trip,
    updateApiTrip,
  ]);
}
