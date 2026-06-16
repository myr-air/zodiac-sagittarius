import type {
  ItineraryExportDocument,
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

export interface PendingItineraryImport {
  fileName: string;
  items: ItineraryExportItem[];
  records: ItineraryExportRecords;
}

export function emptyItineraryExportRecords(): ItineraryExportRecords {
  return { bookingDocs: [], expenses: [], stopNotes: [], tasks: [] };
}

export function pendingItineraryImportFromDocument({
  document,
  fileName,
}: {
  document: Pick<ItineraryExportDocument, "items" | "records">;
  fileName: string;
}): PendingItineraryImport {
  return {
    fileName,
    items: document.items,
    records: document.records ?? emptyItineraryExportRecords(),
  };
}

export function shouldUseApiItineraryImport({
  contentType,
  fileName,
}: {
  contentType: string;
  fileName: string;
}): boolean {
  const lowerName = fileName.toLowerCase();
  const lowerType = contentType.toLowerCase();
  if (
    lowerType.includes("csv") ||
    lowerType.includes("tab-separated") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".tsv") ||
    lowerName.endsWith(".txt")
  ) {
    return false;
  }
  return true;
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

export function resolveCreatedImportId(
  id: string | null | undefined,
  idMaps: Map<string, string>[],
): string | null | undefined {
  if (typeof id !== "string") return id;
  for (const idMap of idMaps) {
    const mappedId = idMap.get(id);
    if (mappedId) return mappedId;
  }
  return id;
}

export function upsertById<T extends { id: string }>(
  current: T[],
  next: T[],
): T[] {
  if (next.length === 0) return current;
  const nextById = new Map(next.map((item) => [item.id, item]));
  const merged = current.map((item) => nextById.get(item.id) ?? item);
  const currentIds = new Set(current.map((item) => item.id));
  for (const item of next) {
    if (!currentIds.has(item.id)) merged.push(item);
  }
  return merged;
}
