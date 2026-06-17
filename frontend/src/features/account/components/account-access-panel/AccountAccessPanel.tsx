"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  AccountApiClient,
  AccountSession,
  AccountExplorerSummary,
  AccountSettings,
  AccountTodoSummary,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemSummary,
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
  cacheAccountPortalData,
  clearAccountPortalDataCache,
  getAccountPortalDataCache,
  heroDetail,
  heroTitle,
  isAccountEntryMode,
  mainLabel,
  type AccountAccessMode,
} from "./account-access-panel-support";
import { AuthHighlights, AuthTravelCollage } from "./account-entry-hero";
import {
  ACCESS_ERROR_CODES,
  isUnauthenticated,
  localizeAccessError,
  rawErrorMessage,
} from "./account-auth-support";
import { AccountPortalLoadingFrame } from "./account-portal-loading-frame";
import type { AuthFlow } from "./account-auth-chrome";
import { EmailLoginPanel } from "./account-email-login-panel";
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
  const initialPortalData = accountSession ? getAccountPortalDataCache(accountSession.sessionToken) : null;
  const [settings, setSettings] = useState<AccountSettings | null>(() => initialPortalData?.settings ?? null);
  const [trips, setTrips] = useState<AccountTripSummary[]>(() => initialPortalData?.trips ?? []);
  const [stats, setStats] = useState<AccountTripStats | null>(() => initialPortalData?.stats ?? null);
  const [explorer, setExplorer] = useState<AccountExplorerSummary | null>(() => initialPortalData?.explorer ?? null);
  const [todos, setTodos] = useState<AccountTodoSummary[]>(() => initialPortalData?.todos ?? []);
  const [vaultItems, setVaultItems] = useState<AccountVaultItemSummary[]>(() => initialPortalData?.vaultItems ?? []);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAccountSession, setPendingAccountSession] = useState<AccountSession | null>(null);
  const displayError = error ? localizeAccessError(error, accessMessages) ?? error : localizeAccessError(initialError ?? null, accessMessages);
  const currentPortalCache = accountSession ? getAccountPortalDataCache(accountSession.sessionToken) : null;
  const displayedSettings = settings ?? currentPortalCache?.settings ?? null;
  const displayedTrips = trips.length ? trips : currentPortalCache?.trips ?? [];
  const displayedStats = stats ?? currentPortalCache?.stats ?? null;
  const displayedExplorer = explorer ?? currentPortalCache?.explorer ?? null;
  const displayedTodos = todos.length ? todos : currentPortalCache?.todos ?? [];
  const displayedVaultItems = vaultItems.length ? vaultItems : currentPortalCache?.vaultItems ?? [];

  useEffect(() => {
    if (!accountSession || isAccountEntry) {
      return;
    }

    let cancelled = false;
    const cachedData = getAccountPortalDataCache(accountSession.sessionToken);

    Promise.allSettled([
      accountClient.loadSettings(accountSession.sessionToken),
      accountClient.listTrips(accountSession.sessionToken),
      accountClient.loadStats(accountSession.sessionToken),
      accountClient.loadExplorer(accountSession.sessionToken),
      accountClient.listToDos(accountSession.sessionToken),
      accountClient.listVault(accountSession.sessionToken),
    ])
      .then(([nextSettings, nextTrips, nextStats, nextExplorer, nextTodos, nextVaultItems]) => {
        if (cancelled) return;
        const failures = [nextSettings, nextTrips, nextStats, nextExplorer, nextTodos, nextVaultItems]
          .filter((result) => result.status === "rejected");
        if (nextSettings.status === "fulfilled") setSettings(nextSettings.value);
        if (nextTrips.status === "fulfilled") setTrips(nextTrips.value);
        if (nextStats.status === "fulfilled") setStats(nextStats.value);
        if (nextExplorer.status === "fulfilled") setExplorer(nextExplorer.value);
        if (nextTodos.status === "fulfilled") setTodos(nextTodos.value);
        if (nextVaultItems.status === "fulfilled") setVaultItems(nextVaultItems.value);
        cacheAccountPortalData(accountSession.sessionToken, {
          settings: nextSettings.status === "fulfilled" ? nextSettings.value : cachedData?.settings ?? null,
          trips: nextTrips.status === "fulfilled" ? nextTrips.value : cachedData?.trips ?? [],
          stats: nextStats.status === "fulfilled" ? nextStats.value : cachedData?.stats ?? null,
          explorer: nextExplorer.status === "fulfilled" ? nextExplorer.value : cachedData?.explorer ?? null,
          todos: nextTodos.status === "fulfilled" ? nextTodos.value : cachedData?.todos ?? [],
          vaultItems: nextVaultItems.status === "fulfilled" ? nextVaultItems.value : cachedData?.vaultItems ?? [],
        });
        if (failures.some((result) => isUnauthenticated(result.reason))) {
          clearAccountPortalDataCache(accountSession.sessionToken);
          onAccountSessionChange(null);
          return;
        }
        if (failures.length) {
          setError(rawErrorMessage(failures[0].reason, ACCESS_ERROR_CODES.accountLoadFailed));
        } else {
          setError(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountClient, accountSession, isAccountEntry, onAccountSessionChange]);

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

  async function refreshAccount(sessionToken: string) {
    const [nextSettings, nextTrips, nextStats] = await Promise.all([
      accountClient.loadSettings(sessionToken),
      accountClient.listTrips(sessionToken),
      accountClient.loadStats(sessionToken),
    ]);
    setSettings(nextSettings);
    setTrips(nextTrips);
    setStats(nextStats);
    cacheAccountPortalData(sessionToken, {
      settings: nextSettings,
      trips: nextTrips,
      stats: nextStats,
      explorer,
      todos,
      vaultItems,
    });
  }

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
