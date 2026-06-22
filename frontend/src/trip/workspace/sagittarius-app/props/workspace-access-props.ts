import type { WorkspaceAppFrameProps } from "../WorkspaceAppFrame";

type WorkspaceAccessProps = WorkspaceAppFrameProps["accessProps"];

export type BuildWorkspaceAccessPropsInput = WorkspaceAccessProps;

export function buildWorkspaceAccessProps({
  accessMode,
  accountClient,
  accountSession,
  accountSessionLoaded,
  accountSuccessRedirectHref,
  apiClient,
  canAccessPanel,
  initialError,
  initialJoinCode,
  initialJoinToken,
  isAccountTripAccessPending,
  isTripLoading,
  portalSection,
  requireJoin,
  routeTripId,
  sessionMember,
  sessionRestored,
  shouldRedirectUnauthenticatedTripRoute,
  trip,
  onAccountSessionChange,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
}: BuildWorkspaceAccessPropsInput): WorkspaceAccessProps {
  return {
    accessMode,
    accountClient,
    accountSession,
    accountSessionLoaded,
    accountSuccessRedirectHref,
    apiClient,
    canAccessPanel,
    initialError,
    initialJoinCode,
    initialJoinToken,
    isAccountTripAccessPending,
    isTripLoading,
    portalSection,
    requireJoin,
    routeTripId,
    sessionMember,
    sessionRestored,
    shouldRedirectUnauthenticatedTripRoute,
    trip,
    onAccountSessionChange,
    onAuthenticated,
    onCockpitLoaded,
    onTripChange,
  };
}
