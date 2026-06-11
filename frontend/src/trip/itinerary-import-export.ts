import type {
  ItineraryAdvisory,
  ItineraryCoordinates,
  ItineraryItem,
  Trip,
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
      | "partySize"
      | "defaultTimezone"
  >;
  items: ItineraryExportItem[];
}

export function buildItineraryExport({
  exportedAt,
  items,
  trip,
}: {
  exportedAt: string;
  items: ItineraryItem[];
  trip: Trip;
}): ItineraryExportDocument {
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
      partySize: trip.partySize,
      defaultTimezone: trip.defaultTimezone,
    },
    items: items.map(toExportItem),
  };
}

export function parseItineraryImport(source: string): ItineraryExportItem[] {
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

  return parsed.items.map(parseExportItem);
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
