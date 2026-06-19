import type {
  BookingDoc,
  Expense,
  ItineraryItem,
  StopNote,
  Trip,
  TripTask,
} from "./types";
import type {
  ItineraryExportDocument,
  ItineraryExportItem,
  ItineraryExportRecords,
} from "./itinerary-import-export";
import {
  itineraryExportSchema,
  itineraryExportVersion,
} from "./itinerary-import-export";

export function buildItineraryExport({
  exportedAt,
  items,
  stopNotes,
  tasks,
  trip,
}: {
  exportedAt: string;
  items: ItineraryItem[];
  stopNotes?: StopNote[];
  tasks?: TripTask[];
  trip: Trip;
}): ItineraryExportDocument {
  const exportItems = items.map(toExportItem);
  const tripPlans = trip.tripPlans ?? trip.planVariants;
  return {
    schema: itineraryExportSchema,
    version: itineraryExportVersion,
    exportedAt,
    trip: {
      id: trip.id,
      name: trip.name,
      destinationLabel: trip.destinationLabel,
      startDate: trip.startDate,
      endDate: trip.endDate,
      activePlanVariantId: trip.activePlanVariantId,
      mainTripPlanId: trip.mainTripPlanId,
      planVariants: tripPlans,
      tripPlans,
      partySize: trip.partySize,
      defaultTimezone: trip.defaultTimezone,
    },
    items: exportItems,
    records: toExportRecords({ items, stopNotes, tasks, trip }),
  };
}

function toExportItem(item: ItineraryItem): ItineraryExportItem {
  return {
    id: item.id,
    pathGroupId: item.pathGroupId,
    pathId: item.pathId,
    pathName: item.pathName,
    pathRole: item.pathRole,
    itemKind: item.itemKind,
    timeMode: item.timeMode,
    parentItemId: item.parentItemId ?? null,
    isPlanBlock: item.isPlanBlock,
    status: item.status,
    priority: item.priority,
    day: item.day,
    sortOrder: item.sortOrder,
    startTime: item.startTime,
    endTime: item.endTime ?? null,
    endOffsetDays: item.endOffsetDays ?? 0,
    activity: item.activity,
    activityType: item.activityType,
    activitySubtype: item.activitySubtype ?? null,
    place: item.place,
    linkLabel: item.linkLabel,
    mapLink: item.mapLink,
    coordinates: item.coordinates,
    address: item.address,
    durationMinutes: item.durationMinutes,
    transportation: item.transportation,
    details: item.details ?? {},
    advisories: item.advisories,
    note: item.note,
  };
}

function toExportRecords({
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
