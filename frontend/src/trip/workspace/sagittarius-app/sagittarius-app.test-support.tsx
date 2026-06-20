import {
  fireEvent,
  screen,
} from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import {
  type CreateExpenseApiRequest,
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import { normalizeExpenseSplitsFromMinor } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import type {
  PlanVariant,
  Trip,
  TripDailyBriefing,
} from "@/src/trip/types";
import { createMemoryStorage } from "@/src/testing/browser-storage";

export function render(ui: ReactElement) {
  const result = renderWithI18n(ui, { locale: "th" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: ReactElement) =>
      originalRerender(
        <I18nProvider initialLocale="th">{nextUi}</I18nProvider>,
      ),
  };
}

export async function openItineraryHeaderControls(
  user: ReturnType<typeof userEvent.setup>,
) {
  const controlsButton = await screen.findByRole("button", {
    name: "Trip Plan controls",
  });
  await user.click(controlsButton);
  return controlsButton;
}

export function tripWithPlans(): Trip {
  const mainPlan = seedTrip.planVariants.find(
    (variant) => variant.id === seedTrip.activePlanVariantId,
  )!;
  const backupPlan: PlanVariant = {
    id: "plan-variant-backup",
    tripId: seedTrip.id,
    name: "Rain Plan",
    kind: "draft",
    description: "",
    version: 1,
  };
  const mainItem = seedTrip.itineraryItems.find(
    (item) => item.id === "item-dimdim",
  )!;
  return {
    ...seedTrip,
    activePlanVariantId: mainPlan.id,
    mainTripPlanId: mainPlan.id,
    planVariants: [
      { ...mainPlan, kind: "main", status: "main" },
      { ...backupPlan, kind: "draft", status: "draft" },
    ],
    tripPlans: [
      { ...mainPlan, kind: "main", status: "main" },
      { ...backupPlan, kind: "draft", status: "draft" },
    ],
    itineraryItems: [
      { ...mainItem, planVariantId: mainPlan.id },
      {
        ...mainItem,
        id: "item-rain-gallery",
        planVariantId: backupPlan.id,
        activity: "Rain plan gallery",
        place: "M+ Museum",
        sortOrder: mainItem.sortOrder + 100,
      },
    ],
  };
}

export function tripWithPlansAndPlanScopedRecords(
  selectedPlanId = "plan-variant-backup",
): Trip {
  const draftTrip = tripWithPlans();
  const backupItem = draftTrip.itineraryItems.find(
    (item) => item.id === "item-rain-gallery",
  )!;
  const mainItem = draftTrip.itineraryItems.find(
    (item) => item.id === "item-dimdim",
  )!;

  return {
    ...draftTrip,
    activePlanVariantId: selectedPlanId,
    mainTripPlanId: selectedPlanId,
    planVariants: draftTrip.planVariants.map((plan) =>
      plan.id === selectedPlanId
        ? { ...plan, kind: "main", status: "main" }
        : { ...plan, kind: "backup", status: "backup" },
    ),
    tripPlans: draftTrip.tripPlans?.map((plan) =>
      plan.id === selectedPlanId
        ? { ...plan, kind: "main", status: "main" }
        : { ...plan, kind: "backup", status: "backup" },
    ),
    expenses: [
      {
        id: "expense-main-dimsum",
        tripId: draftTrip.id,
        tripPlanId: mainItem.planVariantId,
        title: "Main plan dim sum receipt",
        amount: 512,
        paidBy: "member-aom",
        splits: { "member-aom": 512 },
        category: "food",
        itineraryItemId: mainItem.id,
      },
      {
        id: "expense-backup-gallery",
        tripId: draftTrip.id,
        tripPlanId: backupItem.planVariantId,
        title: "Backup gallery tickets",
        amount: 240,
        paidBy: "member-aom",
        splits: { "member-aom": 240 },
        category: "tickets",
        itineraryItemId: backupItem.id,
      },
    ],
    bookingDocs: [
      {
        id: "booking-main-dimsum",
        tripId: draftTrip.id,
        tripPlanId: mainItem.planVariantId,
        type: "activity_ticket",
        title: "Main plan brunch booking",
        status: "booked",
        visibility: "shared",
        ownerMemberId: "member-aom",
        providerName: "Dim Dim Sum",
        confirmationCode: "MAIN-BRUNCH",
        startsAt: null,
        endsAt: null,
        timezone: "Asia/Hong_Kong",
        priceAmount: 512,
        currency: "HKD",
        travelerIds: ["member-aom"],
        externalLinks: [],
        relatedItineraryItemIds: [mainItem.id],
        relatedTaskIds: [],
        relatedExpenseIds: ["expense-main-dimsum"],
        noteIds: [],
        notes: null,
        createdBy: "member-aom",
        updatedAt: "2026-06-01T00:00:00.000Z",
        version: 1,
      },
      {
        id: "booking-backup-gallery",
        tripId: draftTrip.id,
        tripPlanId: backupItem.planVariantId,
        type: "activity_ticket",
        title: "Backup gallery ticket booking",
        status: "booked",
        visibility: "shared",
        ownerMemberId: "member-aom",
        providerName: "M+ Museum",
        confirmationCode: "RAIN-GALLERY",
        startsAt: null,
        endsAt: null,
        timezone: "Asia/Hong_Kong",
        priceAmount: 240,
        currency: "HKD",
        travelerIds: ["member-aom"],
        externalLinks: [],
        relatedItineraryItemIds: [backupItem.id],
        relatedTaskIds: [],
        relatedExpenseIds: ["expense-backup-gallery"],
        noteIds: [],
        notes: null,
        createdBy: "member-aom",
        updatedAt: "2026-06-01T00:00:00.000Z",
        version: 1,
      },
    ],
    tasks: [
      {
        id: "task-main-dimsum",
        tripPlanId: mainItem.planVariantId,
        title: "Main plan brunch task",
        status: "open",
        visibility: "shared",
        kind: "booking",
        createdBy: "member-aom",
        relatedItemId: mainItem.id,
      },
      {
        id: "task-backup-gallery",
        tripPlanId: backupItem.planVariantId,
        title: "Backup gallery task",
        status: "open",
        visibility: "shared",
        kind: "booking",
        createdBy: "member-aom",
        relatedItemId: backupItem.id,
      },
    ],
  };
}

export function installLocalStorageStub() {
  const storage = createMemoryStorage();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

export function installSessionStorageStub() {
  const storage = createMemoryStorage();
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

export async function loginApiTrip(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText(/Trip ID/i), {
    target: { value: "HK-SZ-2025" },
  });
  fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
    target: { value: "seed-trip-pass" },
  });
  await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
  await user.click(
    await screen.findByRole("button", { name: /Demo Traveler/i }),
  );
  fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Demo Traveler/i), {
    target: { value: "owner-pin" },
  });
  await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
}

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

export function dailyBriefingFixture(
  tripId: string,
  date: string,
): TripDailyBriefing {
  return {
    tripId,
    date,
    locationKey: "destination:hong-kong",
    locationLabel: "Hong Kong",
    coordinates: null,
    weather: {
      conditionCode: "rain",
      conditionLabel: "Rain",
      temperatureMaxCelsius: 33,
      temperatureMinCelsius: 28,
      sunrise: `${date}T05:46`,
      sunset: `${date}T18:47`,
      humidityPercent: 82,
      windSpeedKph: 16,
      rainChancePercent: 64,
      meta: {
        source: "Open-Meteo",
        sourceUrl: null,
        fetchedAt: "2026-06-04T00:00:00Z",
        expiresAt: "2026-06-04T06:00:00Z",
        confidence: "high",
        unavailableReason: null,
      },
    },
    holiday: null,
    festival: null,
    facts: null,
    outfitAdvice: {
      title: "Outfit advice",
      body: "Light shirt and compact umbrella.",
      meta: {
        source: "Sagittarius",
        sourceUrl: null,
        fetchedAt: null,
        expiresAt: null,
        confidence: "medium",
        unavailableReason: null,
      },
    },
    manualOverrides: {},
    updatedAt: "2026-06-04T00:00:00Z",
    version: 1,
  };
}

export function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, reject, resolve };
}
