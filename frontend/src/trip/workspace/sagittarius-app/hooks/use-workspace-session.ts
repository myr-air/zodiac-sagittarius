import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  isForbidden,
  isUnauthenticated,
} from "@/src/trip/api-client";
import type { AccountApiClient } from "@/src/account/api-client";
import {
  clearParticipantSession,
  persistParticipantSession,
} from "@/src/trip/auth";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { useWorkspaceAccountSession } from "./use-workspace-account-session";
import { useWorkspaceParticipantSessionRestore } from "./use-workspace-participant-session-restore";

type TripWorkspaceState = {
  trip: Trip;
  past: Trip[];
  future: Trip[];
};

interface UseWorkspaceSessionOptions {
  accountClient: AccountApiClient;
  initialTrip: Trip;
  isApiMode: boolean;
  requireJoin: boolean;
  routeTripId?: string;
  setCurrentMemberId: (memberId: string) => void;
  setSelectedTripPlanId: Dispatch<SetStateAction<string>>;
  setTripState: Dispatch<SetStateAction<TripWorkspaceState>>;
}

export function useWorkspaceSession({
  accountClient,
  initialTrip,
  isApiMode,
  requireJoin,
  routeTripId,
  setCurrentMemberId,
  setSelectedTripPlanId,
  setTripState,
}: UseWorkspaceSessionOptions) {
  const [participantSession, setParticipantSession] =
    useState<TripParticipantSession | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const {
    accountSession,
    accountSessionLoaded,
    changeAccountSession,
  } = useWorkspaceAccountSession(accountClient);
  const [accountTripAccessDeniedRouteId, setAccountTripAccessDeniedRouteId] =
    useState<string | null>(null);

  useWorkspaceParticipantSessionRestore({
    initialTrip,
    isApiMode,
    requireJoin,
    routeTripId,
    setCurrentMemberId,
    setParticipantSession,
    setSelectedTripPlanId,
    setSessionRestored,
    setTripState,
  });

  useEffect(() => {
    if (
      !isApiMode ||
      !routeTripId ||
      !accountSessionLoaded ||
      !accountSession ||
      participantSession
    ) {
      return undefined;
    }

    let cancelled = false;

    void accountClient
      .createTripMemberSession(accountSession.sessionToken, routeTripId)
      .then((session) => {
        if (cancelled) return;
        setAccountTripAccessDeniedRouteId(null);
        setAccessError(null);
        setParticipantSession(session);
        setCurrentMemberId(session.memberId);
        persistParticipantSession(session);
      })
      .catch((caught) => {
        if (cancelled) return;
        if (isUnauthenticated(caught)) {
          changeAccountSession(null);
          setAccessError("unauthenticated");
          return;
        }
        if (isForbidden(caught)) {
          setAccountTripAccessDeniedRouteId(routeTripId);
          clearParticipantSession();
          return;
        }
        setAccessError("trip access check failed");
      });

    return () => {
      cancelled = true;
    };
  }, [
    accountClient,
    accountSession,
    accountSessionLoaded,
    changeAccountSession,
    isApiMode,
    participantSession,
    routeTripId,
    setCurrentMemberId,
  ]);

  return {
    accessError,
    accountSession,
    accountSessionLoaded,
    accountTripAccessDeniedRouteId,
    participantSession,
    sessionRestored,
    setAccessError,
    setAccountTripAccessDeniedRouteId,
    setParticipantSession,
    changeAccountSession,
  };
}
