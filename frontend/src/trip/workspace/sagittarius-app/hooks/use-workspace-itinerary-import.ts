import { useCallback, useState } from "react";
import { parseItineraryImportDocument } from "@/src/trip/itinerary-import-export";
import { buildImportItineraryRequest } from "@/src/trip/workspace/itinerary-import-api-requests";
import {
  pendingItineraryImportFromDocument,
  shouldUseApiItineraryImport,
  type PendingItineraryImport,
} from "@/src/trip/workspace/itinerary-import-model";
import { useWorkspaceItineraryExportCommand } from "./itinerary/use-workspace-itinerary-export-command";
import { useWorkspaceItineraryImportApplyCommand } from "./itinerary/use-workspace-itinerary-import-apply-command";
import type { UseWorkspaceItineraryImportOptions } from "./use-workspace-itinerary-import-params";

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

  const exportItinerary = useWorkspaceItineraryExportCommand({
    planItems,
    stopNotes,
    tasks,
    trip,
  });

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
