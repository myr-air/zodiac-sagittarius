import { AccountAccessPanel } from "@/src/features/account/components/account-access-panel";
import { TripAccessLoadingFrame } from "@/src/trip/workspace/TripAccessLoadingFrame";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { SagittariusAccessMode, SagittariusPortalSection } from "./types";
import type { ReactNode } from "react";

interface WorkspaceAccessBoundaryProps {
  accessMode: SagittariusAccessMode;
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  accountSessionLoaded: boolean;
  accountSuccessRedirectHref?: string;
  apiClient?: TripApiClient;
  canAccessPanel: boolean;
  children: ReactNode;
  initialError: string | null;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  isAccountTripAccessPending: boolean;
  isTripLoading: boolean;
  portalSection: SagittariusPortalSection;
  requireJoin: boolean;
  routeTripId?: string;
  sessionMember: boolean;
  sessionRestored: boolean;
  shouldRedirectUnauthenticatedTripRoute: boolean;
  trip: Trip;
  onAccountSessionChange: (session: AccountSession | null) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
}

export function WorkspaceAccessBoundary({
  accessMode,
  accountClient,
  accountSession,
  accountSessionLoaded,
  accountSuccessRedirectHref,
  apiClient,
  canAccessPanel,
  children,
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
}: WorkspaceAccessBoundaryProps) {
  if (
    isAccountTripAccessPending ||
    isTripLoading ||
    shouldRedirectUnauthenticatedTripRoute
  ) {
    return <TripAccessLoadingFrame />;
  }

  if (canAccessPanel) {
    if (routeTripId && accessMode === "trip-access" && !sessionRestored) {
      return <TripAccessLoadingFrame />;
    }

    return (
      <TripWorkspaceAccessPanel
        accessMode={accessMode}
        accountClient={accountClient}
        accountSession={accountSession}
        accountSessionLoaded={accountSessionLoaded}
        accountSuccessRedirectHref={accountSuccessRedirectHref}
        portalSection={portalSection}
        apiClient={apiClient}
        initialError={initialError}
        initialJoinCode={initialJoinCode}
        initialJoinToken={initialJoinToken}
        trip={routeTripId ? undefined : trip}
        onAccountSessionChange={onAccountSessionChange}
        onAuthenticated={onAuthenticated}
        onCockpitLoaded={onCockpitLoaded}
        onTripChange={onTripChange}
      />
    );
  }

  if (requireJoin && !sessionMember && routeTripId) {
    return <TripAccessLoadingFrame />;
  }

  return children;
}

interface TripWorkspaceAccessPanelProps {
  accessMode: SagittariusAccessMode;
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  accountSessionLoaded: boolean;
  accountSuccessRedirectHref?: string;
  portalSection: SagittariusPortalSection;
  apiClient?: TripApiClient;
  initialError: string | null;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  trip?: Trip;
  onAccountSessionChange: (session: AccountSession | null) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
}

export function TripWorkspaceAccessPanel({
  accessMode,
  accountClient,
  accountSession,
  accountSessionLoaded,
  accountSuccessRedirectHref,
  portalSection,
  apiClient,
  initialError,
  initialJoinCode,
  initialJoinToken,
  trip,
  onAccountSessionChange,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
}: TripWorkspaceAccessPanelProps) {
  return (
    <AccountAccessPanel
      accessMode={accessMode}
      accountClient={accountClient}
      accountSession={accountSession}
      accountSessionLoaded={accountSessionLoaded}
      accountSuccessRedirectHref={accountSuccessRedirectHref}
      portalSection={portalSection}
      apiClient={apiClient}
      initialError={initialError}
      initialJoinCode={initialJoinCode}
      initialJoinToken={initialJoinToken}
      trip={trip}
      onAccountSessionChange={onAccountSessionChange}
      onAuthenticated={onAuthenticated}
      onCockpitLoaded={onCockpitLoaded}
      onTripChange={onTripChange}
    />
  );
}
