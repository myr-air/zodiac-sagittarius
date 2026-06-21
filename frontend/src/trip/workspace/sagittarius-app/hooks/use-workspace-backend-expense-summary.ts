import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import { clearParticipantSession } from "@/src/trip/auth";
import {
  type PlanningView,
  workspaceViewShouldSyncBackendExpenseSummary,
} from "@/src/trip/workspace/planning-view";
import { tripHasPlan } from "@/src/trip/workspace/selected-trip-plan";
import { useBackendExpenseSummary } from "@/src/trip/workspace/use-backend-expense-summary";
import type { Trip, TripParticipantSession } from "@/src/trip/types";

interface UseWorkspaceBackendExpenseSummaryOptions {
  apiClient?: TripApiClient;
  canViewExpenses: boolean;
  currentView: PlanningView;
  isApiMode: boolean;
  isCockpitLoaded: boolean;
  participantSession: TripParticipantSession | null;
  selectedTripPlanId: string;
  setAccessError: (error: "unauthenticated" | "forbidden" | null) => void;
  setParticipantSession: Dispatch<SetStateAction<TripParticipantSession | null>>;
  trip: Trip;
}

export function useWorkspaceBackendExpenseSummary({
  apiClient,
  canViewExpenses,
  currentView,
  isApiMode,
  isCockpitLoaded,
  participantSession,
  selectedTripPlanId,
  setAccessError,
  setParticipantSession,
  trip,
}: UseWorkspaceBackendExpenseSummaryOptions) {
  const shouldSyncBackendExpenseSummary =
    workspaceViewShouldSyncBackendExpenseSummary(currentView);
  const hasSelectedBackendExpenseTripPlan = Boolean(
    selectedTripPlanId && tripHasPlan(trip, selectedTripPlanId),
  );
  const handleBackendExpenseAuthFailure = useCallback(() => {
    clearParticipantSession();
    setParticipantSession(null);
    setAccessError("unauthenticated");
  }, [setAccessError, setParticipantSession]);

  return useBackendExpenseSummary({
    apiClient,
    canViewExpenses,
    enabled: shouldSyncBackendExpenseSummary,
    hasSelectedTripPlan: hasSelectedBackendExpenseTripPlan,
    isApiMode,
    isCockpitLoaded,
    onUnauthenticated: handleBackendExpenseAuthFailure,
    participantSession,
    selectedTripPlanId,
    tripId: trip.id,
  });
}
