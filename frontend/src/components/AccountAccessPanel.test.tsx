import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
import { AccountAccessPanel } from "./AccountAccessPanel";

describe("AccountAccessPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps temp access as the fast default while exposing account login", async () => {
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

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveClass("account-tab--active");
    expect(screen.getByRole("heading", { name: /เข้าห้อง trip/i })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));

    expect(screen.getByRole("heading", { name: /จัดการ trip ด้วย account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(/Code/i)).toHaveAttribute("autocomplete", "one-time-code");
    expect(screen.getByRole("checkbox", { name: /Trust this PC/i })).toBeChecked();
  });

  it("logs in by email, loads settings/history/stats, and creates an owner trip", async () => {
    const user = userEvent.setup();
    const accountClient = createAccountClient();
    const onAuthenticated = vi.fn();

    render(<AccountHarness accountClient={accountClient} onAuthenticated={onAuthenticated} />);

    await user.click(screen.getByRole("tab", { name: /^Account$/i }));
    await user.type(screen.getByLabelText(/Email/i), "aom@example.test");
    await user.click(screen.getByRole("button", { name: /ส่งรหัส login/i }));
    await user.type(screen.getByLabelText(/Code/i), "123456");
    await user.type(screen.getByLabelText(/Device label/i), "MacBook");
    await user.click(screen.getByRole("button", { name: /^เข้า account$/i }));

    expect(accountClient.finishEmailLogin).toHaveBeenCalledWith({
      challengeId: "login-challenge",
      code: "123456",
      trustDevice: true,
      deviceLabel: "MacBook",
    });
    expect(await screen.findByText("Aom")).toBeInTheDocument();
    expect(screen.getByText("aom@example.test")).toBeInTheDocument();
    expect(screen.getByText("Trusted PC")).toBeInTheDocument();
    expect(screen.getByText("Profile & settings")).toBeInTheDocument();
    expect(screen.getByText("Seoul Spring")).toBeInTheDocument();

    const settingsCard = screen.getByText("Profile & settings").closest("section") as HTMLElement;
    await user.clear(within(settingsCard).getByLabelText(/Display name/i));
    await user.type(within(settingsCard).getByLabelText(/Display name/i), "Aom Updated");
    await user.clear(within(settingsCard).getByLabelText(/Avatar color/i));
    await user.type(within(settingsCard).getByLabelText(/Avatar color/i), "#abcdef");
    await user.clear(within(settingsCard).getByLabelText(/Locale/i));
    await user.type(within(settingsCard).getByLabelText(/Locale/i), "en-US");
    await user.clear(within(settingsCard).getByLabelText(/Timezone/i));
    await user.type(within(settingsCard).getByLabelText(/Timezone/i), "Asia/Tokyo");
    await user.click(within(settingsCard).getByRole("button", { name: /Save settings/i }));

    expect(accountClient.updateSettings).toHaveBeenCalledWith("account-session", {
      displayName: "Aom Updated",
      avatarColor: "#abcdef",
      locale: "en-US",
      timezone: "Asia/Tokyo",
    });
    expect(await screen.findByText("บันทึก profile และ settings แล้ว")).toBeInTheDocument();

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
        rp: { name: "Sagittarius" },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
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
    expect(await screen.findByText("สร้าง passkey แล้ว ใช้ login ได้ทันที")).toBeInTheDocument();

    const createForm = screen.getByText("Create trip").closest("form") as HTMLFormElement;
    await user.type(within(createForm).getByLabelText(/Trip name/i), "Taipei Food Run");
    await user.type(within(createForm).getByLabelText(/Destination/i), "Taipei");
    await user.clear(within(createForm).getByLabelText(/Start date/i));
    await user.type(within(createForm).getByLabelText(/Start date/i), "2026-07-01");
    await user.clear(within(createForm).getByLabelText(/End date/i));
    await user.type(within(createForm).getByLabelText(/End date/i), "2026-07-04");
    await user.type(within(createForm).getByLabelText(/Owner display name/i), "Aom");
    await user.type(within(createForm).getByLabelText(/Join ID/i), "TPE-2026");
    await user.type(within(createForm).getByLabelText(/Join password/i), "taipei-secret");
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
  });

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
    await user.type(screen.getByLabelText(/Email/i), "aom@example.test");
    await user.clear(screen.getByLabelText(/Device label/i));
    await user.type(screen.getByLabelText(/Device label/i), "Studio PC");
    await user.click(screen.getByRole("button", { name: /เข้า account ด้วย passkey/i }));

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
      deviceLabel: "Studio PC",
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
    expect(await screen.findByText("ยกเลิก trusted device นี้แล้ว กรุณา login ใหม่")).toBeInTheDocument();
  });
});

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
    listTrips: vi.fn().mockResolvedValue([accountTrip]),
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

const accountStats: AccountTripStats = {
  tripsTotal: 1,
  tripsOwned: 1,
  activeTrips: 1,
  tempClaimsCompleted: 0,
};
