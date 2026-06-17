import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, useState } from "react";
import { expect, vi } from "vitest";
import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
  AccountSettingsUpdateRequest,
  AccountTripCreateRequest,
  AccountTripStats,
  AccountTripSummary,
} from "@/src/account/api-client";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { TripApiClient } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { AccountAccessPanel } from "./AccountAccessPanel";

export function render(ui: ReactElement) {
  const result = renderWithI18n(ui, { locale: "en" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: ReactElement) => originalRerender(<I18nProvider>{nextUi}</I18nProvider>),
  };
}

export function authForm() {
  const form = screen.getByLabelText(/Email/i).closest("form");
  expect(form).toBeTruthy();
  return within(form as HTMLElement);
}

export async function switchToThai(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Language and currency/i }));
  await user.click(await screen.findByRole("menuitemradio", { name: /ภาษาไทย/i }));
}

export async function selectDestinationCity(user: ReturnType<typeof userEvent.setup>, query: string, option: RegExp) {
  const search = await screen.findByLabelText(/Search destination cities/i);
  await user.clear(search);
  await user.type(search, query);
  await user.click(await screen.findByRole("button", { name: option }));
}

export function installLocalStorageStub() {
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

export function createTrustedAccountSession(overrides: Partial<AccountSession> = {}): AccountSession {
  return {
    userId: "user-aom",
    sessionToken: "account-session",
    kind: "trusted",
    trustedDeviceId: "device-current",
    createdAt: "2026-05-30T08:00:00.000Z",
    expiresAt: "2026-06-29T08:00:00.000Z",
    ...overrides,
  };
}

export function AccountHarness({
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

export function renderTripBuilder({
  accountClient = createAccountClient(),
  apiClient,
  onAccountSessionChange = vi.fn(),
  onAuthenticated = vi.fn(),
  onTripChange = vi.fn(),
}: {
  accountClient?: AccountApiClient;
  apiClient?: TripApiClient;
  onAccountSessionChange?: (session: AccountSession | null) => void;
  onAuthenticated?: (session: TripParticipantSession) => void;
  onTripChange?: (trip: Trip) => void;
} = {}) {
  const result = render(
    <AccountAccessPanel
      accessMode="account-portal"
      accountClient={accountClient}
      apiClient={apiClient}
      accountSession={createTrustedAccountSession()}
      portalSection="new-trip"
      trip={seedTrip}
      onAccountSessionChange={onAccountSessionChange}
      onAuthenticated={onAuthenticated}
      onTripChange={onTripChange}
    />,
  );

  return {
    ...result,
    accountClient,
    onAccountSessionChange,
    onAuthenticated,
    onTripChange,
  };
}

export function createAccountClient(): AccountApiClient {
  return {
    startEmailLogin: vi.fn().mockResolvedValue({ challengeId: "login-challenge", expiresAt: "2026-05-30T09:00:00.000Z" }),
    finishEmailLogin: vi.fn().mockResolvedValue(createTrustedAccountSession()),
    finishPasswordLogin: vi.fn().mockResolvedValue(createTrustedAccountSession()),
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
    loadExplorer: vi.fn().mockResolvedValue({
      upcomingTrips: 1,
      ownedTrips: 1,
      destinationCount: 2,
      nextTrip: accountTrip,
    }),
    listToDos: vi.fn().mockResolvedValue([
      {
        id: "todo-1",
        tripId: "trip-id",
        tripName: "Seoul Spring",
        title: "Book train",
        status: "open",
        visibility: "shared",
        kind: "booking",
        assigneeId: null,
        relatedItemId: null,
        version: 1,
      },
    ]),
    listVault: vi.fn().mockResolvedValue([
      {
        id: "vault-1",
        tripId: "trip-id",
        tripName: "Seoul Spring",
        kind: "note",
        title: "Passport note",
        detail: "Keep copies ready",
        externalUrl: null,
        source: "vault",
        createdAt: "2026-05-30T08:00:00.000Z",
      },
    ]),
    createVaultItem: vi.fn().mockResolvedValue({
      id: "vault-created",
      tripId: null,
      tripName: null,
      kind: "file",
      title: "Tickets",
      detail: "PDF link",
      externalUrl: "https://example.test/tickets.pdf",
      source: "vault",
      createdAt: "2026-05-30T08:00:00.000Z",
    }),
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
    createTripMemberSession: vi.fn().mockResolvedValue({
      tripId: "trip-id",
      memberId: "member-owner",
      sessionToken: "member-session",
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
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

export function createTripApiClient(): TripApiClient {
  return {
    rotateJoinInviteToken: vi.fn().mockResolvedValue({ token: "created-token", expiresAt: "2026-06-30T00:00:00.000Z" }),
  } as unknown as TripApiClient;
}

export function stubCredentials() {
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

export function bytes(values: number[]) {
  return Uint8Array.from(values).buffer;
}

export const accountSettings: AccountSettings = {
  profile: {
    id: "user-aom",
    displayName: "Aom",
    avatarColor: "#c2410c",
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

export const accountTrip: AccountTripSummary = {
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

export const accountTravelerTrip: AccountTripSummary = {
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

export const accountStats: AccountTripStats = {
  tripsTotal: 2,
  tripsOwned: 1,
  activeTrips: 1,
  tempClaimsCompleted: 0,
};
