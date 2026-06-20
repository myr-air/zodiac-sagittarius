import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
export { installLocalStorageStub } from "@/src/testing/browser-storage";
import type { TripApiClient } from "@/src/trip/api-client";
import { seedTrip } from "@/src/trip/seed";
import type { TripRole } from "@/src/trip/types";

export async function enterTripRoom(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
  fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "seed-trip-pass" } });
  await user.click(screen.getByRole("button", { name: /Enter trip/i }));
}

export function createApiClient(overrides: Partial<TripApiClient> = {}): TripApiClient {
  return {
    joinTrip: vi.fn(),
    claimMember: vi.fn(),
    loginMember: vi.fn(),
    logout: vi.fn(),
    loadTrip: vi.fn(),
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
    ...overrides,
  } as TripApiClient;
}

export function createApiJoinResponse({
  memberId = "member-aom",
  displayName = "Demo Traveler",
  role = "owner",
  presence = "online",
  color = "#0f766e",
  claimedAt = null,
  expiresAt = "2026-05-29T00:20:00.000Z",
}: {
  memberId?: string;
  displayName?: string;
  role?: TripRole;
  presence?: "online" | "offline";
  color?: string;
  claimedAt?: string | null;
  expiresAt?: string;
} = {}) {
  return {
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
      id: memberId,
      tripId: seedTrip.id,
      displayName,
      role,
      accessStatus: "active" as const,
      presence,
      color,
      userId: null,
      claimedAt,
      lastSeenAt: null,
    }],
    joinSessionToken: "join-session-token",
    expiresAt,
  };
}
