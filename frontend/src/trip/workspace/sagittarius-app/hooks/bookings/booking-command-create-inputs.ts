import {
  type BookingDocInputLike,
  normalizeBookingDocTitle,
  resolveBookingDocCreateTripPlanId,
} from "@/src/trip/booking-docs";
import type { Trip } from "@/src/trip/types";
import { tripPlanIdForBookingRecord } from "@/src/trip/workspace/trip-plan-records";

interface WorkspaceBookingDocCreateInputContext {
  selectedTripPlanId: string;
  trip: Trip;
}

interface WorkspaceBookingDocCreateInput {
  title: string;
  tripPlanId: string | null;
}

export function buildWorkspaceBookingDocCreateInput(
  input: BookingDocInputLike,
  { selectedTripPlanId, trip }: WorkspaceBookingDocCreateInputContext,
): WorkspaceBookingDocCreateInput | null {
  const title = normalizeBookingDocTitle(input);
  if (!title) return null;

  return {
    title,
    tripPlanId: resolveBookingDocCreateTripPlanId(trip, input, {
      resolveTripPlanId: tripPlanIdForBookingRecord,
      selectedTripPlanId,
    }) ?? null,
  };
}
