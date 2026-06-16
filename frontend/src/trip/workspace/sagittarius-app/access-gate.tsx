import { AccountAccessPanel } from "@/src/components/AccountAccessPanel";
import type {
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { SagittariusAccessMode, SagittariusPortalSection } from "./types";

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
