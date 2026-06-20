import type { ItineraryItem, TripPlan } from "./types";
import {
  activitySubtypeValues,
  activityTypeValues,
  itineraryItemKindValues,
  itineraryItemPriorityValues,
  itineraryItemStatusValues,
  itineraryPathRoleValues,
  itineraryTimeModeValues,
} from "./trip-itinerary-types";
import { readEnum, readOptionalEnum } from "./itinerary-import-reader-utils";

const planVariantKinds = ["main", "backup", "draft", "split"] as const;
const planStatuses = ["main", "backup", "draft", "proposal"] as const;

export function readActivityType(value: unknown): ItineraryItem["activityType"] {
  return readEnum(value, activityTypeValues);
}

export function readOptionalActivitySubtype(
  value: unknown,
): ItineraryItem["activitySubtype"] | undefined {
  return readOptionalEnum(value, activitySubtypeValues);
}

export function readOptionalItemKind(
  value: unknown,
): ItineraryItem["itemKind"] | undefined {
  return readOptionalEnum(value, itineraryItemKindValues);
}

export function readPlanVariantKind(value: unknown): TripPlan["kind"] {
  return readEnum(value, planVariantKinds);
}

export function readOptionalPlanStatus(value: unknown): TripPlan["status"] | undefined {
  return readOptionalEnum(value, planStatuses);
}

export function statusFromPlanKind(kind: TripPlan["kind"]): TripPlan["status"] {
  return kind === "split" ? "proposal" : kind;
}

export function readOptionalTimeMode(
  value: unknown,
): ItineraryItem["timeMode"] | undefined {
  return readOptionalEnum(value, itineraryTimeModeValues);
}

export function readOptionalStatus(
  value: unknown,
): ItineraryItem["status"] | undefined {
  return readOptionalEnum(value, itineraryItemStatusValues);
}

export function readOptionalPriority(
  value: unknown,
): ItineraryItem["priority"] | undefined {
  return readOptionalEnum(value, itineraryItemPriorityValues);
}

export function readOptionalPathRole(
  item: Record<string, unknown>,
  key: string,
): ItineraryItem["pathRole"] | undefined {
  return readOptionalEnum(item[key], itineraryPathRoleValues);
}
