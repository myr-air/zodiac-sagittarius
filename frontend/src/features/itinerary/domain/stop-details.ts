import type { ActivityType, ItineraryItem, ItineraryItemKind } from "@/src/trip/types";
import {
  emptyStopDetailValues,
  stopDetailTypeToActivityType,
  type StopDetailType,
  type StopDetailValues,
} from "./stop-detail-definitions";

export {
  emptyStopDetailValues,
  stopDetailLabels,
  stopDetailTypeOptions,
  stopDetailTypeToActivityType,
} from "./stop-detail-definitions";
export type {
  StopDetailType,
  StopDetailValues,
} from "./stop-detail-definitions";

export function buildStructuredStopDetails(detailType: StopDetailType, detailValues: StopDetailValues): Record<string, unknown> {
  const details = trimmedStopDetailValues(detailValues);
  const nextDetails: Record<string, unknown> = { kind: detailType };

  for (const key of detailKeysForType(detailType)) {
    const value = details[key];
    if (value) {
      nextDetails[key] = value;
    }
  }
  return nextDetails;
}

export function detailKeysForType(detailType: StopDetailType): Array<keyof StopDetailValues> {
  if (detailType === "transportation") {
    return ["origin", "destination", "mode", "ticketRef", "costNote"];
  }
  if (detailType === "stay") {
    return ["entryWindow", "bookingRef", "detail"];
  }
  if (detailType === "task") {
    return ["detail", "meetingPoint"];
  }
  return ["provider", "meetingPoint", "bookingRef"];
}

export function structuredStopDetailValues(details: Record<string, unknown> | undefined): Partial<StopDetailValues> {
  if (!details) return {};
  return Object.fromEntries(
    Object.keys(emptyStopDetailValues)
      .map((key) => [key, readStringDetail(details[key])] as const)
      .filter(([, value]) => value),
  ) as Partial<StopDetailValues>;
}

export function resolveStopActivityType(
  detailType: StopDetailType,
  currentActivityType: ActivityType,
): ActivityType {
  if (detailType === "transportation" || detailType === "stay") {
    return stopDetailTypeToActivityType[detailType];
  }
  if (detailType === "experience") {
    return currentActivityType === "travel" || currentActivityType === "stay"
      ? "experience"
      : currentActivityType;
  }
  return "experience";
}

export function itemKindForStopDetailType(detailType: StopDetailType): ItineraryItemKind {
  if (detailType === "transportation") return "travel";
  if (detailType === "stay") return "lodging";
  if (detailType === "task") return "note";
  return "activity";
}

export function detailTypeFromItem(item: ItineraryItem | undefined): StopDetailType {
  const rawKind = item?.details?.kind;
  if (
    rawKind === "transportation" ||
    rawKind === "stay" ||
    rawKind === "experience" ||
    rawKind === "task"
  ) {
    return rawKind;
  }
  return detailTypeFromActivityType(item?.activityType ?? "experience");
}

export const stopDetailTypeFromItem = detailTypeFromItem;

export function detailTypeFromActivityType(activityType: ActivityType): StopDetailType {
  if (activityType === "travel") return "transportation";
  if (activityType === "stay") return "stay";
  return "experience";
}

export function readStringDetail(values: unknown): string {
  return typeof values === "string" ? values : "";
}

function trimmedStopDetailValues(values: StopDetailValues): StopDetailValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim()]),
  ) as StopDetailValues;
}
