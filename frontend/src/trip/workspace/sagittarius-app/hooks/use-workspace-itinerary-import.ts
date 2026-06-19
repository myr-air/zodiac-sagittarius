import { useCallback, useState } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  buildItineraryExport,
  parseItineraryImportDocument,
} from "@/src/trip/itinerary-import-export";
import { slugifyFilePart } from "@/src/lib/file-names";
import { buildImportItineraryRequest } from "@/src/trip/workspace/itinerary-import-api";
import {
  pendingItineraryImportFromDocument,
  shouldUseApiItineraryImport,
  type PendingItineraryImport,
} from "@/src/trip/workspace/itinerary-import-model";
import type {
  ExpenseSummary,
  StopNote,
  Trip,
  TripTask,
  TripParticipantSession,
  ItineraryItem,
} from "@/src/trip/types";
import { useWorkspaceItineraryImportApplyCommand } from "./use-workspace-itinerary-import-apply-command";

interface UseWorkspaceItineraryImportOptions {
  canEdit: boolean;
  commitTrip: (
    updater: (current: Trip) => Trip,
    nextSelectedItemId?: string,
  ) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  selectedTripPlanId: string;
  setBackendExpenseSummary: (
    summary: { tripPlanId: string; summary: ExpenseSummary } | null,
  ) => void;
  setContextRailVisibility: (open: boolean) => void;
  setSelectedItemId: (itemId: string) => void;
  setStopNotes: (updater: (current: StopNote[]) => StopNote[]) => void;
  setTasks: (updater: (current: TripTask[]) => TripTask[]) => void;
  stopNotes: StopNote[];
  tasks: TripTask[];
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
  apiClient?: TripApiClient;
  planItems: ItineraryItem[];
}

export function useWorkspaceItineraryImport({
  canEdit,
  commitTrip,
  isApiMode,
  participantSession,
  selectedTripPlanId,
  setBackendExpenseSummary,
  setContextRailVisibility,
  setSelectedItemId,
  setStopNotes,
  setTasks,
  stopNotes,
  tasks,
  trip,
  updateApiTrip,
  apiClient,
  planItems,
}: UseWorkspaceItineraryImportOptions) {
  const [pendingItineraryImport, setPendingItineraryImport] =
    useState<PendingItineraryImport | null>(null);
  const [itineraryImportError, setItineraryImportError] = useState<
    string | null
  >(null);

  const clearPendingItineraryImport = useCallback(() => {
    setPendingItineraryImport(null);
    setItineraryImportError(null);
  }, []);

  const exportItinerary = useCallback(() => {
    const document = buildItineraryExport({
      exportedAt: new Date().toISOString(),
      items: planItems,
      stopNotes,
      tasks,
      trip,
    });
    const blob = new Blob([`${JSON.stringify(document, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugifyFilePart(trip.name)}-itinerary-v1.json`;
    window.document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [planItems, stopNotes, tasks, trip]);

  const importItineraryContent = useCallback(async ({
    fileName,
    contentType,
    content,
    preferApi,
  }: {
    fileName: string;
    contentType: string;
    content: string;
    preferApi: boolean;
  }) => {
    try {
      const document =
        preferApi &&
        shouldUseApiItineraryImport({ contentType, fileName }) &&
        isApiMode &&
        apiClient &&
        participantSession
          ? await apiClient.importItinerary(
              trip.id,
              participantSession.sessionToken,
              buildImportItineraryRequest({ fileName, contentType, content }),
            )
          : parseItineraryImportDocument(content);
      setPendingItineraryImport(pendingItineraryImportFromDocument({ document, fileName }));
      setItineraryImportError(null);
    } catch (caught) {
      setItineraryImportError(
        caught instanceof Error ? caught.message : "Import itinerary ไม่สำเร็จ",
      );
    }
  }, [
    apiClient,
    isApiMode,
    participantSession,
    trip,
  ]);

  const importItinerary = useCallback(async (file: File) => {
    if (!canEdit) return;
    const content = await file.text();
    await importItineraryContent({
      fileName: file.name,
      contentType: file.type || "text/plain",
      content,
      preferApi: true,
    });
  }, [canEdit, importItineraryContent]);

  const importItineraryText = useCallback(async (content: string, sourceName: string) => {
    if (!canEdit) return;
    await importItineraryContent({
      fileName: sourceName,
      contentType: "text/plain",
      content,
      preferApi: false,
    });
  }, [canEdit, importItineraryContent]);

  const applyPendingItineraryImport = useWorkspaceItineraryImportApplyCommand({
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
  });

  return {
    applyPendingItineraryImport,
    clearPendingItineraryImport,
    exportItinerary,
    importItinerary,
    importItineraryError: itineraryImportError,
    importItineraryText,
    pendingItineraryImport,
  };
}
