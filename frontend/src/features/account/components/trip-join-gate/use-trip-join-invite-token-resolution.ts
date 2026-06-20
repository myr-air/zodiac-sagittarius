import { useEffect, useRef } from "react";
import type { JoinTripResponse, TripApiClient } from "@/src/trip/api-client";
import { errorMessage } from "./trip-join-gate.support";

interface UseTripJoinInviteTokenResolutionInput {
  apiClient?: Pick<TripApiClient, "resolveJoinInviteToken">;
  fallbackError: string;
  initialJoinToken?: string | null;
  onError: (message: string) => void;
  onResolved: (response: JoinTripResponse) => void;
  onSettled: () => void;
}

export function useTripJoinInviteTokenResolution({
  apiClient,
  fallbackError,
  initialJoinToken,
  onError,
  onResolved,
  onSettled,
}: UseTripJoinInviteTokenResolutionInput) {
  const resolvedInitialJoinTokenRef = useRef(false);

  useEffect(() => {
    if (
      resolvedInitialJoinTokenRef.current ||
      !initialJoinToken ||
      !apiClient?.resolveJoinInviteToken
    ) {
      return;
    }
    let cancelled = false;
    resolvedInitialJoinTokenRef.current = true;
    apiClient.resolveJoinInviteToken(initialJoinToken)
      .then((response) => {
        if (cancelled) return;
        onResolved(response);
      })
      .catch((caught) => {
        if (cancelled) return;
        onError(errorMessage(caught, fallbackError));
      })
      .finally(() => {
        if (!cancelled) onSettled();
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient, fallbackError, initialJoinToken, onError, onResolved, onSettled]);
}
