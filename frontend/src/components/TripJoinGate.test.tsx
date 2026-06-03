import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TripJoinGate } from "./TripJoinGate";
import { claimTripParticipant } from "@/src/trip/auth";
import { TripApiError, type TripApiClient, type TripCockpit } from "@/src/trip/api-client";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";

const render = renderWithI18n;

describe("TripJoinGate", () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  it("renders the join flow in English by default and switches to Thai", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <TripJoinGate
        trip={seedTrip}
        onTripChange={() => {}}
        onAuthenticated={() => {}}
      />,
    );

    expect(screen.getByRole("heading", { name: /Enter trip room/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Trip ID/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));

    expect(screen.getByRole("heading", { name: /เข้าห้อง trip/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เข้าห้อง trip/i })).toBeInTheDocument();
  }, 45_000);

  it("prefills the join code from invite route params", () => {
    render(<TripJoinGate trip={seedTrip} initialJoinCode="HK-SZ-2025" onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    expect(screen.getByLabelText(/Trip ID/i)).toHaveValue("HK-SZ-2025");
  });

  it("keeps the trip access visual preview out of complementary landmarks", () => {
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    expect(screen.queryByRole("complementary", { name: /Trip access preview/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Trip access preview/i)).toHaveClass("trip-access-visual");
  });

  it("marks trip room credentials with browser password-manager autocomplete hints", () => {
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    expect(screen.getByLabelText(/Trip ID/i)).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText(/^Trip password$/i)).toHaveAttribute("autocomplete", "current-password");
  });

  it("uses English participant status copy and lets users reveal password fields", async () => {
    const user = userEvent.setup();
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    const roomPassword = screen.getByLabelText(/^Trip password$/i);
    expect(roomPassword).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /Show trip password/i }));
    expect(roomPassword).toHaveAttribute("type", "text");

    await enterTripRoom(user);

    expect(screen.getAllByText("Ready").length).toBeGreaterThan(0);
    expect(screen.queryByText("First entry")).not.toBeInTheDocument();
    expect(screen.queryByText("Claimed")).not.toBeInTheDocument();
    expect(screen.queryByText("Disabled")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    expect(screen.getByText(/This is your personal password/i)).toBeInTheDocument();
    const participantPassword = screen.getByLabelText(/Set password for Explorer Friend/i);
    expect(participantPassword).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: /Show participant password/i }));
    expect(participantPassword).toHaveAttribute("type", "text");
  }, 45_000);

  it("keeps the selected participant password form adjacent to the selected card", async () => {
    const user = userEvent.setup();
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await enterTripRoom(user);
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));

    const selectedCard = screen.getByRole("button", { name: /Explorer Friend/i });
    const authPanel = screen.getByRole("group", { name: /Explorer Friend/i });
    expect(selectedCard.nextElementSibling).toBe(authPanel);
  }, 45_000);

  it("requires the trip id and trip password before choosing a participant", async () => {
    const user = userEvent.setup();
    render(<TripJoinGate trip={seedTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "DEMO-TRIP");
    await user.type(screen.getByLabelText(/^Trip password$/i), "wrong");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Trip ID or password is incorrect/i);
    expect(screen.queryByRole("heading", { name: /Choose identity/i })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^Trip password$/i));
    await user.type(screen.getByLabelText(/^Trip password$/i), "demo-trip-pass");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(screen.getByRole("heading", { name: /Choose identity/i })).toBeInTheDocument();
  });

  it("claims a participant on first entry and returns a local session", async () => {
    const user = userEvent.setup();
    const onTripChange = vi.fn();
    const onAuthenticated = vi.fn();
    render(<TripJoinGate trip={seedTrip} onTripChange={onTripChange} onAuthenticated={onAuthenticated} />);

    await enterTripRoom(user);
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    await user.type(screen.getByLabelText(/Set password for Explorer Friend/i), "traveler-pin");
    await user.click(screen.getByRole("button", { name: /Start/i }));

    expect(onTripChange).toHaveBeenCalled();
    expect(onAuthenticated).toHaveBeenCalledWith(expect.objectContaining({ tripId: seedTrip.id, memberId: "member-nam" }));
  });

  it("rejects weak first-entry participant passwords before creating a local session", async () => {
    const user = userEvent.setup();
    const onTripChange = vi.fn();
    const onAuthenticated = vi.fn();
    render(<TripJoinGate trip={seedTrip} onTripChange={onTripChange} onAuthenticated={onAuthenticated} />);

    await enterTripRoom(user);
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    await user.type(screen.getByLabelText(/Set password for Explorer Friend/i), "123");
    await user.click(screen.getByRole("button", { name: /Start/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Set a password with at least 4 characters.");
    expect(onTripChange).not.toHaveBeenCalled();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it("requires the existing participant password before restoring their local identity", async () => {
    const user = userEvent.setup();
    const claimedTrip = claimTripParticipant(seedTrip, "member-beam", "beam-pin");
    const onAuthenticated = vi.fn();
    render(<TripJoinGate trip={claimedTrip} onTripChange={vi.fn()} onAuthenticated={onAuthenticated} />);

    await enterTripRoom(user);
    await user.click(screen.getByRole("button", { name: /Travel Mate/i }));
    const authPanel = screen.getByRole("group", { name: /Travel Mate/i });

    await user.type(within(authPanel).getByLabelText(/Travel Mate's password/i), "wrong");
    await user.click(within(authPanel).getByRole("button", { name: /Confirm/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/Password is incorrect/i);
    expect(onAuthenticated).not.toHaveBeenCalled();

    await user.clear(within(authPanel).getByLabelText(/Travel Mate's password/i));
    await user.type(within(authPanel).getByLabelText(/Travel Mate's password/i), "beam-pin");
    await user.click(within(authPanel).getByRole("button", { name: /Confirm/i }));

    expect(onAuthenticated).toHaveBeenCalledWith(expect.objectContaining({ memberId: "member-beam" }));
  });

  it("does not allow disabled participants to claim or login", async () => {
    const user = userEvent.setup();
    const disabledTrip = {
      ...seedTrip,
      members: seedTrip.members.map((member) =>
        member.id === "member-nam" ? { ...member, accessStatus: "disabled" as const } : member,
      ),
    };
    render(<TripJoinGate trip={disabledTrip} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await enterTripRoom(user);

    const disabledParticipant = screen.getByRole("button", { name: /Explorer Friend/i });
    expect(disabledParticipant).toBeDisabled();
    expect(disabledParticipant).toHaveTextContent(/Disabled/i);
    (disabledParticipant as HTMLButtonElement).disabled = false;
    await user.click(disabledParticipant);
    expect(screen.queryByRole("group", { name: /Explorer Friend/i })).not.toBeInTheDocument();
  });

  it("uses fallback copy for unknown thrown API join errors", async () => {
    const user = userEvent.setup();
    const apiClient: TripApiClient = {
      joinTrip: vi.fn().mockRejectedValue("network down"),
      claimMember: vi.fn(),
      loginMember: vi.fn(),
      logout: vi.fn(),
      loadTrip: vi.fn(),
      createTask: vi.fn(),
      patchTask: vi.fn(),
      patchItineraryItem: vi.fn(),
      createItineraryItem: vi.fn(),
      deleteItineraryItem: vi.fn(),
      reorderItineraryItems: vi.fn(),
      createSuggestion: vi.fn(),
      approveSuggestion: vi.fn(),
      rejectSuggestion: vi.fn(),
      createStopNote: vi.fn(),
      patchStopNote: vi.fn(),
      deleteStopNote: vi.fn(),
      createMember: vi.fn(),
      patchMember: vi.fn(),
      resetMemberClaim: vi.fn(),
      getExpenseSummary: vi.fn(),
    };

    render(<TripJoinGate apiClient={apiClient} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "bad");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Trip ID or password is incorrect.");
  });

  it("does not offer a separate demo access link", () => {
    render(
      <TripJoinGate
        apiClient={createApiClient()}
        trip={seedTrip}
        onTripChange={vi.fn()}
        onAuthenticated={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link", { name: /เปิด demo trip/i })).not.toBeInTheDocument();
  });

  it("uses the local demo trip from the same join form before falling through to the API", async () => {
    const user = userEvent.setup();
    const apiClient = createApiClient();

    render(
      <TripJoinGate
        apiClient={apiClient}
        trip={seedTrip}
        onTripChange={vi.fn()}
        onAuthenticated={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/Trip ID/i), "DEMO-TRIP");
    await user.type(screen.getByLabelText(/^Trip password$/i), "demo-trip-pass");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(apiClient.joinTrip).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: /Choose identity/i })).toBeInTheDocument();
  });

  it("does not show raw numeric API errors to join users", async () => {
    const user = userEvent.setup();
    const apiClient = createApiClient({
      joinTrip: vi.fn().mockRejectedValue(new Error("404")),
    });

    render(<TripJoinGate apiClient={apiClient} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "bad");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Trip ID or password is incorrect.");
    expect(screen.getByRole("alert")).not.toHaveTextContent(/^404$/);
  });

  it("uses the backend API client to join, claim, and hydrate the real cockpit", async () => {
    const user = userEvent.setup();
    const cockpit: TripCockpit = {
      trip: {
        ...seedTrip,
        id: "018f4e80-5788-7de0-a45c-8a555d17fc2d",
        joinId: "HK-SZ-2025",
        joinPasswordHash: "",
        members: [{ ...seedTrip.members[0], id: "018f4e81-77a4-7b8f-b3bd-0d0f493ac561", displayName: "Aom", claimPasswordHash: null }],
      },
      suggestions: [],
      tasks: [],
      stopNotes: [],
      expenseSummary: null,
    };
    const apiClient: TripApiClient = {
      joinTrip: vi.fn().mockResolvedValue({
        trip: {
          id: cockpit.trip.id,
          name: cockpit.trip.name,
          destinationLabel: cockpit.trip.destinationLabel,
          startDate: cockpit.trip.startDate,
          endDate: cockpit.trip.endDate,
          joinId: cockpit.trip.joinId,
          activePlanVariantId: cockpit.trip.activePlanVariantId,
          ownerMemberId: cockpit.trip.members[0].id,
          version: 1,
        },
        claimableMembers: [
          {
            id: cockpit.trip.members[0].id,
            tripId: cockpit.trip.id,
            displayName: "Aom",
            role: "owner",
            accessStatus: "active",
            presence: "offline",
            color: "#0f766e",
            userId: null,
            claimedAt: null,
            lastSeenAt: null,
          },
        ],
        joinSessionToken: "join-session-token",
        expiresAt: "2026-05-29T00:20:00.000Z",
      }),
      claimMember: vi.fn().mockResolvedValue({
        tripId: cockpit.trip.id,
        memberId: cockpit.trip.members[0].id,
        sessionToken: "session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
      loginMember: vi.fn(),
      logout: vi.fn(),
      loadTrip: vi.fn().mockResolvedValue(cockpit),
      createTask: vi.fn(),
      patchTask: vi.fn(),
      patchItineraryItem: vi.fn(),
      createItineraryItem: vi.fn(),
      deleteItineraryItem: vi.fn(),
      reorderItineraryItems: vi.fn(),
      createSuggestion: vi.fn(),
      approveSuggestion: vi.fn(),
      rejectSuggestion: vi.fn(),
      createStopNote: vi.fn(),
      patchStopNote: vi.fn(),
      deleteStopNote: vi.fn(),
      createMember: vi.fn(),
      patchMember: vi.fn(),
      resetMemberClaim: vi.fn(),
      getExpenseSummary: vi.fn(),
    };
    const onTripChange = vi.fn();
    const onAuthenticated = vi.fn();
    const onCockpitLoaded = vi.fn();

    render(
      <TripJoinGate
        apiClient={apiClient}
        onTripChange={onTripChange}
        onAuthenticated={onAuthenticated}
        onCockpitLoaded={onCockpitLoaded}
      />,
    );

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "dim-sum-run");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));
    await user.click(await screen.findByRole("button", { name: /Aom/i }));
    await user.type(screen.getByLabelText(/Set password for Aom/i), "owner-pin");
    await user.click(screen.getByRole("button", { name: /Start|Confirm/i }));

    expect(apiClient.joinTrip).toHaveBeenCalledWith({ joinId: "HK-SZ-2025", password: "dim-sum-run" });
    expect(apiClient.claimMember).toHaveBeenCalledWith(cockpit.trip.id, cockpit.trip.members[0].id, "owner-pin", "join-session-token");
    expect(apiClient.loadTrip).toHaveBeenCalledWith(cockpit.trip.id, "session-token");
    expect(onTripChange).toHaveBeenCalledWith(cockpit.trip);
    expect(onAuthenticated).toHaveBeenCalledWith(expect.objectContaining({ sessionToken: "session-token" }));
    expect(onCockpitLoaded).toHaveBeenCalledWith(cockpit);
  });

  it("uses safe API fallback copy while joining and authenticating", async () => {
    const user = userEvent.setup();
    const apiClient: TripApiClient = {
      joinTrip: vi.fn()
        .mockRejectedValueOnce(new TripApiError({ code: "invalid_credentials", message: "No trip room", status: 401 }))
        .mockResolvedValueOnce({
          trip: {
            id: seedTrip.id,
            name: seedTrip.name,
            destinationLabel: seedTrip.destinationLabel,
            startDate: seedTrip.startDate,
            endDate: seedTrip.endDate,
            joinId: seedTrip.joinId,
            activePlanVariantId: seedTrip.activePlanVariantId,
            ownerMemberId: "member-aom",
            version: 1,
          },
          claimableMembers: [{
            id: "member-aom",
            tripId: seedTrip.id,
            displayName: "Demo Traveler",
            role: "owner",
            accessStatus: "active",
            presence: "online",
            color: "#0f766e",
            userId: null,
            claimedAt: null,
            lastSeenAt: null,
          }],
          joinSessionToken: "join-session-token",
          expiresAt: "2026-05-29T00:20:00.000Z",
        }),
      claimMember: vi.fn().mockRejectedValue(new TripApiError({ code: "invalid_request", message: "Already claimed", status: 400 })),
      loginMember: vi.fn().mockRejectedValue(new Error("Backend login unavailable")),
      logout: vi.fn(),
      loadTrip: vi.fn(),
      createTask: vi.fn(),
      patchTask: vi.fn(),
      patchItineraryItem: vi.fn(),
      createItineraryItem: vi.fn(),
      deleteItineraryItem: vi.fn(),
      reorderItineraryItems: vi.fn(),
      createSuggestion: vi.fn(),
      approveSuggestion: vi.fn(),
      rejectSuggestion: vi.fn(),
      createStopNote: vi.fn(),
      patchStopNote: vi.fn(),
      deleteStopNote: vi.fn(),
      createMember: vi.fn(),
      patchMember: vi.fn(),
      resetMemberClaim: vi.fn(),
      getExpenseSummary: vi.fn(),
    };

    render(<TripJoinGate apiClient={apiClient} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "bad");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("Trip ID or password is incorrect.");

    await user.clear(screen.getByLabelText(/^Trip password$/i));
    await user.type(screen.getByLabelText(/^Trip password$/i), "dim-sum-run");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));
    await user.click(await screen.findByRole("button", { name: /Demo Traveler/i }));
    await user.type(screen.getByLabelText(/Set password for Demo Traveler/i), "owner-pin");
    await user.click(screen.getByRole("button", { name: /Start|Confirm/i }));

    expect(apiClient.loginMember).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Password is incorrect.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Already claimed");
  });

  it("does not fall back to login when backend claiming fails for a non-validation reason", async () => {
    const user = userEvent.setup();
    const apiClient: TripApiClient = {
      joinTrip: vi.fn().mockResolvedValue({
        trip: {
          id: seedTrip.id,
          name: seedTrip.name,
          destinationLabel: seedTrip.destinationLabel,
          startDate: seedTrip.startDate,
          endDate: seedTrip.endDate,
          joinId: seedTrip.joinId,
          activePlanVariantId: seedTrip.activePlanVariantId,
          ownerMemberId: "member-aom",
          version: 1,
        },
        claimableMembers: [{
          id: "member-aom",
          tripId: seedTrip.id,
          displayName: "Demo Traveler",
          role: "owner",
          accessStatus: "active",
          presence: "online",
          color: "#0f766e",
          userId: null,
          claimedAt: null,
          lastSeenAt: null,
        }],
        joinSessionToken: "join-session-token",
        expiresAt: "2026-05-29T00:20:00.000Z",
      }),
      claimMember: vi.fn().mockRejectedValue(new TripApiError({ code: "server_error", message: "Claim service down", status: 500 })),
      loginMember: vi.fn(),
      logout: vi.fn(),
      loadTrip: vi.fn(),
      createTask: vi.fn(),
      patchTask: vi.fn(),
      patchItineraryItem: vi.fn(),
      createItineraryItem: vi.fn(),
      deleteItineraryItem: vi.fn(),
      reorderItineraryItems: vi.fn(),
      createSuggestion: vi.fn(),
      approveSuggestion: vi.fn(),
      rejectSuggestion: vi.fn(),
      createStopNote: vi.fn(),
      patchStopNote: vi.fn(),
      deleteStopNote: vi.fn(),
      createMember: vi.fn(),
      patchMember: vi.fn(),
      resetMemberClaim: vi.fn(),
      getExpenseSummary: vi.fn(),
    };

    render(<TripJoinGate apiClient={apiClient} onTripChange={vi.fn()} onAuthenticated={vi.fn()} />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/^Trip password$/i), "dim-sum-run");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));
    await user.click(await screen.findByRole("button", { name: /Demo Traveler/i }));
    await user.type(screen.getByLabelText(/Set password for Demo Traveler/i), "owner-pin");
    await user.click(screen.getByRole("button", { name: /Start|Confirm/i }));

    expect(apiClient.loginMember).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Password is incorrect.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Claim service down");
  });
});

async function enterTripRoom(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "DEMO-TRIP" } });
  fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "demo-trip-pass" } });
  await user.click(screen.getByRole("button", { name: /Enter trip/i }));
}

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

function createApiClient(overrides: Partial<TripApiClient> = {}): TripApiClient {
  return {
    joinTrip: vi.fn(),
    claimMember: vi.fn(),
    loginMember: vi.fn(),
    logout: vi.fn(),
    loadTrip: vi.fn(),
    createTask: vi.fn(),
    patchTask: vi.fn(),
    patchItineraryItem: vi.fn(),
    createItineraryItem: vi.fn(),
    deleteItineraryItem: vi.fn(),
    reorderItineraryItems: vi.fn(),
    createSuggestion: vi.fn(),
    approveSuggestion: vi.fn(),
    rejectSuggestion: vi.fn(),
    createStopNote: vi.fn(),
    patchStopNote: vi.fn(),
    deleteStopNote: vi.fn(),
    createMember: vi.fn(),
    patchMember: vi.fn(),
    resetMemberClaim: vi.fn(),
    getExpenseSummary: vi.fn(),
    ...overrides,
  } as TripApiClient;
}
