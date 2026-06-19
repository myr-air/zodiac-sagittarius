import { useCallback } from "react";
import {
  type BookingDocInputLike,
  bookingDocInputForExpenseEstimate,
} from "@/src/trip/booking-docs";
import type { Expense, Trip } from "@/src/trip/types";

interface UseWorkspaceExpenseEstimateCommandOptions {
  canEditBookings: boolean;
  createBookingDoc: (input: BookingDocInputLike) => Promise<unknown>;
  currentMemberId: string;
  selectedTripPlanId: string;
  trip: Trip;
}

export function useWorkspaceExpenseEstimateCommand({
  canEditBookings,
  createBookingDoc,
  currentMemberId,
  selectedTripPlanId,
  trip,
}: UseWorkspaceExpenseEstimateCommandOptions) {
  return useCallback(async (expense: Expense) => {
    if (!canEditBookings) return;
    await createBookingDoc(
      bookingDocInputForExpenseEstimate(expense, {
        currentMemberId,
        defaultTimezone: trip.defaultTimezone,
        members: trip.members,
        itineraryItems: trip.itineraryItems,
        selectedTripPlanId,
        mainTripPlanId: trip.mainTripPlanId,
        activePlanVariantId: trip.activePlanVariantId,
      }),
    );
  }, [
    canEditBookings,
    createBookingDoc,
    currentMemberId,
    selectedTripPlanId,
    trip.activePlanVariantId,
    trip.defaultTimezone,
    trip.itineraryItems,
    trip.mainTripPlanId,
    trip.members,
  ]);
}
