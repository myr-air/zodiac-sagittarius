import type { ItineraryItem, TripPlan } from "./types";
import { readEnum, readOptionalEnum } from "./itinerary-import-reader-utils";

const activityTypes = [
  "travel",
  "food",
  "shopping",
  "attraction",
  "experience",
  "stay",
  "default",
] as const;

const activitySubtypes = [
  "flight",
  "train",
  "bus",
  "taxi",
  "ferry",
  "walk",
  "car",
  "shuttle",
] as const;

const itemKinds = [
  "travel",
  "activity",
  "lodging",
  "meal",
  "note",
  "preparation",
  "foodRecommendation",
] as const;

const planVariantKinds = ["main", "backup", "draft", "split"] as const;
const planStatuses = ["main", "backup", "draft", "proposal"] as const;
const timeModes = ["scheduled", "flexible"] as const;
const itemStatuses = ["idea", "planned", "booked", "confirmed", "done", "skipped"] as const;
const itemPriorities = ["low", "normal", "high", "must"] as const;
const pathRoles = ["main", "alternative"] as const;

export function readActivityType(value: unknown): ItineraryItem["activityType"] {
  return readEnum(value, activityTypes);
}

export function readOptionalActivitySubtype(
  value: unknown,
): ItineraryItem["activitySubtype"] | undefined {
  return readOptionalEnum(value, activitySubtypes);
}

export function readOptionalItemKind(
  value: unknown,
): ItineraryItem["itemKind"] | undefined {
  return readOptionalEnum(value, itemKinds);
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
  return readOptionalEnum(value, timeModes);
}

export function readOptionalStatus(
  value: unknown,
): ItineraryItem["status"] | undefined {
  return readOptionalEnum(value, itemStatuses);
}

export function readOptionalPriority(
  value: unknown,
): ItineraryItem["priority"] | undefined {
  return readOptionalEnum(value, itemPriorities);
}

export function readOptionalPathRole(
  item: Record<string, unknown>,
  key: string,
): ItineraryItem["pathRole"] | undefined {
  return readOptionalEnum(item[key], pathRoles);
}
