import type {
  BookingDoc,
  Expense,
  ItineraryItem,
  StopNote,
  Trip,
  TripTask,
} from "../types";
import type { ItineraryExportRecords } from "./itinerary-import-export-types";

export function buildItineraryExportRecords({
  items,
  stopNotes,
  tasks,
  trip,
}: {
  items: ItineraryItem[];
  stopNotes?: StopNote[];
  tasks?: TripTask[];
  trip: Trip;
}): ItineraryExportRecords {
  const itemIds = new Set(items.map((item) => item.id));
  const itemPlanIds = items
    .map((item) => item.planVariantId)
    .filter((value): value is string => Boolean(value));
  const planIds = new Set(
    (itemPlanIds.length > 0
      ? itemPlanIds
      : [trip.mainTripPlanId, trip.activePlanVariantId]
    ).filter((value): value is string => Boolean(value)),
  );
  const expenses: Expense[] = trip.expenses.filter(
    (expense) =>
      matchesTripPlan(expense.tripPlanId, planIds) ||
      matchesLinkedItem(expense.itineraryItemId, itemIds),
  );
  const expenseIds = new Set(expenses.map((expense) => expense.id));
  const exportStopNotes = (stopNotes ?? trip.stopNotes ?? []).filter(
    (note) =>
      matchesTripPlan(note.tripPlanId, planIds) ||
      matchesLinkedItem(note.itemId, itemIds),
  );
  const noteIds = new Set(exportStopNotes.map((note) => note.id));
  const exportTasks = (tasks ?? []).filter(
    (task) =>
      matchesTripPlan(task.tripPlanId, planIds) ||
      matchesLinkedItem(task.relatedItemId, itemIds),
  );
  const taskIds = new Set(exportTasks.map((task) => task.id));
  const bookingDocs: BookingDoc[] = (trip.bookingDocs ?? []).filter(
    (booking) =>
      matchesTripPlan(booking.tripPlanId, planIds) ||
      booking.relatedItineraryItemIds.some((id) => itemIds.has(id)) ||
      booking.relatedExpenseIds.some((id) => expenseIds.has(id)) ||
      booking.relatedTaskIds.some((id) => taskIds.has(id)) ||
      booking.noteIds.some((id) => noteIds.has(id)),
  );

  return {
    expenses,
    bookingDocs,
    stopNotes: exportStopNotes,
    tasks: exportTasks,
  };
}

function matchesTripPlan(
  tripPlanId: string | null | undefined,
  planIds: Set<string>,
): boolean {
  if (tripPlanId === undefined || tripPlanId === null) return true;
  return typeof tripPlanId === "string" && planIds.has(tripPlanId);
}

function matchesLinkedItem(
  itemId: string | null | undefined,
  itemIds: Set<string>,
): boolean {
  return typeof itemId === "string" && itemIds.has(itemId);
}
