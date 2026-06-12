import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type {
  AccountApiClient,
  AccountSettingsUpdateRequest,
  AccountTripCreateRequest,
} from "@/src/account/api-client";
import { seedTrip } from "@/src/trip/seed";
import type { TripApiClient } from "@/src/trip/api-client";
import { AccountAccessPanel } from "./AccountAccessPanel";

const trustedSession = {
  userId: "user-aom",
  sessionToken: "account-session",
  kind: "trusted" as const,
  trustedDeviceId: "device-current",
  createdAt: "2026-05-30T08:00:00.000Z",
  expiresAt: "2026-06-29T08:00:00.000Z",
};

const accountSettings = {
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
      id: "device-current",
      label: "Current MacBook",
      userAgent: "Safari",
      createdAt: "2026-05-30T08:10:00.000Z",
      lastSeenAt: "2026-05-30T08:40:00.000Z",
    },
  ],
};

const ownedTrip = {
  id: "trip-id",
  name: "Seoul Spring",
  destinationLabel: "Seoul",
  startDate: "2026-06-01",
  endDate: "2026-06-05",
  role: "owner" as const,
  memberId: "member-owner",
  ownerMemberId: "member-owner",
  joinedAt: "2026-05-30T08:00:00.000Z",
  isOwner: true,
};

const travelerTrip = {
  id: "trip-traveler",
  name: "Taipei Shared",
  destinationLabel: "Taipei",
  startDate: "2026-07-01",
  endDate: "2026-07-04",
  role: "traveler" as const,
  memberId: "member-traveler",
  ownerMemberId: "member-owner",
  joinedAt: "2026-05-30T08:00:00.000Z",
  isOwner: false,
};

const accountClient: AccountApiClient = {
  startEmailLogin: async () => ({ challengeId: "login-challenge", expiresAt: "2026-05-30T09:00:00.000Z" }),
  finishEmailLogin: async () => trustedSession,
  finishPasswordLogin: async () => trustedSession,
  loadSettings: async () => accountSettings,
  updateSettings: async (_sessionToken: string, request: AccountSettingsUpdateRequest) => ({
    ...accountSettings,
    profile: { ...accountSettings.profile, ...request },
  }),
  listTrips: async () => [ownedTrip, travelerTrip],
  loadStats: async () => ({
    tripsTotal: 2,
    tripsOwned: 1,
    activeTrips: 1,
    tempClaimsCompleted: 0,
  }),
  loadExplorer: async () => ({
    upcomingTrips: 1,
    ownedTrips: 1,
    destinationCount: 2,
    nextTrip: ownedTrip,
  }),
  listToDos: async () => [
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
  ],
  listVault: async () => [
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
  ],
  createVaultItem: async () => ({
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
  createTrip: async (_sessionToken: string, request: AccountTripCreateRequest) => ({
    trip: {
      id: "trip-created",
      name: request.name || "Draft trip",
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
  createTripMemberSession: async () => ({
    tripId: "trip-id",
    memberId: "member-owner",
    sessionToken: "member-session",
    createdAt: "2026-05-30T08:00:00.000Z",
    expiresAt: "2026-06-29T08:00:00.000Z",
  }),
  claimMember: async () => {},
  transferOwner: async () => ({
    tripId: "trip-id",
    previousOwnerMemberId: "member-owner",
    newOwnerMemberId: "member-target",
  }),
  startPasskeyRegistration: async () => ({
    challengeId: "passkey-challenge",
    challenge: "AQIDBA",
    expiresAt: "2026-05-30T09:00:00.000Z",
  }),
  finishPasskeyRegistration: async () => ({
    id: "passkey-id",
    nickname: "Aom passkey",
    createdAt: "2026-05-30T08:00:00.000Z",
    lastUsedAt: null,
  }),
  startPasskeyLogin: async () => ({
    challengeId: "passkey-login-challenge",
    challenge: "AQIDBA",
    expiresAt: "2026-05-30T09:00:00.000Z",
    allowCredentials: [{ credentialId: "BQYH" }],
  }),
  finishPasskeyLogin: async () => trustedSession,
  revokeTrustedDevice: async () => {},
  logout: async () => {},
};

const tripApiClient = {
  rotateJoinInviteToken: async () => ({ token: "created-token", expiresAt: "2026-06-30T00:00:00.000Z" }),
} as unknown as TripApiClient;

const noop = () => {};

const meta = {
  title: "Pages/Account Access",
  component: AccountAccessPanel,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof AccountAccessPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AccountLogin: Story = {
  args: {
    accessMode: "account-login",
    accountClient,
    accountSession: null,
    trip: seedTrip,
    onAccountSessionChange: noop,
    onAuthenticated: noop,
    onTripChange: noop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Account sign in/i })).toBeVisible();
    await expect(canvas.getByLabelText(/Email/i)).toHaveAttribute("autocomplete", "username");
  },
};

export const AccountRegister: Story = {
  args: {
    ...AccountLogin.args,
    accessMode: "account-register",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Account register/i })).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Set password and continue/i })).toBeDisabled();
  },
};

export const AccountLoginThai: Story = {
  args: AccountLogin.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Account sign in/i })).toBeVisible();
    await expect(canvas.getAllByText(/อีเมล \*/i).length).toBeGreaterThan(0);
    await expect(canvas.getByLabelText(/อีเมล/i)).toHaveAttribute("autocomplete", "username");
    await expect(canvas.getByRole("button", { name: /เข้า account/i })).toBeDisabled();
  },
};

export const TripAccess: Story = {
  args: {
    ...AccountLogin.args,
    accessMode: "trip-access",
    initialJoinCode: seedTrip.joinId,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main", { name: /Trip access/i })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: /Enter trip room/i })).toBeVisible();
  },
};

export const PortalDashboard: Story = {
  args: {
    ...AccountLogin.args,
    accessMode: "account-portal",
    accountSession: trustedSession,
    portalSection: "dashboard",
    apiClient: tripApiClient,
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/User data stats and session status/i)).toBeVisible();
    await expect(await canvas.findByRole("navigation", { name: /Portal navigation/i })).toBeVisible();
  },
};

export const NewTripBuilder: Story = {
  args: {
    ...PortalDashboard.args,
    portalSection: "new-trip",
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText(/Trip name/i)).toBeVisible();
    await expect(await canvas.findByRole("region", { name: /Live trip preview/i })).toHaveClass("trip-live-preview");
  },
};

export const NewTripMobile: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText(/Trip name/i)).toBeVisible();
    await expect(canvas.getByRole("main", { name: /Account portal/i })).toHaveClass("account-page--portal-new-trip");
  },
};

export const AccountLoginTablet: Story = {
  args: AccountLogin.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: AccountLogin.play,
};

export const AccountLoginDesktop1024: Story = {
  args: AccountLogin.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: AccountLogin.play,
};

export const AccountLoginDesktop1440: Story = {
  args: AccountLogin.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: AccountLogin.play,
};

export const TripAccessTablet: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: TripAccess.play,
};

export const TripAccessDesktop1024: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: TripAccess.play,
};

export const TripAccessDesktop1440: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: TripAccess.play,
};

export const NewTripTablet: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: NewTripBuilder.play,
};

export const NewTripDesktop1024: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: NewTripBuilder.play,
};

export const NewTripDesktop1440: Story = {
  args: NewTripBuilder.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: NewTripBuilder.play,
};
