import { useMemo } from "react";
import { buildItineraryCommitmentsByItemId } from "@/src/trip/itinerary-core";
import {
  buildExpenseSummary,
  filterExpenseRemindersForTripPlan,
} from "@/src/trip/expenses";
import { selectTripPlanRecords } from "@/src/trip/workspace/trip-plan-records";
import type {
  ExpenseSummary,
  ItineraryItem,
  StopNote,
  Suggestion,
  Trip,
  TripTask,
} from "@/src/trip/types";

interface UseTripWorkspaceRecordsOptions {
  activePlanItems: ItineraryItem[];
  backendExpenseSummary: { tripPlanId: string; summary: ExpenseSummary } | null;
  currentMemberId: string;
  selectedTripPlanId: string;
  stopNotes: StopNote[];
  suggestions: Suggestion[];
  tasks: TripTask[];
  trip: Trip;
}

export function useTripWorkspaceRecords({
  activePlanItems,
  backendExpenseSummary,
  currentMemberId,
  selectedTripPlanId,
  stopNotes,
  suggestions,
  tasks,
  trip,
}: UseTripWorkspaceRecordsOptions) {
  const scopedTripPlanRecords = useMemo(
    () =>
      selectTripPlanRecords(trip, selectedTripPlanId, {
        stopNotes,
        tasks,
      }),
    [selectedTripPlanId, stopNotes, tasks, trip],
  );
  const expenseSummary = useMemo(
    () => {
      if (backendExpenseSummary?.tripPlanId === selectedTripPlanId) {
        return backendExpenseSummary.summary;
      }

      return buildExpenseSummary(
        scopedTripPlanRecords.expenses,
        currentMemberId,
        filterExpenseRemindersForTripPlan(
          trip.expenseReminders ?? [],
          selectedTripPlanId,
          trip.mainTripPlanId || trip.activePlanVariantId,
        ),
      );
    },
    [
      backendExpenseSummary,
      currentMemberId,
      selectedTripPlanId,
      trip.expenseReminders,
      trip.mainTripPlanId,
      trip.activePlanVariantId,
      scopedTripPlanRecords.expenses,
    ],
  );
  const scopedTripForRecords = useMemo(
    () => ({
      ...trip,
      bookingDocs: scopedTripPlanRecords.bookingDocs,
      expenses: scopedTripPlanRecords.expenses,
      itineraryItems: activePlanItems,
      stopNotes: scopedTripPlanRecords.stopNotes,
    }),
    [
      activePlanItems,
      scopedTripPlanRecords.bookingDocs,
      scopedTripPlanRecords.expenses,
      scopedTripPlanRecords.stopNotes,
      trip,
    ],
  );
  const scopedSuggestions = useMemo(
    () =>
      suggestions.filter(
        (suggestion) => suggestion.planVariantId === selectedTripPlanId,
      ),
    [selectedTripPlanId, suggestions],
  );
  const itineraryCommitmentsByItemId = useMemo(
    () =>
      buildItineraryCommitmentsByItemId({
        bookingDocs: scopedTripPlanRecords.bookingDocs,
        expenses: scopedTripPlanRecords.expenses,
        stopNotes: scopedTripPlanRecords.stopNotes,
        tasks: scopedTripPlanRecords.tasks,
      }),
    [scopedTripPlanRecords],
  );

  return {
    expenseSummary,
    itineraryCommitmentsByItemId,
    scopedSuggestions,
    scopedTripForRecords,
    scopedTripPlanRecords,
  };
}
