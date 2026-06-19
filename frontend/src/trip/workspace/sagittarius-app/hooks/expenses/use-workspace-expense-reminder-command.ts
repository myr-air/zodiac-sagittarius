import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  buildExpenseReminderRequest,
  recordLocalExpenseReminderInTrip,
} from "@/src/trip/expenses";
import { nextClientMutationId } from "@/src/trip/local-ids";
import type {
  ExpenseSummary,
  SettlementSuggestion,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";

interface UseWorkspaceExpenseReminderCommandOptions {
  apiClient?: TripApiClient;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  selectedTripPlanId: string;
  setBackendExpenseSummary: (
    summary: { tripPlanId: string; summary: ExpenseSummary } | null,
  ) => void;
  trip: Trip;
}

export function useWorkspaceExpenseReminderCommand({
  apiClient,
  commitTrip,
  isApiMode,
  participantSession,
  selectedTripPlanId,
  setBackendExpenseSummary,
  trip,
}: UseWorkspaceExpenseReminderCommandOptions) {
  return useCallback(async (suggestion: SettlementSuggestion) => {
    if (isApiMode && apiClient && participantSession) {
      setBackendExpenseSummary({
        tripPlanId: selectedTripPlanId,
        summary: await apiClient.recordExpenseReminder(
          trip.id,
          participantSession.sessionToken,
          buildExpenseReminderRequest(suggestion, {
            clientMutationId: nextClientMutationId("expense-reminder"),
          }),
          selectedTripPlanId,
        ),
      });
      return;
    }
    commitTrip((current) =>
      recordLocalExpenseReminderInTrip(current, suggestion, {
        tripPlanId: selectedTripPlanId,
        remindedAt: new Date().toISOString(),
      }),
    );
  }, [
    apiClient,
    commitTrip,
    isApiMode,
    participantSession,
    selectedTripPlanId,
    setBackendExpenseSummary,
    trip.id,
  ]);
}
