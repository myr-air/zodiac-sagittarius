import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type {
  AccountApiClient,
  AccountSession,
  AccountSettings,
  AccountTripCreateRequest,
  AccountTripStats,
  AccountTripSummary,
} from "@/src/account/api-client";
import { seedTrip } from "@/src/trip/seed";
import type { TripParticipantSession } from "@/src/trip/types";
import { AccountAccessPanel } from "./AccountAccessPanel";

describe("AccountAccessPanel", () => {
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
    await user.click(screen.getByRole("button", { name: /เข้า account/i }));

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
      createdAt: "2026-05-30T08:00:00.000Z",
      expiresAt: "2026-06-29T08:00:00.000Z",
    }),
    loadSettings: vi.fn().mockResolvedValue(accountSettings),
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
      challenge: "opaque",
      expiresAt: "2026-05-30T09:00:00.000Z",
    }),
    logout: vi.fn().mockResolvedValue(undefined),
  };
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
  trustedDevices: [],
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
