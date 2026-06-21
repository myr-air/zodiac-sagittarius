import type {
  AccountApiClient,
  AccountSession,
} from "@/src/account/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { TripJoinGate } from "@/src/features/account/components/trip-join-gate/TripJoinGate";
import type { Messages } from "@/src/i18n/messages";
import type { PortalSection } from "@/src/shared/portal";
import { StatusMessage, type AuthFlow } from "../auth";
import {
  AccountPortalLoadingFrame,
} from "../portal";
import { EmailLoginPanel } from "../email-login";
import {
  accountAuthCardClassName,
  accountDashboardClassName,
  portalContentClassName,
  portalLoadingCardClassName,
} from "../layout/account-access-panel-layout";
import { AccountAccessPanelPortalContent } from "../portal/account-access-panel-portal-content";
import type { UseAccountAccessPanelState } from "../state/use-account-access-panel-state";

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

interface AccountEmailLoginPanelContentProps {
  accountClient: AccountApiClient;
  entryFlow: AuthFlow;
  formError: string | null;
  messages: Messages["access"];
  showRouteTabs: boolean;
  state: UseAccountAccessPanelState;
}

function AccountEmailLoginPanelContent({
  accountClient,
  entryFlow,
  formError,
  messages,
  showRouteTabs,
  state,
}: AccountEmailLoginPanelContentProps) {
  return (
    <EmailLoginPanel
      flow={entryFlow}
      accountClient={accountClient}
      authCardClassName={accountAuthCardClassName}
      formError={formError}
      showRouteTabs={showRouteTabs}
      onFlowChange={state.setEntryFlowOverride}
      onLoggedIn={(session) => state.handleLoggedIn(session, messages.messages)}
      onError={state.setError}
    />
  );
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
      <AccountEmailLoginPanelContent
        accountClient={accountClient}
        entryFlow={entryFlow}
        formError={displayError}
        messages={messages}
        showRouteTabs
        state={state}
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
      <AccountAccessPanelPortalContent
        accountClient={accountClient}
        accountSession={accountSession}
        apiClient={apiClient}
        messages={messages}
        portalSection={portalSection}
        state={state}
        onAuthenticated={onAuthenticated}
        onCockpitLoaded={onCockpitLoaded}
        onTripChange={onTripChange}
      />
    );
  }

  return (
    <AccountEmailLoginPanelContent
      accountClient={accountClient}
      entryFlow={entryFlow}
      formError={null}
      messages={messages}
      showRouteTabs={false}
      state={state}
    />
  );
}
