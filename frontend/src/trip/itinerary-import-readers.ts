import type {
  ItineraryAdvisory,
  ItineraryCoordinates,
  ItineraryItem,
  TripPlan,
} from "./types";

const unsupportedImportFileMessage = "Unsupported itinerary import file.";

export function unsupportedImportFileError(): Error {
  return new Error(unsupportedImportFileMessage);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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

export function readOptionalPathRole(
  item: Record<string, unknown>,
  key: string,
): ItineraryItem["pathRole"] | undefined {
  const value = item[key];
  if (value === undefined || value === null) return undefined;
  if (value === "main" || value === "alternative") return value;
  throw unsupportedImportFileError();
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

export function readActivityType(value: unknown): ItineraryItem["activityType"] {
  if (
    value === "travel" ||
    value === "food" ||
    value === "shopping" ||
    value === "attraction" ||
    value === "experience" ||
    value === "stay" ||
    value === "default"
  ) {
    return value;
  }
  throw unsupportedImportFileError();
}

export function readOptionalActivitySubtype(
  value: unknown,
): ItineraryItem["activitySubtype"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    value === "flight" ||
    value === "train" ||
    value === "bus" ||
    value === "taxi" ||
    value === "ferry" ||
    value === "walk" ||
    value === "car" ||
    value === "shuttle"
  ) {
    return value;
  }
  throw unsupportedImportFileError();
}

export function readOptionalItemKind(
  value: unknown,
): ItineraryItem["itemKind"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    value === "travel" ||
    value === "activity" ||
    value === "lodging" ||
    value === "meal" ||
    value === "note" ||
    value === "preparation" ||
    value === "foodRecommendation"
  ) {
    return value;
  }
  throw unsupportedImportFileError();
}

export function readPlanVariantKind(value: unknown): TripPlan["kind"] {
  if (
    value === "main" ||
    value === "backup" ||
    value === "draft" ||
    value === "split"
  ) {
    return value;
  }
  throw unsupportedImportFileError();
}

export function readOptionalPlanStatus(value: unknown): TripPlan["status"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    value === "main" ||
    value === "backup" ||
    value === "draft" ||
    value === "proposal"
  ) {
    return value;
  }
  throw unsupportedImportFileError();
}

export function statusFromPlanKind(kind: TripPlan["kind"]): TripPlan["status"] {
  return kind === "split" ? "proposal" : kind;
}

export function readOptionalTimeMode(
  value: unknown,
): ItineraryItem["timeMode"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === "scheduled" || value === "flexible") return value;
  throw unsupportedImportFileError();
}

export function readOptionalStatus(
  value: unknown,
): ItineraryItem["status"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    value === "idea" ||
    value === "planned" ||
    value === "booked" ||
    value === "confirmed" ||
    value === "done" ||
    value === "skipped"
  ) {
    return value;
  }
  throw unsupportedImportFileError();
}

export function readOptionalPriority(
  value: unknown,
): ItineraryItem["priority"] | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    value === "low" ||
    value === "normal" ||
    value === "high" ||
    value === "must"
  ) {
    return value;
  }
  throw unsupportedImportFileError();
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
