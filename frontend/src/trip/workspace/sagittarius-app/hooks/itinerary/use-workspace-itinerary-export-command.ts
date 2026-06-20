import { useCallback } from "react";
import { slugifyFilePart } from "@/src/lib/file-names";
import { buildItineraryExport } from "@/src/trip/itinerary-import-export";
import type { ItineraryItem, StopNote, Trip, TripTask } from "@/src/trip/types";

interface UseWorkspaceItineraryExportCommandOptions {
  planItems: ItineraryItem[];
  stopNotes: StopNote[];
  tasks: TripTask[];
  trip: Trip;
}

export function useWorkspaceItineraryExportCommand({
  planItems,
  stopNotes,
  tasks,
  trip,
}: UseWorkspaceItineraryExportCommandOptions) {
  return useCallback(() => {
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
}
