import type { SagittariusAccessMode } from "../types";

interface ResolveWorkspaceAccessStateOptions {
  accessMode: SagittariusAccessMode;
  accountSessionLoaded: boolean;
  accountSessionPresent: boolean;
  accountTripAccessDeniedRouteId: string | null;
  accessError: string | null;
  currentPathname?: string;
  isApiMode: boolean;
  isTripLoading: boolean;
  isVitestBrowser?: boolean;
  participantSessionTripId: string | null;
  requireJoin: boolean;
  routeTripId?: string;
  sessionMember: boolean;
  sessionRestored: boolean;
}

interface WorkspaceAccessState {
  canAccessPanel: boolean;
  hasRouteParticipantSession: boolean;
  isAccountTripAccessPending: boolean;
  shouldRedirectUnauthenticatedTripRoute: boolean;
}

export function resolveWorkspaceAccessState({
  accessMode,
  accountSessionLoaded,
  accountSessionPresent,
  accountTripAccessDeniedRouteId,
  accessError,
  currentPathname,
  isApiMode,
  isTripLoading,
  isVitestBrowser = false,
  participantSessionTripId,
  requireJoin,
  routeTripId,
  sessionMember,
  sessionRestored,
}: ResolveWorkspaceAccessStateOptions): WorkspaceAccessState {
  const isAccountOnlyAccessMode =
    accessMode === "account-login" || accessMode === "account-register";
  const hasRouteParticipantSession = Boolean(
    participantSessionTripId &&
      (!routeTripId || participantSessionTripId === routeTripId),
  );
  const canAccessPanel =
    accessMode === "account-portal" ||
    isAccountOnlyAccessMode ||
    (requireJoin &&
      !sessionMember &&
      (!routeTripId || accessMode === "trip-access"));
  const isAccountTripAccessPending =
    requireJoin &&
    isApiMode &&
    Boolean(routeTripId) &&
    !sessionMember &&
    !accessError &&
    (!accountSessionLoaded ||
      (accountSessionPresent && accountTripAccessDeniedRouteId !== routeTripId));
  const shouldRedirectUnauthenticatedTripRoute =
    sessionRestored &&
    requireJoin &&
    Boolean(routeTripId) &&
    !hasRouteParticipantSession &&
    !accessError &&
    !isAccountTripAccessPending &&
    !isTripLoading &&
    Boolean(currentPathname) &&
    !currentPathname?.includes("iframe.html") &&
    !isVitestBrowser;

  return {
    canAccessPanel,
    hasRouteParticipantSession,
    isAccountTripAccessPending,
    shouldRedirectUnauthenticatedTripRoute,
  };
}
