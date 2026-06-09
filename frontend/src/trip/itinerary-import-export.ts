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
    day: readString(item, "day"),
    sortOrder: readNumber(item, "sortOrder"),
    startTime: readString(item, "startTime"),
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
