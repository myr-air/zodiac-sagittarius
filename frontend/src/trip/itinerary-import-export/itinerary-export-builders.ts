import { tripPlanOptions } from "../trip-plans";
import type {
  ItineraryItem,
  StopNote,
  Trip,
  TripTask,
} from "../types";
import type {
  ItineraryExportDocument,
  ItineraryExportItem,
} from "./itinerary-import-export-types";
import {
  itineraryExportSchema,
  itineraryExportVersion,
} from "./itinerary-import-export-schema";
import { buildItineraryExportRecords } from "./itinerary-export-records";

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
  const tripPlans = tripPlanOptions(trip);
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
    records: buildItineraryExportRecords({ items, stopNotes, tasks, trip }),
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
