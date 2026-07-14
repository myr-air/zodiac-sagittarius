import { vi } from "vitest";
import {
  type CreateExpenseApiRequest,
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import { normalizeExpenseSplitsFromMinor } from "@/src/trip/expenses";
import type { Trip } from "@/src/trip/types";

export { createDeferred } from "@/src/testing/deferred";

export function createApiClientForTrip(
  trip: Trip,
  overrides: Partial<TripApiClient> = {},
): TripApiClient {
  const cockpit: TripCockpit = {
    trip,
    suggestions: [],
    tasks: [],
    stopNotes: [],
    expenseSummary: null,
  };

  return {
    joinTrip: vi.fn().mockResolvedValue({
      trip: {
        id: trip.id,
        name: trip.name,
        destinationLabel: trip.destinationLabel,
        startDate: trip.startDate,
        endDate: trip.endDate,
        joinId: trip.joinId,
        activePlanVariantId: trip.activePlanVariantId,
        ownerMemberId: trip.members[0].id,
        version: 1,
      },
      claimableMembers: trip.members.map((member) => ({
        id: member.id,
        tripId: trip.id,
        displayName: member.displayName,
        role: member.role,
        accessStatus: member.accessStatus ?? "active",
        presence: member.presence,
        color: member.color,
        userId: member.userId ?? null,
        claimedAt: member.claimedAt ?? null,
        lastSeenAt: member.lastSeenAt ?? null,
      })),
      joinSessionToken: "join-session-token",
      expiresAt: "2026-05-29T00:20:00.000Z",
    }),
    claimMember: vi.fn().mockResolvedValue({
      tripId: trip.id,
      memberId: trip.members[0].id,
      sessionToken: "session-token",
      createdAt: "2026-05-29T00:00:00.000Z",
      expiresAt: "2027-06-28T00:00:00.000Z",
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
    createItineraryItem: vi.fn(),
    patchItineraryItem: vi.fn(),
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
    getExpenseSummary: vi.fn().mockResolvedValue({
      groupSpend: 0,
      netByMember: {},
      currentUserNetLabel: "settled",
      settlementSuggestions: [],
    }),
    recordExpenseReminder: vi.fn().mockResolvedValue({
      groupSpend: 0,
      netByMember: {},
      currentUserNetLabel: "settled",
      settlementSuggestions: [],
    }),
    createExpense: vi
      .fn()
      .mockImplementation(
        (
          _tripId: string,
          _sessionToken: string,
          request: CreateExpenseApiRequest,
        ) =>
          Promise.resolve({
            id: "new-expense-id",
            title: request.title,
            amount: request.amountMinor ? request.amountMinor / 100 : 0,
            amountMinor: request.amountMinor || 0,
            notes: request.notes ?? "",
            receiptUrl: request.receiptUrl ?? null,
            lineItems: request.lineItems ?? [],
            comments: request.comments ?? [],
            settlementAllocations: request.settlementAllocations ?? [],
            paidBy: request.paidBy,
            splits: normalizeExpenseSplitsFromMinor(request.splits || {}),
            category: request.category || "food",
            itineraryItemId: request.itineraryItemId || null,
            version: 1,
          }),
      ),
    patchExpense: vi.fn(),
    deleteExpense: vi.fn(),
    createBookingDoc: vi.fn(),
    patchBookingDoc: vi.fn(),
    deleteBookingDoc: vi.fn(),
    createPhotoAlbum: vi.fn(),
    patchPhotoAlbum: vi.fn(),
    deletePhotoAlbum: vi.fn(),
    ...overrides,
  };
}
