import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { TripApiClient } from "@/src/trip/api-client";

export async function enterTripRoom(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText(/Trip ID/i), { target: { value: "HK-SZ-2025" } });
  fireEvent.change(screen.getByLabelText(/^Trip password$/i), { target: { value: "seed-trip-pass" } });
  await user.click(screen.getByRole("button", { name: /Enter trip/i }));
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
