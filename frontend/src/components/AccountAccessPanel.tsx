"use client";

import { ComponentProps, FormEvent, ReactNode, useEffect, useState } from "react";
import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
  AccountSettingsUpdateRequest,
  AccountTripCreateRequest,
  AccountTripStats,
  AccountTripSummary,
  EmailLoginStartResponse,
} from "@/src/account/api-client";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { Badge, Button } from "./ui";
import { Icon } from "./icons";
import { TripJoinGate } from "./TripJoinGate";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";

interface AccountAccessPanelProps {
  accessMode?: "combined" | "account-login" | "account-register" | "trip-access";
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
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

const ACCESS_ERROR_CODES = {
  accountLoadFailed: "account-load-failed",
  passkeyRegistrationCredential: "passkey-registration-credential",
  passkeyLoginCredential: "passkey-login-credential",
  passkeyUnsupported: "passkey-unsupported",
} as const;

const defaultTripForm = (): AccountTripCreateRequest => ({
  name: "",
  destinationLabel: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
  ownerDisplayName: "",
  joinId: "",
  joinPassword: "",
});

export function AccountAccessPanel({
  accessMode = "combined",
  accountClient,
  accountSession,
  apiClient,
  initialError,
  initialJoinCode,
  onAccountSessionChange,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
  trip,
}: AccountAccessPanelProps) {
  const { t } = useI18n();
  const accessMessages = t.access.messages;
  const forcedMode = accessMode === "trip-access" ? "temp" : accessMode === "combined" ? null : "account";
  const isAccountEntry = accessMode === "account-login" || accessMode === "account-register";
  const [selectedMode, setSelectedMode] = useState<AccessMode>(() => (accountSession ? "account" : "temp"));
  const mode = forcedMode ?? (accountSession ? "account" : selectedMode);
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [trips, setTrips] = useState<AccountTripSummary[]>([]);
  const [stats, setStats] = useState<AccountTripStats | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAccountSession, setPendingAccountSession] = useState<AccountSession | null>(null);
  const displayError = localizeAccessError(error ?? initialError ?? null, accessMessages);

  useEffect(() => {
    if (!accountSession) {
      return;
    }

    let cancelled = false;
    Promise.all([
      accountClient.loadSettings(accountSession.sessionToken),
      accountClient.listTrips(accountSession.sessionToken),
      accountClient.loadStats(accountSession.sessionToken),
    ])
      .then(([nextSettings, nextTrips, nextStats]) => {
        if (cancelled) return;
        setSettings(nextSettings);
        setTrips(nextTrips);
        setStats(nextStats);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(rawErrorMessage(caught, ACCESS_ERROR_CODES.accountLoadFailed));
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
      setPendingAccountSession(null);
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [onAccountSessionChange, pendingAccountSession]);

  async function refreshAccount(sessionToken: string) {
    const [nextSettings, nextTrips, nextStats] = await Promise.all([
      accountClient.loadSettings(sessionToken),
      accountClient.listTrips(sessionToken),
      accountClient.loadStats(sessionToken),
    ]);
    setSettings(nextSettings);
    setTrips(nextTrips);
    setStats(nextStats);
  }

  return (
    <main className={["account-page", isAccountEntry ? "account-page--entry" : ""].filter(Boolean).join(" ")} aria-label={mainLabel(accessMode, t.access.mainLabels)}>
      <section className={["account-shell", isAccountEntry ? "account-shell--entry" : ""].filter(Boolean).join(" ")}>
        {isAccountEntry ? <LanguageSwitch className="access-language-switch account-entry-language-switch" /> : null}
        <div className="account-hero">
          <div className="join-mark account-hero-mark" aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className="join-eyebrow">{t.access.eyebrow}</p>
            <h1>{heroTitle(accessMode, t.access.titles)}</h1>
            <p>{heroDetail(accessMode, t.access.details)}</p>
            {isAccountEntry ? null : <LanguageSwitch className="access-language-switch" />}
          </div>
          {isAccountEntry ? <AuthHighlights flow={accessMode === "account-register" ? "register" : "login"} highlights={t.access.highlights} /> : null}
        </div>

        {accessMode === "combined" ? (
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
          <AccountPortalDelay session={pendingAccountSession} />
        ) : accountSession ? (
          <AccountDashboard
            accountClient={accountClient}
            accountSession={accountSession}
            isLoading={!settings}
            settings={settings}
            stats={stats}
            trips={trips}
            onSettingsChanged={setSettings}
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
              onAccountSessionChange(null);
              setMessage(t.access.messages.loggedOut);
            }}
            onSessionCleared={() => onAccountSessionChange(null)}
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

function AccountPortalDelay({ session }: { session: AccountSession }) {
  const { t } = useI18n();

  return (
    <section className="account-card account-portal-delay" aria-live="polite">
      <PanelHeading icon="check" title={t.access.portalDelay.title} detail={t.access.portalDelay.detail} />
      <div className="account-step-summary">
        <span>{session.kind === "trusted" ? t.access.portalDelay.trusted : t.access.portalDelay.temporary}</span>
      </div>
      <a className="account-portal-link" href="#account-portal">
        <Icon name="settings" />
        {t.access.portalDelay.link}
      </a>
    </section>
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

function mainLabel(accessMode: AccountAccessPanelProps["accessMode"], labels: Messages["access"]["mainLabels"]): string {
  if (accessMode === "account-login") return labels.accountLogin;
  if (accessMode === "account-register") return labels.accountRegister;
  if (accessMode === "trip-access") return labels.tripAccess;
  return labels.combined;
}

function heroTitle(accessMode: AccountAccessPanelProps["accessMode"], titles: Messages["access"]["titles"]): string {
  if (accessMode === "account-login") return titles.accountLogin;
  if (accessMode === "account-register") return titles.accountRegister;
  if (accessMode === "trip-access") return titles.tripAccess;
  return titles.combined;
}

function heroDetail(accessMode: AccountAccessPanelProps["accessMode"], details: Messages["access"]["details"]): string {
  if (accessMode === "account-login") return details.accountLogin;
  if (accessMode === "account-register") return details.accountRegister;
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
        trustDevice: flow === "login" ? trustDevice : false,
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
        trustDevice: flow === "login" ? trustDevice : false,
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
  isLoading,
  onCreatedTrip,
  onError,
  onLogout,
  onSessionCleared,
  onMessage,
  onSettingsChanged,
  settings,
  stats,
  trips,
}: {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  isLoading: boolean;
  onCreatedTrip: (session: TripParticipantSession) => Promise<void>;
  onError: (message: string | null) => void;
  onLogout: () => Promise<void>;
  onSessionCleared: () => void;
  onMessage: (message: string | null) => void;
  onSettingsChanged: (settings: AccountSettings) => void;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
  trips: AccountTripSummary[];
}) {
  const { t } = useI18n();
  const [tripForm, setTripForm] = useState(defaultTripForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionKindLabel = accountSession.kind === "trusted" ? t.access.dashboard.sessionKinds.trusted : t.access.dashboard.sessionKinds.temporary;

  async function submitTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await accountClient.createTrip(accountSession.sessionToken, tripForm);
      await onCreatedTrip(response.memberSession);
      setTripForm(defaultTripForm());
      onMessage(t.access.dashboard.createTrip.success);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, t.access.dashboard.createTrip.error, t.access.messages));
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="account-dashboard" id="account-portal">
      <section className="account-card account-profile-card">
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
          <Stat label={t.access.dashboard.stats.trips} value={stats?.tripsTotal ?? 0} />
          <Stat label={t.access.dashboard.stats.owned} value={stats?.tripsOwned ?? 0} />
          <Stat label={t.access.dashboard.stats.active} value={stats?.activeTrips ?? 0} />
          <Stat label={t.access.dashboard.stats.claims} value={stats?.tempClaimsCompleted ?? 0} />
        </div>
        <Button type="button" variant="secondary" onClick={() => void onLogout()}>
          <Icon name="x" />
          {t.access.dashboard.logout}
        </Button>
      </section>

      <form className="account-card account-form account-create-trip" onSubmit={submitTrip}>
        <PanelHeading icon="plus" title={t.access.dashboard.createTrip.title} detail={t.access.dashboard.createTrip.detail} />
        <div className="account-two-col">
          <label>
            <span>{t.access.dashboard.createTrip.labels.name}</span>
            <input value={tripForm.name} onChange={(event) => setTripForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label>
            <span>{t.access.dashboard.createTrip.labels.destination}</span>
            <input
              value={tripForm.destinationLabel}
              onChange={(event) => setTripForm((current) => ({ ...current, destinationLabel: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>{t.access.dashboard.createTrip.labels.startDate}</span>
            <input
              value={tripForm.startDate}
              onChange={(event) => setTripForm((current) => ({ ...current, startDate: event.target.value }))}
              type="date"
              required
            />
          </label>
          <label>
            <span>{t.access.dashboard.createTrip.labels.endDate}</span>
            <input value={tripForm.endDate} onChange={(event) => setTripForm((current) => ({ ...current, endDate: event.target.value }))} type="date" required />
          </label>
          <label>
            <span>{t.access.dashboard.createTrip.labels.ownerDisplayName}</span>
            <input
              value={tripForm.ownerDisplayName}
              onChange={(event) => setTripForm((current) => ({ ...current, ownerDisplayName: event.target.value }))}
              autoComplete="name"
              required
            />
          </label>
          <label>
            <span>{t.access.dashboard.createTrip.labels.joinId}</span>
            <input
              value={tripForm.joinId}
              onChange={(event) => setTripForm((current) => ({ ...current, joinId: event.target.value }))}
              autoComplete="username"
              required
            />
          </label>
        </div>
        <label>
          <span>{t.access.dashboard.createTrip.labels.joinPassword}</span>
          <input
            value={tripForm.joinPassword}
            onChange={(event) => setTripForm((current) => ({ ...current, joinPassword: event.target.value }))}
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <Button type="submit" disabled={isSubmitting}>
          <Icon name="check" />
          {t.access.dashboard.createTrip.submit}
        </Button>
      </form>

      <section className="account-card account-history">
        <PanelHeading
          icon="clock"
          title={t.access.dashboard.history.title}
          detail={isLoading ? t.access.dashboard.history.loading : t.access.dashboard.history.visibleTrips({ count: trips.length })}
        />
        {trips.length ? (
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
      </section>

      <section className="account-card account-settings-card">
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
      </section>
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
              required
            />
          </label>
          <label>
            <span>{t.access.settings.form.locale}</span>
            <input value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} required />
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
  if (normalized === "401" || normalized === "403") return labels.unauthorized;
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
