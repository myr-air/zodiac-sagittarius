import type {
  AccountApiClient,
  AccountSession,
  AccountVaultItemSummary,
} from "@/src/account/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import type { Messages } from "@/src/i18n/messages";
import type { PortalSection } from "@/src/shared/portal";
import { AccountPortalDashboard } from "./dashboard/account-portal-dashboard";
import { accountPortalDashboardClassNames } from "./dashboard/account-portal-dashboard-classnames";
import { buildAccountPortalDashboardHandlers } from "./account-access-panel-portal-handlers";
import type { UseAccountAccessPanelState } from "../state/use-account-access-panel-state";

interface AccountAccessPanelPortalContentProps {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  apiClient?: TripApiClient;
  messages: Messages["access"];
  portalSection: PortalSection;
  state: UseAccountAccessPanelState;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
}

export function prependPortalVaultItem(
  currentItems: AccountVaultItemSummary[],
  item: AccountVaultItemSummary,
): AccountVaultItemSummary[] {
  return [item, ...currentItems];
}

export function AccountAccessPanelPortalContent({
  accountClient,
  accountSession,
  apiClient,
  messages,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
  portalSection,
  state,
}: AccountAccessPanelPortalContentProps) {
  const portalHandlers = buildAccountPortalDashboardHandlers({
    accountClient,
    accountSession,
    apiClient,
    messages,
    onAuthenticated,
    onCockpitLoaded,
    onTripChange,
    state,
  });

  return (
    <AccountPortalDashboard
      accountClient={accountClient}
      apiClient={apiClient}
      accountSession={accountSession}
      classNames={accountPortalDashboardClassNames}
      isLoading={!state.displayedSettings}
      settings={state.displayedSettings}
      stats={state.displayedStats}
      explorer={state.displayedExplorer}
      trips={state.displayedTrips}
      todos={state.displayedTodos}
      vaultItems={state.displayedVaultItems}
      key={portalSection}
      portalSection={portalSection}
      onSettingsChanged={state.setSettings}
      onVaultItemCreated={(item) =>
        state.setVaultItems((current) => prependPortalVaultItem(current, item))
      }
      onCreatedTrip={portalHandlers.onCreatedTrip}
      onLogout={portalHandlers.onLogout}
      onSessionCleared={portalHandlers.onSessionCleared}
      onMessage={state.setMessage}
      onError={state.setError}
    />
  );
}
