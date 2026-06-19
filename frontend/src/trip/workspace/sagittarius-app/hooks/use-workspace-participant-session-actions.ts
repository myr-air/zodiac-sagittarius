import { useCallback } from "react";
import { resolveJoinPostAuthReturnTo } from "@/src/trip/join-return";
import {
  clearParticipantSession,
  persistParticipantSession,
} from "@/src/trip/participant-session-storage";
import { appRoutes, decodeReturnTo } from "@/src/trip/workspace/sagittarius-app/support";
import type { Trip, TripParticipantSession } from "@/src/trip/types";

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
        const returnToParam = searchParams.get("rt");
        const returnTo = returnToParam ? decodeReturnTo(returnToParam) : null;
        const safeReturnTo = resolveJoinPostAuthReturnTo(
          returnTo,
          session.tripId,
        );
        const postAuthHref =
          safeReturnTo ??
          (!routeTripId ? appRoutes.tripOverview(session.tripId) : null);
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
