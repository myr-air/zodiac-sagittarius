import type {
  BookingDoc,
  Expense,
  ItineraryAdvisory,
  ItineraryCoordinates,
  ItineraryItem,
  StopNote,
  Trip,
  TripTask,
} from "./types";
import { safeExternalHref } from "./safe-links";

export const itineraryExportSchema = "joii.itinerary.export";
export const itineraryExportVersion = 1;

export interface ItineraryExportItem {
  id: string;
  pathGroupId?: string;
  pathId?: string;
  pathName?: string;
  pathRole?: ItineraryItem["pathRole"];
  itemKind?: ItineraryItem["itemKind"];
  timeMode?: ItineraryItem["timeMode"];
  parentItemId?: string | null;
  isPlanBlock?: boolean;
  status?: ItineraryItem["status"];
  priority?: ItineraryItem["priority"];
  day: string;
  sortOrder: number;
  startTime: string;
  endTime?: string | null;
  endOffsetDays?: number;
  activity: string;
  activityType: ItineraryItem["activityType"];
  place: string;
  linkLabel: string;
  mapLink: string;
  coordinates?: ItineraryCoordinates;
  address?: string;
  durationMinutes: number | null;
  transportation: string;
  details: ItineraryItem["details"];
  advisories?: ItineraryAdvisory[];
  note: string;
}

export interface ItineraryExportDocument {
  schema: typeof itineraryExportSchema;
  version: typeof itineraryExportVersion;
  source?: "json" | "ai";
  exportedAt: string;
  trip: Pick<
    Trip,
    | "id"
    | "name"
    | "destinationLabel"
    | "startDate"
    | "endDate"
    | "activePlanVariantId"
    | "mainTripPlanId"
    | "partySize"
    | "defaultTimezone"
  >;
  items: ItineraryExportItem[];
  records?: ItineraryExportRecords;
}

export interface ItineraryExportRecords {
  expenses: Expense[];
  bookingDocs: BookingDoc[];
  stopNotes: StopNote[];
  tasks: TripTask[];
}

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
      partySize: trip.partySize,
      defaultTimezone: trip.defaultTimezone,
    },
    items: exportItems,
    records: toExportRecords({ items, stopNotes, tasks, trip }),
  };
}

export function parseItineraryImport(source: string): ItineraryExportItem[] {
  return parseItineraryImportDocument(source).items;
}

export function parseItineraryImportDocument(source: string): ItineraryExportDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("Import file must be valid JSON.");
  }

  if (
    !isRecord(parsed) ||
    parsed.schema !== itineraryExportSchema ||
    parsed.version !== itineraryExportVersion ||
    !Array.isArray(parsed.items)
  ) {
    throw new Error("Unsupported itinerary import file.");
  }

  return {
    schema: itineraryExportSchema,
    version: itineraryExportVersion,
    source: parsed.source === "json" || parsed.source === "ai" ? parsed.source : undefined,
    exportedAt: readString(parsed, "exportedAt"),
    trip: parseExportTrip(parsed.trip),
    items: parsed.items.map(parseExportItem),
    records: parseExportRecords(parsed.records),
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
  const planIds = new Set(
    [
      ...items.map((item) => item.planVariantId),
      trip.mainTripPlanId,
      trip.activePlanVariantId,
    ].filter((value): value is string => Boolean(value)),
  );
  const expenses = trip.expenses.filter(
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
  const bookingDocs = (trip.bookingDocs ?? []).filter(
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

function parseExportTrip(value: unknown): ItineraryExportDocument["trip"] {
  if (!isRecord(value)) throw new Error("Unsupported itinerary import file.");
  return {
    id: readString(value, "id"),
    name: readString(value, "name"),
    destinationLabel: readString(value, "destinationLabel"),
    startDate: readString(value, "startDate"),
    endDate: readString(value, "endDate"),
    activePlanVariantId:
      readOptionalString(value, "activePlanVariantId") ??
      readOptionalString(value, "mainTripPlanId") ??
      "",
    mainTripPlanId:
      readOptionalString(value, "mainTripPlanId") ??
      readOptionalString(value, "activePlanVariantId"),
    partySize: readOptionalNumber(value, "partySize"),
    defaultTimezone: readOptionalString(value, "defaultTimezone"),
  };
}

function parseExportRecords(value: unknown): ItineraryExportRecords {
  if (value === undefined || value === null) {
    return { expenses: [], bookingDocs: [], stopNotes: [], tasks: [] };
  }
  if (!isRecord(value) || Array.isArray(value)) {
    throw new Error("Unsupported itinerary import file.");
  }
  return {
    expenses: readRecordArray<Expense>(value, "expenses"),
    bookingDocs: readRecordArray<BookingDoc>(value, "bookingDocs"),
    stopNotes: readRecordArray<StopNote>(value, "stopNotes"),
    tasks: readRecordArray<TripTask>(value, "tasks"),
  };
}

function readRecordArray<T>(
  item: Record<string, unknown>,
  key: string,
): T[] {
  const value = item[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((entry) => !isRecord(entry))) {
    throw new Error("Unsupported itinerary import file.");
  }
  return value as T[];
}

function parseExportItem(value: unknown): ItineraryExportItem {
  if (!isRecord(value)) throw new Error("Unsupported itinerary import file.");
  const item = value as Record<string, unknown>;

  return {
    id: readString(item, "id"),
    pathGroupId: readOptionalString(item, "pathGroupId"),
    pathId: readOptionalString(item, "pathId"),
    pathName: readOptionalString(item, "pathName"),
    pathRole: readOptionalPathRole(item, "pathRole"),
    itemKind: readOptionalItemKind(item.itemKind) ?? itemKindFromActivityType(readActivityType(item.activityType)),
    timeMode: readOptionalTimeMode(item.timeMode) ?? (item.startTime === null ? "flexible" : "scheduled"),
    parentItemId: readOptionalNullableString(item, "parentItemId"),
    isPlanBlock: typeof item.isPlanBlock === "boolean" ? item.isPlanBlock : false,
    status: readOptionalStatus(item.status) ?? "planned",
    priority: readOptionalPriority(item.priority) ?? "normal",
    day: readString(item, "day"),
    sortOrder: readNumber(item, "sortOrder"),
    startTime: item.startTime === null ? "" : readString(item, "startTime"),
    endTime: readOptionalNullableString(item, "endTime"),
    endOffsetDays: item.endOffsetDays === undefined ? 0 : readNumber(item, "endOffsetDays"),
    activity: readString(item, "activity"),
    activityType: readActivityType(item.activityType),
    place: readString(item, "place"),
    linkLabel: typeof item.linkLabel === "string" ? item.linkLabel : "Map",
    mapLink:
      typeof item.mapLink === "string" ? safeExternalHref(item.mapLink) : "",
    coordinates: readCoordinates(item.coordinates),
    address: typeof item.address === "string" ? item.address : undefined,
    durationMinutes:
      item.durationMinutes === null
        ? null
        : readNumber(item, "durationMinutes"),
    transportation:
      typeof item.transportation === "string" ? item.transportation : "",
    details: readDetails(item.details),
    advisories: readAdvisories(item.advisories),
    note: typeof item.note === "string" ? item.note : "",
  };
}

function readOptionalNullableString(
  item: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = item[key];
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string")
    throw new Error("Unsupported itinerary import file.");
  return value;
}

function readDetails(value: unknown): ItineraryItem["details"] {
  if (value === undefined || value === null) return {};
  if (!isRecord(value) || Array.isArray(value))
    throw new Error("Unsupported itinerary import file.");
  return value;
}

function readOptionalString(
  item: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = item[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string")
    throw new Error("Unsupported itinerary import file.");
  return value;
}

function readOptionalPathRole(
  item: Record<string, unknown>,
  key: string,
): ItineraryItem["pathRole"] | undefined {
  const value = item[key];
  if (value === undefined || value === null) return undefined;
  if (value === "main" || value === "alternative") return value;
  throw new Error("Unsupported itinerary import file.");
}

function readString(item: Record<string, unknown>, key: string): string {
  const value = item[key];
  if (typeof value !== "string")
    throw new Error("Unsupported itinerary import file.");
  return value;
}

function readNumber(item: Record<string, unknown>, key: string): number {
  const value = item[key];
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error("Unsupported itinerary import file.");
  return value;
}

function readOptionalNumber(
  item: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = item[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new Error("Unsupported itinerary import file.");
  return value;
}

function readActivityType(value: unknown): ItineraryItem["activityType"] {
  if (
    value === "travel" ||
    value === "food" ||
    value === "shopping" ||
    value === "attraction" ||
    value === "experience" ||
    value === "stay"
  )
    return value;
  throw new Error("Unsupported itinerary import file.");
}

function readOptionalItemKind(value: unknown): ItineraryItem["itemKind"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    value === "travel" ||
    value === "activity" ||
    value === "lodging" ||
    value === "meal" ||
    value === "note" ||
    value === "preparation" ||
    value === "foodRecommendation"
  )
    return value;
  throw new Error("Unsupported itinerary import file.");
}

function itemKindFromActivityType(activityType: ItineraryItem["activityType"]): ItineraryItem["itemKind"] {
  if (activityType === "travel") return "travel";
  if (activityType === "food") return "meal";
  if (activityType === "stay") return "lodging";
  return "activity";
}

function readOptionalTimeMode(value: unknown): ItineraryItem["timeMode"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === "scheduled" || value === "flexible") return value;
  throw new Error("Unsupported itinerary import file.");
}

function readOptionalStatus(value: unknown): ItineraryItem["status"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    value === "idea" ||
    value === "planned" ||
    value === "booked" ||
    value === "confirmed" ||
    value === "done" ||
    value === "skipped"
  )
    return value;
  throw new Error("Unsupported itinerary import file.");
}

function readOptionalPriority(value: unknown): ItineraryItem["priority"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === "low" || value === "normal" || value === "high" || value === "must") return value;
  throw new Error("Unsupported itinerary import file.");
}

function readCoordinates(value: unknown): ItineraryCoordinates | undefined {
  if (value === undefined) return undefined;
  if (
    !isRecord(value) ||
    typeof value.lat !== "number" ||
    typeof value.lng !== "number"
  )
    throw new Error("Unsupported itinerary import file.");
  return { lat: value.lat, lng: value.lng };
}

function readAdvisories(value: unknown): ItineraryAdvisory[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value))
    throw new Error("Unsupported itinerary import file.");
  return value.map((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.code !== "string" ||
      typeof entry.label !== "string"
    )
      throw new Error("Unsupported itinerary import file.");
    if (
      entry.severity !== "info" &&
      entry.severity !== "warning" &&
      entry.severity !== "critical"
    )
      throw new Error("Unsupported itinerary import file.");
    return { code: entry.code, label: entry.label, severity: entry.severity };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
