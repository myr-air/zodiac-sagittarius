"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  AccountApiClient,
  AccountSession,
} from "@/src/account/api-client";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { TripJoinGate } from "@/src/features/account/components/trip-join-gate";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { PortalSection } from "@/src/shared/portal";
import {
  clearAccountPortalDataCache,
  heroDetail,
  heroTitle,
  isAccountEntryMode,
  mainLabel,
  type AccountAccessMode,
} from "./account-access-panel-support";
import { AuthHighlights, AuthTravelCollage } from "./account-entry-hero";
import {
  localizeAccessError,
} from "./account-auth-support";
import { AccountPortalLoadingFrame } from "./account-portal-loading-frame";
import type { AuthFlow } from "./account-auth-chrome";
import { EmailLoginPanel } from "./email-login";
import {
  accountAuthCardClassName,
  accountDashboardClassName,
  accountEntryBackHomeClassName,
  accountEntryBrandTaglineClassName,
  accountEntryPageClassName,
  accountEntryShellClassName,
  accountHeroClassName,
  accountHeroEyebrowClassName,
  accountHeroMarkClassName,
  accountModeTabsClassName,
  accountPageClassName,
  accountPortalDashboardClassNames,
  accountPortalHeroClassName,
  accountPortalHeroMarkClassName,
  accountPortalLanguageSwitchClassName,
  accountPortalNewTripPageClassName,
  accountPortalNewTripShellClassName,
  accountPortalPageClassName,
  accountPortalShellClassName,
  accountShellClassName,
  accountTabActiveClassName,
  accountTabClassName,
  accountToastStackClassName,
  accountTripAccessPageClassName,
  accountTripAccessShellClassName,
  backHomeButtonClassName,
  portalContentClassName,
  portalLoadingCardClassName,
  tripAccessBackHomeClassName,
  tripAccessLanguageSwitchClassName,
} from "./account-access-panel-layout";
import { accessLanguageSwitchClassName, accountEntryLanguageSwitchClassName } from "./account-panel-shared-styles";
import { AccountPortalDashboard } from "./account-portal-dashboard";
import { StatusMessage } from "./account-status-message";
import { useAccountPortalData } from "./use-account-portal-data";

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

type AccessMode = "account" | "temp";

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
  const [clientPortalRedirected, setClientPortalRedirected] = useState(false);
  const effectiveAccessMode = clientPortalRedirected ? "account-portal" : accessMode;
  const [entryFlowOverride, setEntryFlowOverride] = useState<AuthFlow | null>(null);
  const entryFlow = entryFlowOverride ?? (accessMode === "account-register" ? "register" : "login");
  const effectiveEntryAccessMode = isAccountEntryMode(effectiveAccessMode)
    ? entryFlow === "register" ? "account-register" : "account-login"
    : effectiveAccessMode;
  const forcedMode = effectiveAccessMode === "trip-access" ? "temp" : effectiveAccessMode === "combined" ? null : "account";
  const isAccountEntry = effectiveAccessMode === "account-login" || effectiveAccessMode === "account-register";
  const isPortalEntry = effectiveAccessMode === "account-portal";
  const isTripAccessEntry = effectiveAccessMode === "trip-access";
  const [selectedMode, setSelectedMode] = useState<AccessMode>(() => (accountSession ? "account" : "temp"));
  const mode = forcedMode ?? (accountSession ? "account" : selectedMode);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAccountSession, setPendingAccountSession] = useState<AccountSession | null>(null);
  const displayError = error ? localizeAccessError(error, accessMessages) ?? error : localizeAccessError(initialError ?? null, accessMessages);
  const {
    displayedExplorer,
    displayedSettings,
    displayedStats,
    displayedTodos,
    displayedTrips,
    displayedVaultItems,
    refreshAccount,
    setSettings,
    setVaultItems,
  } = useAccountPortalData({
    accountClient,
    accountSession,
    isAccountEntry,
    onAccountSessionChange,
    onError: setError,
  });

  useEffect(() => {
    if (!pendingAccountSession) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      onAccountSessionChange(pendingAccountSession);
      if (accountSuccessRedirectHref) {
        if (pendingAccountSession.kind === "trusted") {
          window.location.replace(accountSuccessRedirectHref);
        } else {
          window.history.replaceState(null, "", accountSuccessRedirectHref);
          setClientPortalRedirected(true);
        }
      }
      setPendingAccountSession(null);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [accountSuccessRedirectHref, onAccountSessionChange, pendingAccountSession]);

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
        {isAccountEntry ? (
          <>
            <Link href={appRoutes.home()} className={cn(backHomeButtonClassName, accountEntryBackHomeClassName)}>
              <Icon name="chevronLeft" className="size-3.5" />
              {t.access.backToHome}
            </Link>
          </>
        ) : null}
        {isTripAccessEntry ? (
          <>
            <Link href={appRoutes.home()} className={cn(backHomeButtonClassName, tripAccessBackHomeClassName)}>
              <Icon name="chevronLeft" className="size-3.5" />
              {t.access.backToHome}
            </Link>
            <LanguageSwitch className={cn(accessLanguageSwitchClassName, accountEntryLanguageSwitchClassName, tripAccessLanguageSwitchClassName)} />
          </>
        ) : null}
        {!isTripAccessEntry ? <div className={cn(accountHeroClassName, isPortalEntry ? accountPortalHeroClassName : "")}>
          <div className={cn(accountHeroMarkClassName, isPortalEntry ? accountPortalHeroMarkClassName : "")} aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className={accountHeroEyebrowClassName}>{isAccountEntry ? t.access.entryHero.brand : t.access.eyebrow}</p>
            {isAccountEntry ? <p className={accountEntryBrandTaglineClassName}>{t.access.entryHero.tagline}</p> : null}
            <h1>{isAccountEntry ? t.access.entryHero.title : heroTitle(effectiveEntryAccessMode, t.access.titles)}</h1>
            <div className="h-6"></div>
            <p>{isAccountEntry ? t.access.entryHero.detail : heroDetail(effectiveEntryAccessMode, t.access.details)}</p>
            {isAccountEntry || (isPortalEntry && portalSection === "new-trip") ? null : <LanguageSwitch className={cn(accessLanguageSwitchClassName, isPortalEntry ? accountPortalLanguageSwitchClassName : "")} />}
          </div>
          {isAccountEntry ? <AuthTravelCollage labels={t.access.entryHero} /> : null}
          {isAccountEntry ? <AuthHighlights flow={entryFlow} highlights={t.access.highlights} entryHero={t.access.entryHero} /> : null}
        </div> : null}

        {effectiveAccessMode === "combined" ? (
          <div className={accountModeTabsClassName} role="tablist" aria-label={t.access.tabs.label}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "account"}
              className={cn(accountTabClassName, mode === "account" ? accountTabActiveClassName : "")}
              onClick={() => setSelectedMode("account")}
            >
              <Icon name="users" />
              {t.access.tabs.account}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "temp"}
              className={cn(accountTabClassName, mode === "temp" ? accountTabActiveClassName : "")}
              onClick={() => setSelectedMode("temp")}
            >
              <Icon name="clock" />
              {t.access.tabs.temp}
            </button>
          </div>
        ) : null}

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
            onLoggedIn={(session) => {
              setMessage(session.kind === "trusted" ? t.access.messages.trustedLogin : t.access.messages.temporaryLogin);
              setPendingAccountSession(session);
            }}
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
              clearAccountPortalDataCache(accountSession.sessionToken);
              onAccountSessionChange(null);
              setMessage(t.access.messages.loggedOut);
            }}
            onSessionCleared={() => {
              clearAccountPortalDataCache(accountSession.sessionToken);
              onAccountSessionChange(null);
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
            onLoggedIn={(session) => {
              setMessage(session.kind === "trusted" ? t.access.messages.trustedLogin : t.access.messages.temporaryLogin);
              setPendingAccountSession(session);
            }}
            onError={setError}
          />
        )}
      </section>
    </main>
  );
}
