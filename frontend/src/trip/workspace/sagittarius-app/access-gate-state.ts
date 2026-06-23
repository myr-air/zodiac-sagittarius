import type { SagittariusAccessMode } from "./types";

export interface WorkspaceAccessLoadingFrameInput {
  accessMode: SagittariusAccessMode;
  canAccessPanel: boolean;
  isAccountTripAccessPending: boolean;
  isTripLoading: boolean;
  requireJoin: boolean;
  routeTripId?: string;
  sessionMember: boolean;
  sessionRestored: boolean;
  shouldRedirectUnauthenticatedTripRoute: boolean;
}

export function shouldRenderWorkspaceAccessLoadingFrame({
  accessMode,
  canAccessPanel,
  isAccountTripAccessPending,
  isTripLoading,
  requireJoin,
  routeTripId,
  sessionMember,
  sessionRestored,
  shouldRedirectUnauthenticatedTripRoute,
}: WorkspaceAccessLoadingFrameInput): boolean {
  if (
    isAccountTripAccessPending ||
    isTripLoading ||
    shouldRedirectUnauthenticatedTripRoute
  ) {
    return true;
  }

  if (canAccessPanel) {
    return Boolean(routeTripId && accessMode === "trip-access" && !sessionRestored);
  }

  return Boolean(requireJoin && !sessionMember && routeTripId);
}
