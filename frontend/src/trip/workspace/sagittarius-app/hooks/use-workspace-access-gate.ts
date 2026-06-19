import { useEffect } from "react";
import type { AccountSession } from "@/src/account/api-client";
import type { TripParticipantSession } from "@/src/trip/types";
import { resolveJoinPostAuthReturnTo } from "@/src/trip/join-return";
import { decodeReturnTo } from "@/src/trip/workspace/sagittarius-app/support";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import type { SagittariusAccessMode } from "../types";
import { resolveWorkspaceAccessState } from "./workspace-access-state";

interface UseWorkspaceAccessGateOptions {
  accessMode: SagittariusAccessMode;
  accountSession: AccountSession | null;
  accountSessionLoaded: boolean;
  accountTripAccessDeniedRouteId: string | null;
  accessError: string | null;
  isApiMode: boolean;
  isTripLoading: boolean;
  participantSession: TripParticipantSession | null;
  routeTripId?: string;
  requireJoin: boolean;
  sessionMember: boolean;
  sessionRestored: boolean;
}

interface UseWorkspaceAccessGateResult {
  canAccessPanel: boolean;
  hasRouteParticipantSession: boolean;
  isAccountTripAccessPending: boolean;
  shouldRedirectUnauthenticatedTripRoute: boolean;
}

export function useWorkspaceAccessGate({
  accessMode,
  accountSession,
  accountSessionLoaded,
  accountTripAccessDeniedRouteId,
  accessError,
  isApiMode,
  isTripLoading,
  participantSession,
  routeTripId,
  requireJoin,
  sessionMember,
  sessionRestored,
}: UseWorkspaceAccessGateOptions): UseWorkspaceAccessGateResult {
  const {
    canAccessPanel,
    hasRouteParticipantSession,
    isAccountTripAccessPending,
    shouldRedirectUnauthenticatedTripRoute,
  } = resolveWorkspaceAccessState({
    accessMode,
    accountSessionLoaded,
    accountSessionPresent: Boolean(accountSession),
    accountTripAccessDeniedRouteId,
    accessError,
    currentPathname:
      typeof window === "undefined" ? undefined : window.location.pathname,
    isApiMode,
    isTripLoading,
    isVitestBrowser:
      typeof window !== "undefined" && "__vitest_browser__" in window,
    participantSessionTripId: participantSession?.tripId ?? null,
    requireJoin,
    routeTripId,
    sessionMember,
    sessionRestored,
  });

  useEffect(() => {
    if (
      !requireJoin ||
      !participantSession ||
      !sessionMember ||
      routeTripId ||
      typeof window === "undefined"
    )
      return;
    if (!window.location.pathname.startsWith(appRoutes.join())) return;
    const returnToParam = new URLSearchParams(window.location.search).get("rt");
    const returnTo = returnToParam ? decodeReturnTo(returnToParam) : null;
    const target =
      resolveJoinPostAuthReturnTo(returnTo, participantSession.tripId) ??
      appRoutes.tripOverview(participantSession.tripId);
    window.location.replace(target);
  }, [participantSession, requireJoin, routeTripId, sessionMember]);

  useEffect(() => {
    if (!shouldRedirectUnauthenticatedTripRoute) return;
    const returnTo = window.location.pathname + window.location.search;
    const joinHref = appRoutes.join(undefined, returnTo);
    window.location.replace(joinHref);
  }, [shouldRedirectUnauthenticatedTripRoute]);

  return {
    canAccessPanel,
    hasRouteParticipantSession,
    isAccountTripAccessPending,
    shouldRedirectUnauthenticatedTripRoute,
  };
}
