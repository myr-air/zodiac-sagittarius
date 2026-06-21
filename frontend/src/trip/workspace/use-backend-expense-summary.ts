import { useCallback, useEffect, useState } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import { isAuthFailure } from "@/src/trip/api-client";
import type {
  ExpenseSummary,
  TripParticipantSession,
} from "@/src/trip/types";

interface UseBackendExpenseSummaryOptions {
  apiClient?: TripApiClient;
  canViewExpenses: boolean;
  enabled: boolean;
  hasSelectedTripPlan: boolean;
  isApiMode: boolean;
  isCockpitLoaded: boolean;
  onUnauthenticated: () => void;
  participantSession: TripParticipantSession | null;
  selectedTripPlanId: string;
  tripId: string;
}

export function useBackendExpenseSummary({
  apiClient,
  canViewExpenses,
  enabled,
  hasSelectedTripPlan,
  isApiMode,
  isCockpitLoaded,
  onUnauthenticated,
  participantSession,
  selectedTripPlanId,
  tripId,
}: UseBackendExpenseSummaryOptions) {
  const [backendExpenseSummary, setBackendExpenseSummary] =
    useState<{ tripPlanId: string; summary: ExpenseSummary } | null>(null);

  const resetBackendExpenseSummary = useCallback(() => {
    setBackendExpenseSummary(null);
  }, []);

  const refreshBackendExpenseSummary = useCallback(async () => {
    if (!apiClient || !participantSession || !selectedTripPlanId) return null;
    const summary = await apiClient.getExpenseSummary(
      tripId,
      participantSession.sessionToken,
      selectedTripPlanId,
    );
    setBackendExpenseSummary({ tripPlanId: selectedTripPlanId, summary });
    return summary;
  }, [apiClient, participantSession, selectedTripPlanId, tripId]);

  useEffect(() => {
    if (
      !isApiMode ||
      !participantSession ||
      !apiClient ||
      !isCockpitLoaded ||
      !canViewExpenses ||
      !enabled ||
      !hasSelectedTripPlan ||
      !selectedTripPlanId
    ) {
      return undefined;
    }
    if (backendExpenseSummary?.tripPlanId === selectedTripPlanId) {
      return undefined;
    }

    let cancelled = false;
    void Promise.resolve(
      apiClient.getExpenseSummary(
        tripId,
        participantSession.sessionToken,
        selectedTripPlanId,
      ),
    )
      .then((summary) => {
        if (cancelled || !summary) return;
        setBackendExpenseSummary({ tripPlanId: selectedTripPlanId, summary });
      })
      .catch((caught) => {
        if (cancelled) return;
        if (isAuthFailure(caught)) onUnauthenticated();
      });

    return () => {
      cancelled = true;
    };
  }, [
    apiClient,
    backendExpenseSummary?.tripPlanId,
    canViewExpenses,
    enabled,
    hasSelectedTripPlan,
    isApiMode,
    isCockpitLoaded,
    onUnauthenticated,
    participantSession,
    selectedTripPlanId,
    tripId,
  ]);

  return {
    backendExpenseSummary,
    refreshBackendExpenseSummary,
    resetBackendExpenseSummary,
    setBackendExpenseSummary,
  };
}
