"use client";

import type {
  AccountApiClient,
  AccountSession,
} from "@/src/account/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { TripJoinGate } from "@/src/features/account/components/trip-join-gate";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { PortalSection } from "@/src/shared/portal";
import {
  mainLabel,
  type AccountAccessMode,
} from "./account-access-panel-support";
import { AccountAccessChrome } from "./account-access-panel-chrome";
import {
  StatusMessage,
} from "./auth";
import {
  AccountPortalDashboard,
  AccountPortalLoadingFrame,
} from "./portal";
import { EmailLoginPanel } from "./email-login";
import {
  accountAuthCardClassName,
  accountDashboardClassName,
  accountEntryPageClassName,
  accountEntryShellClassName,
  accountPageClassName,
  accountPortalDashboardClassNames,
  accountPortalNewTripPageClassName,
  accountPortalNewTripShellClassName,
  accountPortalPageClassName,
  accountPortalShellClassName,
  accountShellClassName,
  accountToastStackClassName,
  accountTripAccessPageClassName,
  accountTripAccessShellClassName,
  portalContentClassName,
  portalLoadingCardClassName,
} from "./account-access-panel-layout";
import { useAccountAccessPanelState } from "./use-account-access-panel-state";

interface AccountAccessPanelProps {
  accessMode?: AccountAccessMode;
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  accountSessionLoaded?: boolean;
  accountSuccessRedirectHref?: string;
  portalSection?: PortalSection;
  apiClient?: TripApiClient;
  initialError?: string | null;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  trip?: Trip;
  onAccountSessionChange: (session: AccountSession | null) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
}

export function AccountAccessPanel({
  accessMode = "combined",
  accountClient,
  accountSession,
  accountSessionLoaded = true,
  accountSuccessRedirectHref,
  apiClient,
  initialError,
  initialJoinCode,
  initialJoinToken,
  onAccountSessionChange,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
  portalSection = "dashboard",
  trip,
}: AccountAccessPanelProps) {
  const { t } = useI18n();
  const accessMessages = t.access.messages;
  const {
    clearPortalSession,
    displayError,
    displayedExplorer,
    displayedSettings,
    displayedStats,
    displayedTodos,
    displayedTrips,
    displayedVaultItems,
    effectiveAccessMode,
    effectiveEntryAccessMode,
    entryFlow,
    handleLoggedIn,
    isAccountEntry,
    isPortalEntry,
    isTripAccessEntry,
    message,
    mode,
    pendingAccountSession,
    refreshAccount,
    setEntryFlowOverride,
    setError,
    setMessage,
    setSelectedMode,
    setSettings,
    setVaultItems,
  } = useAccountAccessPanelState({
    accessMessages,
    accessMode,
    accountClient,
    accountSession,
    accountSuccessRedirectHref,
    initialError,
    onAccountSessionChange,
  });

  return (
    <main
      className={cn(
        accountPageClassName,
        isAccountEntry ? accountEntryPageClassName : "",
        isPortalEntry ? accountPortalPageClassName : "",
        isTripAccessEntry ? accountTripAccessPageClassName : "",
        isPortalEntry && portalSection === "new-trip" ? accountPortalNewTripPageClassName : "",
      )}
      aria-label={mainLabel(effectiveEntryAccessMode, t.access.mainLabels)}
    >
      <section className={cn(accountShellClassName, isAccountEntry ? accountEntryShellClassName : "", isPortalEntry ? accountPortalShellClassName : "", isPortalEntry && portalSection === "new-trip" ? accountPortalNewTripShellClassName : "", isTripAccessEntry ? accountTripAccessShellClassName : "")}>
        <AccountAccessChrome
          accessMode={effectiveAccessMode}
          backToHomeLabel={t.access.backToHome}
          detailLabels={t.access.details}
          entryFlow={entryFlow}
          entryHeroLabels={t.access.entryHero}
          eyebrowLabel={t.access.eyebrow}
          highlightLabels={t.access.highlights}
          isAccountEntry={isAccountEntry}
          isPortalEntry={isPortalEntry}
          isTripAccessEntry={isTripAccessEntry}
          mode={mode}
          onModeChange={setSelectedMode}
          portalSection={portalSection}
          tabLabels={t.access.tabs}
          titleLabels={t.access.titles}
        />

        {isAccountEntry && message ? (
          <div className={accountToastStackClassName} aria-live="polite">
            {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
          </div>
        ) : null}

        {!isAccountEntry && message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
        {!isAccountEntry && displayError ? <StatusMessage tone="danger">{displayError}</StatusMessage> : null}

        {mode === "temp" ? (
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
        ) : pendingAccountSession ? (
          <StatusMessage tone="success">{t.access.portalDelay.detail}</StatusMessage>
        ) : isAccountEntry ? (
          <EmailLoginPanel
            flow={entryFlow}
            accountClient={accountClient}
            authCardClassName={accountAuthCardClassName}
            formError={displayError}
            showRouteTabs
            onFlowChange={setEntryFlowOverride}
            onLoggedIn={(session) => handleLoggedIn(session, t.access.messages)}
            onError={setError}
          />
        ) : !accountSessionLoaded && effectiveAccessMode === "account-portal" ? (
          <AccountPortalLoadingFrame
            classNames={{
              content: portalContentClassName,
              dashboard: accountDashboardClassName,
              loadingCard: portalLoadingCardClassName,
            }}
            portalSection={portalSection}
          />
        ) : accountSession ? (
          <AccountPortalDashboard
            accountClient={accountClient}
            apiClient={apiClient}
            accountSession={accountSession}
            classNames={accountPortalDashboardClassNames}
            isLoading={!displayedSettings}
            settings={displayedSettings}
            stats={displayedStats}
            explorer={displayedExplorer}
            trips={displayedTrips}
            todos={displayedTodos}
            vaultItems={displayedVaultItems}
            key={portalSection}
            portalSection={portalSection}
            onSettingsChanged={setSettings}
            onVaultItemCreated={(item) => setVaultItems((current) => [item, ...current])}
            onCreatedTrip={async (session, options) => {
              if (options?.openTrip !== false) {
                onAuthenticated(session);
                if (apiClient) {
                  const cockpit = await apiClient.loadTrip(session.tripId, session.sessionToken);
                  onTripChange(cockpit.trip);
                  onCockpitLoaded?.(cockpit);
                }
              }
              await refreshAccount(accountSession.sessionToken);
            }}
            onLogout={async () => {
              await accountClient.logout(accountSession.sessionToken);
              clearPortalSession(accountSession.sessionToken);
              setMessage(t.access.messages.loggedOut);
            }}
            onSessionCleared={() => {
              clearPortalSession(accountSession.sessionToken);
            }}
            onMessage={setMessage}
            onError={setError}
          />
        ) : (
          <EmailLoginPanel
            flow={entryFlow}
            accountClient={accountClient}
            authCardClassName={accountAuthCardClassName}
            formError={isAccountEntry ? displayError : null}
            showRouteTabs={isAccountEntry}
            onFlowChange={setEntryFlowOverride}
            onLoggedIn={(session) => handleLoggedIn(session, t.access.messages)}
            onError={setError}
          />
        )}
      </section>
    </main>
  );
}
