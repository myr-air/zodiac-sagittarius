import type {
  AccountApiClient,
  AccountSession,
} from "@/src/account/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { TripJoinGate } from "@/src/features/account/components/trip-join-gate";
import type { Messages } from "@/src/i18n/messages";
import type { PortalSection } from "@/src/shared/portal";
import { StatusMessage, type AuthFlow } from "./auth";
import {
  AccountPortalDashboard,
  AccountPortalLoadingFrame,
} from "./portal";
import { EmailLoginPanel } from "./email-login";
import {
  accountAuthCardClassName,
  accountDashboardClassName,
  accountPortalDashboardClassNames,
  portalContentClassName,
  portalLoadingCardClassName,
} from "./account-access-panel-layout";
import type { UseAccountAccessPanelState } from "./use-account-access-panel-state";

interface AccountAccessPanelContentProps {
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  accountSessionLoaded: boolean;
  apiClient?: TripApiClient;
  displayError: string | null;
  effectiveAccessMode: UseAccountAccessPanelState["effectiveAccessMode"];
  entryFlow: AuthFlow;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  isAccountEntry: boolean;
  isTripAccessEntry: boolean;
  mode: UseAccountAccessPanelState["mode"];
  pendingAccountSession: AccountSession | null;
  portalSection: PortalSection;
  state: UseAccountAccessPanelState;
  trip?: Trip;
  messages: Messages["access"];
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
}

export function AccountAccessPanelContent({
  accountClient,
  accountSession,
  accountSessionLoaded,
  apiClient,
  displayError,
  effectiveAccessMode,
  entryFlow,
  initialJoinCode,
  initialJoinToken,
  isAccountEntry,
  isTripAccessEntry,
  mode,
  pendingAccountSession,
  portalSection,
  state,
  trip,
  messages,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
}: AccountAccessPanelContentProps) {
  if (mode === "temp") {
    return (
      <TripJoinGate
        apiClient={apiClient}
        embedded
        initialJoinCode={initialJoinCode}
        initialJoinToken={initialJoinToken}
        trip={trip}
        variant={isTripAccessEntry ? "trip-access" : "default"}
        onAuthenticated={onAuthenticated}
        onCockpitLoaded={onCockpitLoaded}
        onTripChange={onTripChange}
      />
    );
  }

  if (pendingAccountSession) {
    return <StatusMessage tone="success">{messages.portalDelay.detail}</StatusMessage>;
  }

  if (isAccountEntry) {
    return (
      <EmailLoginPanel
        flow={entryFlow}
        accountClient={accountClient}
        authCardClassName={accountAuthCardClassName}
        formError={displayError}
        showRouteTabs
        onFlowChange={state.setEntryFlowOverride}
        onLoggedIn={(session) => state.handleLoggedIn(session, messages.messages)}
        onError={state.setError}
      />
    );
  }

  if (!accountSessionLoaded && effectiveAccessMode === "account-portal") {
    return (
      <AccountPortalLoadingFrame
        classNames={{
          content: portalContentClassName,
          dashboard: accountDashboardClassName,
          loadingCard: portalLoadingCardClassName,
        }}
        portalSection={portalSection}
      />
    );
  }

  if (accountSession) {
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
          state.setVaultItems((current) => [item, ...current])
        }
        onCreatedTrip={async (session, options) => {
          if (options?.openTrip !== false) {
            onAuthenticated(session);
            if (apiClient) {
              const cockpit = await apiClient.loadTrip(
                session.tripId,
                session.sessionToken,
              );
              onTripChange(cockpit.trip);
              onCockpitLoaded?.(cockpit);
            }
          }
          await state.refreshAccount(accountSession.sessionToken);
        }}
        onLogout={async () => {
          await accountClient.logout(accountSession.sessionToken);
          state.clearPortalSession(accountSession.sessionToken);
          state.setMessage(messages.messages.loggedOut);
        }}
        onSessionCleared={() => {
          state.clearPortalSession(accountSession.sessionToken);
        }}
        onMessage={state.setMessage}
        onError={state.setError}
      />
    );
  }

  return (
    <EmailLoginPanel
      flow={entryFlow}
      accountClient={accountClient}
      authCardClassName={accountAuthCardClassName}
      formError={isAccountEntry ? displayError : null}
      showRouteTabs={isAccountEntry}
      onFlowChange={state.setEntryFlowOverride}
      onLoggedIn={(session) => state.handleLoggedIn(session, messages.messages)}
      onError={state.setError}
    />
  );
}
