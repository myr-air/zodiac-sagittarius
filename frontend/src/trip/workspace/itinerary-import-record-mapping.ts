import type {
  ItineraryExportItem,
  ItineraryExportRecords,
} from "@/src/trip/itinerary-import-export";
import type {
  BookingDoc,
  Expense,
  ItineraryItem,
  StopNote,
  Trip,
  TripTask,
} from "@/src/trip/types";

export interface ImportedPlanRecords {
  bookingDocs: BookingDoc[];
  expenses: Expense[];
  stopNotes: StopNote[];
  tasks: TripTask[];
}

export function buildImportedPlanRecordsForTripPlan({
  appliedImportedItems,
  importedItems,
  records,
  targetTrip,
  tripPlanId,
}: {
  appliedImportedItems: ItineraryItem[];
  importedItems: ItineraryExportItem[];
  records: ItineraryExportRecords;
  targetTrip: Trip;
  tripPlanId: string;
}): ImportedPlanRecords {
  const sourceItemIds = new Set(importedItems.map((item) => item.id));
  const itemIdMap = new Map(
    importedItems.map((item, index) => [
      item.id,
      appliedImportedItems[index]?.id ?? item.id,
    ]),
  );
  const mapItemId = (itemId: string) => itemIdMap.get(itemId) ?? itemId;
  const hasImportedItem = (itemId?: string | null) =>
    Boolean(itemId && sourceItemIds.has(itemId));

  const importedExpenses = records.expenses
    .filter((expense) => hasImportedItem(expense.itineraryItemId))
    .map((expense): Expense => ({
      ...expense,
      tripId: targetTrip.id,
      tripPlanId,
      itineraryItemId: expense.itineraryItemId
        ? mapItemId(expense.itineraryItemId)
        : expense.itineraryItemId,
    }));
  const importedBookingDocs = records.bookingDocs
    .filter((bookingDoc) =>
      bookingDoc.relatedItineraryItemIds.some((itemId) =>
        hasImportedItem(itemId),
      ),
    )
    .map((bookingDoc): BookingDoc => ({
      ...bookingDoc,
      tripId: targetTrip.id,
      tripPlanId,
      relatedItineraryItemIds: bookingDoc.relatedItineraryItemIds.map(mapItemId),
    }));
  const importedStopNotes = records.stopNotes
    .filter((note) => hasImportedItem(note.itemId))
    .map((note): StopNote => ({
      ...note,
      tripId: targetTrip.id,
      tripPlanId,
      itemId: mapItemId(note.itemId),
    }));
  const importedTasks = records.tasks
    .filter((task) => hasImportedItem(task.relatedItemId))
    .map((task): TripTask => ({
      ...task,
      tripPlanId,
      relatedItemId: task.relatedItemId
        ? mapItemId(task.relatedItemId)
        : task.relatedItemId,
    }));

  return {
    bookingDocs: importedBookingDocs,
    expenses: importedExpenses,
    stopNotes: importedStopNotes,
    tasks: importedTasks,
  };
}
