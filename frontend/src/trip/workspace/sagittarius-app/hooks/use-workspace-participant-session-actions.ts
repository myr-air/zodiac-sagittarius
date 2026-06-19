import { useCallback } from "react";
import {
  clearParticipantSession,
  persistParticipantSession,
} from "@/src/trip/participant-session-storage";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { resolveParticipantPostAuthHref } from "./participant-post-auth-navigation";

interface UseWorkspaceParticipantSessionActionsParams {
  initialTrip: Trip;
  isApiMode: boolean;
  replaceWorkspacePath: (href: string, tripId?: string) => void;
  resetTrip: (nextTrip: Trip, options?: { persist?: boolean }) => void;
  routeTripId?: string;
  setAccessError: (error: string | null) => void;
  setContextRailVisibility: (open: boolean) => void;
  setCurrentMemberId: (memberId: string) => void;
  setIsCockpitLoaded: (loaded: boolean) => void;
  setParticipantSession: (session: TripParticipantSession | null) => void;
}

export function useWorkspaceParticipantSessionActions({
  initialTrip,
  isApiMode,
  replaceWorkspacePath,
  resetTrip,
  routeTripId,
  setAccessError,
  setContextRailVisibility,
  setCurrentMemberId,
  setIsCockpitLoaded,
  setParticipantSession,
}: UseWorkspaceParticipantSessionActionsParams) {
  const authenticateParticipant = useCallback(
    (session: TripParticipantSession) => {
      setAccessError(null);
      setParticipantSession(session);
      setCurrentMemberId(session.memberId);
      persistParticipantSession(session);

      if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const postAuthHref = resolveParticipantPostAuthHref({
          encodedReturnTo: searchParams.get("rt"),
          routeTripId,
          tripId: session.tripId,
        });
        if (postAuthHref) {
          replaceWorkspacePath(postAuthHref, session.tripId);
        }
      }
    },
    [
      replaceWorkspacePath,
      routeTripId,
      setAccessError,
      setCurrentMemberId,
      setParticipantSession,
    ],
  );

  const leaveParticipantSession = useCallback(() => {
    setParticipantSession(null);
    setCurrentMemberId(initialTrip.members[0].id);
    setContextRailVisibility(false);
    clearParticipantSession();
    setIsCockpitLoaded(false);
  }, [
    initialTrip.members,
    setContextRailVisibility,
    setCurrentMemberId,
    setIsCockpitLoaded,
    setParticipantSession,
  ]);

  const replaceTripFromJoin = useCallback(
    (nextTrip: Trip) => {
      resetTrip(nextTrip, { persist: !isApiMode });
    },
    [isApiMode, resetTrip],
  );

  return {
    authenticateParticipant,
    leaveParticipantSession,
    replaceTripFromJoin,
  };
}
