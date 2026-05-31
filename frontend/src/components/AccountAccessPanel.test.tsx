import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
  AccountSettingsUpdateRequest,
  AccountTripCreateRequest,
  AccountTripStats,
  AccountTripSummary,
} from "@/src/account/api-client";
import { seedTrip } from "@/src/trip/seed";
import type { TripParticipantSession } from "@/src/trip/types";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { AccountAccessPanel } from "./AccountAccessPanel";

function render(ui: ReactElement) {
  const result = renderWithI18n(ui);
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: ReactElement) => originalRerender(<I18nProvider>{nextUi}</I18nProvider>),
  };
}

describe("AccountAccessPanel", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("keeps temp access as the fast default while exposing account login", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    render(
      <AccountAccessPanel
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveClass("account-tab--active");
    expect(screen.getByRole("heading", { name: /Enter trip room/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));

    expect(screen.getByRole("heading", { name: /Manage trips with an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toHaveAttribute("autocomplete", "email");
    expect(screen.queryByLabelText(/Verification code/i)).not.toBeInTheDocument();
    expect(screen.getByText(/verify after sending an email code/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Trust this device/i })).toBeChecked();
    expect(screen.queryByLabelText(/Device label/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    await user.click(screen.getByRole("button", { name: /Send login code/i }));

    expect(await screen.findByLabelText(/Verification code/i)).toHaveAttribute("autocomplete", "one-time-code");
    expect(screen.queryByText(/verify after sending an email code/i)).not.toBeInTheDocument();
    expect(screen.getByText(/aom@example.test/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Device label/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend code in 30 seconds/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Change email/i }));

    expect(screen.queryByLabelText(/Verification code/i)).not.toBeInTheDocument();
    expect(screen.getByText(/verify after sending an email code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toHaveValue("aom@example.test");

    await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));

    expect(screen.getByLabelText(/อีเมล/i)).toHaveValue("aom@example.test");
    expect(screen.getByRole("checkbox", { name: /เชื่อถืออุปกรณ์นี้/i })).toBeChecked();
  }, 45_000);

  it("enables resend after the email code cooldown finishes", async () => {
    const accountClient = createAccountClient();
    const intervalCallbacks: Array<() => void> = [];
    vi.spyOn(window, "setInterval").mockImplementation((callback) => {
      intervalCallbacks.push(callback as () => void);
      return intervalCallbacks.length as unknown as ReturnType<typeof window.setInterval>;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => undefined);
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Send login code/i }));
    });
    expect(screen.getByLabelText(/Verification code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend code in 30 seconds/i })).toBeDisabled();

    for (let count = 0; count < 30; count += 1) {
      act(() => intervalCallbacks.at(-1)?.());
    }

    expect(screen.getByRole("button", { name: /^Resend code$/i })).toBeEnabled();
  });

  it("logs in and registers with a password fallback instead of forcing OTP", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={onAccountSessionChange}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: "account-secret" } });
    await user.click(screen.getByRole("button", { name: /Sign in with password/i }));

    expect(accountClient.finishPasswordLogin).toHaveBeenCalledWith({
      flow: "login",
      email: "aom@example.test",
      password: "account-secret",
      trustDevice: true,
      deviceLabel: "",
    });
    expect(onAccountSessionChange).toHaveBeenCalledWith(expect.objectContaining({ sessionToken: "account-session" }));
  });

  it("separates passkey access from email verification with a key icon", async () => {
    const user = userEvent.setup();
    render(
      <AccountAccessPanel
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));

    const passkeyPanel = screen.getByRole("region", { name: /Passkey login/i });
    expect(within(passkeyPanel).getByRole("button", { name: /Sign in with passkey/i })).toBeDisabled();
    expect(within(passkeyPanel).getAllByTestId("icon-key").length).toBeGreaterThan(0);
  });

  it("renders account login without exposing trip access tabs on the login path", () => {
    render(
      <AccountAccessPanel
        accessMode="account-login"
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("tablist", { name: /Access mode/i })).not.toBeInTheDocument();
    expect(screen.getByRole("main", { name: /Account login/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send login code/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Register/i })).toHaveAttribute("href", "/register");
    expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
  });

  it("renders account registration as a separate account entry path", () => {
    render(
      <AccountAccessPanel
        accessMode="account-register"
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("tablist", { name: /Access mode/i })).not.toBeInTheDocument();
    expect(screen.getByRole("main", { name: /Account register/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Create an account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send register code/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign in/i })).toHaveAttribute("href", "/login");
    expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
  });

  it("renders trip access without exposing account login tabs on the join path", () => {
    render(
      <AccountAccessPanel
        accessMode="trip-access"
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("tablist", { name: /Access mode/i })).not.toBeInTheDocument();
    expect(screen.getByRole("main", { name: /Trip access/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Enter trip room/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "ภาษาไทย" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: /เปิด demo trip/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Email/i)).not.toBeInTheDocument();
  });

  it("auto-switches to account mode when accountSession appears", async () => {
    const view = render(
      <AccountAccessPanel
        accountClient={createAccountClient()}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(view.getByRole("tab", { name: /^Temp access$/i })).toHaveClass("account-tab--active");

    view.rerender(
      <AccountAccessPanel
        accountClient={createAccountClient()}
        accountSession={{
          userId: "11111111-1111-1111-1111-111111111111",
          sessionToken: "playwright-account-session",
          kind: "trusted",
          trustedDeviceId: "device-1",
          createdAt: "2026-05-30T10:00:00.000Z",
          expiresAt: "2030-01-01T10:00:00.000Z",
        }}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(view.getByRole("tab", { name: /^Account$/i })).toHaveClass("account-tab--active");
    expect(await view.findByText("Aom")).toBeInTheDocument();
    expect(view.getByRole("button", { name: /Start passkey setup/i })).toBeInTheDocument();
  });

  it("does not reload account dashboard data when switching language", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    render(
      <AccountAccessPanel
        accountClient={accountClient}
        accountSession={{
          userId: "11111111-1111-1111-1111-111111111111",
          sessionToken: "playwright-account-session",
          kind: "trusted",
          trustedDeviceId: "device-1",
          createdAt: "2026-05-30T10:00:00.000Z",
          expiresAt: "2030-01-01T10:00:00.000Z",
        }}
        trip={seedTrip}
        onAccountSessionChange={vi.fn()}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    expect(await screen.findByText("Aom")).toBeInTheDocument();
    expect(accountClient.loadSettings).toHaveBeenCalledTimes(1);
    expect(accountClient.listTrips).toHaveBeenCalledTimes(1);
    expect(accountClient.loadStats).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));

    expect(await screen.findByText("ผู้ร่วมเดินทาง")).toBeInTheDocument();
    expect(accountClient.loadSettings).toHaveBeenCalledTimes(1);
    expect(accountClient.listTrips).toHaveBeenCalledTimes(1);
    expect(accountClient.loadStats).toHaveBeenCalledTimes(1);
  });

  it("logs in by email, loads settings/history/stats, and creates an owner trip", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAuthenticated = vi.fn();

    render(<AccountHarness accountClient={accountClient} onAuthenticated={onAuthenticated} />);

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    await user.click(screen.getByRole("button", { name: /Send login code/i }));
    fireEvent.change(screen.getByLabelText(/Verification code/i), { target: { value: "123456" } });
    await user.click(screen.getByRole("button", { name: /^Sign in$/i }));

    expect(accountClient.finishEmailLogin).toHaveBeenCalledWith({
      challengeId: "login-challenge",
      code: "123456",
      trustDevice: true,
      deviceLabel: "",
    });
    expect(await screen.findByText("Aom")).toBeInTheDocument();
    expect(screen.getByText("aom@example.test")).toBeInTheDocument();
    expect(screen.getByText("Trusted PC")).toBeInTheDocument();
    expect(screen.getByText("Profile & settings")).toBeInTheDocument();
    expect(screen.getByText("Seoul Spring")).toBeInTheDocument();
    expect(screen.getByText("Taipei Shared")).toBeInTheDocument();
    expect(screen.getByText("Traveler")).toBeInTheDocument();
    expect(screen.queryByText("traveler")).not.toBeInTheDocument();

    const settingsCard = screen.getByText("Profile & settings").closest("section") as HTMLElement;
    fireEvent.change(within(settingsCard).getByLabelText(/Display name/i), { target: { value: "Aom Updated" } });
    fireEvent.change(within(settingsCard).getByLabelText(/Avatar color/i), { target: { value: "#abcdef" } });
    fireEvent.change(within(settingsCard).getByLabelText(/Locale/i), { target: { value: "en-US" } });
    fireEvent.change(within(settingsCard).getByLabelText(/Timezone/i), { target: { value: "Asia/Tokyo" } });
    await user.click(within(settingsCard).getByRole("button", { name: /Save settings/i }));

    expect(accountClient.updateSettings).toHaveBeenCalledWith("account-session", {
      displayName: "Aom Updated",
      avatarColor: "#abcdef",
      locale: "en-US",
      timezone: "Asia/Tokyo",
    });
    expect(await screen.findByText("Saved profile and settings.")).toBeInTheDocument();

    const laptopDeviceRow = screen.getByText("Aom laptop").closest(".account-device-row") as HTMLElement;
    await user.click(within(laptopDeviceRow).getByRole("button", { name: /Revoke/i }));
    expect(accountClient.revokeTrustedDevice).toHaveBeenCalledWith("account-session", "device-laptop");

    const credentials = stubCredentials();
    await user.click(within(settingsCard).getByRole("button", { name: /Start passkey setup/i }));
    expect(credentials.create).toHaveBeenCalledWith({
      publicKey: expect.objectContaining({
        attestation: "none",
        challenge: bytes([1, 2, 3, 4]),
        authenticatorSelection: expect.objectContaining({ userVerification: "required" }),
        rp: expect.objectContaining({ name: "Joii" }),
        pubKeyCredParams: expect.arrayContaining([
          expect.objectContaining({ type: "public-key", alg: -7 }),
          expect.objectContaining({ type: "public-key", alg: -257 }),
        ]),
        user: expect.objectContaining({
          name: "aom@example.test",
          displayName: "Aom",
        }),
      }),
    });
    expect(accountClient.finishPasskeyRegistration).toHaveBeenCalledWith("account-session", {
      challengeId: "passkey-challenge",
      credentialId: "BQYH",
      clientDataJson: "CAk",
      attestationObject: "CgsM",
      nickname: "Aom passkey",
    });
    expect(await screen.findByText("Passkey created. You can use it to sign in immediately.")).toBeInTheDocument();

    const createForm = screen.getByText("Create trip").closest("form") as HTMLFormElement;
    expect(within(createForm).getByLabelText(/Join ID/i)).toHaveAttribute("autocomplete", "username");
    expect(within(createForm).getByLabelText(/Join password/i)).toHaveAttribute("autocomplete", "new-password");
    fireEvent.change(within(createForm).getByLabelText(/Trip name/i), { target: { value: "Taipei Food Run" } });
    fireEvent.change(within(createForm).getByLabelText(/Destination/i), { target: { value: "Taipei" } });
    fireEvent.change(within(createForm).getByLabelText(/Start date/i), { target: { value: "2026-07-01" } });
    fireEvent.change(within(createForm).getByLabelText(/End date/i), { target: { value: "2026-07-04" } });
    fireEvent.change(within(createForm).getByLabelText(/Owner display name/i), { target: { value: "Aom" } });
    fireEvent.change(within(createForm).getByLabelText(/Join ID/i), { target: { value: "TPE-2026" } });
    fireEvent.change(within(createForm).getByLabelText(/Join password/i), { target: { value: "taipei-secret" } });
    await user.click(within(createForm).getByRole("button", { name: /Create and open/i }));

    expect(accountClient.createTrip).toHaveBeenCalledWith("account-session", {
      name: "Taipei Food Run",
      destinationLabel: "Taipei",
      startDate: "2026-07-01",
      endDate: "2026-07-04",
      ownerDisplayName: "Aom",
      joinId: "TPE-2026",
      joinPassword: "taipei-secret",
    });
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith(expect.objectContaining({ sessionToken: "member-session" })));
  }, 45_000);

  it("logs in with a provider-free browser passkey and keeps trusted-device controls", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();
    const credentials = stubCredentials();

    render(
      <AccountAccessPanel
        accountClient={accountClient}
        accountSession={null}
        trip={seedTrip}
        onAccountSessionChange={onAccountSessionChange}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "aom@example.test" } });
    expect(screen.queryByLabelText(/Device label/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Sign in with passkey/i }));

    expect(accountClient.startPasskeyLogin).toHaveBeenCalledWith("aom@example.test");
    expect(credentials.get).toHaveBeenCalledWith({
      publicKey: expect.objectContaining({
        challenge: bytes([1, 2, 3, 4]),
        allowCredentials: [{ type: "public-key", id: bytes([5, 6, 7]) }],
        userVerification: "required",
      }),
    });
    expect(accountClient.finishPasskeyLogin).toHaveBeenCalledWith({
      challengeId: "passkey-login-challenge",
      credentialId: "BQYH",
      clientDataJson: "CAk",
      authenticatorData: "DQ4",
      signature: "DxA",
      trustDevice: true,
      deviceLabel: "",
    });
    await waitFor(() => expect(onAccountSessionChange).toHaveBeenCalledWith(expect.objectContaining({ sessionToken: "passkey-session" })));
  });

  it("clears the account session when revoking the current trusted device", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAccountSessionChange = vi.fn();

    render(
      <AccountAccessPanel
        accountClient={accountClient}
        accountSession={{
          userId: "user-aom",
          sessionToken: "account-session",
          kind: "trusted",
          trustedDeviceId: "device-current",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        }}
        trip={seedTrip}
        onAccountSessionChange={onAccountSessionChange}
        onAuthenticated={vi.fn()}
        onTripChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));
    const currentDeviceRow = (await screen.findByText("Current MacBook")).closest(".account-device-row") as HTMLElement;
    await user.click(within(currentDeviceRow).getByRole("button", { name: /Revoke/i }));

    expect(accountClient.revokeTrustedDevice).toHaveBeenCalledWith("account-session", "device-current");
    expect(accountClient.loadSettings).toHaveBeenCalledTimes(1);
    expect(onAccountSessionChange).toHaveBeenCalledWith(null);
    expect(await screen.findByText("Revoked this trusted device. Please sign in again.")).toBeInTheDocument();
  });
});

function installLocalStorageStub() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

function AccountHarness({
  accountClient,
  onAuthenticated,
}: {
  accountClient: AccountApiClient;
  onAuthenticated: (session: TripParticipantSession) => void;
}) {
  const [accountSession, setAccountSession] = useState<AccountSession | null>(null);

  return (
    <AccountAccessPanel
      accountClient={accountClient}
      accountSession={accountSession}
      trip={seedTrip}
      onAccountSessionChange={setAccountSession}
      onAuthenticated={onAuthenticated}
      onTripChange={vi.fn()}
    />
  );
}

function createAccountClient(): AccountApiClient {
  return {
    startEmailLogin: vi.fn().mockResolvedValue({ challengeId: "login-challenge", expiresAt: "2026-05-30T09:00:00.000Z" }),
    finishEmailLogin: vi.fn().mockResolvedValue({
      userId: "user-aom",
      sessionToken: "account-session",
      kind: "trusted",
      trustedDeviceId: "device-current",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
    finishPasswordLogin: vi.fn().mockResolvedValue({
      userId: "user-aom",
      sessionToken: "account-session",
      kind: "trusted",
      trustedDeviceId: "device-current",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
    loadSettings: vi.fn().mockResolvedValue(accountSettings),
    updateSettings: vi.fn().mockImplementation((_sessionToken: string, request: AccountSettingsUpdateRequest) =>
      Promise.resolve({
        ...accountSettings,
        profile: {
          ...accountSettings.profile,
          ...request,
        },
      }),
    ),
    listTrips: vi.fn().mockResolvedValue([accountTrip, accountTravelerTrip]),
    loadStats: vi.fn().mockResolvedValue(accountStats),
    createTrip: vi.fn().mockImplementation((_sessionToken: string, request: AccountTripCreateRequest) =>
      Promise.resolve({
        trip: {
          id: "trip-created",
          name: request.name,
          destinationLabel: request.destinationLabel,
          startDate: request.startDate,
          endDate: request.endDate,
          joinId: request.joinId,
          activePlanVariantId: "plan-main",
          ownerMemberId: "member-owner",
          version: 1,
        },
        ownerMemberId: "member-owner",
        memberSession: {
          tripId: "trip-created",
          memberId: "member-owner",
          sessionToken: "member-session",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        },
      }),
    ),
    claimMember: vi.fn().mockResolvedValue(undefined),
    transferOwner: vi.fn().mockResolvedValue({
      tripId: "trip-id",
      previousOwnerMemberId: "member-owner",
      newOwnerMemberId: "member-target",
    }),
    startPasskeyRegistration: vi.fn().mockResolvedValue({
      challengeId: "passkey-challenge",
      challenge: "AQIDBA",
      expiresAt: "2026-05-30T09:00:00.000Z",
    }),
    finishPasskeyRegistration: vi.fn().mockResolvedValue({
      id: "passkey-id",
      nickname: "Aom passkey",
      createdAt: "2026-05-30T08:00:00.000Z",
      lastUsedAt: null,
    }),
    startPasskeyLogin: vi.fn().mockResolvedValue({
      challengeId: "passkey-login-challenge",
      challenge: "AQIDBA",
      expiresAt: "2026-05-30T09:00:00.000Z",
      allowCredentials: [{ credentialId: "BQYH" }],
    }),
    finishPasskeyLogin: vi.fn().mockResolvedValue({
      userId: "user-aom",
      sessionToken: "passkey-session",
      kind: "trusted",
      trustedDeviceId: "device-passkey",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
    revokeTrustedDevice: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  };
}

function stubCredentials() {
  const credentials = {
    create: vi.fn().mockResolvedValue({
      rawId: bytes([5, 6, 7]),
      response: {
        clientDataJSON: bytes([8, 9]),
        attestationObject: bytes([10, 11, 12]),
      },
    }),
    get: vi.fn().mockResolvedValue({
      rawId: bytes([5, 6, 7]),
      response: {
        clientDataJSON: bytes([8, 9]),
        authenticatorData: bytes([13, 14]),
        signature: bytes([15, 16]),
      },
    }),
  };
  Object.defineProperty(navigator, "credentials", {
    configurable: true,
    value: credentials,
  });
  return credentials;
}

function bytes(values: number[]) {
  return Uint8Array.from(values).buffer;
}

const accountSettings: AccountSettings = {
  profile: {
    id: "user-aom",
    displayName: "Aom",
    avatarColor: "#0f766e",
    locale: "th-TH",
    timezone: "Asia/Bangkok",
    primaryEmail: "aom@example.test",
  },
  passkeys: [],
  trustedDevices: [
    {
      id: "device-laptop",
      label: "Aom laptop",
      userAgent: "Safari",
      createdAt: "2026-05-30T08:00:00.000Z",
      lastSeenAt: "2026-05-30T08:30:00.000Z",
    },
    {
      id: "device-current",
      label: "Current MacBook",
      userAgent: "Safari",
      createdAt: "2026-05-30T08:10:00.000Z",
      lastSeenAt: "2026-05-30T08:40:00.000Z",
    },
  ],
};

const accountTrip: AccountTripSummary = {
  id: "trip-id",
  name: "Seoul Spring",
  destinationLabel: "Seoul",
  startDate: "2026-06-01",
  endDate: "2026-06-05",
  role: "owner",
  memberId: "member-owner",
  ownerMemberId: "member-owner",
  joinedAt: "2026-05-30T08:00:00.000Z",
  isOwner: true,
};

const accountTravelerTrip: AccountTripSummary = {
  id: "trip-traveler",
  name: "Taipei Shared",
  destinationLabel: "Taipei",
  startDate: "2026-07-01",
  endDate: "2026-07-04",
  role: "traveler",
  memberId: "member-traveler",
  ownerMemberId: "member-owner",
  joinedAt: "2026-05-30T08:00:00.000Z",
  isOwner: false,
};

const accountStats: AccountTripStats = {
  tripsTotal: 2,
  tripsOwned: 1,
  activeTrips: 1,
  tempClaimsCompleted: 0,
};
