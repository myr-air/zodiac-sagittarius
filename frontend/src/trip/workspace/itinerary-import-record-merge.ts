import { upsertById } from "@/src/shared/collection";
import type {
  ItineraryItem,
  StopNote,
  Trip,
  TripTask,
} from "@/src/trip/types";
import type { ImportedPlanRecords } from "./itinerary-import-record-mapping";

export function mergeImportedRecordsIntoTripPlan(
  targetTrip: Trip,
  records: ImportedPlanRecords,
): Trip {
  return {
    ...targetTrip,
    bookingDocs: upsertById(targetTrip.bookingDocs ?? [], records.bookingDocs),
    expenses: upsertById(targetTrip.expenses, records.expenses),
    stopNotes: upsertById(targetTrip.stopNotes ?? [], records.stopNotes),
    tasks: upsertById(targetTrip.tasks ?? [], records.tasks),
  };
}

export function mergeApiImportedPlanRecordsIntoTrip({
  createdItems,
  currentTrip,
  deletedItemIds,
  previewTrip,
  records,
}: {
  createdItems: ItineraryItem[];
  currentTrip: Trip;
  deletedItemIds: Set<string>;
  previewTrip: Pick<Trip, "itineraryPaths">;
  records: ImportedPlanRecords;
}): Trip {
  return {
    ...currentTrip,
    itineraryPaths: previewTrip.itineraryPaths,
    itineraryItems: [
      ...currentTrip.itineraryItems.filter(
        (item) => !deletedItemIds.has(item.id),
      ),
      ...createdItems,
    ],
    bookingDocs: upsertById(currentTrip.bookingDocs ?? [], records.bookingDocs),
    expenses: upsertById(currentTrip.expenses, records.expenses),
  };
}

export function mergeImportedTasks(
  currentTasks: TripTask[],
  records: Pick<ImportedPlanRecords, "tasks">,
): TripTask[] {
  return upsertById(currentTasks, records.tasks);
}

export function mergeImportedStopNotes(
  currentStopNotes: StopNote[],
  records: Pick<ImportedPlanRecords, "stopNotes">,
): StopNote[] {
  return upsertById(currentStopNotes, records.stopNotes);
}
