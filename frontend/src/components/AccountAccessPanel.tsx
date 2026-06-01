"use client";

import { ComponentProps, CSSProperties, Dispatch, FormEvent, ReactNode, SetStateAction, useEffect, useState } from "react";
import Link from "next/link";
import type {
  AccountApiClient,
  AccountSession,
  AccountExplorerSummary,
  AccountSettings,
  AccountSettingsUpdateRequest,
  AccountTodoSummary,
  AccountTripCreateRequest,
  AccountTripStats,
  AccountTripSummary,
  AccountVaultItemCreateRequest,
  AccountVaultItemSummary,
  EmailLoginStartResponse,
} from "@/src/account/api-client";
import { appRoutes } from "@/src/routes/app-routes";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { Badge, Button } from "./ui";
import { Icon } from "./icons";
import { TripJoinGate } from "./TripJoinGate";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";

interface AccountAccessPanelProps {
  accessMode?: "combined" | "account-login" | "account-register" | "account-portal" | "trip-access";
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  accountSessionLoaded?: boolean;
  accountSuccessRedirectHref?: string;
  portalSection?: PortalSection;
  apiClient?: TripApiClient;
  initialError?: string | null;
  initialJoinCode?: string;
  trip?: Trip;
  onAccountSessionChange: (session: AccountSession | null) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
}

type AccessMode = "account" | "temp";
type PortalSection = "dashboard" | "trips" | "new-trip" | "explorer" | "todos" | "vault" | "settings" | "sign-out";
type TripWizardStep = "basics" | "access" | "review";

const ACCESS_ERROR_CODES = {
  accountLoadFailed: "account-load-failed",
  passkeyRegistrationCredential: "passkey-registration-credential",
  passkeyLoginCredential: "passkey-login-credential",
  passkeyUnsupported: "passkey-unsupported",
} as const;

const defaultTripForm = (ownerDisplayName = ""): AccountTripCreateRequest => ({
  name: "",
  destinationLabel: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
  ownerDisplayName,
  joinId: generateJoinId(),
  joinPassword: generateJoinPassword(),
});

const tripWizardSteps: TripWizardStep[] = ["basics", "access", "review"];
const portalSectionOrder: PortalSection[] = ["dashboard", "trips", "new-trip", "explorer", "todos", "vault", "settings", "sign-out"];
const portalSectionStorageKey = "sagittarius:portal-section-index";

interface AccountPortalDataCache {
  explorer: AccountExplorerSummary | null;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
  todos: AccountTodoSummary[];
  trips: AccountTripSummary[];
  vaultItems: AccountVaultItemSummary[];
}

let accountPortalDataCache: (AccountPortalDataCache & { sessionToken: string }) | null = null;

export function AccountAccessPanel({
  accessMode = "combined",
  accountClient,
  accountSession,
  accountSessionLoaded = true,
  accountSuccessRedirectHref,
  apiClient,
  initialError,
  initialJoinCode,
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
  const forcedMode = effectiveAccessMode === "trip-access" ? "temp" : effectiveAccessMode === "combined" ? null : "account";
  const isAccountEntry = effectiveAccessMode === "account-login" || effectiveAccessMode === "account-register";
  const isPortalEntry = effectiveAccessMode === "account-portal";
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
  const displayError = localizeAccessError(error ?? initialError ?? null, accessMessages);
  const currentPortalCache = accountSession ? getAccountPortalDataCache(accountSession.sessionToken) : null;
  const displayedSettings = settings ?? currentPortalCache?.settings ?? null;
  const displayedTrips = trips.length ? trips : currentPortalCache?.trips ?? [];
  const displayedStats = stats ?? currentPortalCache?.stats ?? null;
  const displayedExplorer = explorer ?? currentPortalCache?.explorer ?? null;
  const displayedTodos = todos.length ? todos : currentPortalCache?.todos ?? [];
  const displayedVaultItems = vaultItems.length ? vaultItems : currentPortalCache?.vaultItems ?? [];

  useEffect(() => {
    if (!accountSession) {
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
        if (failures.length) {
          setError(rawErrorMessage(failures[0].reason, ACCESS_ERROR_CODES.accountLoadFailed));
        } else {
          setError(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accountClient, accountSession]);

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
      className={[
        "account-page",
        isAccountEntry ? "account-page--entry" : "",
        isPortalEntry ? "account-page--portal" : "",
        isPortalEntry && portalSection === "new-trip" ? "account-page--portal-new-trip" : "",
      ].filter(Boolean).join(" ")}
      aria-label={mainLabel(effectiveAccessMode, t.access.mainLabels)}
    >
      <section className={["account-shell", isAccountEntry ? "account-shell--entry" : ""].filter(Boolean).join(" ")}>
        {isAccountEntry ? <LanguageSwitch className="access-language-switch account-entry-language-switch" /> : null}
        <div className="account-hero">
          <div className="join-mark account-hero-mark" aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className="join-eyebrow">{t.access.eyebrow}</p>
            <h1>{heroTitle(effectiveAccessMode, t.access.titles)}</h1>
            <p>{heroDetail(effectiveAccessMode, t.access.details)}</p>
            {isAccountEntry ? null : <LanguageSwitch className="access-language-switch" />}
          </div>
          {isAccountEntry ? <AuthHighlights flow={effectiveAccessMode === "account-register" ? "register" : "login"} highlights={t.access.highlights} /> : null}
        </div>

        {effectiveAccessMode === "combined" ? (
          <div className="account-mode-tabs" role="tablist" aria-label={t.access.tabs.label}>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "account"}
              className={mode === "account" ? "account-tab account-tab--active" : "account-tab"}
              onClick={() => setSelectedMode("account")}
            >
              <Icon name="users" />
              {t.access.tabs.account}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "temp"}
              className={mode === "temp" ? "account-tab account-tab--active" : "account-tab"}
              onClick={() => setSelectedMode("temp")}
            >
              <Icon name="clock" />
              {t.access.tabs.temp}
            </button>
          </div>
        ) : null}

        {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
        {displayError ? <StatusMessage tone="danger">{displayError}</StatusMessage> : null}

        {mode === "temp" ? (
          <TripJoinGate
            apiClient={apiClient}
            embedded
            initialJoinCode={initialJoinCode}
            trip={trip}
            onAuthenticated={onAuthenticated}
            onCockpitLoaded={onCockpitLoaded}
            onTripChange={onTripChange}
          />
        ) : pendingAccountSession ? (
          <StatusMessage tone="success">{t.access.portalDelay.detail}</StatusMessage>
        ) : !accountSessionLoaded && effectiveAccessMode === "account-portal" ? (
          <AccountPortalLoadingFrame portalSection={portalSection} />
        ) : accountSession ? (
          <AccountDashboard
            accountClient={accountClient}
            accountSession={accountSession}
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
            onCreatedTrip={async (session) => {
              onAuthenticated(session);
              if (apiClient) {
                const cockpit = await apiClient.loadTrip(session.tripId, session.sessionToken);
                onTripChange(cockpit.trip);
                onCockpitLoaded?.(cockpit);
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
            flow={accessMode === "account-register" ? "register" : "login"}
            accountClient={accountClient}
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

function AuthHighlights({ flow, highlights }: { flow: "login" | "register"; highlights: Messages["access"]["highlights"] }) {
  const items = flow === "register"
    ? [highlights.registerSecure, highlights.registerHistory, highlights.registerOwner]
    : [highlights.secure, highlights.history, highlights.trusted];

  return (
    <ul className="account-auth-highlights" aria-label={highlights.label}>
      <li className="account-auth-highlight">
        <Icon name="check" />
        <span>{items[0]}</span>
      </li>
      <li className="account-auth-highlight">
        <Icon name="clock" />
        <span>{items[1]}</span>
      </li>
      <li className="account-auth-highlight">
        <Icon name="key" />
        <span>{items[2]}</span>
      </li>
    </ul>
  );
}

function AccountPortalLoadingFrame({ portalSection }: { portalSection: PortalSection }) {
  const { t } = useI18n();
  const portalNavItems = getPortalNavItems(t);
  const cachedEmail = accountPortalDataCache?.settings?.profile.primaryEmail ?? t.access.dashboard.noEmail;

  return (
    <div className="account-dashboard" id="account-portal" aria-busy="true">
      <nav className="portal-nav" aria-label={t.access.portal.nav.label}>
        <div className="portal-nav-brand">
          <div>
            <strong>{t.access.portal.title}</strong>
            <span>{cachedEmail}</span>
          </div>
        </div>
        <div className="portal-nav-links">
          {portalNavItems.map((item) => (
            <Link href={item.href} key={item.href} className={item.id === portalSection ? "portal-nav-link portal-nav-link--active" : "portal-nav-link"} aria-current={item.id === portalSection ? "page" : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href={appRoutes.portalSignOut()}
            className={portalSection === "sign-out" ? "portal-nav-link portal-nav-link--active" : "portal-nav-link"}
            aria-current={portalSection === "sign-out" ? "page" : undefined}
          >
            <Icon name="x" />
            <span>{t.access.dashboard.logout}</span>
          </Link>
        </div>
      </nav>
      <div className="portal-content">
        <section className="account-card portal-loading-card">
          <span className="portal-skeleton portal-skeleton--title" />
          <span className="portal-skeleton portal-skeleton--line" />
          <span className="portal-skeleton portal-skeleton--block" />
        </section>
      </div>
    </div>
  );
}

function mainLabel(accessMode: AccountAccessPanelProps["accessMode"], labels: Messages["access"]["mainLabels"]): string {
  if (accessMode === "account-login") return labels.accountLogin;
  if (accessMode === "account-register") return labels.accountRegister;
  if (accessMode === "account-portal") return labels.accountPortal;
  if (accessMode === "trip-access") return labels.tripAccess;
  return labels.combined;
}

function getPortalNavItems(t: Messages) {
  return [
    { id: "dashboard" as const, href: appRoutes.portal(), icon: "home" as const, label: t.access.portal.nav.dashboard },
    { id: "trips" as const, href: appRoutes.portalMyTrips(), icon: "calendar" as const, label: t.access.portal.nav.trips },
    { id: "explorer" as const, href: appRoutes.portalExplorer(), icon: "map" as const, label: t.access.portal.nav.explorer },
    { id: "todos" as const, href: appRoutes.portalToDos(), icon: "list" as const, label: t.access.portal.nav.todos },
    { id: "vault" as const, href: appRoutes.portalVault(), icon: "document" as const, label: t.access.portal.nav.vault },
    { id: "settings" as const, href: appRoutes.portalSettings(), icon: "settings" as const, label: t.access.portal.nav.settings },
  ];
}

function getAccountPortalDataCache(sessionToken: string): AccountPortalDataCache | null {
  if (accountPortalDataCache?.sessionToken !== sessionToken) return null;
  return accountPortalDataCache;
}

function cacheAccountPortalData(sessionToken: string, data: AccountPortalDataCache) {
  accountPortalDataCache = { ...data, sessionToken };
}

function clearAccountPortalDataCache(sessionToken: string) {
  if (accountPortalDataCache?.sessionToken === sessionToken) accountPortalDataCache = null;
}

function heroTitle(accessMode: AccountAccessPanelProps["accessMode"], titles: Messages["access"]["titles"]): string {
  if (accessMode === "account-login") return titles.accountLogin;
  if (accessMode === "account-register") return titles.accountRegister;
  if (accessMode === "account-portal") return titles.accountPortal;
  if (accessMode === "trip-access") return titles.tripAccess;
  return titles.combined;
}

function heroDetail(accessMode: AccountAccessPanelProps["accessMode"], details: Messages["access"]["details"]): string {
  if (accessMode === "account-login") return details.accountLogin;
  if (accessMode === "account-register") return details.accountRegister;
  if (accessMode === "account-portal") return details.accountPortal;
  if (accessMode === "trip-access") return details.tripAccess;
  return details.combined;
}

function EmailLoginPanel({
  flow,
  accountClient,
  onError,
  onLoggedIn,
}: {
  flow: "login" | "register";
  accountClient: AccountApiClient;
  onError: (message: string | null) => void;
  onLoggedIn: (session: AccountSession) => void;
}) {
  const { locale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [authStep, setAuthStep] = useState<"email" | "methods" | "password">("email");
  const [challenge, setChallenge] = useState<EmailLoginStartResponse | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!challenge || resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [challenge, resendCooldown]);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError(null);
    setAuthStep("methods");
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signInWithPassword();
  }

  async function requestEmailCode() {
    setIsSubmitting(true);
    try {
      const nextChallenge = await accountClient.startEmailLogin(email);
      setChallenge(nextChallenge);
      setResendCooldown(30);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.startFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge) return;
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishEmailLogin({
        challengeId: challenge.challengeId,
        code,
        trustDevice: flow === "login" ? trustDevice : true,
        deviceLabel: "",
      });
      onLoggedIn(session);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.invalidCode, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithPassword() {
    setIsSubmitting(true);
    try {
      const session = await accountClient.finishPasswordLogin({
        flow,
        email,
        password,
        trustDevice: flow === "login" ? trustDevice : true,
        deviceLabel: "",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, flow === "register" ? t.access.emailLogin.errors.passwordRegisterFailed : t.access.emailLogin.errors.passwordLoginFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithPasskey() {
    setIsSubmitting(true);
    try {
      const loginStart = await accountClient.startPasskeyLogin(email);
      const credential = await getPasskeyCredential(loginStart.challenge, loginStart.allowCredentials.map((credential) => credential.credentialId));
      const session = await accountClient.finishPasskeyLogin({
        challengeId: loginStart.challengeId,
        credentialId: arrayBufferToBase64Url(credential.rawId),
        clientDataJson: arrayBufferToBase64Url(credential.response.clientDataJSON),
        authenticatorData: arrayBufferToBase64Url(credential.response.authenticatorData),
        signature: arrayBufferToBase64Url(credential.response.signature),
        trustDevice: flow === "login" ? trustDevice : false,
        deviceLabel: "",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.emailLogin.errors.passkeyLoginFailed, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetChallenge() {
    setChallenge(null);
    setCode("");
    setResendCooldown(0);
    setAuthStep("methods");
    onError(null);
  }

  function changeEmail() {
    setChallenge(null);
    setCode("");
    setPassword("");
    setResendCooldown(0);
    setAuthStep("email");
    onError(null);
  }

  function showPasswordStep() {
    setPassword("");
    setAuthStep("password");
    onError(null);
  }

  const trustDeviceFields = (
    <label className="account-check">
      <input checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} type="checkbox" />
      {t.access.emailLogin.trustDevice}
    </label>
  );

  return (
    <div className="account-login-flow">
      <form className="account-card account-form" onSubmit={challenge ? submitCode : authStep === "password" ? submitPassword : submitEmail}>
        <PanelHeading
          icon={challenge ? "settings" : authStep === "password" ? "key" : "users"}
          title={challenge ? t.access.emailLogin.verifyTitle : authStep === "methods" ? t.access.emailLogin.methodTitle : authStep === "password" ? t.access.emailLogin.passwordTitle : t.access.emailLogin.emailTitle}
          detail={
            challenge
              ? t.access.emailLogin.expiresAt({ value: formatDateTime(challenge.expiresAt, locale) })
              : authStep === "methods"
                ? t.access.emailLogin.methodDetail
                : authStep === "password"
                  ? t.access.emailLogin.passwordDetail
                  : t.access.emailLogin.emailDetail
          }
        />
        {challenge ? (
          <>
            <div className="account-step-summary">
              <span>{t.access.emailLogin.sentCodeTo}</span>
              <strong>{email}</strong>
            </div>
            <label>
              <span>{t.access.emailLogin.verificationCode}</span>
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required />
            </label>
            {flow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={isSubmitting}>
              <Icon name="check" />
              {flow === "register" ? t.access.emailLogin.createAccount : t.access.emailLogin.signInAccount}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting || resendCooldown > 0} onClick={() => void requestEmailCode()}>
              {t.access.emailLogin.resendCode}
              {resendCooldown > 0 ? t.access.emailLogin.resendCooldown({ seconds: resendCooldown }) : ""}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={resetChallenge}>
              {t.access.emailLogin.changeEmail}
            </Button>
          </>
        ) : authStep === "email" ? (
          <>
            <label>
              <span>{t.access.emailLogin.email}</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
            </label>
            <Button type="submit" disabled={!email || isSubmitting}>
              <Icon name="check" />
              {t.access.emailLogin.continue}
            </Button>
          </>
        ) : authStep === "methods" ? (
          <>
            <div className="account-step-summary">
              <span>{flow === "register" ? t.access.emailLogin.createFor : t.access.emailLogin.signInAs}</span>
              <strong>{email}</strong>
            </div>
            <Button type="button" disabled={isSubmitting} onClick={() => void requestEmailCode()}>
              <Icon name="check" />
              {flow === "register" ? t.access.emailLogin.sendRegisterCode : t.access.emailLogin.sendSignInCode}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={showPasswordStep}>
              <Icon name="key" />
              {flow === "register" ? t.access.emailLogin.createWithPassword : t.access.emailLogin.signInWithPassword}
            </Button>
            {flow === "login" ? (
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={() => void signInWithPasskey()}>
                <Icon name="key" />
                {t.access.emailLogin.signInWithPasskey}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={changeEmail}>
              {t.access.emailLogin.changeEmail}
            </Button>
          </>
        ) : (
          <>
            <div className="account-step-summary">
              <span>{flow === "register" ? t.access.emailLogin.createFor : t.access.emailLogin.signInAs}</span>
              <strong>{email}</strong>
            </div>
            <label>
              <span>{t.access.emailLogin.password}</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={flow === "register" ? "new-password" : "current-password"}
                required
              />
            </label>
            {flow === "login" ? trustDeviceFields : null}
            <Button type="submit" disabled={password.length < 8 || isSubmitting}>
              <Icon name="key" />
              {flow === "register" ? t.access.emailLogin.createWithPassword : t.access.emailLogin.signInWithPassword}
            </Button>
            <Button type="button" variant="ghost" disabled={isSubmitting} onClick={() => setAuthStep("methods")}>
              {t.access.emailLogin.chooseAnotherMethod}
            </Button>
          </>
        )}
      </form>
      {!challenge ? (
        <p className="account-flow-switch">
          {flow === "register" ? (
            <>
              {t.access.emailLogin.hasAccount} <a href="/login">{t.access.emailLogin.signInLink}</a>
            </>
          ) : (
            <>
              {t.access.emailLogin.noAccount} <a href="/register">{t.access.emailLogin.registerLink}</a>
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

function AccountDashboard({
  accountClient,
  accountSession,
  explorer,
  isLoading,
  onCreatedTrip,
  onError,
  onLogout,
  onSessionCleared,
  onMessage,
  onSettingsChanged,
  onVaultItemCreated,
  portalSection,
  settings,
  stats,
  todos,
  trips,
  vaultItems,
}: {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  explorer: AccountExplorerSummary | null;
  isLoading: boolean;
  onCreatedTrip: (session: TripParticipantSession) => Promise<void>;
  onError: (message: string | null) => void;
  onLogout: () => Promise<void>;
  onSessionCleared: () => void;
  onMessage: (message: string | null) => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  onVaultItemCreated: (item: AccountVaultItemSummary) => void;
  portalSection: PortalSection;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
  todos: AccountTodoSummary[];
  trips: AccountTripSummary[];
  vaultItems: AccountVaultItemSummary[];
}) {
  const { t } = useI18n();
  const defaultOwnerDisplayName = settings?.profile.displayName ?? t.access.dashboard.fallbackName;
  const [tripForm, setTripForm] = useState(() => defaultTripForm());
  const [wizardStep, setWizardStep] = useState<TripWizardStep>("basics");
  const [transitionDirection] = useState<"forward" | "back">(() => {
    const currentIndex = portalSectionOrder.indexOf(portalSection);
    return currentIndex < readPreviousPortalSectionIndex(currentIndex) ? "back" : "forward";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vaultForm, setVaultForm] = useState<AccountVaultItemCreateRequest>({ kind: "note", title: "", detail: "", externalUrl: "" });
  const [explorerQuery, setExplorerQuery] = useState("");
  const sessionKindLabel = accountSession.kind === "trusted" ? t.access.dashboard.sessionKinds.trusted : t.access.dashboard.sessionKinds.temporary;
  const sharedTrips = trips.filter((trip) => !trip.isOwner);
  const explorerTrips = (sharedTrips.length ? sharedTrips : trips).filter((trip) => {
    const query = explorerQuery.trim().toLocaleLowerCase();
    if (!query) return true;
    return `${trip.name} ${trip.destinationLabel} ${trip.role}`.toLocaleLowerCase().includes(query);
  });

  async function submitTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await accountClient.createTrip(accountSession.sessionToken, normalizedTripForm(tripForm, defaultOwnerDisplayName));
      await onCreatedTrip(response.memberSession);
      setTripForm(defaultTripForm());
      setWizardStep("basics");
      onMessage(t.access.dashboard.createTrip.success);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.dashboard.createTrip.error, t.access.messages));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitVaultItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = vaultForm.title.trim();
    if (!title) return;
    try {
      const item = await accountClient.createVaultItem(accountSession.sessionToken, {
        ...vaultForm,
        title,
        detail: vaultForm.detail.trim(),
        externalUrl: vaultForm.externalUrl?.trim() || null,
      });
      onVaultItemCreated(item);
      setVaultForm({ kind: "note", title: "", detail: "", externalUrl: "" });
      onMessage(t.access.portal.vaultCreate.success);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.portal.vaultCreate.error, t.access.messages));
    }
  }

  async function registerPasskey() {
    if (!settings) return;
    try {
      const registrationStart = await accountClient.startPasskeyRegistration(accountSession.sessionToken);
      const credential = await createPasskeyCredential(registrationStart.challenge, settings);
      const passkey = await accountClient.finishPasskeyRegistration(accountSession.sessionToken, {
        challengeId: registrationStart.challengeId,
        credentialId: arrayBufferToBase64Url(credential.rawId),
        clientDataJson: arrayBufferToBase64Url(credential.response.clientDataJSON),
        attestationObject: arrayBufferToBase64Url(credential.response.attestationObject),
        nickname: `${settings.profile.displayName} passkey`,
      });
      onSettingsChanged({
        ...settings,
        passkeys: [passkey, ...settings.passkeys.filter((candidate) => candidate.id !== passkey.id)],
      });
      onMessage(t.access.settings.messages.passkeyCreated);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.passkeyFailed, t.access.messages));
    }
  }

  const portalNavItems = getPortalNavItems(t);
  const activePortalSection = portalSection === "new-trip" ? "trips" : portalSection;
  const currentPortalSectionIndex = portalSectionOrder.indexOf(portalSection);

  useEffect(() => {
    window.sessionStorage.setItem(portalSectionStorageKey, String(currentPortalSectionIndex));
  }, [currentPortalSectionIndex]);

  return (
    <div className="account-dashboard" id="account-portal" data-transition-direction={transitionDirection}>
      <nav className="portal-nav" aria-label={t.access.portal.nav.label}>
        <div className="portal-nav-brand">
          <div>
            <strong>{t.access.portal.title}</strong>
            <span>{settings?.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
          </div>
        </div>
        <div className="portal-nav-links">
          {portalNavItems.map((item) => (
            <Link href={item.href} key={item.href} className={item.id === activePortalSection ? "portal-nav-link portal-nav-link--active" : "portal-nav-link"} aria-current={item.id === activePortalSection ? "page" : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
          <Link
            href={appRoutes.portalSignOut()}
            className={activePortalSection === "sign-out" ? "portal-nav-link portal-nav-link--active" : "portal-nav-link"}
            aria-current={activePortalSection === "sign-out" ? "page" : undefined}
          >
            <Icon name="x" />
            <span>{t.access.dashboard.logout}</span>
          </Link>
        </div>
      </nav>

      <div className="portal-content">
        {portalSection === "dashboard" ? <section className="account-card account-profile-card" id="portal-dashboard">
          <PanelHeading icon="home" title={t.access.portal.sections.dashboard.title} detail={t.access.portal.sections.dashboard.detail} />
          <div className="account-profile-row">
            <span className="person-avatar" style={{ backgroundColor: settings?.profile.avatarColor ?? "#0f766e" }} aria-hidden="true">
              {(settings?.profile.displayName ?? t.access.dashboard.fallbackName).slice(0, 1)}
            </span>
            <div>
              <strong>{settings?.profile.displayName ?? t.access.dashboard.fallbackName}</strong>
              <span>{settings?.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
            </div>
            <Badge tone={accountSession.kind === "trusted" ? "success" : "warning"}>{sessionKindLabel}</Badge>
          </div>
          <div className="account-stat-grid">
            {isLoading && !stats ? (
              <PortalStatSkeleton />
            ) : (
              <>
                <Stat label={t.access.dashboard.stats.trips} value={stats?.tripsTotal ?? 0} />
                <Stat label={t.access.dashboard.stats.owned} value={stats?.tripsOwned ?? 0} />
                <Stat label={t.access.dashboard.stats.active} value={stats?.activeTrips ?? 0} />
                <Stat label={t.access.dashboard.stats.claims} value={stats?.tempClaimsCompleted ?? 0} />
              </>
            )}
          </div>
        </section> : null}

        {portalSection === "trips" ? <section className="account-card account-history" id="portal-trips">
          <div className="portal-section-topline">
            <PanelHeading
              icon="calendar"
              title={t.access.portal.sections.trips.title}
              detail={isLoading ? t.access.dashboard.history.loading : t.access.dashboard.history.visibleTrips({ count: trips.length })}
            />
            <Button asChild>
              <Link href={appRoutes.portalNewTrip()}>
                <Icon name="plus" />
                Create trip
              </Link>
            </Button>
          </div>
          {isLoading && !trips.length ? (
            <PortalListSkeleton rows={2} />
          ) : trips.length ? (
            <div className="account-trip-list">
              {trips.map((trip) => (
                <article className="account-trip-row" key={trip.id}>
                  <span className="account-trip-icon" aria-hidden="true"><Icon name="location" /></span>
                  <div>
                    <strong>{trip.name}</strong>
                    <span>{trip.destinationLabel} · {trip.startDate} - {trip.endDate}</span>
                  </div>
                  <Badge tone={trip.isOwner ? "success" : "neutral"}>{trip.isOwner ? t.access.dashboard.history.owner : t.appShell.roles[trip.role]}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty">{t.access.dashboard.history.empty}</p>
          )}
        </section> : null}

        {portalSection === "new-trip" ? <section className="account-card account-history portal-new-trip-card" id="portal-new-trip">
          <div className="trip-builder-topbar">
            <Button asChild variant="secondary">
              <Link href={appRoutes.portalMyTrips()}>
                <Icon name="chevronLeft" />
                My trips
              </Link>
            </Button>
            <div>
              <span>Trip builder</span>
              <strong>Create trip</strong>
            </div>
            <Badge tone="neutral">Draft</Badge>
          </div>
          <PortalTripWizard
            defaultOwnerDisplayName={defaultOwnerDisplayName}
            isSubmitting={isSubmitting}
            step={wizardStep}
            tripForm={tripForm}
            onChange={setTripForm}
            onStepChange={setWizardStep}
            onSubmit={submitTrip}
          />
        </section> : null}

        {portalSection === "explorer" ? <section className="account-card portal-feature-card portal-explorer-card" id="portal-explorer">
          <PanelHeading icon="map" title={t.access.portal.sections.explorer.title} detail="Find shared trips from people in your system." />
          {isLoading && !explorer ? <PortalListSkeleton rows={1} compact /> : (
            <div className="account-settings-grid">
              <SettingLine label={t.access.portal.explorerStats.upcoming} value={`${explorer?.upcomingTrips ?? 0}`} />
              <SettingLine label={t.access.portal.explorerStats.destinations} value={`${explorer?.destinationCount ?? 0}`} />
            </div>
          )}
          {explorer?.nextTrip ? (
            <div className="account-step-summary">
              <span>{t.access.portal.explorerStats.nextTrip}</span>
              <strong>{explorer.nextTrip.name}</strong>
            </div>
          ) : null}
          <div className="portal-search">
            <Icon name="map" />
            <input
              aria-label="Search shared trips"
              placeholder="Search city, trip, or role"
              value={explorerQuery}
              onChange={(event) => setExplorerQuery(event.target.value)}
            />
          </div>
          <div className="portal-map-preview" aria-label="Shared trip map preview">
            {explorerTrips.slice(0, 4).map((trip, index) => (
              <span
                className="portal-map-pin"
                key={trip.id}
                style={{ "--pin-x": `${22 + index * 17}%`, "--pin-y": `${32 + (index % 2) * 26}%` } as CSSProperties}
                title={`${trip.name}, ${trip.destinationLabel}`}
              >
                <Icon name="location" />
              </span>
            ))}
          </div>
          {explorerTrips.length ? (
            <div className="account-trip-list">
              {explorerTrips.map((trip) => (
                <article className="account-trip-row" key={trip.id}>
                  <span className="account-trip-icon" aria-hidden="true"><Icon name="map" /></span>
                  <div>
                    <strong>{trip.name}</strong>
                    <span>{trip.destinationLabel} · {trip.startDate} - {trip.endDate}</span>
                  </div>
                  <Badge tone={trip.isOwner ? "success" : "neutral"}>{trip.isOwner ? "Owned" : "Shared"}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty">No shared trips match this search.</p>
          )}
        </section> : null}

        {portalSection === "todos" ? <section className="account-card portal-feature-card" id="portal-to-dos">
          <PanelHeading icon="list" title={t.access.portal.sections.todos.title} detail={t.access.portal.sections.todos.detail} />
          {isLoading && !todos.length ? (
            <PortalListSkeleton rows={1} />
          ) : todos.length ? (
            <div className="account-trip-list">
              {todos.map((todo) => (
                <article className="account-trip-row" key={todo.id}>
                  <span className="account-trip-icon" aria-hidden="true"><Icon name="list" /></span>
                  <div>
                    <strong>{todo.title}</strong>
                    <span>{todo.tripName} · {todo.visibility} · {todo.kind ?? "prep"}</span>
                  </div>
                  <Badge tone={todo.status === "done" ? "success" : "warning"}>{todo.status}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty">{t.access.portal.sections.todos.empty}</p>
          )}
        </section> : null}

        {portalSection === "vault" ? <section className="account-card portal-feature-card" id="portal-vault">
          <PanelHeading icon="document" title={t.access.portal.sections.vault.title} detail={t.access.portal.sections.vault.detail} />
          <div className="cloud-provider-panel" aria-label="Cloud provider options">
            <div>
              <strong>Use your own cloud</strong>
              <span>Save links to Google Drive, iCloud, Dropbox, OneDrive, or any private folder. Files stay in your provider; Joii keeps only the link and note.</span>
            </div>
            <div className="cloud-provider-grid">
              {["Google Drive", "iCloud", "Dropbox", "OneDrive"].map((provider) => (
                <button className="cloud-provider-button" type="button" key={provider}>
                  <Icon name="cloud" />
                  {provider}
                </button>
              ))}
            </div>
          </div>
          <form className="account-form account-settings-form" onSubmit={submitVaultItem}>
            <div className="account-two-col">
              <label>
                <span>{t.access.portal.vaultCreate.kind}</span>
                <select value={vaultForm.kind} onChange={(event) => setVaultForm((current) => ({ ...current, kind: event.target.value as "note" | "file" }))}>
                  <option value="note">{t.access.portal.vaultCreate.note}</option>
                  <option value="file">{t.access.portal.vaultCreate.file}</option>
                </select>
              </label>
              <label>
                <span>{t.access.portal.vaultCreate.title}</span>
                <input value={vaultForm.title} onChange={(event) => setVaultForm((current) => ({ ...current, title: event.target.value }))} required />
              </label>
            </div>
            <label>
              <span>{t.access.portal.vaultCreate.detail}</span>
              <input value={vaultForm.detail} onChange={(event) => setVaultForm((current) => ({ ...current, detail: event.target.value }))} />
            </label>
            <label>
              <span>{t.access.portal.vaultCreate.externalUrl}</span>
              <input
                value={vaultForm.externalUrl ?? ""}
                onChange={(event) => setVaultForm((current) => ({ ...current, externalUrl: event.target.value }))}
                placeholder="https://drive.google.com/..."
                type="url"
              />
            </label>
            <Button type="submit"><Icon name="plus" />{t.access.portal.vaultCreate.submit}</Button>
          </form>
          {isLoading && !vaultItems.length ? (
            <PortalListSkeleton rows={1} />
          ) : vaultItems.length ? (
            <div className="account-trip-list">
              {vaultItems.map((item) => (
                <article className="account-trip-row" key={`${item.source}-${item.id}`}>
                  <span className="account-trip-icon" aria-hidden="true"><Icon name={item.kind === "file" ? "document" : "note"} /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.tripName ?? t.access.portal.vaultCreate.personal} · {item.detail}</span>
                  </div>
                  <Badge tone={item.kind === "file" ? "neutral" : "success"}>{item.kind}</Badge>
                </article>
              ))}
            </div>
          ) : (
            <p className="account-empty">{t.access.portal.sections.vault.empty}</p>
          )}
        </section> : null}

        {portalSection === "settings" ? <section className="account-card account-settings-card" id="portal-settings">
          <PanelHeading icon="settings" title={t.access.settings.title} detail={t.access.settings.detail} />
          {settings ? (
            <AccountSettingsEditor
              accountClient={accountClient}
              accountSession={accountSession}
              settings={settings}
              onError={onError}
              onMessage={onMessage}
              onSessionCleared={onSessionCleared}
              onSettingsChanged={onSettingsChanged}
            />
          ) : (
            <p className="account-empty">{t.access.settings.loading}</p>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={!settings}
            onClick={() => void registerPasskey()}
          >
            <Icon name="key" />
            {t.access.settings.startPasskeySetup}
          </Button>
        </section> : null}

        {portalSection === "sign-out" ? <section className="account-card account-profile-card" id="portal-sign-out">
          <PanelHeading icon="x" title={t.access.portal.sections.signOut.title} detail={t.access.portal.sections.signOut.detail} />
          <Button type="button" variant="secondary" onClick={() => void onLogout()}>
            <Icon name="x" />
            {t.access.dashboard.logout}
          </Button>
        </section> : null}
      </div>
    </div>
  );
}

function PortalTripWizard({
  defaultOwnerDisplayName,
  isSubmitting,
  onChange,
  onStepChange,
  onSubmit,
  step,
  tripForm,
}: {
  defaultOwnerDisplayName: string;
  isSubmitting: boolean;
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
  onStepChange: Dispatch<SetStateAction<TripWizardStep>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  step: TripWizardStep;
  tripForm: AccountTripCreateRequest;
}) {
  const { t } = useI18n();
  const stepIndex = tripWizardSteps.indexOf(step);
  const ownerDisplayName = tripForm.ownerDisplayName.trim() || defaultOwnerDisplayName;
  const basicsComplete = Boolean(tripForm.name.trim() && tripForm.startDate && tripForm.endDate);
  const accessComplete = Boolean(ownerDisplayName.trim() && tripForm.joinId.trim() && tripForm.joinPassword.length >= 12);
  const canGoNext = step === "basics" ? basicsComplete : step === "access" ? accessComplete : true;
  const canSubmit = basicsComplete && accessComplete;
  const progress = `${((stepIndex + 1) / tripWizardSteps.length) * 100}%`;

  function nextStep() {
    if (!canGoNext) return;
    onStepChange(tripWizardSteps[Math.min(tripWizardSteps.length - 1, stepIndex + 1)]);
  }

  function previousStep() {
    onStepChange(tripWizardSteps[Math.max(0, stepIndex - 1)]);
  }

  function isStepAccessible(candidate: TripWizardStep) {
    const candidateIndex = tripWizardSteps.indexOf(candidate);
    if (candidateIndex <= stepIndex) return true;
    if (candidate === "access") return basicsComplete;
    if (candidate === "review") return basicsComplete && accessComplete;
    return true;
  }

  function regenerateCredentials() {
    onChange((current) => ({
      ...current,
      joinId: generateJoinId(),
      joinPassword: generateJoinPassword(),
    }));
  }

  return (
    <form className="account-form account-settings-form portal-create-trip-inline portal-trip-wizard" onSubmit={onSubmit}>
      <div className="trip-wizard-head">
        <div>
          <span className="trip-wizard-kicker">Step {stepIndex + 1} of {tripWizardSteps.length}</span>
          <strong>{wizardStepTitle(step)}</strong>
          <p>{wizardStepDetail(step)}</p>
        </div>
        <Badge tone={canSubmit ? "success" : "neutral"}>{canSubmit ? "Ready" : "Draft"}</Badge>
      </div>
      <div className="trip-wizard-progress" aria-hidden="true">
        <span style={{ width: progress }} />
      </div>
      <div className="trip-wizard-steps" aria-label="Create trip steps">
        {tripWizardSteps.map((candidate, index) => (
          <button
            aria-current={candidate === step ? "step" : undefined}
            className={[
              "trip-wizard-step",
              candidate === step ? "trip-wizard-step--active" : "",
              index < stepIndex ? "trip-wizard-step--complete" : "",
            ].filter(Boolean).join(" ")}
            disabled={!isStepAccessible(candidate)}
            key={candidate}
            type="button"
            onClick={() => onStepChange(candidate)}
          >
            <span>{index + 1}</span>
            {wizardStepLabel(candidate)}
          </button>
        ))}
      </div>
      <div className="trip-wizard-layout">
        <div className="trip-wizard-main">
          {step === "basics" ? (
            <div className="trip-wizard-pane">
              <p>Name the trip and choose the round trip window.</p>
              <div className="account-two-col">
                <label>
                  <span>{t.access.dashboard.createTrip.labels.name}</span>
                  <input
                    value={tripForm.name}
                    onChange={(event) => onChange((current) => ({ ...current, name: event.target.value, destinationLabel: event.target.value }))}
                    required
                  />
                  <small>Use a name your group will recognize in the portal.</small>
                </label>
                <fieldset className="trip-roundtrip-field">
                  <legend>Round trip dates</legend>
                  <div className="trip-roundtrip-row">
                    <label className="trip-date-leg">
                      <span>Depart</span>
                      <input
                        aria-label={t.access.dashboard.createTrip.labels.startDate}
                        value={tripForm.startDate}
                        onChange={(event) => onChange((current) => ({ ...current, startDate: event.target.value }))}
                        type="date"
                        required
                      />
                    </label>
                    <span className="trip-date-arrow" aria-hidden="true"><Icon name="route" /></span>
                    <label className="trip-date-leg">
                      <span>Return</span>
                      <input
                        aria-label={t.access.dashboard.createTrip.labels.endDate}
                        value={tripForm.endDate}
                        onChange={(event) => onChange((current) => ({ ...current, endDate: event.target.value }))}
                        type="date"
                        required
                      />
                    </label>
                  </div>
                  <small>Round trip dates are used as the first trip window.</small>
                </fieldset>
              </div>
            </div>
          ) : null}
          {step === "access" ? (
            <div className="trip-wizard-pane">
              <p>Access details are generated for this trip. You can regenerate before creating it.</p>
              <div className="trip-access-panel">
                <label>
                  <span>{t.access.dashboard.createTrip.labels.ownerDisplayName}</span>
                  <input
                    value={ownerDisplayName}
                    onChange={(event) => onChange((current) => ({ ...current, ownerDisplayName: event.target.value }))}
                    autoComplete="name"
                    required
                  />
                  <small>Defaulted from your account profile.</small>
                </label>
                <div className="trip-generated-access">
                  <label>
                    <span>{t.access.dashboard.createTrip.labels.joinId}</span>
                    <input value={tripForm.joinId} readOnly />
                  </label>
                  <label>
                    <span>{t.access.dashboard.createTrip.labels.joinPassword}</span>
                    <input value={tripForm.joinPassword} readOnly />
                  </label>
                  <Button type="button" variant="secondary" onClick={regenerateCredentials}>
                    <Icon name="route" />
                    Regenerate
                  </Button>
                </div>
              </div>
              <div className="trip-access-note">
                <Icon name="key" />
                <span>Share these with travelers who need to join manually. You can rotate access later.</span>
              </div>
            </div>
          ) : null}
          {step === "review" ? (
            <div className="trip-ticket-review">
              <div>
                <span>Trip</span>
                <strong>{tripForm.name || "New trip"}</strong>
              </div>
              <div>
                <span>Dates</span>
                <strong>{tripForm.startDate} - {tripForm.endDate}</strong>
              </div>
              <div>
                <span>Owner</span>
                <strong>{ownerDisplayName || "Owner"}</strong>
              </div>
              <div>
                <span>Join ID</span>
                <strong>{tripForm.joinId || "Join ID"}</strong>
              </div>
            </div>
          ) : null}
        </div>
        <aside className="trip-ticket-preview" aria-label="Trip ticket preview">
          <div className="trip-ticket-topline">
            <span>JOII TRIP</span>
            <Badge tone="primary">Round trip</Badge>
          </div>
          <strong>{tripForm.name || "New trip"}</strong>
          <small>{ownerDisplayName || "Owner"}</small>
          <div className="trip-ticket-route">
            <span>{tripForm.startDate || "Depart"}</span>
            <Icon name="route" />
            <span>{tripForm.endDate || "Return"}</span>
          </div>
          <div className="trip-ticket-meta">
            <span>{tripForm.joinId || "Join ID"}</span>
            <span>{tripForm.joinPassword ? "Password generated" : "Password"}</span>
          </div>
          <em>Access is generated automatically and can be rotated later.</em>
        </aside>
      </div>
      <div className="trip-wizard-actions">
        <Button type="button" variant="secondary" onClick={previousStep} disabled={stepIndex === 0}>
          <Icon name="chevronLeft" />
          Back
        </Button>
        {step === "review" ? (
          <Button type="submit" disabled={isSubmitting || !canSubmit}>
            <Icon name="check" />
            {t.access.dashboard.createTrip.submit}
          </Button>
        ) : (
          <Button type="button" onClick={nextStep} disabled={!canGoNext}>
            Continue
            <Icon name="chevronRight" />
          </Button>
        )}
      </div>
    </form>
  );
}

function wizardStepLabel(step: TripWizardStep): string {
  if (step === "basics") return "Trip";
  if (step === "access") return "Access";
  return "Review";
}

function wizardStepTitle(step: TripWizardStep): string {
  if (step === "basics") return "Round trip";
  if (step === "access") return "Join access";
  return "Review and create";
}

function wizardStepDetail(step: TripWizardStep): string {
  if (step === "basics") return "Name the trip and select departure plus return dates.";
  if (step === "access") return "Owner and join credentials are prepared by the system.";
  return "Check the trip before opening the workspace.";
}

function normalizedTripForm(form: AccountTripCreateRequest, defaultOwnerDisplayName: string): AccountTripCreateRequest {
  const name = form.name.trim();
  return {
    ...form,
    name,
    destinationLabel: form.destinationLabel.trim() || name,
    ownerDisplayName: form.ownerDisplayName.trim() || defaultOwnerDisplayName,
  };
}

function generateJoinId(): string {
  return `JOII-${randomToken(3)}-${randomToken(3)}`.toUpperCase();
}

function generateJoinPassword(): string {
  return `${randomToken(4)}-${randomToken(4)}-${randomToken(4)}`;
}

function randomToken(length: number): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const values = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < values.length; index += 1) values[index] = Math.floor(Math.random() * 256);
  }
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

function readPreviousPortalSectionIndex(fallbackIndex: number): number {
  if (typeof window === "undefined") return fallbackIndex;
  const storedIndex = Number(window.sessionStorage.getItem(portalSectionStorageKey));
  return Number.isFinite(storedIndex) ? storedIndex : fallbackIndex;
}

function PortalStatSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, index) => (
        <div className="account-stat portal-skeleton-card" key={index}>
          <span className="portal-skeleton portal-skeleton--number" />
          <span className="portal-skeleton portal-skeleton--short" />
        </div>
      ))}
    </>
  );
}

function PortalListSkeleton({ compact = false, rows }: { compact?: boolean; rows: number }) {
  return (
    <div className={compact ? "portal-list-skeleton portal-list-skeleton--compact" : "portal-list-skeleton"} aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className="portal-skeleton-row" key={index}>
          <span className="portal-skeleton portal-skeleton--icon" />
          <span className="portal-skeleton portal-skeleton--line" />
          <span className="portal-skeleton portal-skeleton--short" />
        </div>
      ))}
    </div>
  );
}

function AccountSettingsEditor({
  accountClient,
  accountSession,
  onError,
  onMessage,
  onSessionCleared,
  onSettingsChanged,
  settings,
}: {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
  onSessionCleared: () => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  settings: AccountSettings;
}) {
  const { locale, t } = useI18n();
  const [form, setForm] = useState<AccountSettingsUpdateRequest>(() => profileToForm(settings));
  const [isSaving, setIsSaving] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const nextSettings = await accountClient.updateSettings(accountSession.sessionToken, form);
      onSettingsChanged(nextSettings);
      setForm(profileToForm(nextSettings));
      onMessage(t.access.settings.messages.saved);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.saveFailed, t.access.messages));
    } finally {
      setIsSaving(false);
    }
  }

  async function revokeDevice(deviceId: string) {
    setRevokingDeviceId(deviceId);
    try {
      await accountClient.revokeTrustedDevice(accountSession.sessionToken, deviceId);
      if (accountSession.trustedDeviceId === deviceId) {
        onSessionCleared();
        onMessage(t.access.settings.messages.currentDeviceRevoked);
        onError(null);
        return;
      }
      const nextSettings = await accountClient.loadSettings(accountSession.sessionToken);
      onSettingsChanged(nextSettings);
      onMessage(t.access.settings.messages.deviceRevoked);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.settings.messages.revokeFailed, t.access.messages));
    } finally {
      setRevokingDeviceId(null);
    }
  }

  return (
    <>
      <div className="settings-profile-preview">
        <span className="person-avatar" style={{ backgroundColor: form.avatarColor }} aria-hidden="true">
          {form.displayName.slice(0, 1) || "A"}
        </span>
        <div>
          <strong>{form.displayName}</strong>
          <span>{settings.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
        </div>
      </div>
      <form className="account-form account-settings-form" onSubmit={submitSettings}>
        <div className="account-two-col">
          <label>
            <span>{t.access.settings.form.displayName}</span>
            <input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required />
          </label>
          <label>
            <span>{t.access.settings.form.avatarColor}</span>
            <input
              value={form.avatarColor}
              onChange={(event) => setForm((current) => ({ ...current, avatarColor: event.target.value }))}
              pattern="#[0-9a-fA-F]{6}"
              type="color"
              required
            />
          </label>
          <label>
            <span>{t.access.settings.form.locale}</span>
            <select value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} required>
              <option value="th-TH">Thai</option>
              <option value="en-US">English</option>
            </select>
          </label>
          <label>
            <span>{t.access.settings.form.timezone}</span>
            <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} required />
          </label>
        </div>
        <Button type="submit" disabled={isSaving}>
          <Icon name="check" />
          {t.access.settings.form.save}
        </Button>
      </form>

      <div className="account-settings-grid">
        <SettingLine label={t.access.settings.passkeys} value={`${settings.passkeys.length}`} />
        <SettingLine label={t.access.settings.trustedDevices} value={`${settings.trustedDevices.length}`} />
      </div>

      <div className="account-device-list" aria-label={t.access.settings.trustedDevicesLabel}>
        {settings.trustedDevices.length ? (
          settings.trustedDevices.map((device) => (
            <div className="account-device-row" key={device.id}>
              <div>
                <strong>{device.label}</strong>
                <span>
                  {device.userAgent || t.access.settings.unknownBrowser} ·{" "}
                  {device.lastSeenAt ? formatDateTime(device.lastSeenAt, locale) : formatDateTime(device.createdAt, locale)}
                </span>
              </div>
              <Button type="button" variant="secondary" onClick={() => void revokeDevice(device.id)} disabled={revokingDeviceId === device.id}>
                <Icon name="x" />
                {t.access.settings.revoke}
              </Button>
            </div>
          ))
        ) : (
          <p className="account-empty">{t.access.settings.noTrustedDevices}</p>
        )}
      </div>
    </>
  );
}

function PanelHeading({ detail, icon, title }: { detail: string; icon: ComponentProps<typeof Icon>["name"]; title: string }) {
  return (
    <div className="account-panel-heading">
      <span aria-hidden="true"><Icon name={icon} /></span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="account-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SettingLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="account-setting-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusMessage({ children, tone }: { children: ReactNode; tone: "danger" | "success" }) {
  return (
    <p className={tone === "danger" ? "join-alert" : "account-success"} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={tone === "danger" ? "alertCircle" : "check"} />
      {children}
    </p>
  );
}

function errorMessage(caught: unknown, fallback: string, labels: Messages["access"]["messages"]): string {
  return localizeAccessError(rawErrorMessage(caught, fallback), labels) ?? fallback;
}

function rawErrorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof Error && caught.message) return caught.message;
  return fallback;
}

function localizeAccessError(message: string | null, labels: Messages["access"]["messages"]): string | null {
  if (!message) return null;
  return friendlyErrorText(message, message, labels);
}

function friendlyErrorText(message: string, fallback: string, labels: Messages["access"]["messages"]): string {
  const normalized = message.trim();
  if (normalized === ACCESS_ERROR_CODES.accountLoadFailed) return labels.accountLoadFailed;
  if (normalized === ACCESS_ERROR_CODES.passkeyRegistrationCredential) return labels.passkeyRegistrationCredential;
  if (normalized === ACCESS_ERROR_CODES.passkeyLoginCredential) return labels.passkeyLoginCredential;
  if (normalized === ACCESS_ERROR_CODES.passkeyUnsupported) return labels.passkeyUnsupported;
  if (normalized === "404") return labels.notFound;
  if (normalized === "401" || normalized === "403" || normalized === "unauthenticated" || normalized === "unauthorized") return labels.unauthorized;
  if (!normalized || /^\d{3}$/.test(normalized)) return fallback;
  return normalized;
}

function formatDateTime(value: string, locale: "en" | "th"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function profileToForm(settings: AccountSettings): AccountSettingsUpdateRequest {
  return {
    displayName: settings.profile.displayName,
    avatarColor: settings.profile.avatarColor,
    locale: settings.profile.locale,
    timezone: settings.profile.timezone,
  };
}

async function createPasskeyCredential(challenge: string, settings: AccountSettings) {
  const credentials = assertCredentialApi();
  const userName = settings.profile.primaryEmail ?? settings.profile.displayName;
  const rpId = getPasskeyRpId();
  const credential = await credentials.create({
    publicKey: {
      challenge: base64UrlToArrayBuffer(challenge),
      rp: { name: "Joii", ...(rpId ? { id: rpId } : {}) },
      user: {
        id: new TextEncoder().encode(settings.profile.id),
        name: userName,
        displayName: settings.profile.displayName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
      attestation: "none",
      timeout: 60_000,
    },
  });

  if (!isRegistrationCredential(credential)) {
    throw new Error(ACCESS_ERROR_CODES.passkeyRegistrationCredential);
  }

  return credential;
}

async function getPasskeyCredential(challenge: string, credentialIds: string[]) {
  const credentials = assertCredentialApi();
  const credential = await credentials.get({
    publicKey: {
      challenge: base64UrlToArrayBuffer(challenge),
      allowCredentials: credentialIds.map((credentialId) => ({
        type: "public-key",
        id: base64UrlToArrayBuffer(credentialId),
      })),
      userVerification: "required",
      timeout: 60_000,
    },
  });

  if (!isAssertionCredential(credential)) {
    throw new Error(ACCESS_ERROR_CODES.passkeyLoginCredential);
  }

  return credential;
}

type RegistrationCredential = PublicKeyCredential & {
  response: AuthenticatorAttestationResponse;
};

type AssertionCredential = PublicKeyCredential & {
  response: AuthenticatorAssertionResponse;
};

function assertCredentialApi(): CredentialsContainer {
  if (typeof navigator === "undefined" || !navigator.credentials) {
    throw new Error(ACCESS_ERROR_CODES.passkeyUnsupported);
  }
  return navigator.credentials;
}

function isRegistrationCredential(credential: Credential | null): credential is RegistrationCredential {
  return isPublicKeyCredential(credential) && "attestationObject" in credential.response && credential.response.attestationObject instanceof ArrayBuffer;
}

function isAssertionCredential(credential: Credential | null): credential is AssertionCredential {
  return (
    isPublicKeyCredential(credential) &&
    "authenticatorData" in credential.response &&
    "signature" in credential.response &&
    credential.response.authenticatorData instanceof ArrayBuffer &&
    credential.response.signature instanceof ArrayBuffer
  );
}

function getPasskeyRpId(): string | null {
  const rpHost = window.location.hostname;
  if (!rpHost) return null;
  if (rpHost === "localhost") return rpHost;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(rpHost)) return null;
  if (/^([0-9a-fA-F:]+)$/.test(rpHost)) return null;
  return rpHost;
}

function isPublicKeyCredential(credential: Credential | null): credential is PublicKeyCredential {
  return (
    !!credential &&
    "rawId" in credential &&
    credential.rawId instanceof ArrayBuffer &&
    "response" in credential &&
    typeof credential.response === "object" &&
    credential.response !== null &&
    "clientDataJSON" in credential.response &&
    credential.response.clientDataJSON instanceof ArrayBuffer
  );
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}
