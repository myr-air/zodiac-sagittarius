import { useMemo } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import type { PlaceResolver } from "@/src/trip/place-resolution";
import type { TripParticipantSession } from "@/src/trip/types";

interface UseEffectivePlaceResolverOptions {
  apiClient?: Pick<TripApiClient, "resolvePlace">;
  participantSession: TripParticipantSession | null;
  placeResolver?: PlaceResolver;
  tripId: string;
}

export function useEffectivePlaceResolver({
  apiClient,
  participantSession,
  placeResolver,
  tripId,
}: UseEffectivePlaceResolverOptions): PlaceResolver | null {
  return useMemo(() => {
    if (placeResolver) return placeResolver;
    if (!apiClient?.resolvePlace || !participantSession) return null;
    return (request) =>
      apiClient.resolvePlace!(
        tripId,
        participantSession.sessionToken,
        request,
      );
  }, [apiClient, participantSession, placeResolver, tripId]);
}
