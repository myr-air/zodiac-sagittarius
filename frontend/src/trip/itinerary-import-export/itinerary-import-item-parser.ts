import { itemKindFromActivityType } from "../itinerary-items";
import { safeExternalHref } from "../places";
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
  readOptionalPathRole,
  readOptionalPriority,
  readOptionalStatus,
  readOptionalString,
  readOptionalTimeMode,
  readString,
  unsupportedImportFileError,
} from "./itinerary-import-readers";
import type { ItineraryExportItem } from "./itinerary-import-export-types";

export function parseExportItem(value: unknown): ItineraryExportItem {
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
