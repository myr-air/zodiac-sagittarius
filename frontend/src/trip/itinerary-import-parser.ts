import type { TripPlan } from "./types";
import {
  itineraryExportSchema,
  itineraryExportVersion,
} from "./itinerary-import-export-schema";
import { itemKindFromActivityType } from "./itinerary-item-kind";
import { parseSpreadsheetItineraryImportDocument } from "./itinerary-spreadsheet-import";
import { safeExternalHref } from "./safe-links";
import {
  isRecord,
  readActivityType,
  readAdvisories,
  readCoordinates,
  readDetails,
  readNumber,
  readOptionalActivitySubtype,
  readOptionalItemKind,
  readOptionalNullableString,
  readOptionalNumber,
  readOptionalPathRole,
  readOptionalPlanStatus,
  readOptionalPriority,
  readOptionalStatus,
  readOptionalString,
  readOptionalTimeMode,
  readPlanVariantKind,
  readRecordArray,
  readString,
  statusFromPlanKind,
  unsupportedImportFileError,
} from "./itinerary-import-readers";
import type {
  ItineraryExportDocument,
  ItineraryExportItem,
  ItineraryExportRecords,
} from "./itinerary-import-export-types";

export function parseItineraryImport(source: string): ItineraryExportItem[] {
  return parseItineraryImportDocument(source).items;
}

export function parseItineraryImportDocument(
  source: string,
): ItineraryExportDocument {
  const normalizedSource = stripByteOrderMark(source);
  if (!looksLikeJsonImport(normalizedSource)) {
    const spreadsheetDocument =
      parseSpreadsheetItineraryImportDocument(normalizedSource);
    return {
      ...spreadsheetDocument,
      items: normalizeImportedHierarchy(spreadsheetDocument.items),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalizedSource);
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
    source:
      parsed.source === "json" ||
      parsed.source === "ai" ||
      parsed.source === "csv" ||
      parsed.source === "pasted-table"
        ? parsed.source
        : undefined,
    exportedAt: readString(parsed, "exportedAt"),
    trip: parseExportTrip(parsed.trip),
    items: normalizeImportedHierarchy(parsed.items.map(parseExportItem)),
    records: parseExportRecords(parsed.records),
  };
}

function looksLikeJsonImport(source: string): boolean {
  const trimmed = source.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed === "";
}

function stripByteOrderMark(source: string): string {
  return source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
}

function parseExportTrip(value: unknown): ItineraryExportDocument["trip"] {
  if (value === undefined || value === null) {
    return {
      id: "",
      name: "",
      destinationLabel: "",
      startDate: "",
      endDate: "",
      activePlanVariantId: "",
      mainTripPlanId: undefined,
      planVariants: [],
      tripPlans: [],
      partySize: undefined,
      defaultTimezone: undefined,
    };
  }
  if (!isRecord(value)) throw new Error("Unsupported itinerary import file.");
  const tripPlanAliases = readTripPlanAliases(value);
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
    planVariants: tripPlanAliases.planVariants,
    tripPlans: tripPlanAliases.tripPlans,
    partySize: readOptionalNumber(value, "partySize"),
    defaultTimezone: readOptionalString(value, "defaultTimezone"),
  };
}

function readTripPlanAliases(value: Record<string, unknown>): {
  planVariants: TripPlan[];
  tripPlans: TripPlan[];
} {
  const canonical = readTripPlans(value.tripPlans);
  const legacy = readTripPlans(value.planVariants);
  if (canonical.length > 0 && legacy.length > 0) {
    assertTripPlanAliasesMatch(canonical, legacy);
    return {
      planVariants: canonical,
      tripPlans: canonical,
    };
  }
  const plans = canonical.length > 0 ? canonical : legacy;
  return {
    planVariants: plans,
    tripPlans: plans,
  };
}

function readTripPlans(value: unknown): TripPlan[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((entry) => !isRecord(entry))) {
    throw unsupportedImportFileError();
  }
  return value.map((entry) => {
    const plan = entry as Record<string, unknown>;
    const kind = readPlanVariantKind(plan.kind);
    return {
      id: readString(plan, "id"),
      tripId: readString(plan, "tripId"),
      name: readString(plan, "name"),
      kind,
      status: readOptionalPlanStatus(plan.status) ?? statusFromPlanKind(kind),
      description: typeof plan.description === "string" ? plan.description : "",
      version: readOptionalNumber(plan, "version"),
    };
  });
}

function assertTripPlanAliasesMatch(
  canonical: TripPlan[],
  legacy: TripPlan[],
): void {
  if (canonical.length !== legacy.length) {
    throw unsupportedImportFileError();
  }
  for (const [index, canonicalPlan] of canonical.entries()) {
    const legacyPlan = legacy[index];
    if (
      !legacyPlan ||
      canonicalPlan.id !== legacyPlan.id ||
      canonicalPlan.name !== legacyPlan.name ||
      canonicalPlan.version !== legacyPlan.version ||
      canonicalPlan.kind !== legacyPlan.kind ||
      canonicalPlan.status !== legacyPlan.status
    ) {
      throw unsupportedImportFileError();
    }
  }
}

function parseExportRecords(value: unknown): ItineraryExportRecords {
  if (value === undefined || value === null) {
    return { expenses: [], bookingDocs: [], stopNotes: [], tasks: [] };
  }
  if (!isRecord(value) || Array.isArray(value)) {
    throw unsupportedImportFileError();
  }
  return {
    expenses: readRecordArray(value, "expenses"),
    bookingDocs: readRecordArray(value, "bookingDocs"),
    stopNotes: readRecordArray(value, "stopNotes"),
    tasks: readRecordArray(value, "tasks"),
  };
}

function parseExportItem(value: unknown): ItineraryExportItem {
  if (!isRecord(value)) throw unsupportedImportFileError();
  const item = value as Record<string, unknown>;

  return {
    id: readString(item, "id"),
    pathGroupId: readOptionalString(item, "pathGroupId"),
    pathId: readOptionalString(item, "pathId"),
    pathName: readOptionalString(item, "pathName"),
    pathRole: readOptionalPathRole(item, "pathRole"),
    itemKind:
      readOptionalItemKind(item.itemKind) ??
      itemKindFromActivityType(readActivityType(item.activityType)),
    timeMode:
      readOptionalTimeMode(item.timeMode) ??
      (item.startTime === null ? "flexible" : "scheduled"),
    parentItemId: readOptionalNullableString(item, "parentItemId"),
    isPlanBlock: typeof item.isPlanBlock === "boolean" ? item.isPlanBlock : false,
    status: readOptionalStatus(item.status) ?? "planned",
    priority: readOptionalPriority(item.priority) ?? "normal",
    day: readString(item, "day"),
    sortOrder: readNumber(item, "sortOrder"),
    startTime: item.startTime === null ? "" : readString(item, "startTime"),
    endTime: readOptionalNullableString(item, "endTime"),
    endOffsetDays:
      item.endOffsetDays === undefined ? 0 : readNumber(item, "endOffsetDays"),
    activity: readString(item, "activity"),
    activityType: readActivityType(item.activityType),
    activitySubtype: readOptionalActivitySubtype(item.activitySubtype) ?? null,
    place: readString(item, "place"),
    linkLabel: typeof item.linkLabel === "string" ? item.linkLabel : "Map",
    mapLink: typeof item.mapLink === "string" ? safeExternalHref(item.mapLink) : "",
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

function normalizeImportedHierarchy(
  items: ItineraryExportItem[],
): ItineraryExportItem[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const parentIds = new Set<string>();
  for (const item of items) {
    if (item.parentItemId) parentIds.add(item.parentItemId);
  }

  return items.map((item) => {
    if (!item.parentItemId) {
      return parentIds.has(item.id) ? { ...item, isPlanBlock: true } : item;
    }
    const parent = itemsById.get(item.parentItemId);
    if (!parent) throw unsupportedImportFileError();
    if (parent.parentItemId || item.day !== parent.day) {
      throw unsupportedImportFileError();
    }
    return { ...item, isPlanBlock: false };
  });
}
