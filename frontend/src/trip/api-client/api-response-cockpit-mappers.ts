import { TripApiError } from "../api-error";
import { mapItineraryItem } from "./api-response-itinerary-mappers";
import { mapMember } from "./api-response-member-mappers";
import {
  assertMainPlanPointerAliasesMatch,
  assertTripPlanResponse,
  assertTripPlanResponseAliasesMatch,
  mapPlanVariantForMainPointer,
  mapTask,
  mapTripSummary,
} from "./api-response-planning-mappers";
import { mapExpense } from "./api-response-record-mappers";
import type {
  PlanVariantResponse,
  TripCockpit,
  TripCockpitResponse,
} from "./api-response-types";

export function mapCockpitResponse(response: TripCockpitResponse): TripCockpit {
  if (!Array.isArray(response.bookingDocs)) {
    throw new TripApiError({
      code: "invalid_response",
      message: "cockpit response is missing bookingDocs",
      status: 0,
    });
  }
  if (!Array.isArray(response.photoAlbumLinks)) {
    throw new TripApiError({
      code: "invalid_response",
      message: "cockpit response is missing photoAlbumLinks",
      status: 0,
    });
  }
  const legacyPlanResponses = response.planVariants ?? [];
  const canonicalPlanResponses = (response.tripPlans ?? []).map(assertTripPlanResponse);
  assertMainPlanPointerAliasesMatch(response.trip);
  const mainTripPlanIdForAliasCheck =
    response.trip.mainTripPlanId ??
    response.trip.activePlanVariantId ??
    canonicalPlanResponses[0]?.id ??
    legacyPlanResponses[0]?.id ??
    "";
  assertTripPlanResponseAliasesMatch(
    canonicalPlanResponses,
    legacyPlanResponses,
    mainTripPlanIdForAliasCheck,
  );
  const planResponses: PlanVariantResponse[] = canonicalPlanResponses.length ? canonicalPlanResponses : legacyPlanResponses;
  const mainTripPlanId = response.trip.mainTripPlanId ?? response.trip.activePlanVariantId ?? planResponses[0]?.id ?? "";
  const activePlanVariantId = response.trip.activePlanVariantId ?? mainTripPlanId;
  const mappedPlanVariants = planResponses.map((plan) =>
    mapPlanVariantForMainPointer(plan, mainTripPlanId),
  );
  const mappedTripPlans = planResponses.map((plan) =>
    mapPlanVariantForMainPointer(plan, mainTripPlanId),
  );
  return {
    trip: {
      ...mapTripSummary(response.trip),
      activePlanVariantId,
      mainTripPlanId,
      planVariants: mappedPlanVariants,
      tripPlans: mappedTripPlans,
      members: response.members.map(mapMember),
      itineraryItems: response.itineraryItems.map(mapItineraryItem),
      expenses: response.expenses.map(mapExpense),
      bookingDocs: response.bookingDocs,
      photoAlbumLinks: response.photoAlbumLinks,
    },
    suggestions: response.suggestions,
    tasks: response.tasks.map(mapTask),
    stopNotes: response.stopNotes,
    expenseSummary: response.expenseSummary,
    latestPlanCheck: response.latestPlanCheck ?? null,
  };
}
