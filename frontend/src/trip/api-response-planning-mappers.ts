import { TripApiError } from "./api-error";
import type {
  PlanVariant,
  Trip,
  TripTask,
} from "./types";
import type {
  JoinTripResponse,
  PlanVariantResponse,
  TripPlanResponse,
  TripSummaryResponse,
  TripTaskResponse,
} from "./api-response-types";
import { DEFAULT_TRIP_TIMEZONE } from "./trip-defaults";
import {
  legacyKindForPlanStatus,
  planStatusForLegacyKind,
} from "./trip-plan-aliases";

export function mapTripSummary(trip: TripSummaryResponse): Trip {
  return {
    id: trip.id,
    joinId: trip.joinId,
    joinPasswordHash: "",
    name: trip.name,
    originLabel: trip.originLabel,
    originCity: trip.originCity,
    originCountry: trip.originCountry,
    originCountryCode: trip.originCountryCode,
    destinationLabel: trip.destinationLabel,
    destinationCities: trip.destinationCities ?? [],
    countries: trip.countries ?? [],
    partySize: trip.partySize ?? 1,
    defaultTimezone: trip.defaultTimezone ?? trip.destinationCities?.[0]?.timezone ?? DEFAULT_TRIP_TIMEZONE,
    startDate: trip.startDate,
    endDate: trip.endDate,
    activePlanVariantId: trip.activePlanVariantId ?? "",
    mainTripPlanId: trip.mainTripPlanId ?? trip.activePlanVariantId ?? "",
    planVariants: [],
    tripPlans: [],
    members: [],
    itineraryItems: [],
    expenses: [],
    version: trip.version,
  };
}

export function mapJoinTripResponse(response: JoinTripResponse): JoinTripResponse {
  assertMainPlanPointerAliasesMatch(response.trip);
  return response;
}

export function mapTask(task: TripTaskResponse): TripTask {
  return {
    id: task.id,
    tripPlanId: task.tripPlanId,
    title: task.title,
    status: task.status,
    visibility: task.visibility,
    kind: task.kind,
    createdBy: task.createdBy,
    assigneeId: task.assigneeId,
    relatedItemId: task.relatedItemId,
    version: task.version,
  };
}

function mapPlanVariant(variant: PlanVariantResponse): PlanVariant {
  const status = variant.status ?? planStatusForLegacyKind(variant.kind);
  return {
    id: variant.id,
    tripId: variant.tripId,
    name: variant.name,
    kind: legacyKindForPlanStatus(status),
    status,
    description: variant.description,
    version: variant.version,
  };
}

export function mapTripPlanResponse(variant: TripPlanResponse): PlanVariant {
  return mapPlanVariant(assertTripPlanResponse(variant));
}

export function mapPlanVariantForMainPointer(
  variant: PlanVariantResponse,
  mainTripPlanId: string,
): PlanVariant {
  return normalizePlanVariantForMainPointer(mapPlanVariant(variant), mainTripPlanId);
}

export function assertTripPlanResponse(variant: PlanVariantResponse): TripPlanResponse {
  if (!variant.status) {
    throw new TripApiError({
      code: "invalid_response",
      message: "canonical trip plan response is missing status",
      status: 0,
    });
  }
  return variant as TripPlanResponse;
}

export function assertTripPlanResponseAliasesMatch(
  canonicalPlans: TripPlanResponse[],
  legacyPlans: PlanVariantResponse[],
  mainTripPlanId: string,
): void {
  if (canonicalPlans.length === 0 || legacyPlans.length === 0) return;
  if (canonicalPlans.length !== legacyPlans.length) {
    throwInvalidTripPlanAliasDrift();
  }
  for (const [index, canonicalPlan] of canonicalPlans.entries()) {
    const legacyPlan = legacyPlans[index];
    const mappedCanonicalPlan = normalizePlanVariantForMainPointer(mapPlanVariant(canonicalPlan), mainTripPlanId);
    const mappedLegacyPlan = normalizePlanVariantForMainPointer(mapPlanVariant(legacyPlan), mainTripPlanId);
    if (
      !legacyPlan ||
      canonicalPlan.id !== legacyPlan.id ||
      canonicalPlan.name !== legacyPlan.name ||
      canonicalPlan.version !== legacyPlan.version ||
      mappedCanonicalPlan.kind !== mappedLegacyPlan.kind ||
      mappedCanonicalPlan.status !== mappedLegacyPlan.status
    ) {
      throwInvalidTripPlanAliasDrift();
    }
  }
}

export function assertMainPlanPointerAliasesMatch(trip: TripSummaryResponse): void {
  if (
    trip.activePlanVariantId &&
    trip.mainTripPlanId &&
    trip.activePlanVariantId !== trip.mainTripPlanId
  ) {
    throwInvalidTripPlanAliasDrift();
  }
}

function throwInvalidTripPlanAliasDrift(): never {
  throw new TripApiError({
    code: "invalid_response",
    message: "Trip Plan compatibility aliases do not match",
    status: 0,
  });
}

function normalizePlanVariantForMainPointer(
  plan: PlanVariant,
  mainTripPlanId: string,
): PlanVariant {
  const status =
    plan.id === mainTripPlanId
      ? "main"
      : plan.status === "main"
        ? "backup"
        : plan.status ?? planStatusForLegacyKind(plan.kind);
  return {
    ...plan,
    kind: legacyKindForPlanStatus(status),
    status,
  };
}
