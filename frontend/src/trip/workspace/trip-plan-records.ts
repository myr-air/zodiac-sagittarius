import { defaultTripPlanId } from "@/src/trip/trip-plans";
import type {
  BookingDoc,
  Expense,
  StopNote,
  Trip,
  TripTask,
} from "@/src/trip/types";

export interface TripPlanRecordSet {
  bookingDocs: BookingDoc[];
  expenses: Expense[];
  stopNotes: StopNote[];
  tasks: TripTask[];
}

export function tripPlanIdForRecord(
  trip: Trip,
  itineraryItemId?: string | null,
  fallbackTripPlanId?: string | null,
): string | null {
  if (itineraryItemId) {
    const item = trip.itineraryItems.find(
      (candidate) => candidate.id === itineraryItemId,
    );
    if (item?.planVariantId) return item.planVariantId;
  }
  return fallbackTripPlanId || defaultTripPlanId(trip) || null;
}

export function tripPlanIdForBookingRecord(
  trip: Trip,
  input: Pick<BookingDoc, "relatedItineraryItemIds">,
  fallbackTripPlanId?: string | null,
): string | null {
  for (const itemId of input.relatedItineraryItemIds) {
    const tripPlanId = tripPlanIdForRecord(trip, itemId);
    if (tripPlanId) return tripPlanId;
  }
  return tripPlanIdForRecord(trip, null, fallbackTripPlanId);
}

export function selectTripPlanRecords(
  trip: Trip,
  selectedTripPlanId: string,
  records: {
    stopNotes: StopNote[];
    tasks: TripTask[];
  },
): TripPlanRecordSet {
  const fallbackTripPlanId = selectedTripPlanId || defaultTripPlanId(trip);
  const itemPlanById = new Map(
    trip.itineraryItems.map((item) => [item.id, item.planVariantId]),
  );
  const belongsToSelectedPlan = (
    explicitTripPlanId?: string | null,
    linkedItemIds: Array<string | null | undefined> = [],
  ) => {
    if (explicitTripPlanId) return explicitTripPlanId === fallbackTripPlanId;

    for (const itemId of linkedItemIds) {
      if (!itemId) continue;
      const itemTripPlanId = itemPlanById.get(itemId);
      if (itemTripPlanId) return itemTripPlanId === fallbackTripPlanId;
    }

    return fallbackTripPlanId === defaultTripPlanId(trip);
  };

  return {
    bookingDocs: (trip.bookingDocs ?? []).filter((bookingDoc) =>
      belongsToSelectedPlan(
        bookingDoc.tripPlanId,
        bookingDoc.relatedItineraryItemIds,
      ),
    ),
    expenses: trip.expenses.filter((expense) =>
      belongsToSelectedPlan(expense.tripPlanId, [expense.itineraryItemId]),
    ),
    stopNotes: records.stopNotes.filter((note) =>
      belongsToSelectedPlan(note.tripPlanId, [note.itemId]),
    ),
    tasks: records.tasks.filter((task) =>
      belongsToSelectedPlan(task.tripPlanId, [task.relatedItemId]),
    ),
  };
}
