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
  const forcedMode = accessMode === "trip-access" ? "temp" : accessMode === "combined" ? null : "account";
  const [selectedMode, setSelectedMode] = useState<AccessMode>(() => (accountSession ? "account" : "temp"));
  const mode = forcedMode ?? (accountSession ? "account" : selectedMode);
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [trips, setTrips] = useState<AccountTripSummary[]>([]);
  const [stats, setStats] = useState<AccountTripStats | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const displayError = error ?? initialError ?? null;

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
        setError(errorMessage(caught, "โหลดข้อมูล account ไม่สำเร็จ"));
      });

    return () => {
      cancelled = true;
    };
  }, [accountClient, accountSession]);

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
    <main className="account-page" aria-label={mainLabel(accessMode)}>
      <section className="account-shell">
        <div className="account-hero">
          <div className="join-mark account-hero-mark" aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className="join-eyebrow">Sagittarius access</p>
            <h1>{heroTitle(accessMode)}</h1>
            <p>{heroDetail(accessMode)}</p>
          </div>
        </div>

        {accessMode === "combined" ? (
          <div className="account-mode-tabs" role="tablist" aria-label="Access mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "account"}
              className={mode === "account" ? "account-tab account-tab--active" : "account-tab"}
              onClick={() => setSelectedMode("account")}
            >
              <Icon name="users" />
              Account
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "temp"}
              className={mode === "temp" ? "account-tab account-tab--active" : "account-tab"}
              onClick={() => setSelectedMode("temp")}
            >
              <Icon name="clock" />
              Temp access
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
              setMessage("ออกจาก account แล้ว");
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
              onAccountSessionChange(session);
              setMessage(session.kind === "trusted" ? "เข้าสู่ระบบแบบ trusted device แล้ว" : "เข้าสู่ระบบแบบ temporary แล้ว");
            }}
            onError={setError}
          />
        )}
      </section>
    </main>
  );
}

function mainLabel(accessMode: AccountAccessPanelProps["accessMode"]): string {
  if (accessMode === "account-login") return "Account login";
  if (accessMode === "account-register") return "Account register";
  if (accessMode === "trip-access") return "Trip access";
  return "Account access";
}

function heroTitle(accessMode: AccountAccessPanelProps["accessMode"]): string {
  if (accessMode === "account-login") return "เข้าสู่ account";
  if (accessMode === "account-register") return "สร้าง account";
  if (accessMode === "trip-access") return "เข้า trip แบบ temp access";
  return "จัดการ trip ด้วย account หรือเข้าแบบ temp";
}

function heroDetail(accessMode: AccountAccessPanelProps["accessMode"]): string {
  if (accessMode === "account-login") return "ใช้ email code หรือ passkey เพื่อกลับเข้า account ที่ผูกกับ trip ของคุณ";
  if (accessMode === "account-register") return "สร้าง account ด้วย email code เพื่อเก็บประวัติ trip สถิติ และสิทธิ owner";
  if (accessMode === "trip-access") return "กรอก Trip ID และ password เพื่อเข้า trip เดิมโดยไม่ต้องใช้ account";
  return "Account จะเก็บประวัติ สถิติ และสิทธิ owner ส่วน temp access ยังใช้เข้าทริปเดิมได้ทันที";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
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
    await requestEmailCode();
  }

  async function requestEmailCode() {
    setIsSubmitting(true);
    try {
      const nextChallenge = await accountClient.startEmailLogin(email);
      setChallenge(nextChallenge);
      setResendCooldown(30);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, "เริ่ม login ไม่สำเร็จ"));
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
        trustDevice,
        deviceLabel: "",
      });
      onLoggedIn(session);
    } catch (caught) {
      onError(errorMessage(caught, "รหัสยืนยันไม่ถูกต้อง"));
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
        trustDevice,
        deviceLabel: "",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, flow === "register" ? "สร้าง account ด้วยรหัสผ่านไม่สำเร็จ" : "เข้า account ด้วยรหัสผ่านไม่สำเร็จ"));
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
        trustDevice,
        deviceLabel: "",
      });
      onLoggedIn(session);
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, "เข้า account ด้วย passkey ไม่สำเร็จ"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetChallenge() {
    setChallenge(null);
    setCode("");
    setResendCooldown(0);
    onError(null);
  }

  const trustDeviceFields = (
    <label className="account-check">
      <input checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} type="checkbox" />
      เชื่อถืออุปกรณ์นี้
    </label>
  );

  return (
    <div className="account-login-flow">
      <form className="account-card account-form" onSubmit={challenge ? submitCode : submitEmail}>
        <PanelHeading
          icon={challenge ? "settings" : "users"}
          title={challenge ? "ยืนยันรหัส" : "เข้าสู่ระบบด้วยอีเมล"}
          detail={challenge ? `หมดอายุ ${formatDateTime(challenge.expiresAt)}` : "ส่งรหัสเข้าอีเมลของคุณก่อน แล้วค่อยยืนยันในขั้นถัดไป"}
        />
        {challenge ? (
          <>
            <div className="account-step-summary">
              <span>ส่งรหัสไปที่</span>
              <strong>{email}</strong>
            </div>
            <label>
              <span>รหัสยืนยัน *</span>
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required />
            </label>
            {trustDeviceFields}
            <Button type="submit" disabled={isSubmitting}>
              <Icon name="check" />
              {flow === "register" ? "สร้าง account" : "เข้า account"}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting || resendCooldown > 0} onClick={() => void requestEmailCode()}>
              ส่งรหัสอีกครั้ง
              {resendCooldown > 0 ? `ได้ใน ${resendCooldown} วินาที` : ""}
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={resetChallenge}>
              เปลี่ยนอีเมล
            </Button>
          </>
        ) : (
          <>
            <div className="account-step-summary">
              <span>ยืนยันรหัสได้หลังจากส่ง email code</span>
            </div>
            <label>
              <span>อีเมล *</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
            </label>
            <label>
              <span>รหัสผ่าน</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={flow === "register" ? "new-password" : "current-password"}
              />
            </label>
            {trustDeviceFields}
            <Button type="submit" disabled={isSubmitting}>
              <Icon name="check" />
              {flow === "register" ? "ส่งรหัส register" : "ส่งรหัส login"}
            </Button>
            <Button type="button" variant="secondary" disabled={!email || password.length < 8 || isSubmitting} onClick={() => void signInWithPassword()}>
              <Icon name="key" />
              {flow === "register" ? "สร้าง account ด้วยรหัสผ่าน" : "เข้า account ด้วยรหัสผ่าน"}
            </Button>
          </>
        )}
      </form>
      {!challenge ? (
        <p className="account-flow-switch">
          {flow === "register" ? (
            <>
              มีบัญชีแล้ว? <a href="/login">เข้าสู่ระบบ</a>
            </>
          ) : (
            <>
              ยังไม่มีบัญชี? <a href="/register">สมัครใช้งาน</a>
            </>
          )}
        </p>
      ) : null}
      {!challenge ? (
        <section className="account-card account-form account-passkey-card" role="region" aria-label="Passkey login">
          <PanelHeading icon="key" title="Passkey login" detail="ใช้ passkey ของ browser เพื่อเข้า account หลังกรอกอีเมล" />
          <Button type="button" variant="secondary" disabled={!email || isSubmitting} onClick={() => void signInWithPasskey()}>
            <Icon name="key" />
            เข้า account ด้วย passkey
          </Button>
        </section>
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
  const [tripForm, setTripForm] = useState(defaultTripForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionKindLabel = accountSession.kind === "trusted" ? "Trusted PC" : "Temp account session";

  async function submitTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await accountClient.createTrip(accountSession.sessionToken, tripForm);
      await onCreatedTrip(response.memberSession);
      setTripForm(defaultTripForm());
      onMessage("สร้าง trip และเปิดใน cockpit แล้ว");
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, "สร้าง trip ไม่สำเร็จ"));
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
      onMessage("สร้าง passkey แล้ว ใช้ login ได้ทันที");
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, "สร้าง passkey ไม่สำเร็จ"));
    }
  }

  return (
    <div className="account-dashboard">
      <section className="account-card account-profile-card">
        <div className="account-profile-row">
          <span className="person-avatar" style={{ backgroundColor: settings?.profile.avatarColor ?? "#0f766e" }} aria-hidden="true">
            {(settings?.profile.displayName ?? "A").slice(0, 1)}
          </span>
          <div>
            <strong>{settings?.profile.displayName ?? "Account"}</strong>
            <span>{settings?.profile.primaryEmail ?? "No email loaded"}</span>
          </div>
          <Badge tone={accountSession.kind === "trusted" ? "success" : "warning"}>{sessionKindLabel}</Badge>
        </div>
        <div className="account-stat-grid">
          <Stat label="Trips" value={stats?.tripsTotal ?? 0} />
          <Stat label="Owned" value={stats?.tripsOwned ?? 0} />
          <Stat label="Active" value={stats?.activeTrips ?? 0} />
          <Stat label="Claims" value={stats?.tempClaimsCompleted ?? 0} />
        </div>
        <Button type="button" variant="secondary" onClick={() => void onLogout()}>
          <Icon name="x" />
          Logout
        </Button>
      </section>

      <form className="account-card account-form account-create-trip" onSubmit={submitTrip}>
        <PanelHeading icon="plus" title="Create trip" detail="Account creator becomes owner and gets a member session immediately" />
        <div className="account-two-col">
          <label>
            <span>Trip name *</span>
            <input value={tripForm.name} onChange={(event) => setTripForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label>
            <span>Destination *</span>
            <input
              value={tripForm.destinationLabel}
              onChange={(event) => setTripForm((current) => ({ ...current, destinationLabel: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>Start date *</span>
            <input
              value={tripForm.startDate}
              onChange={(event) => setTripForm((current) => ({ ...current, startDate: event.target.value }))}
              type="date"
              required
            />
          </label>
          <label>
            <span>End date *</span>
            <input value={tripForm.endDate} onChange={(event) => setTripForm((current) => ({ ...current, endDate: event.target.value }))} type="date" required />
          </label>
          <label>
            <span>Owner display name *</span>
            <input
              value={tripForm.ownerDisplayName}
              onChange={(event) => setTripForm((current) => ({ ...current, ownerDisplayName: event.target.value }))}
              autoComplete="name"
              required
            />
          </label>
          <label>
            <span>Join ID *</span>
            <input
              value={tripForm.joinId}
              onChange={(event) => setTripForm((current) => ({ ...current, joinId: event.target.value }))}
              autoComplete="username"
              required
            />
          </label>
        </div>
        <label>
          <span>Join password *</span>
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
          Create and open
        </Button>
      </form>

      <section className="account-card account-history">
        <PanelHeading icon="clock" title="Trip history" detail={isLoading ? "Loading account trips" : `${trips.length} visible trips`} />
        {trips.length ? (
          <div className="account-trip-list">
            {trips.map((trip) => (
              <article className="account-trip-row" key={trip.id}>
                <span className="account-trip-icon" aria-hidden="true"><Icon name="location" /></span>
                <div>
                  <strong>{trip.name}</strong>
                  <span>{trip.destinationLabel} · {trip.startDate} - {trip.endDate}</span>
                </div>
                <Badge tone={trip.isOwner ? "success" : "neutral"}>{trip.isOwner ? "Owner" : trip.role}</Badge>
              </article>
            ))}
          </div>
        ) : (
          <p className="account-empty">No account trips yet.</p>
        )}
      </section>

      <section className="account-card account-settings-card">
        <PanelHeading icon="settings" title="Profile & settings" detail="Manage local account profile and trusted devices" />
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
          <p className="account-empty">Loading account settings.</p>
        )}
        <Button
          type="button"
          variant="secondary"
          disabled={!settings}
          onClick={() => void registerPasskey()}
        >
          <Icon name="key" />
          Start passkey setup
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
      onMessage("บันทึก profile และ settings แล้ว");
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, "บันทึก settings ไม่สำเร็จ"));
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
        onMessage("ยกเลิก trusted device นี้แล้ว กรุณา login ใหม่");
        onError(null);
        return;
      }
      const nextSettings = await accountClient.loadSettings(accountSession.sessionToken);
      onSettingsChanged(nextSettings);
      onMessage("ยกเลิก trusted device แล้ว");
      onError(null);
    } catch (caught) {
      onError(errorMessage(caught, "ยกเลิก trusted device ไม่สำเร็จ"));
    } finally {
      setRevokingDeviceId(null);
    }
  }

  return (
    <>
      <form className="account-form account-settings-form" onSubmit={submitSettings}>
        <div className="account-two-col">
          <label>
            <span>Display name *</span>
            <input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required />
          </label>
          <label>
            <span>Avatar color *</span>
            <input
              value={form.avatarColor}
              onChange={(event) => setForm((current) => ({ ...current, avatarColor: event.target.value }))}
              pattern="#[0-9a-fA-F]{6}"
              required
            />
          </label>
          <label>
            <span>Locale *</span>
            <input value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} required />
          </label>
          <label>
            <span>Timezone *</span>
            <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} required />
          </label>
        </div>
        <Button type="submit" disabled={isSaving}>
          <Icon name="check" />
          Save settings
        </Button>
      </form>

      <div className="account-settings-grid">
        <SettingLine label="Passkeys" value={`${settings.passkeys.length}`} />
        <SettingLine label="Trusted devices" value={`${settings.trustedDevices.length}`} />
      </div>

      <div className="account-device-list" aria-label="Trusted devices">
        {settings.trustedDevices.length ? (
          settings.trustedDevices.map((device) => (
            <div className="account-device-row" key={device.id}>
              <div>
                <strong>{device.label}</strong>
                <span>{device.userAgent || "Unknown browser"} · {device.lastSeenAt ? formatDateTime(device.lastSeenAt) : formatDateTime(device.createdAt)}</span>
              </div>
              <Button type="button" variant="secondary" onClick={() => void revokeDevice(device.id)} disabled={revokingDeviceId === device.id}>
                <Icon name="x" />
                Revoke
              </Button>
            </div>
          ))
        ) : (
          <p className="account-empty">No trusted devices.</p>
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

function errorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof Error && caught.message) return friendlyErrorText(caught.message, fallback);
  return fallback;
}

function friendlyErrorText(message: string, fallback: string): string {
  const normalized = message.trim();
  if (normalized === "404") return "ไม่พบข้อมูลที่ต้องการ กรุณาตรวจสอบอีกครั้ง";
  if (normalized === "401" || normalized === "403") return "สิทธิ์ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่";
  if (!normalized || /^\d{3}$/.test(normalized)) return fallback;
  return normalized;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
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
      rp: { name: "Sagittarius", ...(rpId ? { id: rpId } : {}) },
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
    throw new Error("Browser did not return a passkey registration credential");
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
    throw new Error("Browser did not return a passkey login credential");
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
    throw new Error("This browser does not support passkeys");
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
