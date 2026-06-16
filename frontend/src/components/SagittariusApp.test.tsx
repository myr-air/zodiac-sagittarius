import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SagittariusApp,
  bookingTypeForItineraryItem,
  findDuplicateBookingDoc,
  nextClientMutationId,
  nextLocalItemId,
  nextLocalStopNoteId,
  nextLocalSuggestionId,
  nextLocalTaskId,
  normalizeInlineTimePatch,
} from "@/src/app/SagittariusApp";
import {
  TripApiError,
  type CreateExpenseApiRequest,
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { normalizeExpenseSplitsFromMinor } from "@/src/trip/expenses";
import { replaceSuggestionById } from "@/src/trip/suggestions";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import { encodeTripId } from "@/src/trip/ids";
import type {
  ItineraryItem,
  PlanVariant,
  StopNote,
  Suggestion,
  Trip,
  TripDailyBriefing,
  TripTask,
} from "@/src/trip/types";
import { appRoutes, encodeReturnTo } from "@/src/routes/app-routes";
import { optionalTrailingSlashPattern } from "@/src/trip/workspace/sagittarius-app/support/route-matchers";
import { portalRoutes } from "@/src/trip/workspace/sagittarius-app/support/route-patterns";

function render(ui: ReactElement) {
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

async function openItineraryHeaderControls(
  user: ReturnType<typeof userEvent.setup>,
) {
  const controlsButton = await screen.findByRole("button", {
    name: "Trip Plan controls",
  });
  await user.click(controlsButton);
  return controlsButton;
}

function tripWithPlans(): Trip {
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

function tripWithPlansAndPlanScopedRecords(selectedPlanId = "plan-variant-backup"): Trip {
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

describe("Sagittarius cockpit UI", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", "/");
  });

  it("generates collision-free local ids and falls back when randomUUID is unavailable", () => {
    expect(
      nextLocalTaskId([
        { id: "task-local-1" },
        { id: "task-local-2" },
      ] as TripTask[]),
    ).toBe("task-local-3");
    expect(
      nextLocalTaskId([
        { id: "task-local-1" },
        { id: "task-local-3" },
      ] as TripTask[]),
    ).toBe("task-local-4");
    expect(
      nextLocalItemId(
        [{ id: "item-local-1" }, { id: "item-local-3" }] as ItineraryItem[],
        "item-local",
      ),
    ).toBe("item-local-4");
    expect(
      nextLocalSuggestionId([
        { id: "suggestion-local-1" },
        { id: "suggestion-local-3" },
      ] as Suggestion[]),
    ).toBe("suggestion-local-4");
    expect(
      nextLocalStopNoteId([
        { id: "note-local-1" },
        { id: "note-local-2" },
      ] as StopNote[]),
    ).toBe("note-local-3");
    expect(
      nextLocalStopNoteId([
        { id: "note-local-1" },
        { id: "note-local-3" },
      ] as StopNote[]),
    ).toBe("note-local-4");
    expect(
      replaceSuggestionById(
        [
          { id: "suggestion-a", status: "pending" },
          { id: "suggestion-b", status: "pending" },
        ] as Suggestion[],
        "suggestion-b",
        { id: "suggestion-b", status: "approved" } as Suggestion,
      ),
    ).toEqual([
      { id: "suggestion-a", status: "pending" },
      { id: "suggestion-b", status: "approved" },
    ]);

    vi.stubGlobal("crypto", {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T00:00:00.000Z"));
    expect(nextClientMutationId("task")).toBe(
      `task-${Date.now().toString(36)}`,
    );
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("normalizes inline time-window edits into matching duration patches", () => {
    const item = {
      ...seedTrip.itineraryItems[0],
      startTime: "23:00",
      endTime: "01:00",
      endOffsetDays: 1,
      durationMinutes: 120,
    };

    expect(normalizeInlineTimePatch(item, { endTime: "02:30" })).toMatchObject({
      endTime: "02:30",
      durationMinutes: 210,
    });
    expect(
      normalizeInlineTimePatch(item, {
        endTime: "02:00",
        endOffsetDays: 0,
      }),
    ).toMatchObject({
      endTime: "02:00",
      endOffsetDays: 1,
      durationMinutes: 180,
    });
    expect(normalizeInlineTimePatch(item, { startTime: "00:30" })).toMatchObject(
      {
        startTime: "00:30",
        endOffsetDays: 0,
        durationMinutes: 30,
      },
    );
    expect(normalizeInlineTimePatch(item, { endTime: "23:30" })).toMatchObject({
      endTime: "23:30",
      endOffsetDays: 0,
      durationMinutes: 30,
    });
    expect(
      normalizeInlineTimePatch(item, {
        endTime: null,
        endOffsetDays: 1,
      }),
    ).toMatchObject({
      endTime: null,
      endOffsetDays: 0,
      durationMinutes: null,
    });
  });

  it("classifies Thai itinerary rows into booking draft types", () => {
    const baseItem = seedTrip.itineraryItems[0];

    expect(
      bookingTypeForItineraryItem({
        ...baseItem,
        activity: "บินไปฮ่องกง",
        activityType: "travel",
        transportation: "เครื่องบิน",
      }),
    ).toBe("flight");
    expect(
      bookingTypeForItineraryItem({
        ...baseItem,
        activity: "นั่งรถไฟเข้าเมือง",
        activityType: "travel",
        transportation: "รถไฟ",
      }),
    ).toBe("train");
    expect(
      bookingTypeForItineraryItem({
        ...baseItem,
        activity: "เช็คอินโรงแรม",
        activityType: "experience",
        itemKind: "activity",
        transportation: "",
      }),
    ).toBe("hotel");
    expect(
      bookingTypeForItineraryItem({
        ...baseItem,
        activity: "รถรับส่งจากโรงแรมไปสนามบิน",
        activityType: "travel",
        transportation: "รถรับส่ง",
      }),
    ).toBe("public_transport");
  });

  it("can require trip participant authentication before opening the cockpit", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp requireJoin />);

    expect(
      screen.getByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), {
      target: { value: "traveler-pin" },
    });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    expect(
      await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("region", { name: /Trip overview/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }),
    ).toHaveLength(0);
  }, 45_000);

  it("keeps account routes isolated from restored local participant sessions", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[1].id,
        sessionToken: "local-restored-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );

    render(<SagittariusApp accessMode="account-login" requireJoin />);

    expect(
      await screen.findByRole("main", { name: /Account sign in/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Travel ideas. Perfectly planned./i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the Bookings & Docs workspace and creates a local booking record", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="bookings" />);

    expect(
      screen.getByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Select Bangkok to Hong Kong flight|เลือก Bangkok to Hong Kong flight/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Add booking|เพิ่มการจอง/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /Add booking|เพิ่มการจอง/i });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^(Title|ชื่อ)$/i }), {
      target: { value: "Airport Express pass" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Type|ประเภท)$/i }), {
      target: { value: "public_transport" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Status|สถานะ)$/i }), {
      target: { value: "booked" },
    });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^(External link|ลิงก์ภายนอก)$/i }), {
      target: { value: "https://drive.google.com/airport-express" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: /Save booking|บันทึกการจอง/i }),
    );

    expect(
      await screen.findByRole("button", {
        name: /Select Airport Express pass|เลือก Airport Express pass/i,
      }),
    ).toBeInTheDocument();
  });

  it("opens the Photos workspace and creates a local album link", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="photos" />);

    expect(
      screen.getByRole("region", { name: /Photos & Albums|รูปภาพและอัลบั้ม/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Add album|เพิ่มอัลบั้ม/i }));
    const dialog = screen.getByRole("dialog", { name: /Add album|เพิ่มอัลบั้ม/i });
    fireEvent.change(within(dialog).getByLabelText(/Title|ชื่อ/i), {
      target: { value: "Trip group album" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Provider|ผู้ให้บริการ/i), {
      target: { value: "google_photos" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Album link|ลิงก์อัลบั้ม/i), {
      target: { value: "https://photos.app.goo.gl/trip-group" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: /Save album|บันทึกอัลบั้ม/i }),
    );

    expect(
      await screen.findByRole("button", {
        name: /Select Trip group album|เลือก Trip group album/i,
      }),
    ).toBeInTheDocument();
  });

  it("creates photo albums through the API client in API mode", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "api-photos-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiAlbum = {
      ...(seedTrip.photoAlbumLinks ?? [])[0],
      id: "018f4e89-1111-7000-8000-000000009999",
      title: "Trip group album",
      provider: "google_photos" as const,
      url: "https://photos.app.goo.gl/trip-group",
      access: "collaborative" as const,
      updatedAt: "2026-05-29T00:00:00.000Z",
      version: 1,
    };
    const apiClient = createApiClientForTrip(seedTrip, {
      createPhotoAlbum: vi.fn().mockResolvedValue(apiAlbum),
    });

    render(
      <SagittariusApp
        accessMode="trip-access"
        initialView="photos"
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        apiClient={apiClient}
      />,
    );

    expect(
      await screen.findByRole("region", { name: /Photos & Albums|รูปภาพและอัลบั้ม/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Add album|เพิ่มอัลบั้ม/i }));
    const dialog = screen.getByRole("dialog", { name: /Add album|เพิ่มอัลบั้ม/i });
    fireEvent.change(within(dialog).getByLabelText(/Title|ชื่อ/i), {
      target: { value: "Trip group album" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Provider|ผู้ให้บริการ/i), {
      target: { value: "google_photos" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Album link|ลิงก์อัลบั้ม/i), {
      target: { value: "https://photos.app.goo.gl/trip-group" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: /Save album|บันทึกอัลบั้ม/i }),
    );

    await waitFor(() =>
      expect(apiClient.createPhotoAlbum).toHaveBeenCalledWith(
        seedTrip.id,
        "api-photos-session",
        expect.objectContaining({
          clientMutationId: expect.stringMatching(/^photo-album-create-/),
          title: "Trip group album",
          provider: "google_photos",
          url: "https://photos.app.goo.gl/trip-group",
          access: "collaborative",
        }),
      ),
    );
    expect(
      await screen.findByRole("button", {
        name: /Select Trip group album|เลือก Trip group album/i,
      }),
    ).toBeInTheDocument();
  });

  it("creates booking docs through the API client in API mode", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "api-bookings-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiBooking = {
      ...(seedTrip.bookingDocs ?? [])[0],
      id: "018f4e87-1111-7000-8000-000000009999",
      title: "Airport Express pass",
      type: "public_transport" as const,
      status: "booked" as const,
      externalLinks: [
        {
          id: "018f4e88-1111-7000-8000-000000009999",
          label: "External link",
          url: "https://drive.google.com/airport-express",
          provider: "Google Drive",
          accessNote: null,
        },
      ],
      updatedAt: "2026-05-29T00:00:00.000Z",
      version: 1,
    };
    const apiClient = createApiClientForTrip(seedTrip, {
      createBookingDoc: vi.fn().mockResolvedValue(apiBooking),
    });

    render(
      <SagittariusApp
        accessMode="trip-access"
        initialView="bookings"
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        apiClient={apiClient}
      />,
    );

    expect(
      await screen.findByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Select Bangkok to Hong Kong flight|เลือก Bangkok to Hong Kong flight/i,
      }),
    ).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /Add booking|เพิ่มการจอง/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /Add booking|เพิ่มการจอง/i });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^(Title|ชื่อ)$/i }), {
      target: { value: "Airport Express pass" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Type|ประเภท)$/i }), {
      target: { value: "public_transport" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Status|สถานะ)$/i }), {
      target: { value: "booked" },
    });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^(External link|ลิงก์ภายนอก)$/i }), {
      target: { value: "https://drive.google.com/airport-express" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: /Save booking|บันทึกการจอง/i }),
    );

    await waitFor(() =>
      expect(apiClient.createBookingDoc).toHaveBeenCalledWith(
        seedTrip.id,
        "api-bookings-session",
        expect.objectContaining({
          clientMutationId: expect.stringMatching(/^booking-doc-create-/),
          title: "Airport Express pass",
          type: "public_transport",
          status: "booked",
          externalLinks: [
            expect.objectContaining({
              label: expect.stringMatching(/External link|ลิงก์ภายนอก/),
              url: "https://drive.google.com/airport-express",
              provider: null,
            }),
          ],
        }),
      ),
    );
    expect(
      await screen.findByRole("button", {
        name: /Select Airport Express pass|เลือก Airport Express pass/i,
      }),
    ).toBeInTheDocument();
  });

  it("does not retry booking doc creates with a new mutation id after create conflicts", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "api-bookings-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip, {
      createBookingDoc: vi
        .fn()
        .mockRejectedValue(
          new TripApiError({
            code: "version_conflict",
            message: "duplicate mutation",
            status: 409,
          }),
        ),
      loadTrip: vi.fn().mockResolvedValue({
        trip: seedTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      }),
    });

    render(
      <SagittariusApp
        accessMode="trip-access"
        initialView="bookings"
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        apiClient={apiClient}
      />,
    );

    expect(
      await screen.findByRole("region", { name: /Bookings & Docs|การจองและเอกสาร/i }),
    ).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /Add booking|เพิ่มการจอง/i })[0]);
    const dialog = screen.getByRole("dialog", { name: /Add booking|เพิ่มการจอง/i });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /^(Title|ชื่อ)$/i }), {
      target: { value: "Airport Express pass" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Type|ประเภท)$/i }), {
      target: { value: "public_transport" },
    });
    fireEvent.change(within(dialog).getByRole("combobox", { name: /^(Status|สถานะ)$/i }), {
      target: { value: "booked" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: /Save booking|บันทึกการจอง/i }),
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "api-bookings-session",
      ),
    );
    expect(apiClient.createBookingDoc).toHaveBeenCalledTimes(1);
  });

  it("uses the API join route for canonical API trip access and replaces join history", async () => {
    const user = userEvent.setup();
    const replaceStateMock = vi
      .spyOn(window.history, "replaceState")
      .mockImplementation(() => undefined);
    const originalLocation = window.location;
    const safeReturnTo = `/trips/${encodeTripId(seedTrip.id)}/itinerary`;
    const locationMock = {
      ...originalLocation,
      pathname: "/join",
      search: `?rt=${encodeURIComponent(encodeReturnTo(safeReturnTo))}`,
      replace: vi.fn(),
    };
    const locationSpy = vi
      .spyOn(window, "location", "get")
      .mockReturnValue(locationMock);
    const apiClient = createApiClientForTrip(seedTrip);
    render(
      <SagittariusApp
        accessMode="trip-access"
        requireJoin
        dataSource="api"
        apiClient={apiClient}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), {
      target: { value: "traveler-pin" },
    });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    expect(apiClient.joinTrip).toHaveBeenCalledWith({
      joinId: "HK-SZ-2025",
      password: "seed-trip-pass",
    });
    expect(apiClient.loadTrip).toHaveBeenCalledWith(
      seedTrip.id,
      "session-token",
    );
    expect(replaceStateMock).toHaveBeenCalledWith(null, "", safeReturnTo);
    expect(
      screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).toBeInTheDocument();

    locationSpy.mockRestore();
    replaceStateMock.mockRestore();
  }, 45_000);

  it.each([
    ["overview", appRoutes.tripOverview(seedTrip.id)],
    ["itinerary", appRoutes.tripItinerary(seedTrip.id)],
    ["map", appRoutes.tripMap(seedTrip.id)],
    ["timeline", appRoutes.tripTimeline(seedTrip.id)],
    ["members", appRoutes.tripMembers(seedTrip.id)],
    ["settings", appRoutes.tripSettings(seedTrip.id)],
  ] as const)(
    "redirects unauthenticated trip %s routes to /join with encoded returnTo",
    async (_view, tripPath) => {
      const originalLocation = window.location;
      const locationMock = {
        ...originalLocation,
        pathname: tripPath,
        search: "",
        replace: vi.fn(),
      };
      const locationSpy = vi
        .spyOn(window, "location", "get")
        .mockReturnValue(locationMock);

      render(
        <SagittariusApp
          accessMode="trip-access"
          requireJoin
          dataSource="api"
          routeTripId={seedTrip.id}
        />,
      );

      await waitFor(() =>
        expect(locationMock.replace).toHaveBeenCalledWith(
          appRoutes.join(undefined, tripPath),
        ),
      );
      expect(
        screen.queryByRole("heading", { name: /เข้าห้อง trip/i }),
      ).not.toBeInTheDocument();

      locationSpy.mockRestore();
    },
  );

  it("lets a guest participant leave their local session and choose another identity", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), {
      target: { value: "traveler-pin" },
    });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    await user.click(screen.getByRole("button", { name: /เปลี่ยนตัวตน/i }));
    await user.click(
      within(screen.getByRole("dialog", { name: /เปลี่ยนตัวตน/i })).getByRole(
        "button",
        { name: /เปลี่ยนตัวตน/i },
      ),
    );

    expect(confirm).not.toHaveBeenCalled();
    expect(
      screen.getByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /เข้าห้อง trip/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).not.toBeInTheDocument();
  }, 45_000);

  it("persists guest participant claims across a fresh app mount", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const { unmount } = render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), {
      target: { value: "traveler-pin" },
    });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
    await user.click(screen.getByRole("button", { name: /เปลี่ยนตัวตน/i }));
    await user.click(
      within(screen.getByRole("dialog", { name: /เปลี่ยนตัวตน/i })).getByRole(
        "button",
        { name: /เปลี่ยนตัวตน/i },
      ),
    );

    unmount();
    render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));

    expect(
      screen.getByLabelText(/รหัสของ Explorer Friend/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i),
    ).not.toBeInTheDocument();
  });

  it("does not restore temporary or expired account sessions from local storage", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "user-temp",
        sessionToken: "temporary-account-token",
        kind: "temporary",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2099-06-28T00:00:00.000Z",
      }),
    );

    const { unmount } = render(<SagittariusApp requireJoin />);

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitFor(() =>
      expect(storage.getItem("sagittarius-account-session")).toBeNull(),
    );

    unmount();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "user-expired",
        sessionToken: "expired-account-token",
        kind: "trusted",
        createdAt: "2020-05-29T00:00:00.000Z",
        expiresAt: "2020-06-28T00:00:00.000Z",
      }),
    );

    render(<SagittariusApp requireJoin />);

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitFor(() =>
      expect(storage.getItem("sagittarius-account-session")).toBeNull(),
    );
  });

  it("hydrates a trusted account session on startup and renders account mode", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "playwright-account-session",
        kind: "trusted",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    );

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const request = input instanceof Request ? input.url : String(input);

        if (
          request.includes("/api/v1/account") &&
          !request.includes("/api/v1/account/trips") &&
          !request.includes("/api/v1/account/trip-stats")
        ) {
          return new Response(
            JSON.stringify({
              profile: {
                id: "11111111-1111-1111-1111-111111111111",
                displayName: "Aom",
                avatarColor: "#0f766e",
                locale: "en-US",
                timezone: "UTC",
                primaryEmail: "aom@example.com",
              },
              passkeys: [],
              trustedDevices: [],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (request.includes("/api/v1/account/trips")) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        if (request.includes("/api/v1/account/trip-stats")) {
          return new Response(
            JSON.stringify({
              tripsTotal: 0,
              tripsOwned: 0,
              activeTrips: 0,
              tempClaimsCompleted: 0,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (request.includes("/api/v1/account/explorer")) {
          return new Response(
            JSON.stringify({
              upcomingTrips: 0,
              ownedTrips: 0,
              destinationCount: 0,
              nextTrip: null,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (
          request.includes("/api/v1/account/to-dos") ||
          request.includes("/api/v1/account/vault")
        ) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({}), {
          status: 404,
          headers: { "content-type": "application/json" },
          statusText: "not found",
        });
      });

    try {
      render(<SagittariusApp requireJoin dataSource="api" />);

      expect(
        await screen.findByText("User data stats และ session status"),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Dashboard|แดชบอร์ด/).length).toBeGreaterThan(
        0,
      );
      expect(screen.getByRole("tab", { name: /^Account$/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute(
        "aria-selected",
        "false",
      );
      expect(
        screen.getByRole("link", { name: /^Settings$|^ตั้งค่า$/i }),
      ).toHaveAttribute(
        "href",
        expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.settings)),
      );
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /ส่งรหัส sign-in/i }),
      ).not.toBeInTheDocument();
      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(6));
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
  });

  it("keeps account portal routes in the portal even when a trip session is persisted", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "playwright-account-session",
        kind: "trusted",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    );
    storage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const request = input instanceof Request ? input.url : String(input);

        if (
          request.includes("/api/v1/account") &&
          !request.includes("/api/v1/account/trips") &&
          !request.includes("/api/v1/account/trip-stats")
        ) {
          return new Response(
            JSON.stringify({
              profile: {
                id: "11111111-1111-1111-1111-111111111111",
                displayName: "Aom",
                avatarColor: "#0f766e",
                locale: "en-US",
                timezone: "UTC",
                primaryEmail: "aom@example.com",
              },
              passkeys: [],
              trustedDevices: [],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (request.includes("/api/v1/account/trips")) {
          return new Response(
            JSON.stringify([
              {
                id: seedTrip.id,
                name: "Portal Trip",
                destinationLabel: "Hong Kong",
                countries: ["Hong Kong"],
                startDate: "2026-06-18",
                endDate: "2026-06-23",
                role: "owner",
                memberId: seedTrip.members[0].id,
                ownerMemberId: seedTrip.members[0].id,
                joinedAt: "2026-05-30T08:00:00.000Z",
                isOwner: true,
              },
            ]),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (request.includes("/api/v1/account/trip-stats")) {
          return new Response(
            JSON.stringify({
              tripsTotal: 1,
              tripsOwned: 1,
              activeTrips: 1,
              tempClaimsCompleted: 0,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (request.includes("/api/v1/account/explorer")) {
          return new Response(
            JSON.stringify({
              upcomingTrips: 1,
              ownedTrips: 1,
              destinationCount: 1,
              nextTrip: null,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (
          request.includes("/api/v1/account/to-dos") ||
          request.includes("/api/v1/account/vault")
        ) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(JSON.stringify({}), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      });

    try {
      render(
        <SagittariusApp
          accessMode="account-portal"
          portalSection="trips"
          requireJoin
          dataSource="api"
          apiClient={createApiClientForTrip(seedTrip)}
        />,
      );

      expect(await screen.findByText("Portal Trip")).toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: /Portal navigation/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Command center")).not.toBeInTheDocument();
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
  });

  it("opens an account-linked trip route without asking for trip credentials", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "playwright-account-session",
        kind: "trusted",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const request = input instanceof Request ? input.url : String(input);

        if (
          request.includes(
            `/api/v1/account/trips/${seedTrip.id}/member-sessions`,
          )
        ) {
          return new Response(
            JSON.stringify({
              tripId: seedTrip.id,
              memberId: seedTrip.members[0].id,
              sessionToken: "account-member-session",
              createdAt: "2026-05-30T08:00:00.000Z",
              expiresAt: "2026-06-29T08:00:00.000Z",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      });

    try {
      render(
        <SagittariusApp
          accessMode="trip-access"
          requireJoin
          dataSource="api"
          routeTripId={seedTrip.id}
          apiClient={apiClient}
        />,
      );

      expect(
        screen.getByRole("main", { name: /Opening trip/i }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      await waitFor(() =>
        expect(apiClient.loadTrip).toHaveBeenCalledWith(
          seedTrip.id,
          "account-member-session",
        ),
      );
      expect(
        await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      expect(
        window.localStorage.getItem(tripParticipantSessionStorageKey),
      ).toBeNull();
      expect(
        window.sessionStorage.getItem(tripParticipantSessionStorageKey),
      ).toContain("account-member-session");
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/v1/account/trips/${seedTrip.id}/member-sessions`,
        ),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer playwright-account-session",
          }),
        }),
      );
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
  });

  it("keeps account state when account trip access check fails transiently", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "transient-account-session",
        kind: "trusted",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const request = input instanceof Request ? input.url : String(input);
        if (
          request.includes(
            `/api/v1/account/trips/${seedTrip.id}/member-sessions`,
          )
        ) {
          throw new Error("network down");
        }
        return new Response(JSON.stringify({}), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      });
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: appRoutes.tripOverview(seedTrip.id),
      search: "",
      replace: vi.fn(),
    };
    const locationSpy = vi
      .spyOn(window, "location", "get")
      .mockReturnValue(locationMock);

    try {
      render(
        <SagittariusApp
          accessMode="trip-access"
          requireJoin
          dataSource="api"
          routeTripId={seedTrip.id}
          apiClient={apiClient}
        />,
      );

      await waitFor(() =>
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            `/api/v1/account/trips/${seedTrip.id}/member-sessions`,
          ),
          expect.anything(),
        ),
      );
      expect(storage.getItem("sagittarius-account-session")).toBeNull();
      expect(
        window.sessionStorage.getItem("sagittarius-account-session"),
      ).toContain("transient-account-session");
      expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
      expect(locationMock.replace).not.toHaveBeenCalledWith(
        expect.stringContaining("/join"),
      );
    } finally {
      locationSpy.mockRestore();
      fetchSpy.mockRestore();
      storage.clear();
    }
  });

  it("switches trip workspace navigation without reloading the backend cockpit", async () => {
    const user = userEvent.setup();
    const shortTripId = encodeTripId(seedTrip.id);
    installLocalStorageStub();
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    window.history.pushState(null, "", `/trips/${shortTripId}`);
    const apiClient = createApiClientForTrip(seedTrip);

    render(
      <SagittariusApp
        accessMode="trip-access"
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        apiClient={apiClient}
      />,
    );

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("link", { name: /แผนการเดินทาง/i }));

    expect(window.location.pathname).toBe(`/trips/${shortTripId}/itinerary`);
    expect(
      screen.getByRole("link", { name: /แผนการเดินทาง/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(apiClient.loadTrip).toHaveBeenCalledTimes(1);
  });

  it("re-syncs workspace active link from popstate without extra loadTrip", async () => {
    installLocalStorageStub();
    const shortTripId = encodeTripId(seedTrip.id);
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    window.history.pushState(null, "", `/trips/${shortTripId}`);
    const apiClient = createApiClientForTrip(seedTrip);

    render(
      <SagittariusApp
        accessMode="trip-access"
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        apiClient={apiClient}
      />,
    );

    await waitFor(() => expect(apiClient.loadTrip).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute(
      "aria-current",
      "page",
    );

    act(() => {
      window.history.pushState(null, "", `/trips/${shortTripId}/itinerary`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /แผนการเดินทาง/i }),
      ).toHaveAttribute("aria-current", "page"),
    );
    expect(screen.getByRole("link", { name: /ภาพรวม/i })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(apiClient.loadTrip).toHaveBeenCalledTimes(1);
  });

  it("opens an empty trip timeline without a selected itinerary item", async () => {
    installLocalStorageStub();
    const emptyTrip = {
      ...seedTrip,
      id: "019e83ac-ed69-7df3-9354-b27359800374",
      itineraryItems: [],
      members: [
        {
          ...seedTrip.members[0],
          tripId: "019e83ac-ed69-7df3-9354-b27359800374",
        },
      ],
    };
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: emptyTrip.id,
        memberId: emptyTrip.members[0].id,
        sessionToken: "empty-trip-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );

    render(
      <SagittariusApp
        accessMode="trip-access"
        initialView="timeline"
        requireJoin
        dataSource="api"
        routeTripId={emptyTrip.id}
        apiClient={createApiClientForTrip(emptyTrip)}
      />,
    );

    expect(
      await screen.findByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ไทม์ไลน์/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("adds a local shared expense from the full expenses page", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="expenses" />);

    expect(
      await screen.findByRole("region", { name: /เงินทริป/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ค่าใช้จ่าย/i })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }));
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(
      within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i),
      "Late night taxi",
    );
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "100");
    await user.selectOptions(
      within(dialog).getByLabelText(/แบ่งแบบ/i),
      "exact",
    );
    await user.clear(within(dialog).getByLabelText(/ส่วนของ Demo Traveler/i));
    await user.type(
      within(dialog).getByLabelText(/ส่วนของ Demo Traveler/i),
      "40",
    );
    await user.clear(within(dialog).getByLabelText(/ส่วนของ Travel Mate/i));
    await user.type(
      within(dialog).getByLabelText(/ส่วนของ Travel Mate/i),
      "60",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }),
    );

    const expenseTable = screen.getByRole("table", { name: /รายการค่าใช้จ่าย/i });
    expect(within(expenseTable).getByText("Late night taxi")).toBeInTheDocument();
    expect(expenseTable).toHaveTextContent("HK$100.00");
    const persistedTrip = JSON.parse(localStorage.getItem(tripStorageKey)!) as Trip;
    expect(
      persistedTrip.expenses.find((expense) => expense.title === "Late night taxi"),
    ).toMatchObject({
      tripPlanId: seedTrip.activePlanVariantId,
      itineraryItemId: null,
    });
  });

  it("adds unlinked local expenses to the selected Trip Plan", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(screen.getByRole("link", { name: /ค่าใช้จ่าย/i }));
    await user.click(
      await screen.findByRole("button", { name: /เพิ่มค่าใช้จ่าย/i }),
    );
    const dialog = screen.getByRole("dialog", { name: /เพิ่มค่าใช้จ่าย/i });
    await user.type(
      within(dialog).getByLabelText(/ชื่อค่าใช้จ่าย/i),
      "Rain plan taxi",
    );
    await user.clear(within(dialog).getByLabelText(/จำนวนเงิน/i));
    await user.type(within(dialog).getByLabelText(/จำนวนเงิน/i), "180");
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }),
    );

    const expenseTable = screen.getByRole("table", { name: /รายการค่าใช้จ่าย/i });
    await waitFor(() => {
      expect(within(expenseTable).getByText("Rain plan taxi")).toBeInTheDocument();
    });
    const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
    expect(
      persistedTrip.expenses.find((expense) => expense.title === "Rain plan taxi"),
    ).toMatchObject({
      tripPlanId: "plan-variant-backup",
      itineraryItemId: null,
    });
    expect(persistedTrip.mainTripPlanId).toBe(draftTrip.mainTripPlanId);
    expect(persistedTrip.activePlanVariantId).toBe(draftTrip.activePlanVariantId);
  });

  it("moves an unlinked local actual expense to the organizer-selected Trip Plan", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="expenses" />);

    await screen.findByRole("region", { name: /เงินทริป/i });
    await user.click(screen.getByRole("button", { name: /แก้ไข Dim Dim Sum brunch/i }));
    const dialog = screen.getByRole("dialog", { name: /แก้ไขค่าใช้จ่าย/i });
    await user.selectOptions(within(dialog).getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกค่าใช้จ่าย/i }),
    );

    await waitFor(() => {
      const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
      expect(
        persistedTrip.expenses.find((expense) => expense.id === "expense-dimsum"),
      ).toMatchObject({
        tripPlanId: "plan-variant-backup",
        itineraryItemId: null,
      });
      expect(persistedTrip.mainTripPlanId).toBe(draftTrip.mainTripPlanId);
      expect(persistedTrip.activePlanVariantId).toBe(draftTrip.activePlanVariantId);
    });
  });

  it("duplicates a local actual expense as a booking estimate without creating real money", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify({
      ...draftTrip,
      bookingDocs: [],
    }));

    render(<SagittariusApp initialView="expenses" />);

    await screen.findByRole("region", { name: /เงินทริป/i });
    await user.click(
      screen.getByRole("button", {
        name: /ทำ Dim Dim Sum brunch เป็น estimate/i,
      }),
    );

    await waitFor(() => {
      const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
      expect(persistedTrip.expenses).toHaveLength(draftTrip.expenses.length);
      expect(persistedTrip.bookingDocs).toEqual([
        expect.objectContaining({
          type: "other",
          title: "Estimate: Dim Dim Sum brunch",
          status: "draft",
          priceAmount: 512,
          currency: "HKD",
          tripPlanId: draftTrip.activePlanVariantId,
          relatedExpenseIds: [],
          notes: expect.stringContaining(
            "This does not create or move real money.",
          ),
        }),
      ]);
    });
  });

  it("records a local actual expense refund as a settlement without removing the source", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="expenses" />);

    await screen.findByRole("region", { name: /เงินทริป/i });
    await user.click(
      screen.getByRole("button", {
        name: /บันทึก refund ของ Dim Dim Sum brunch/i,
      }),
    );

    await waitFor(() => {
      const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
      expect(
        persistedTrip.expenses.find((expense) => expense.id === "expense-dimsum"),
      ).toBeTruthy();
      expect(persistedTrip.expenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Refund: Dim Dim Sum brunch",
            amount: 384,
            category: "settlement",
            paidBy: "member-aom",
            tripPlanId: draftTrip.activePlanVariantId,
            splits: {
              "member-beam": 128,
              "member-nam": 128,
              "member-family": 128,
            },
          }),
        ]),
      );
    });
  });

  it("creates overview tasks through the API client after backend login", async () => {
    const user = userEvent.setup();
    const ownerTrip = {
      ...seedTrip,
      joinPasswordHash: "",
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const cockpit: TripCockpit = {
      trip: ownerTrip,
      suggestions: [],
      tasks: [],
      stopNotes: [],
      expenseSummary: null,
    };
    const apiClient: TripApiClient = {
      joinTrip: vi.fn().mockResolvedValue({
        trip: {
          id: ownerTrip.id,
          name: ownerTrip.name,
          destinationLabel: ownerTrip.destinationLabel,
          startDate: ownerTrip.startDate,
          endDate: ownerTrip.endDate,
          joinId: ownerTrip.joinId,
          activePlanVariantId: ownerTrip.activePlanVariantId,
          ownerMemberId: ownerTrip.members[0].id,
          version: 1,
        },
        claimableMembers: [
          {
            id: ownerTrip.members[0].id,
            tripId: ownerTrip.id,
            displayName: ownerTrip.members[0].displayName,
            role: "owner",
            accessStatus: "active",
            presence: "offline",
            color: ownerTrip.members[0].color,
            userId: null,
            claimedAt: null,
            lastSeenAt: null,
          },
        ],
        joinSessionToken: "join-session-token",
        expiresAt: "2026-05-29T00:20:00.000Z",
      }),
      claimMember: vi.fn().mockResolvedValue({
        tripId: ownerTrip.id,
        memberId: ownerTrip.members[0].id,
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
      createTask: vi.fn().mockResolvedValue({
        id: "task-api-created",
        title: "แลกเงิน HKD",
        status: "open",
        visibility: "shared",
        kind: "prep",
        createdBy: ownerTrip.members[0].id,
        assigneeId: ownerTrip.members[0].id,
        relatedItemId: null,
        version: 1,
      }),
      patchTask: vi.fn().mockResolvedValue({
        id: "task-api-created",
        title: "แลกเงิน HKD",
        status: "done",
        visibility: "shared",
        kind: "prep",
        createdBy: ownerTrip.members[0].id,
        assigneeId: null,
        relatedItemId: null,
        version: 2,
      }),
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

    render(
      <SagittariusApp requireJoin dataSource="api" apiClient={apiClient} />,
    );

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

    const tasks = await screen.findByRole("region", {
      name: /เช็กลิสต์ของทริป/i,
    });
    await user.click(
      within(tasks).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }),
    );
    const taskDialog = screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i });
    await user.type(
      within(taskDialog).getByLabelText(/เพิ่มเช็กลิสต์/i),
      "แลกเงิน HKD",
    );
    await user.selectOptions(
      within(taskDialog).getByLabelText(/เก็บไว้ที่/i),
      "shared",
    );
    await user.click(
      within(taskDialog).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }),
    );

    expect(apiClient.createTask).toHaveBeenCalledWith(
      ownerTrip.id,
      "session-token",
      expect.objectContaining({
        title: "แลกเงิน HKD",
        visibility: "shared",
        assigneeId: null,
      }),
    );
    expect(within(tasks).getByText(/แลกเงิน HKD/i)).toBeInTheDocument();

    await user.click(
      within(tasks).getByRole("checkbox", { name: /แลกเงิน HKD/i }),
    );

    expect(apiClient.patchTask).toHaveBeenCalledWith(
      ownerTrip.id,
      "task-api-created",
      "session-token",
      expect.objectContaining({
        expectedVersion: 1,
        patch: { status: "done" },
      }),
    );
  }, 45_000);

  it("hydrates a persisted API session from the backend", async () => {
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      name: "Persisted API Trip",
      joinPasswordHash: "",
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: apiTrip.id,
        memberId: apiTrip.members[0].id,
        sessionToken: "persisted-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(apiTrip);

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="overview"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        apiTrip.id,
        "persisted-session-token",
      ),
    );
    expect(
      await screen.findByRole("heading", { name: /Persisted API Trip/i }),
    ).toBeInTheDocument();
  });

  it("keeps a persisted trip member session when the account is not linked to the trip", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "unlinked-account-session",
        kind: "trusted",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    );
    storage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[1].id,
        sessionToken: "beam-member-session",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiTrip = {
      ...seedTrip,
      name: "Beam Temp Workspace",
      members: seedTrip.members.map((member) =>
        member.id === seedTrip.members[1].id
          ? { ...member, userId: null, claimPasswordHash: null }
          : member,
      ),
    };
    const apiClient = createApiClientForTrip(apiTrip);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const request = input instanceof Request ? input.url : String(input);
        if (
          request.includes(
            `/api/v1/account/trips/${seedTrip.id}/member-sessions`,
          )
        ) {
          return new Response(
            JSON.stringify({
              code: "forbidden",
              message: "account is not linked to this trip",
            }),
            {
              status: 403,
              headers: { "content-type": "application/json" },
            },
          );
        }
        return new Response(JSON.stringify({}), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
      });

    try {
      render(
        <SagittariusApp
          requireJoin
          dataSource="api"
          routeTripId={seedTrip.id}
          apiClient={apiClient}
        />,
      );

      await waitFor(() =>
        expect(apiClient.loadTrip).toHaveBeenCalledWith(
          seedTrip.id,
          "beam-member-session",
        ),
      );
      expect(
        await screen.findByRole("heading", { name: /Beam Temp Workspace/i }),
      ).toBeInTheDocument();
      expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
      expect(
        window.sessionStorage.getItem(tripParticipantSessionStorageKey),
      ).toContain("beam-member-session");
      expect(fetchSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(
          `/api/v1/account/trips/${seedTrip.id}/member-sessions`,
        ),
        expect.anything(),
      );
    } finally {
      fetchSpy.mockRestore();
      storage.clear();
    }
  });

  it("loads daily weather briefings into overview and saves organizer overrides", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      name: "Weather API Trip",
      joinPasswordHash: "",
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const briefing = dailyBriefingFixture(apiTrip.id, "2026-07-12");
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: apiTrip.id,
        memberId: apiTrip.members[0].id,
        sessionToken: "weather-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(apiTrip, {
      listDailyBriefings: vi.fn().mockResolvedValue([briefing]),
      patchDailyBriefing: vi.fn().mockResolvedValue({
        ...briefing,
        manualOverrides: { outfitAdvice: "Pack a compact umbrella" },
        version: 2,
      }),
    });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="overview"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.listDailyBriefings).toHaveBeenCalledWith(
        apiTrip.id,
        "weather-session-token",
      ),
    );
    expect(
      await screen.findByRole("region", { name: /พยากรณ์อากาศรายวัน/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Rain 33° 28°/ }));
    expect(
      screen.getByRole("region", { name: /รายละเอียดพยากรณ์อากาศ/i }),
    ).toBeInTheDocument();
    await user.type(
      screen.getByLabelText(/Outfit advice override|คำแนะนำการแต่งตัว/i),
      "Pack a compact umbrella",
    );
    await user.click(screen.getByRole("button", { name: /บันทึก/i }));

    expect(apiClient.patchDailyBriefing).toHaveBeenCalledWith(
      apiTrip.id,
      "2026-07-12",
      "weather-session-token",
      expect.objectContaining({
        expectedVersion: 1,
        outfitAdvice: "Pack a compact umbrella",
      }),
    );
  });

  it("shows fallback daily weather briefings in the local overview", async () => {
    render(<SagittariusApp initialView="overview" />);

    const forecast = await screen.findByRole("region", {
      name: /พยากรณ์อากาศรายวัน/i,
    });
    expect(
      within(forecast).queryByText(/ยังไม่มีข้อมูลพยากรณ์อากาศ/i),
    ).not.toBeInTheDocument();
    expect(
      within(forecast).getAllByRole("button", { name: /Forecast pending/i })
        .length,
    ).toBeGreaterThan(0);
  });

  it("patches trip countries when organizer changes the API trip destination", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: apiTrip.id,
        memberId: apiTrip.members[0].id,
        sessionToken: "settings-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const patchTrip = vi.fn().mockResolvedValue({
      ...apiTrip,
      destinationLabel: "Chiang Mai, Thailand",
      countries: ["Thailand"],
      version: 2,
    });
    const apiClient = createApiClientForTrip(apiTrip, { patchTrip });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="settings"
        apiClient={apiClient}
      />,
    );

    const destinationInput = await screen.findByLabelText("ปลายทาง");
    await user.clear(destinationInput);
    await user.type(destinationInput, "Chiang Mai, Thailand");
    await user.click(
      screen.getByRole("button", {
        name: /Save changes|บันทึกการเปลี่ยนแปลง/i,
      }),
    );

    await waitFor(() =>
      expect(patchTrip).toHaveBeenCalledWith(
        apiTrip.id,
        "settings-session-token",
        expect.objectContaining({
          destinationLabel: "Chiang Mai, Thailand",
          countries: ["Thailand"],
        }),
      ),
    );
  });

  it("redirects /join to the trip route when a persisted API session already exists", async () => {
    installLocalStorageStub();
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: "/join",
      search: "",
      replace: replaceMock,
    };
    const locationSpy = vi
      .spyOn(window, "location", "get")
      .mockReturnValue(locationMock);
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-join-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);

    render(
      <SagittariusApp
        accessMode="trip-access"
        requireJoin
        dataSource="api"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        `/trips/${encodeTripId(seedTrip.id)}`,
      ),
    );
    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "persisted-join-session-token",
      ),
    );

    locationSpy.mockRestore();
  });

  it("falls back to trip route when /join returnTo points to /trips", async () => {
    installLocalStorageStub();
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: "/join",
      search: `?rt=${encodeURIComponent(encodeReturnTo("/trips"))}`,
      replace: replaceMock,
    };
    const locationSpy = vi
      .spyOn(window, "location", "get")
      .mockReturnValue(locationMock);
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "persisted-join-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);

    render(
      <SagittariusApp
        accessMode="trip-access"
        requireJoin
        dataSource="api"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        `/trips/${encodeTripId(seedTrip.id)}`,
      ),
    );
    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "persisted-join-session-token",
      ),
    );

    locationSpy.mockRestore();
  });

  it("keeps a persisted API session when the public route uses the canonical UUID", async () => {
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
      name: "Canonical Route API Trip",
      joinPasswordHash: "",
      members: [
        {
          ...seedTrip.members[0],
          id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f22",
          tripId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
          claimPasswordHash: null,
        },
      ],
    };
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: apiTrip.id,
        memberId: apiTrip.members[0].id,
        sessionToken: "canonical-route-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(apiTrip);

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="overview"
        routeTripId={apiTrip.id}
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        apiTrip.id,
        "canonical-route-session-token",
      ),
    );
    expect(
      await screen.findByRole("heading", { name: /Canonical Route API Trip/i }),
    ).toBeInTheDocument();
  });

  it("rejects a persisted API session when a canonical UUID route belongs to another trip", async () => {
    installLocalStorageStub();
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    const locationMock = {
      ...originalLocation,
      pathname: "/trips/018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99",
      search: "",
      replace: replaceMock,
    };
    const locationSpy = vi
      .spyOn(window, "location", "get")
      .mockReturnValue(locationMock);

    const apiClient = createApiClientForTrip(seedTrip);
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
        memberId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f22",
        sessionToken: "other-trip-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="overview"
        routeTripId="018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith(
        `/join?rt=${encodeURIComponent(encodeReturnTo("/trips/018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99"))}`,
      ),
    );
    expect(apiClient.loadTrip).not.toHaveBeenCalled();
    expect(
      window.sessionStorage.getItem(tripParticipantSessionStorageKey),
    ).toBeNull();

    locationSpy.mockRestore();
  });

  it("hydrates a persisted API session before the backend trip is in local state", async () => {
    installLocalStorageStub();
    const apiTrip = {
      ...seedTrip,
      id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
      name: "Account Created API Trip",
      joinId: "ACCOUNT-CREATED",
      joinPasswordHash: "",
      members: [
        {
          ...seedTrip.members[0],
          id: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f22",
          tripId: "018fc9c4-9cf0-7384-93ee-9bdc9c8d8f11",
          displayName: "Account Owner",
          claimPasswordHash: null,
        },
      ],
    };
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: apiTrip.id,
        memberId: apiTrip.members[0].id,
        sessionToken: "account-created-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(apiTrip);

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="members"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        apiTrip.id,
        "account-created-session-token",
      ),
    );
    expect(
      await screen.findByRole("heading", { name: /Account Created API Trip/i }),
    ).toBeInTheDocument();
  });

  it("renders the same access choice before restoring a persisted account session", () => {
    installLocalStorageStub();
    window.sessionStorage.setItem(
      "sagittarius-account-session",
      JSON.stringify({
        userId: "11111111-1111-1111-1111-111111111111",
        sessionToken: "persisted-account-session",
        kind: "trusted",
        trustedDeviceId: "device-1",
        createdAt: "2026-05-30T10:00:00.000Z",
        expiresAt: "2030-01-01T10:00:00.000Z",
      }),
    );

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        apiClient={createApiClientForTrip(seedTrip)}
      />,
    );

    expect(screen.getByRole("tab", { name: /^Temp access$/i })).toHaveClass(
      "account-tab--active",
    );
    expect(
      screen.getByRole("heading", { name: /เข้าห้อง trip/i }),
    ).toBeInTheDocument();
  });

  it("ignores late API hydration when the app unmounts during a persisted session load", async () => {
    installLocalStorageStub();
    const deferred = createDeferred<TripCockpit>();
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "slow-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);
    vi.mocked(apiClient.loadTrip).mockReturnValue(deferred.promise);

    const { unmount } = render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="overview"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "slow-session-token",
      ),
    );
    unmount();
    await act(async () => {
      deferred.resolve({
        trip: { ...seedTrip, name: "Too Late Trip" },
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      });
      await deferred.promise;
    });

    expect(screen.queryByText(/Too Late Trip/i)).not.toBeInTheDocument();
  });

  it("recovers to access instead of hanging when persisted API hydration is unauthenticated", async () => {
    installLocalStorageStub();
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "expired-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);
    vi.mocked(apiClient.loadTrip).mockRejectedValue(
      new TripApiError({
        code: "unauthenticated",
        message: "session expired",
        status: 401,
      }),
    );

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="overview"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "expired-session-token",
      ),
    );
    expect(
      await screen.findByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/สิทธิ์ไม่ถูกต้อง/i);
    expect(
      window.sessionStorage.getItem(tripParticipantSessionStorageKey),
    ).toBeNull();
  });

  it("keeps a persisted API session when hydration fails transiently", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "network-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip);
    vi.mocked(apiClient.loadTrip).mockRejectedValue(new Error("network down"));

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        routeTripId={seedTrip.id}
        initialView="overview"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "network-session-token",
      ),
    );
    expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
    expect(
      window.sessionStorage.getItem(tripParticipantSessionStorageKey),
    ).toContain("network-session-token");
    expect(
      screen.queryByRole("main", { name: /Account access/i }),
    ).not.toBeInTheDocument();
  });

  it("opens directly into the trip overview instead of a marketing landing page", () => {
    const { container } = render(<SagittariusApp />);
    const workspaceGrid = container.querySelector(".workspace-grid");
    const planningMain = container.querySelector(".planning-main");

    expect(
      screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("banner", { name: /Trip command bar/i }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/ศูนย์จัดการทริป/i).length).toBeGreaterThan(0);
    expect(workspaceGrid).toBeInTheDocument();
    expect(workspaceGrid).toContainElement(planningMain as HTMLElement);
    expect(container.querySelector(".workspace-shell")).toHaveClass("max-[1199px]:min-h-[calc(100dvh-48px)]");
    expect(planningMain).toHaveClass("max-[1199px]:min-h-[calc(100dvh-48px)]", "max-[1199px]:bg-(--color-surface)");
    expect(planningMain).toContainElement(
      screen.getByRole("region", { name: /Trip overview/i }),
    );
    expect(
      screen.getByRole("region", { name: /Trip overview/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }),
    ).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: /เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /เลิกทำ/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ทำซ้ำ/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /More actions/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/hero/i)).not.toBeInTheDocument();
  });

  it("manages trip tasks from the overview checklist", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    expect(
      screen.getByRole("region", { name: /ความพร้อมของทริป/i }),
    ).toBeInTheDocument();
    const tasks = screen.getByRole("region", { name: /เช็กลิสต์ของทริป/i });
    expect(within(tasks).getByRole("button", { name: /ของฉัน/i })).toHaveClass(
      "overview-task-filter--active",
    );
    expect(within(tasks).getAllByText(/ส่วนตัว/i).length).toBeGreaterThan(0);
    expect(within(tasks).getAllByText(/แชร์ในทริป/i).length).toBeGreaterThan(0);
    expect(
      within(tasks).getByRole("checkbox", { name: /ซื้อ eSIM/i }),
    ).not.toBeChecked();

    const addTaskButton = within(tasks).getByRole("button", {
      name: /เพิ่มเช็กลิสต์/i,
    });
    expect(addTaskButton.textContent?.trim()).toBe("+");
    await user.click(addTaskButton);

    const taskDialog = screen.getByRole("dialog", { name: /เพิ่มเช็กลิสต์/i });
    await user.type(
      within(taskDialog).getByLabelText(/เพิ่มเช็กลิสต์/i),
      "แลกเงิน HKD",
    );
    await user.selectOptions(
      within(taskDialog).getByLabelText(/เก็บไว้ที่/i),
      "shared",
    );
    await user.selectOptions(
      within(taskDialog).getByLabelText(/ให้ใครดูแล/i),
      "member-nam",
    );
    await user.click(
      within(taskDialog).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }),
    );

    expect(
      screen.queryByRole("dialog", { name: /เพิ่มเช็กลิสต์/i }),
    ).not.toBeInTheDocument();

    const newTask = within(tasks).getByRole("listitem", {
      name: /แลกเงิน HKD/i,
    });
    expect(within(newTask).getByText(/Explorer Friend/i)).toBeInTheDocument();
    expect(within(newTask).getByText(/แชร์ในทริป/i)).toBeInTheDocument();

    await user.click(
      within(newTask).getByRole("checkbox", { name: /แลกเงิน HKD/i }),
    );
    expect(
      within(newTask).getByRole("checkbox", { name: /แลกเงิน HKD/i }),
    ).toBeChecked();

    await user.click(within(tasks).getByRole("button", { name: /เสร็จแล้ว/i }));

    expect(within(tasks).getByText(/แลกเงิน HKD/i)).toBeInTheDocument();
    expect(within(tasks).queryByText(/ซื้อ eSIM/i)).not.toBeInTheDocument();

    await user.click(
      within(tasks).getByRole("button", { name: /แชร์ในทริป/i }),
    );
    expect(within(tasks).getByText(/จอง Peak Tram/i)).toBeInTheDocument();

    await user.click(within(tasks).getByRole("button", { name: /ของฉัน/i }));
    await user.click(within(tasks).getByRole("button", { name: /ทุกสถานะ/i }));
    expect(within(tasks).getByText(/ซื้อ eSIM/i)).toBeInTheDocument();
    expect(within(tasks).queryByText(/จอง Peak Tram/i)).not.toBeInTheDocument();
  });

  it("keeps the left navigation simple and only links to implemented views", () => {
    render(<SagittariusApp />);

    const navigation = screen.getByRole("navigation", {
      name: /เมนูวางแผน Joii/i,
    });
    const railLinks = navigation.querySelector(".rail-links");
    expect(railLinks).not.toBeNull();
    const links = within(railLinks as HTMLElement).getAllByRole("link");

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "ภาพรวม",
      "แผนการเดินทาง",
      "แผนที่",
      "ไทม์ไลน์",
      "ตั๋วและเอกสาร",
      "รูปภาพ",
      "สมาชิก",
      "ค่าใช้จ่าย",
      "ตั้งค่า",
    ]);
    expect(
      within(navigation).getByRole("link", { name: /ภาพรวม/i }),
    ).toHaveClass("rail-link--active");
    expect(
      within(navigation).queryByRole("link", { name: /งบประมาณ/i }),
    ).not.toBeInTheDocument();
    expect(
      within(navigation).getByRole("link", { name: /ตั๋วและเอกสาร/i }),
    ).toBeInTheDocument();
    expect(
      within(navigation).getByRole("link", { name: /รูปภาพ/i }),
    ).toBeInTheDocument();
    expect(
      within(navigation).getByRole("link", { name: /^ตั้งค่า$/ }),
    ).toBeInTheDocument();
  });

  it("renders the itinerary workspace as a graph plus compact activity cells", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(
      screen.queryByRole("banner", { name: /Trip command bar/i }),
    ).not.toBeInTheDocument();
    expect(document.querySelector(".page-header")).toHaveTextContent(
      "แผนการเดินทาง",
    );
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/i })).toHaveClass(
      "rail-link--active",
    );
    expect(
      screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Path graph" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Activity" })).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", {
        name: /เวลา|แผนที่ \/ ลิงก์|ประเภท|การเดินทาง|จัดการ/i,
      }),
    ).not.toBeInTheDocument();

    const itemRows = container.querySelectorAll<HTMLTableRowElement>(
      ".item-placeholder-row[data-item-id]",
    );
    expect(itemRows.length).toBeGreaterThan(0);
    for (const row of itemRows) {
      expect(row.querySelector(".item-placeholder-cell")).toBeInTheDocument();
      expect(row.querySelector(".activity-cell")).toBeInTheDocument();
      expect(row.textContent?.trim()).not.toBe("");
      expect(
        within(row).getByRole("button", { name: /เปิดรายละเอียดของ/i }),
      ).toBeInTheDocument();
      expect(within(row).queryByRole("combobox")).not.toBeInTheDocument();
    }

    expect(
      screen.queryByRole("button", { name: /^เลือกจุด /i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /เปิดรายละเอียดของ/i }).length,
    ).toBeGreaterThan(0);
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "closed",
    );

    const graphButton = screen.getByRole("button", {
      name: /Dim Dim Sum.* on Main/i,
    });
    await user.click(graphButton);
    expect(graphButton).toHaveClass("activity-path-graph-node--selected");
    expect(
      screen.queryByRole("complementary", {
        name: /ข้อมูลประกอบการวางแผน/i,
      }),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "closed",
    );

    await user.click(
      within(itemRows[0]).getByRole("button", { name: /เปิดรายละเอียดของ/i }),
    );
    expect(
      screen.getByRole("complementary", {
        name: /ข้อมูลประกอบการวางแผน/i,
      }),
    ).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "open",
    );
  });

  it("renders only the surface that belongs to the current URL view", () => {
    const { rerender } = render(<SagittariusApp initialView="itinerary" />);

    expect(
      screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="map" />);

    const map = screen.getByRole("region", { name: /แผนที่เส้นทาง/i });
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
    expect(
      within(map).getByRole("button", { name: /ทุกวัน/i }),
    ).toBeInTheDocument();
    expect(
      within(map).getByRole("button", { name: /วันที่ 2/i }),
    ).toBeInTheDocument();
    expect(
      within(map).queryByRole("button", { name: /โหลด OpenFreeMap/i }),
    ).not.toBeInTheDocument();
    expect(
      within(map).queryByRole("button", {
        name: /Select map stop Victoria Peak/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(map).queryByRole("button", {
        name: /Select route stop Dim Dim Sum/i,
      }),
    ).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="timeline" />);

    const timeline = screen.getByRole("region", { name: /ไทม์ไลน์ทริป/i });

    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      within(timeline).getByRole("button", {
        name: /เลือกจุดในไทม์ไลน์ Dim Dim Sum/i,
      }),
    ).toBeInTheDocument();
    expect(within(timeline).getAllByText(/วันที่ 2/i).length).toBeGreaterThan(
      0,
    );
  });

  it("renders trip members as their own workspace page", () => {
    const shortTripId = encodeTripId(seedTrip.id);
    render(<SagittariusApp initialView="members" />);

    const navigation = screen.getByRole("navigation", {
      name: /เมนูวางแผน Joii/i,
    });
    const membersLink = within(navigation).getByRole("link", {
      name: /สมาชิก/i,
    });

    expect(membersLink).toHaveClass("rail-link--active");
    expect(membersLink).toHaveAttribute(
      "href",
      `/trips/${shortTripId}/members`,
    );
    expect(
      screen.getByRole("region", { name: /สมาชิกทริป/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /People and presence/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /สมาชิกในทริป/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();
  });

  it("renders members with a single page header and without itinerary-only controls", () => {
    const { container } = render(<SagittariusApp initialView="members" />);
    const workspaceGrid = container.querySelector(".workspace-grid");
    const planningMain = container.querySelector(".planning-main");

    expect(
      screen.queryByRole("banner", { name: /Trip command bar/i }),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".page-header")).toHaveTextContent(
      "Hong Kong + Shenzhen Trip",
    );
    expect(container.querySelector(".page-header")).toHaveTextContent(
      "18–23 มิ.ย. 2026",
    );
    expect(workspaceGrid).toBeInTheDocument();
    expect(workspaceGrid).toHaveAttribute("data-command-bar", "hidden");
    expect(workspaceGrid).toContainElement(planningMain as HTMLElement);
    expect(planningMain).toContainElement(
      screen.getByRole("region", { name: /สมาชิกทริป/i }),
    );
    expect(
      screen.queryByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /เลิกทำ/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ทำซ้ำ/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /More actions/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the current member as confirmed on the members page", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    const currentMemberRow = screen
      .getByText(/Demo Traveler \(คุณ\)/i)
      .closest(".person-row");
    expect(currentMemberRow).not.toBeNull();
    expect(
      within(currentMemberRow as HTMLElement).getByText(/ยืนยันแล้ว/i),
    ).toBeInTheDocument();
    expect(
      within(currentMemberRow as HTMLElement).queryByText(/รอเข้าร่วม/i),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สถานะ$/i), "pending");

    expect(
      screen.queryByText(/Demo Traveler \(คุณ\)/i),
    ).not.toBeInTheDocument();
  });

  it("starts hydration from the join gate even when a remembered participant session exists", async () => {
    installLocalStorageStub();
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: "member-aom",
        sessionToken: "local_hydration_test",
        createdAt: "2026-05-28T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );

    render(<SagittariusApp initialView="members" requireJoin />);

    expect(
      screen.getByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).toBeInTheDocument();
  });

  it("filters trip members and can reset an empty member search", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    await user.type(screen.getByLabelText(/ค้นหาสมาชิก/i), "Family");

    const membersPage = screen.getByRole("region", { name: /สมาชิกทริป/i });
    expect(
      within(membersPage).getByRole("button", {
        name: /ปิดสิทธิ์ Family Member/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(membersPage).queryByText(/Travel Mate/i),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สิทธิ์$/i), "organizer");

    expect(
      screen.getByText(/ไม่พบสมาชิกที่ตรงกับตัวกรอง/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: /ล้างตัวกรอง/i })[0],
    );

    expect(
      screen.getByRole("button", { name: /ปิดสิทธิ์ Travel Mate/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }),
    ).toBeInTheDocument();
  });

  it("copies the trip invite link from the members command center", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<SagittariusApp initialView="members" />);

    await user.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/join/HK-SZ-2025"),
    );
    expect(screen.getByText(/คัดลอกแล้ว/i)).toBeInTheDocument();
  });

  it("creates new members from the members command center", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    await user.click(
      screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }),
    );
    await user.type(screen.getByLabelText(/ชื่อสมาชิกใหม่/i), "New Cousin");
    await user.selectOptions(
      screen.getByLabelText(/สิทธิ์สมาชิกใหม่/i),
      "viewer",
    );
    await user.click(screen.getByRole("button", { name: /บันทึกสมาชิก/i }));

    const newMemberRow = screen
      .getAllByText("New Cousin")[0]
      .closest(".person-row");
    expect(newMemberRow).not.toBeNull();
    expect(
      within(newMemberRow as HTMLElement).getByText(/ดูได้/i),
    ).toBeInTheDocument();
    expect(
      within(newMemberRow as HTMLElement).getByText(/รอเข้าร่วม/i),
    ).toBeInTheDocument();
  });

  it("manages member roles, access, claim reset, and current member password from the app state", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    const prompt = vi.spyOn(window, "prompt");
    render(<SagittariusApp initialView="members" />);

    await user.selectOptions(
      screen.getByLabelText(/Role for Explorer Friend/i),
      "organizer",
    );
    expect(
      screen.getByText("Explorer Friend").closest(".person-row"),
    ).toHaveTextContent("ผู้จัดทริป");

    await user.click(
      screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }),
    );
    await user.click(screen.getByRole("button", { name: /ยืนยัน/i }));
    expect(
      screen.getByRole("button", { name: /เปิดสิทธิ์ Explorer Friend/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /เปิดสิทธิ์ Explorer Friend/i }),
    );
    await user.click(screen.getByRole("button", { name: /ยืนยัน/i }));
    expect(
      screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }),
    );
    const passwordDialog = screen.getByRole("dialog", {
      name: /เปลี่ยนรหัสผ่าน Demo Traveler/i,
    });
    await user.type(
      within(passwordDialog).getByLabelText(/รหัสผ่านใหม่/i),
      "owner-new-pin",
    );
    await user.click(
      within(passwordDialog).getByRole("button", { name: /บันทึกรหัสผ่าน/i }),
    );

    expect(prompt).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();

    prompt.mockRestore();
    confirm.mockRestore();
  });

  it("resets a claimed non-owner member loaded from a persisted draft", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    const storage = installLocalStorageStub();
    storage.setItem(
      "sagittarius:trip-draft",
      JSON.stringify({
        ...seedTrip,
        members: seedTrip.members.map((member) =>
          member.id === "member-beam"
            ? {
                ...member,
                claimPasswordHash: "local_hash_old",
                claimedAt: "2026-05-28T00:00:00.000Z",
              }
            : member,
        ),
      }),
    );

    render(<SagittariusApp initialView="members" />);

    await user.click(
      await screen.findByRole("button", {
        name: /รีเซ็ตรหัสผ่าน Travel Mate/i,
      }),
    );
    await user.click(
      within(
        screen.getByRole("dialog", { name: /รีเซ็ตตัวตน Travel Mate/i }),
      ).getByRole("button", { name: /รีเซ็ตตัวตน/i }),
    );

    expect(confirm).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /รีเซ็ตรหัสผ่าน Travel Mate/i }),
      ).not.toBeInTheDocument(),
    );

    confirm.mockRestore();
  });

  it("cleans corrupt persisted drafts and participant sessions before opening", async () => {
    const storage = installLocalStorageStub();
    storage.setItem("sagittarius:trip-draft", "{");
    storage.setItem(tripParticipantSessionStorageKey, "{");

    render(<SagittariusApp requireJoin />);

    await waitFor(() => {
      expect(storage.getItem("sagittarius:trip-draft")).toBeNull();
      expect(storage.getItem(tripParticipantSessionStorageKey)).toBeNull();
    });
    expect(
      screen.getByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
  });

  it("can start on real route paths with the right surface first", () => {
    const { rerender } = render(<SagittariusApp initialView="map" />);

    const navigation = screen.getByRole("navigation", {
      name: /เมนูวางแผน Joii/i,
    });
    expect(
      within(navigation).getByRole("link", { name: /แผนที่/i }),
    ).toHaveClass("rail-link--active");
    expect(
      document.querySelector(".planning-main")?.firstElementChild,
    ).toHaveClass("route-map-panel");
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /ไทม์ไลน์ทริป/i }),
    ).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="timeline" />);

    expect(
      within(navigation).getByRole("link", { name: /ไทม์ไลน์/i }),
    ).toHaveClass("rail-link--active");
    expect(
      document.querySelector(".planning-main")?.firstElementChild,
    ).toHaveClass("timeline-panel");
    expect(
      screen.queryByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /แผนที่เส้นทาง/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps timeline selections separate from opening details while map day filters stay local", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SagittariusApp initialView="timeline" />);

    await user.click(
      within(screen.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).getByRole(
        "button",
        { name: /เลือกจุดในไทม์ไลน์ Victoria Peak/i },
      ),
    );
    expect(
      screen.queryByRole("complementary", {
        name: /ข้อมูลประกอบการวางแผน/i,
      }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    expect(
      within(
        screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
      ).getByRole("heading", { name: /Victoria Peak/i }),
    ).toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="map" />);

    expect(
      screen.queryByRole("button", { name: /เปิดรายละเอียด/i }),
    ).not.toBeInTheDocument();
    await user.click(
      within(screen.getByRole("region", { name: /แผนที่เส้นทาง/i })).getByRole(
        "button",
        { name: /วันที่ 2/i },
      ),
    );
    expect(
      screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/6\/16 มีพิกัด/i)).toBeInTheDocument();
  });

  it("keeps the map on the main Trip Plan when a backup plan is selected elsewhere", () => {
    window.history.replaceState(null, "", "/trips/trip-seed/map?tripPlanId=plan-variant-backup");
    const trip = {
      ...tripWithPlans(),
      itineraryItems: tripWithPlans().itineraryItems.map((item) =>
        item.planVariantId === "plan-variant-backup"
          ? { ...item, coordinates: undefined }
          : item,
      ),
    };

    render(<SagittariusApp initialView="map" initialTrip={trip} />);

    const map = screen.getByRole("region", { name: /แผนที่เส้นทาง/i });
    expect(within(map).queryByText("Rain plan gallery")).not.toBeInTheDocument();
    expect(screen.getByText(/1\/1 มีพิกัด/i)).toBeInTheDocument();
  });

  it("collapses the left rail and keeps labels accessible", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /ย่อเมนู/i }));

    const nav = screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i });
    expect(nav).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("button", { name: /ขยายเมนู/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await user.click(screen.getByRole("button", { name: /ขยายเมนู/i }));

    expect(nav).toHaveAttribute("data-collapsed", "false");
    expect(screen.getByRole("button", { name: /ย่อเมนู/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  }, 45_000);

  it("keeps the right context drawer closed when selecting an activity from the graph", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const mainItem = {
      ...seedTrip.itineraryItems[0],
      id: "graph-main-app",
      day: seedTrip.startDate,
      activity: "Graph app main",
      pathGroupId: "graph-app-group",
      pathRole: "main" as const,
    };
    const alternativeItem = {
      ...mainItem,
      id: "graph-alt-app",
      activity: "Graph app alternative",
      pathId: "path-2026-06-18-sub-a",
      pathName: "Plan A",
      pathRole: "alternative" as const,
    };
    storage.setItem(
      tripStorageKey,
      JSON.stringify({
        ...seedTrip,
        itineraryItems: [mainItem, alternativeItem],
      }),
    );
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    const graphButton = await screen.findByRole("button", {
      name: /Graph app alternative on Plan A/i,
    });
    await user.click(graphButton);

    expect(graphButton).toHaveClass("activity-path-graph-node--selected");
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "closed",
    );
    expect(
      screen.queryByRole("complementary", {
        name: /ข้อมูลประกอบการวางแผน/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("changes edit affordances by role capability", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    expect(screen.queryByRole("button", { name: /นำเข้า|Import/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ส่งออก|Export/i })).toBeNull();
    await openItineraryHeaderControls(user);
    expect(screen.getByRole("button", { name: "เพิ่มแผน" })).toBeEnabled();

    await user.selectOptions(
      screen.getByLabelText(/Role preview/i),
      "member-viewer",
    );

    expect(screen.queryByRole("button", { name: /นำเข้า|Import/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /ส่งออก|Export/i })).toBeNull();
    expect(screen.queryByRole("button", { name: "เพิ่มแผน" })).toBeNull();
    expect(
      screen.getByText(/ต้องมีสิทธิ์ผู้จัดทริปจึงจะแก้ไขได้/i),
    ).toBeInTheDocument();
  });

  it("creates a named local Trip Plan and selects it without copying itinerary rows", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    const selector = (await screen.findByLabelText(
      "Trip Plan",
    )) as HTMLSelectElement;
    await user.click(screen.getByRole("button", { name: "เพิ่มแผน" }));
    await user.type(screen.getByPlaceholderText("ตั้งชื่อแผน"), "Museum Day");
    await user.click(screen.getByRole("button", { name: "สร้างแผน" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveDisplayValue(
        "Museum Day - ร่าง",
      ),
    );
    expect(selector).toHaveValue(
      (screen.getByRole("option", { name: "Museum Day - ร่าง" }) as HTMLOptionElement)
        .value,
    );
    expect(
      screen.queryByRole("row", { name: /Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
    const persistedTrip = JSON.parse(
      window.localStorage.getItem(tripStorageKey)!,
    ) as Trip;
    expect(persistedTrip.activePlanVariantId).toBe(seedTrip.activePlanVariantId);
    expect(persistedTrip.mainTripPlanId).toBe(
      seedTrip.mainTripPlanId ?? seedTrip.activePlanVariantId,
    );
    expect(persistedTrip.planVariants).toEqual(persistedTrip.tripPlans);
    expect(
      persistedTrip.planVariants.find((plan) => plan.id === selector.value),
    ).toMatchObject({ kind: "draft", status: "draft" });
  });

  it("switches local Trip Plans and changes visible itinerary rows by planVariantId", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await screen.findByRole("row", { name: /Dim Dim Sum/i });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);

    expect(
      await screen.findByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
    const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
    expect(persistedTrip.activePlanVariantId).toBe(draftTrip.activePlanVariantId);
    expect(persistedTrip.mainTripPlanId).toBe(draftTrip.mainTripPlanId);
    expect(persistedTrip.planVariants).toEqual(persistedTrip.tripPlans);
    expect(
      persistedTrip.planVariants.find(
        (plan) => plan.id === "plan-variant-backup",
      ),
    ).toMatchObject({ kind: "draft", status: "draft" });
    expect(window.location.search).toContain("tripPlanId=plan-variant-backup");
  });

  it("preserves the selected Trip Plan across reload-style remounts", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    const { unmount } = render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    expect(
      await screen.findByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(
        "plan-variant-backup",
      ),
    );
    expect(
      await screen.findByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
  });

  it("sets the selected local Trip Plan as Main only from the explicit action", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithPlans();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="itinerary" />);

    await openItineraryHeaderControls(user);
    await screen.findByRole("option", { name: "Rain Plan - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" }));

    await waitFor(() => {
      const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
      expect(persistedTrip.activePlanVariantId).toBe("plan-variant-backup");
      expect(persistedTrip.mainTripPlanId).toBe("plan-variant-backup");
      expect(
        persistedTrip.planVariants.find(
          (plan) => plan.id === "plan-variant-backup",
        ),
      ).toMatchObject({ kind: "main", status: "main" });
      expect(
        persistedTrip.planVariants.find(
          (plan) => plan.id === seedTrip.activePlanVariantId,
        ),
      ).toMatchObject({ kind: "backup", status: "backup" });
    });
  });

  it("shows plan-scoped records on secondary detail pages for the selected Trip Plan", async () => {
    const storage = installLocalStorageStub();
    storage.setItem(
      tripStorageKey,
      JSON.stringify(tripWithPlansAndPlanScopedRecords()),
    );

    const { unmount } = render(<SagittariusApp initialView="expenses" />);

    expect(
      await screen.findByText("Backup gallery tickets"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Main plan dim sum receipt"),
    ).not.toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="bookings" />);

    expect(
      (await screen.findAllByText("Backup gallery ticket booking")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("1 รายการ").length).toBeGreaterThan(0);
    expect(
      screen.queryByText("Main plan brunch booking"),
    ).not.toBeInTheDocument();
  });

  it("shows selected Trip Plan tasks on overview instead of tasks from other plans", async () => {
    const trip = tripWithPlansAndPlanScopedRecords();

    render(<SagittariusApp initialTrip={trip} initialView="overview" />);

    expect(await screen.findByText("Backup gallery task")).toBeInTheDocument();
    expect(screen.queryByText("Main plan brunch task")).not.toBeInTheDocument();
  });

  it("creates a Trip Plan through the API, then selects it without publishing", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithPlans(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const createdPlan: PlanVariant = {
      id: "plan-variant-api-created",
      tripId: apiTrip.id,
      name: "API Plan",
      kind: "draft",
      status: "draft",
      description: "",
      version: 1,
    };
    const apiClient = createApiClientForTrip(apiTrip, {
      createTripPlan: vi.fn().mockResolvedValue(createdPlan),
      setMainTripPlan: vi.fn(),
    });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={apiClient}
      />,
    );
    await loginApiTrip(user);

    await openItineraryHeaderControls(user);
    await user.click(await screen.findByRole("button", { name: "เพิ่มแผน" }));
    await user.type(screen.getByPlaceholderText("ตั้งชื่อแผน"), "API Plan");
    await user.click(screen.getByRole("button", { name: "สร้างแผน" }));

    await waitFor(() =>
      expect(apiClient.createTripPlan!).toHaveBeenCalledWith(
        apiTrip.id,
        "session-token",
        expect.objectContaining({
          name: "API Plan",
          status: "draft",
          creationMode: "blank",
          description: "",
        }),
      ),
    );
    expect(apiClient.setMainTripPlan!).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(createdPlan.id),
    );
  }, 45_000);

  it("refreshes API expense summary for the selected Trip Plan without publishing", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithPlans(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const getExpenseSummary = vi.fn().mockImplementation(
      (
        _tripId: string,
        _sessionToken: string,
        tripPlanId?: string | null,
      ) =>
        Promise.resolve({
          groupSpend: tripPlanId === "plan-variant-backup" ? 88 : 42,
          netByMember: {},
          currentUserNetLabel: "settled",
          settlementSuggestions: [],
        }),
    );
    const apiClient = createApiClientForTrip(apiTrip, {
      getExpenseSummary,
      setMainTripPlan: vi.fn(),
    });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={apiClient}
      />,
    );
    await loginApiTrip(user);

    await waitFor(() =>
      expect(getExpenseSummary).toHaveBeenCalledWith(
        apiTrip.id,
        "session-token",
        apiTrip.activePlanVariantId,
      ),
    );
    await openItineraryHeaderControls(user);
    await user.selectOptions(await screen.findByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);

    await waitFor(() =>
      expect(getExpenseSummary).toHaveBeenCalledWith(
        apiTrip.id,
        "session-token",
        "plan-variant-backup",
      ),
    );
    expect(apiClient.setMainTripPlan!).not.toHaveBeenCalled();
  }, 45_000);

  it("waits for a loaded API Trip Plan before refreshing the expense summary", async () => {
    const user = userEvent.setup();
    const draftTrip = tripWithPlans();
    const backendMainPlanId = "018f4e82-3000-7c00-b111-000000000001";
    const backendBackupPlanId = "018f4e82-3000-7c00-b111-000000000002";
    const planIdMap = new Map([
      [draftTrip.activePlanVariantId, backendMainPlanId],
      ["plan-variant-backup", backendBackupPlanId],
    ]);
    const apiTrip = {
      ...draftTrip,
      activePlanVariantId: backendMainPlanId,
      mainTripPlanId: backendMainPlanId,
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
      planVariants: draftTrip.planVariants.map((plan) => ({
        ...plan,
        id: planIdMap.get(plan.id) ?? plan.id,
      })),
      tripPlans: draftTrip.tripPlans?.map((plan) => ({
        ...plan,
        id: planIdMap.get(plan.id) ?? plan.id,
      })),
      itineraryItems: draftTrip.itineraryItems.map((item) => ({
        ...item,
        planVariantId: planIdMap.get(item.planVariantId) ?? item.planVariantId,
      })),
    };
    const getExpenseSummary = vi.fn().mockResolvedValue({
      groupSpend: 42,
      netByMember: {},
      currentUserNetLabel: "settled",
      settlementSuggestions: [],
    });
    const apiClient = createApiClientForTrip(apiTrip, {
      getExpenseSummary,
    });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={apiClient}
      />,
    );
    await loginApiTrip(user);

    await waitFor(() =>
      expect(getExpenseSummary).toHaveBeenCalledWith(
        apiTrip.id,
        "session-token",
        backendMainPlanId,
      ),
    );
    expect(getExpenseSummary).not.toHaveBeenCalledWith(
      apiTrip.id,
      "session-token",
      seedTrip.activePlanVariantId,
    );
  }, 45_000);

  for (const workspace of [
    {
      view: "settings",
      regionName: /Trip settings|ตั้งค่าทริป/i,
    },
    {
      view: "photos",
      regionName: /Photos & Albums|รูปภาพและอัลบั้ม/i,
    },
    {
      view: "bookings",
      regionName: /Bookings & Docs|การจองและเอกสาร/i,
    },
  ] as const) {
    it(`does not refresh API expense summary from the ${workspace.view} workspace`, async () => {
      const user = userEvent.setup();
      const apiTrip = {
        ...tripWithPlans(),
        members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
      };
      const getExpenseSummary = vi.fn().mockResolvedValue({
        groupSpend: 0,
        netByMember: {},
        currentUserNetLabel: "settled",
        settlementSuggestions: [],
      });
      const apiClient = createApiClientForTrip(apiTrip, {
        getExpenseSummary,
      });

      render(
        <SagittariusApp
          requireJoin
          dataSource="api"
          initialView={workspace.view}
          apiClient={apiClient}
        />,
      );
      await loginApiTrip(user);

      expect(
        await screen.findByRole("region", { name: workspace.regionName }),
      ).toBeInTheDocument();
      expect(getExpenseSummary).not.toHaveBeenCalled();
    }, 45_000);
  }

  it("matches existing booking tickets before creating duplicate itinerary tickets", () => {
    const flightItem = seedTrip.itineraryItems.find(
      (item) => item.id === "item-flight-bkk-hkg",
    )!;
    const flightModeItem = {
      ...flightItem,
      details: {
        ...flightItem.details,
        mode: "flight",
      },
    };
    const duplicateTicket = {
      ...seedTrip.bookingDocs![0],
      id: "booking-flight-ticket-duplicate-guard",
      title: `${flightModeItem.activity} flight ticket`,
      startsAt: `${flightModeItem.day}T${flightModeItem.startTime}:00`,
      endsAt: null,
      relatedItineraryItemIds: [flightModeItem.id],
      version: 7,
    };

    expect(
      findDuplicateBookingDoc([duplicateTicket], {
        type: "flight",
        title: `${flightModeItem.activity} flight ticket`,
        status: "draft",
        visibility: "shared",
        ownerMemberId: seedTrip.members[0].id,
        providerName: null,
        confirmationCode: null,
        startsAt: `${flightModeItem.day}T${flightModeItem.startTime}`,
        endsAt: null,
        timezone: seedTrip.defaultTimezone,
        priceAmount: null,
        currency: null,
        travelerIds: [seedTrip.members[0].id],
        externalLinks: [],
        relatedItineraryItemIds: [flightModeItem.id],
        relatedTaskIds: [],
        relatedExpenseIds: [],
        noteIds: [],
        notes: null,
      }),
    ).toBe(duplicateTicket);
    expect(
      findDuplicateBookingDoc([duplicateTicket], {
        type: "flight",
        title: `${flightModeItem.activity} later flight ticket`,
        status: "draft",
        visibility: "shared",
        ownerMemberId: seedTrip.members[0].id,
        providerName: null,
        confirmationCode: null,
        startsAt: `${flightModeItem.day}T${flightModeItem.startTime}`,
        endsAt: null,
        timezone: seedTrip.defaultTimezone,
        priceAmount: null,
        currency: null,
        travelerIds: [seedTrip.members[0].id],
        externalLinks: [],
        relatedItineraryItemIds: [flightModeItem.id],
        relatedTaskIds: [],
        relatedExpenseIds: [],
        noteIds: [],
        notes: null,
      }),
    ).toBeNull();
  });

  it("sets the selected API Trip Plan as Main only from the explicit action", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithPlans(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const publishedTrip: Trip = {
      ...apiTrip,
      activePlanVariantId: "plan-variant-backup",
      mainTripPlanId: "plan-variant-backup",
      planVariants: [],
      tripPlans: [],
      version: (apiTrip.version ?? 0) + 1,
    };
    const apiClient = createApiClientForTrip(apiTrip, {
      setMainTripPlan: vi.fn().mockResolvedValue(publishedTrip),
    });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={apiClient}
      />,
    );
    await loginApiTrip(user);

    await openItineraryHeaderControls(user);
    await user.selectOptions(await screen.findByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    expect(apiClient.setMainTripPlan!).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" }));

    await waitFor(() =>
      expect(apiClient.setMainTripPlan!).toHaveBeenCalledWith(
        apiTrip.id,
        "plan-variant-backup",
        "session-token",
        expect.objectContaining({ clientMutationId: expect.any(String) }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(
        "plan-variant-backup",
      ),
    );
    const selector = screen.getByLabelText("Trip Plan") as HTMLSelectElement;
    const optionLabels = Array.from(selector.options).map(
      (option) => option.textContent,
    );
    expect(
      optionLabels.some(
        (label) => label?.includes("Rain Plan") && label.includes("หลัก"),
      ),
    ).toBe(true);
    expect(
      optionLabels.some(
        (label) => label?.includes("แผนหลัก") && label.includes("สำรอง"),
      ),
    ).toBe(true);
    expect(
      screen.getByRole("row", { name: /Rain plan gallery/i }),
    ).toBeInTheDocument();
  }, 45_000);

  it("reloads cockpit state when API Trip Plan publish hits a version conflict", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithPlans(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const reloadedPlan: PlanVariant = {
      id: "plan-variant-reloaded",
      tripId: apiTrip.id,
      name: "Reloaded Plan",
      kind: "draft",
      status: "draft",
      description: "",
      version: 3,
    };
    const reloadedTrip: Trip = {
      ...apiTrip,
      activePlanVariantId: reloadedPlan.id,
      mainTripPlanId: reloadedPlan.id,
      planVariants: [...apiTrip.planVariants, reloadedPlan],
      tripPlans: [...(apiTrip.tripPlans ?? apiTrip.planVariants), reloadedPlan],
      itineraryItems: [
        {
          ...apiTrip.itineraryItems[0],
          id: "item-reloaded-plan",
          planVariantId: reloadedPlan.id,
          activity: "Reloaded plan stop",
        },
      ],
      version: (apiTrip.version ?? 0) + 2,
    };
    const loadTrip = vi
      .fn()
      .mockResolvedValueOnce({
        trip: apiTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      })
      .mockResolvedValueOnce({
        trip: reloadedTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      })
      .mockResolvedValue({
        trip: reloadedTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
    });
    const apiClient = createApiClientForTrip(apiTrip, {
      loadTrip,
      setMainTripPlan: vi.fn().mockRejectedValue(
        new TripApiError({
          code: "version_conflict",
          message: "version conflict",
          status: 409,
        }),
      ),
    });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={apiClient}
      />,
    );
    await loginApiTrip(user);

    await openItineraryHeaderControls(user);
    await user.selectOptions(await screen.findByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(screen.getByRole("button", { name: "ใช้เป็นแผนหลัก" }));

    expect(apiClient.setMainTripPlan!).toHaveBeenCalledWith(
      apiTrip.id,
      "plan-variant-backup",
      "session-token",
      expect.objectContaining({ clientMutationId: expect.any(String) }),
    );
    await waitFor(() => expect(loadTrip.mock.calls.length).toBeGreaterThanOrEqual(2));
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(
        reloadedPlan.id,
      ),
    );
    expect(
      screen.getByRole("row", { name: /Reloaded plan stop/i }),
    ).toBeInTheDocument();
  }, 45_000);

});

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

function installSessionStorageStub() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    value: storage,
  });
  return storage;
}

async function loginApiTrip(user: ReturnType<typeof userEvent.setup>) {
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

function createApiClientForTrip(
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

function dailyBriefingFixture(tripId: string, date: string): TripDailyBriefing {
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });
  return { promise, reject, resolve };
}
