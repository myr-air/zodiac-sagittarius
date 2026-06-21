import { useCallback, useMemo, useState } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  applyDailyBriefingOverrides,
  buildFallbackBriefings,
  buildPatchDailyBriefingRequest,
} from "@/src/trip/weather";
import { nextClientMutationId } from "@/src/trip/identity";
import type {
  DailyBriefingOverrides,
  Trip,
  TripDailyBriefing,
  TripParticipantSession,
} from "@/src/trip/types";

interface UseDailyBriefingsOptions {
  apiClient?: TripApiClient;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  trip: Trip;
}

export function useDailyBriefings({
  apiClient,
  isApiMode,
  participantSession,
  trip,
}: UseDailyBriefingsOptions) {
  const [dailyBriefings, setDailyBriefings] = useState<TripDailyBriefing[]>([]);
  const visibleDailyBriefings = useMemo(
    () =>
      dailyBriefings.length ? dailyBriefings : buildFallbackBriefings(trip),
    [dailyBriefings, trip],
  );

  const resetDailyBriefings = useCallback(() => {
    setDailyBriefings([]);
  }, []);

  const replaceDailyBriefings = useCallback((briefings: TripDailyBriefing[]) => {
    setDailyBriefings(briefings);
  }, []);

  const saveDailyBriefingOverrides = useCallback(
    async (
      date: string,
      version: number,
      overrides: DailyBriefingOverrides,
    ) => {
      if (isApiMode && apiClient && participantSession) {
        const patched = await apiClient.patchDailyBriefing(
          trip.id,
          date,
          participantSession.sessionToken,
          buildPatchDailyBriefingRequest(overrides, {
            clientMutationId: nextClientMutationId("daily-briefing"),
            expectedVersion: version,
          }),
        );
        setDailyBriefings((current) =>
          current.map((briefing) =>
            briefing.date === date ? patched : briefing,
          ),
        );
        return;
      }

      setDailyBriefings((current) =>
        applyDailyBriefingOverrides(current, trip, date, overrides),
      );
    },
    [apiClient, isApiMode, participantSession, trip],
  );

  return {
    dailyBriefings,
    replaceDailyBriefings,
    resetDailyBriefings,
    saveDailyBriefingOverrides,
    visibleDailyBriefings,
  };
}
