import { useEffect } from "react";
import { isAuthFailure } from "@/src/trip/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import {
  buildUpdatePresenceRequest,
  replaceTripParticipant,
} from "@/src/trip/auth";
import { nextClientMutationId } from "@/src/trip/identity";
import { clearParticipantSession } from "@/src/trip/auth";
import type {
  Trip,
  TripDailyBriefing,
  TripParticipantSession,
} from "@/src/trip/types";

interface UseWorkspaceApiCockpitEffectsParams {
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  rememberSelectedTripPlanId: (trip: Trip, tripPlanId: string) => void;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  replaceDailyBriefings: (briefings: TripDailyBriefing[]) => void;
  resetDailyBriefings: () => void;
  resolvedApiClient?: TripApiClient;
  resolveSelectedTripPlanId: (trip: Trip, preferredTripPlanId?: string | null) => string;
  setAccessError: (error: string | null) => void;
  setIsCockpitLoaded: (loaded: boolean) => void;
  setParticipantSession: (session: TripParticipantSession | null) => void;
  setSelectedTripPlanId: (tripPlanId: string) => void;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceApiCockpitEffects({
  isApiMode,
  participantSession,
  rememberSelectedTripPlanId,
  replaceCockpitFromApi,
  replaceDailyBriefings,
  resetDailyBriefings,
  resolvedApiClient,
  resolveSelectedTripPlanId,
  setAccessError,
  setIsCockpitLoaded,
  setParticipantSession,
  setSelectedTripPlanId,
  updateApiTrip,
}: UseWorkspaceApiCockpitEffectsParams) {
  useEffect(() => {
    if (!isApiMode || !participantSession || !resolvedApiClient)
      return undefined;
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled) return;
      setIsCockpitLoaded(false);
      resetDailyBriefings();
    });

    void resolvedApiClient
      .loadTrip(participantSession.tripId, participantSession.sessionToken)
      .then((cockpit) => {
        if (cancelled) return;
        const loadedTripPlanId = resolveSelectedTripPlanId(cockpit.trip);
        replaceCockpitFromApi(cockpit);
        setSelectedTripPlanId(loadedTripPlanId);
        rememberSelectedTripPlanId(cockpit.trip, loadedTripPlanId);
      })
      .catch((caught) => {
        if (cancelled) return;
        if (isAuthFailure(caught)) {
          clearParticipantSession();
          setParticipantSession(null);
          setAccessError("unauthenticated");
          resetDailyBriefings();
          setIsCockpitLoaded(false);
          return;
        }
        setAccessError("trip load failed");
        resetDailyBriefings();
        setIsCockpitLoaded(false);
      });

    void resolvedApiClient
      .listDailyBriefings(
        participantSession.tripId,
        participantSession.sessionToken,
      )
      .then((briefings) => {
        if (cancelled) return;
        replaceDailyBriefings(briefings);
      })
      .catch(() => {
        if (cancelled) return;
        resetDailyBriefings();
      });

    return () => {
      cancelled = true;
    };
  }, [
    isApiMode,
    participantSession,
    rememberSelectedTripPlanId,
    replaceCockpitFromApi,
    replaceDailyBriefings,
    resetDailyBriefings,
    resolvedApiClient,
    resolveSelectedTripPlanId,
    setAccessError,
    setIsCockpitLoaded,
    setParticipantSession,
    setSelectedTripPlanId,
  ]);

  useEffect(() => {
    if (!isApiMode || !participantSession || !resolvedApiClient)
      return undefined;
    let cancelled = false;

    void Promise.resolve(
      resolvedApiClient.updatePresence(
        participantSession.tripId,
        participantSession.sessionToken,
        buildUpdatePresenceRequest("online", {
          clientMutationId: nextClientMutationId("presence-online"),
        }),
      ),
    )
      .then((member) => {
        if (cancelled || !member) return;
        updateApiTrip((current) => replaceTripParticipant(current, member));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isApiMode, participantSession, resolvedApiClient, updateApiTrip]);
}
