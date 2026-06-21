import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { TripJoinGate } from "../TripJoinGate";
import { installLocalStorageStub } from "./TripJoinGate.test-support";

const render = renderWithI18n;

describe("TripJoinGate API access", () => {
  beforeEach(() => {
    installLocalStorageStub();
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
      listDailyBriefings: vi.fn().mockResolvedValue([]),
      patchDailyBriefing: vi.fn(),
      patchTrip: vi.fn(),
      createPlanVariant: vi.fn(),
      patchPlanVariant: vi.fn(),
      publishPlanVariant: vi.fn(),
      createTask: vi.fn(),
      patchTask: vi.fn(),
      patchItineraryItem: vi.fn(),
      createItineraryItem: vi.fn(),
      deleteItineraryItem: vi.fn(),
      reorderItineraryItems: vi.fn(),
      importItinerary: vi.fn(),
      createSuggestion: vi.fn(),
      approveSuggestion: vi.fn(),
      rejectSuggestion: vi.fn(),
      createStopNote: vi.fn(),
      patchStopNote: vi.fn(),
      deleteStopNote: vi.fn(),
      listMembers: vi.fn(),
      updatePresence: vi.fn(),
      createMember: vi.fn(),
      patchMember: vi.fn(),
      resetMemberClaim: vi.fn(),
      getExpenseSummary: vi.fn(),
      recordExpenseReminder: vi.fn(),
      createExpense: vi.fn(),
      patchExpense: vi.fn(),
      deleteExpense: vi.fn(),
      createBookingDoc: vi.fn(),
      patchBookingDoc: vi.fn(),
      deleteBookingDoc: vi.fn(),
      createPhotoAlbum: vi.fn(),
      patchPhotoAlbum: vi.fn(),
      deletePhotoAlbum: vi.fn(),
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
    await user.type(screen.getByLabelText(/^Trip password$/i), "seed-trip-pass");
    await user.click(screen.getByRole("button", { name: /Enter trip/i }));
    await user.click(await screen.findByRole("button", { name: /Aom/i }));
    await user.type(screen.getByLabelText(/Set password for Aom/i), "owner-pin");
    await user.click(screen.getByRole("button", { name: /Start|Confirm/i }));

    expect(apiClient.joinTrip).toHaveBeenCalledWith({ joinId: "HK-SZ-2025", password: "seed-trip-pass" });
    expect(apiClient.claimMember).toHaveBeenCalledWith(cockpit.trip.id, cockpit.trip.members[0].id, "owner-pin", "join-session-token");
    expect(apiClient.loadTrip).toHaveBeenCalledWith(cockpit.trip.id, "session-token");
    expect(onTripChange).toHaveBeenCalledWith(cockpit.trip);
    expect(onAuthenticated).toHaveBeenCalledWith(expect.objectContaining({ sessionToken: "session-token" }));
    expect(onCockpitLoaded).toHaveBeenCalledWith(cockpit);
  });
});
