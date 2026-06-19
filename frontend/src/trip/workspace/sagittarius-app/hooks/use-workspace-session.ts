import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  isForbidden,
  isUnauthenticated,
} from "@/src/trip/api-errors";
import { loadPersistedAccountSession, persistAccountSession } from "@/src/account/session-storage";
import type {
  AccountApiClient,
  AccountSession,
} from "@/src/account/api-client";
import {
  clearParticipantSession,
  loadPersistedParticipantSession,
  persistParticipantSession,
} from "@/src/trip/participant-session-storage";
import { loadPersistedTripDraft } from "@/src/trip/repository";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import {
  resolveWorkspaceSessionRestore,
  resolveWorkspaceSessionTrip,
} from "./workspace-session-restore";

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
  const [accountSession, setAccountSession] = useState<AccountSession | null>(
    null,
  );
  const [accountSessionLoaded, setAccountSessionLoaded] = useState(false);
  const [accountTripAccessDeniedRouteId, setAccountTripAccessDeniedRouteId] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) setSessionRestored(false);
    });
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      const persistedTrip = loadPersistedTripDraft();
      const nextTrip = resolveWorkspaceSessionTrip(initialTrip, persistedTrip);
      const persistedSession = loadPersistedParticipantSession(
        requireJoin,
        nextTrip,
        isApiMode,
        routeTripId,
      );
      const restored = resolveWorkspaceSessionRestore({
        initialTrip,
        persistedSession,
        persistedTrip,
      });

      if (restored.shouldReplaceTripState) {
        setTripState({ trip: restored.nextTrip, past: [], future: [] });
        setSelectedTripPlanId(restored.selectedTripPlanId!);
      }
      if (restored.participantSession) {
        setParticipantSession(restored.participantSession);
        setCurrentMemberId(restored.currentMemberId!);
      } else {
        setParticipantSession(null);
      }
      setSessionRestored(true);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [initialTrip, isApiMode, requireJoin, routeTripId, setCurrentMemberId, setSelectedTripPlanId, setTripState]);

  useEffect(() => {
    if (accountSessionLoaded) return;
    const timeout = window.setTimeout(() => {
      setAccountSession(loadPersistedAccountSession());
      setAccountSessionLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [accountSessionLoaded]);

  useEffect(() => {
    if (!accountSessionLoaded) return;
    persistAccountSession(accountSession);
  }, [accountSession, accountSessionLoaded]);

  const changeAccountSession = useCallback((session: AccountSession | null) => {
    setAccountSession(session);
    persistAccountSession(session);
  }, []);

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
