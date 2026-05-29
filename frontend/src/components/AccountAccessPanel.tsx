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
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  apiClient?: TripApiClient;
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
  accountClient,
  accountSession,
  apiClient,
  onAccountSessionChange,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
  trip,
}: AccountAccessPanelProps) {
  const [mode, setMode] = useState<AccessMode>(() => (accountSession ? "account" : "temp"));
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [trips, setTrips] = useState<AccountTripSummary[]>([]);
  const [stats, setStats] = useState<AccountTripStats | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <main className="account-page" aria-label="Account access">
      <section className="account-shell">
        <div className="account-hero">
          <div className="join-mark account-hero-mark" aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className="join-eyebrow">Sagittarius account</p>
            <h1>จัดการ trip ด้วย account หรือเข้าแบบ temp</h1>
            <p>Account จะเก็บประวัติ สถิติ และสิทธิ owner ส่วน temp access ยังใช้เข้าทริปเดิมได้ทันที</p>
          </div>
        </div>

        <div className="account-mode-tabs" role="tablist" aria-label="Access mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "account"}
            className={mode === "account" ? "account-tab account-tab--active" : "account-tab"}
            onClick={() => setMode("account")}
          >
            <Icon name="users" />
            Account
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "temp"}
            className={mode === "temp" ? "account-tab account-tab--active" : "account-tab"}
            onClick={() => setMode("temp")}
          >
            <Icon name="clock" />
            Temp access
          </button>
        </div>

        {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
        {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}

        {mode === "temp" ? (
          <TripJoinGate
            apiClient={apiClient}
            embedded
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
            onMessage={setMessage}
            onError={setError}
          />
        ) : (
          <EmailLoginPanel
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

function EmailLoginPanel({
  accountClient,
  onError,
  onLoggedIn,
}: {
  accountClient: AccountApiClient;
  onError: (message: string | null) => void;
  onLoggedIn: (session: AccountSession) => void;
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [deviceLabel, setDeviceLabel] = useState("");
  const [challenge, setChallenge] = useState<EmailLoginStartResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const nextChallenge = await accountClient.startEmailLogin(email);
      setChallenge(nextChallenge);
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
        deviceLabel,
      });
      onLoggedIn(session);
    } catch (caught) {
      onError(errorMessage(caught, "รหัสยืนยันไม่ถูกต้อง"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="account-grid">
      <form className="account-card account-form" onSubmit={submitEmail}>
        <PanelHeading icon="users" title="Email login" detail="รับรหัสจาก local email outbox แล้วกรอกต่อในขั้นถัดไป" />
        <label>
          <span>Email *</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
        </label>
        <Button type="submit" disabled={isSubmitting}>
          <Icon name="check" />
          ส่งรหัส login
        </Button>
      </form>

      <form className="account-card account-form" onSubmit={submitCode}>
        <PanelHeading icon="settings" title="Verify code" detail={challenge ? `หมดอายุ ${formatDateTime(challenge.expiresAt)}` : "เริ่มจาก email ก่อน"} />
        <label>
          <span>Code *</span>
          <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" required />
        </label>
        <label className="account-check">
          <input checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} type="checkbox" />
          Trust this PC
        </label>
        {trustDevice ? (
          <label>
            <span>Device label</span>
            <input value={deviceLabel} onChange={(event) => setDeviceLabel(event.target.value)} autoComplete="off" placeholder="MacBook, office PC" />
          </label>
        ) : null}
        <Button type="submit" disabled={!challenge || isSubmitting}>
          <Icon name="check" />
          เข้า account
        </Button>
      </form>
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
            <input value={tripForm.joinId} onChange={(event) => setTripForm((current) => ({ ...current, joinId: event.target.value }))} required />
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
            onSettingsChanged={onSettingsChanged}
          />
        ) : (
          <p className="account-empty">Loading account settings.</p>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            accountClient
              .startPasskeyRegistration(accountSession.sessionToken)
              .then(() => onMessage("สร้าง passkey registration challenge แล้ว"))
              .catch((caught) => onError(errorMessage(caught, "เริ่ม passkey registration ไม่สำเร็จ")))
          }
        >
          <Icon name="settings" />
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
  onSettingsChanged,
  settings,
}: {
  accountClient: AccountApiClient;
  accountSession: AccountSession;
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
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
  if (caught instanceof Error && caught.message) return caught.message;
  return fallback;
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
