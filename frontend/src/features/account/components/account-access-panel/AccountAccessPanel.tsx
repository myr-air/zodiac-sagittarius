"use client";

import type {
  AccountApiClient,
  AccountSession,
} from "@/src/account/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { PortalSection } from "@/src/shared/portal";
import {
  mainLabel,
  type AccountAccessMode,
} from "./model/account-access-modes";
import { AccountAccessChrome } from "./composition/account-access-panel-chrome";
import {
  StatusMessage,
} from "./auth";
import { AccountAccessPanelContent } from "./composition/account-access-panel-content";
import {
  accountToastStackClassName,
} from "./layout/account-access-panel-layout";
import {
  accountAccessPanelPageClassName,
  accountAccessPanelShellClassName,
} from "./layout/account-access-panel-shell-classes";
import { useAccountAccessPanelState } from "./state/use-account-access-panel-state";

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
  const panelState = useAccountAccessPanelState({
    accessMessages,
    accessMode,
    accountClient,
    accountSession,
    accountSuccessRedirectHref,
    initialError,
    onAccountSessionChange,
  });
  const {
    displayError,
    effectiveAccessMode,
    effectiveEntryAccessMode,
    entryFlow,
    isAccountEntry,
    isPortalEntry,
    isTripAccessEntry,
    message,
    mode,
    pendingAccountSession,
    setSelectedMode,
  } = panelState;

  return (
    <main
      className={accountAccessPanelPageClassName({
        isAccountEntry,
        isPortalEntry,
        isTripAccessEntry,
        portalSection,
      })}
      aria-label={mainLabel(effectiveEntryAccessMode, t.access.mainLabels)}
    >
      <section
        className={accountAccessPanelShellClassName({
          isAccountEntry,
          isPortalEntry,
          isTripAccessEntry,
          portalSection,
        })}
      >
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

        <AccountAccessPanelContent
          accountClient={accountClient}
          accountSession={accountSession}
          accountSessionLoaded={accountSessionLoaded}
          apiClient={apiClient}
          displayError={displayError}
          effectiveAccessMode={effectiveAccessMode}
          entryFlow={entryFlow}
          initialJoinCode={initialJoinCode}
          initialJoinToken={initialJoinToken}
          isAccountEntry={isAccountEntry}
          isTripAccessEntry={isTripAccessEntry}
          mode={mode}
          pendingAccountSession={pendingAccountSession}
          portalSection={portalSection}
          state={panelState}
          trip={trip}
          messages={t.access}
          onAuthenticated={onAuthenticated}
          onCockpitLoaded={onCockpitLoaded}
          onTripChange={onTripChange}
        />
      </section>
    </main>
  );
}
