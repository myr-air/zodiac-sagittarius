import type {
  ItineraryAdvisory,
  ItineraryCoordinates,
  ItineraryItem,
} from "../types";
import { isRecord, unsupportedImportFileError } from "./itinerary-import-reader-utils";

export { isRecord, unsupportedImportFileError } from "./itinerary-import-reader-utils";
export {
  readActivityType,
  readOptionalActivitySubtype,
  readOptionalItemKind,
  readOptionalPathRole,
  readOptionalPlanStatus,
  readOptionalPriority,
  readOptionalStatus,
  readOptionalTimeMode,
  readPlanVariantKind,
  statusFromPlanKind,
} from "./itinerary-import-enum-readers";

export function readRecordArray<T>(
  item: Record<string, unknown>,
  key: string,
): T[] {
  const value = item[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((entry) => !isRecord(entry))) {
    throw unsupportedImportFileError();
  }
  return value as T[];
}

export function readOptionalNullableString(
  item: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = item[key];
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw unsupportedImportFileError();
  return value;
}

export function readDetails(value: unknown): ItineraryItem["details"] {
  if (value === undefined || value === null) return {};
  if (!isRecord(value) || Array.isArray(value)) {
    throw unsupportedImportFileError();
  }
  return value;
}

export function readOptionalString(
  item: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = item[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw unsupportedImportFileError();
  return value;
}

export function readString(item: Record<string, unknown>, key: string): string {
  const value = item[key];
  if (typeof value !== "string") throw unsupportedImportFileError();
  return value;
}

export function readNumber(item: Record<string, unknown>, key: string): number {
  const value = item[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw unsupportedImportFileError();
  }
  return value;
}

export function readOptionalNumber(
  item: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = item[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw unsupportedImportFileError();
  }
  return value;
}

export function readCoordinates(value: unknown): ItineraryCoordinates | undefined {
  if (value === undefined) return undefined;
  if (
    !isRecord(value) ||
    typeof value.lat !== "number" ||
    typeof value.lng !== "number"
  ) {
    throw unsupportedImportFileError();
  }
  return { lat: value.lat, lng: value.lng };
}

export function readAdvisories(value: unknown): ItineraryAdvisory[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw unsupportedImportFileError();
  return value.map((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.code !== "string" ||
      typeof entry.label !== "string"
    ) {
      throw unsupportedImportFileError();
    }
    if (
      entry.severity !== "info" &&
      entry.severity !== "warning" &&
      entry.severity !== "critical"
    ) {
      throw unsupportedImportFileError();
    }
    return { code: entry.code, label: entry.label, severity: entry.severity };
  });
}
