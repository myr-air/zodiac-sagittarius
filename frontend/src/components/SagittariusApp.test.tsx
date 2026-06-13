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
  resolveJoinPostAuthReturnTo,
  nextClientMutationId,
  nextLocalItemId,
  nextLocalStopNoteId,
  nextLocalSuggestionId,
  nextLocalTaskId,
  normalizeInlineTimePatch,
  parsePlanSuggestionEditAction,
  replaceSuggestionById,
} from "@/src/app/SagittariusApp";
import {
  TripApiError,
  type CreateBookingDocApiRequest,
  type CreateExpenseApiRequest,
  type CreateItineraryItemApiRequest,
  type CreateStopNoteApiRequest,
  type CreateTaskApiRequest,
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { normalizeExpenseSplitsFromMinor } from "@/src/trip/expenses";
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

function getFirstStopDetailsButton(): HTMLElement {
  return screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i });
}

async function openFirstStopDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.click(getFirstStopDetailsButton());
}

function tripWithSheets(): Trip {
  const mainSheet = seedTrip.planVariants.find(
    (variant) => variant.id === seedTrip.activePlanVariantId,
  )!;
  const backupSheet: PlanVariant = {
    id: "plan-variant-backup",
    tripId: seedTrip.id,
    name: "Rain Sheet",
    kind: "draft",
    description: "",
    version: 1,
  };
  const mainItem = seedTrip.itineraryItems.find(
    (item) => item.id === "item-dimdim",
  )!;
  return {
    ...seedTrip,
    activePlanVariantId: mainSheet.id,
    mainTripPlanId: mainSheet.id,
    planVariants: [
      { ...mainSheet, kind: "main", status: "main" },
      { ...backupSheet, kind: "draft", status: "draft" },
    ],
    tripPlans: [
      { ...mainSheet, kind: "main", status: "main" },
      { ...backupSheet, kind: "draft", status: "draft" },
    ],
    itineraryItems: [
      { ...mainItem, planVariantId: mainSheet.id },
      {
        ...mainItem,
        id: "item-rain-gallery",
        planVariantId: backupSheet.id,
        activity: "Rain sheet gallery",
        place: "M+ Museum",
        sortOrder: mainItem.sortOrder + 100,
      },
    ],
  };
}

function tripWithSheetsAndPlanScopedRecords(selectedPlanId = "plan-variant-backup"): Trip {
  const draftTrip = tripWithSheets();
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

function tripWithSheetsAndPlanCheckFindings(): Trip {
  const trip = tripWithSheetsAndPlanScopedRecords();
  return {
    ...trip,
    itineraryItems: trip.itineraryItems.map((item) =>
      item.id === "item-dimdim"
        ? {
            ...item,
            activity: "Main broken brunch",
            durationMinutes: null,
            timeMode: "scheduled",
          }
        : item.id === "item-rain-gallery"
          ? {
              ...item,
              activity: "Backup broken gallery",
              durationMinutes: null,
              timeMode: "scheduled",
            }
          : item,
    ),
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

  it("parses safe structured Plan Check edit actions", () => {
    expect(
      parsePlanSuggestionEditAction({
        itemId: "item-1",
        patch: {
          timeMode: "flexible",
          startTime: null,
          durationMinutes: null,
          parentItemId: null,
        },
      }),
    ).toEqual({
      itemId: "item-1",
      patch: {
        timeMode: "flexible",
        startTime: "",
        durationMinutes: null,
        parentItemId: null,
      },
    });
    expect(
      parsePlanSuggestionEditAction({
        itemId: "item-1",
        patch: { unknownField: "ignored" },
      }),
    ).toBeNull();
    expect(parsePlanSuggestionEditAction({ itemId: "item-1" })).toBeNull();
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
      screen.queryByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }),
    ).not.toBeInTheDocument();
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

  it("creates a local activity with resolved coordinates when place resolution is high confidence", async () => {
    const user = userEvent.setup();
    const placeResolver = vi.fn().mockResolvedValue({
      status: "resolved",
      candidates: [
        {
          name: "The Elements",
          address: "Austin Road West, Hong Kong",
          coordinates: { lat: 22.3049, lng: 114.1617 },
          mapLink:
            "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617",
          confidence: 0.92,
          source: "nominatim",
          evidence: ["brave: The Elements"],
        },
      ],
    });
    render(
      <SagittariusApp initialView="itinerary" placeResolver={placeResolver} />,
    );

    await user.click(
      screen.getByRole("button", { name: "เพิ่มสถานที่ / กิจกรรม วันที่ 1" }),
    );
    fireEvent.change(screen.getByLabelText("กิจกรรม"), {
      target: { value: "Dim Dim Sum" },
    });
    fireEvent.change(screen.getByLabelText("สถานที่"), {
      target: { value: "ติ่มซำ แถว Elements" },
    });
    await user.click(screen.getByRole("button", { name: "บันทึกกิจกรรม" }));

    await waitFor(() =>
      expect(placeResolver).toHaveBeenCalledWith(
        expect.objectContaining({
          activity: "Dim Dim Sum",
          placeHint: "ติ่มซำ แถว Elements",
          destinationLabel: seedTrip.destinationLabel,
        }),
      ),
    );
    expect(screen.getAllByDisplayValue("ติ่มซำ แถว Elements").length).toBeGreaterThan(0);
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

    await user.click(screen.getByRole("button", { name: /Add booking|เพิ่มการจอง/i }));
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
    await user.click(screen.getByRole("button", { name: /Add booking|เพิ่มการจอง/i }));
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
    await user.click(screen.getByRole("button", { name: /Add booking|เพิ่มการจอง/i }));
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

  it("asks the organizer to choose when place resolution is ambiguous", async () => {
    const user = userEvent.setup();
    const placeResolver = vi.fn().mockResolvedValue({
      status: "ambiguous",
      candidates: [
        {
          name: "The Elements",
          address: "Austin Road West, Hong Kong",
          coordinates: { lat: 22.3049, lng: 114.1617 },
          mapLink:
            "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617",
          confidence: 0.78,
          source: "nominatim",
          evidence: ["brave: The Elements"],
        },
      ],
    });
    render(
      <SagittariusApp initialView="itinerary" placeResolver={placeResolver} />,
    );

    await user.click(
      screen.getByRole("button", { name: "เพิ่มสถานที่ / กิจกรรม วันที่ 1" }),
    );
    fireEvent.change(screen.getByLabelText("กิจกรรม"), {
      target: { value: "Dim Dim Sum" },
    });
    fireEvent.change(screen.getByLabelText("สถานที่"), {
      target: { value: "ติ่มซำ แถว Elements" },
    });
    await user.click(screen.getByRole("button", { name: "บันทึกกิจกรรม" }));

    expect(
      await screen.findByRole("button", { name: "เลือก The Elements" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "เลือก The Elements" }),
    );
    await user.click(screen.getByRole("button", { name: "บันทึกกิจกรรม" }));

    expect(placeResolver).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "เลือกจุด Dim Dim Sum" }),
    ).toBeInTheDocument();
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
      ).toHaveAttribute("href", "/portal/settings");
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

    expect(await screen.findByText("Late night taxi")).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /รายการค่าใช้จ่าย/i }),
    ).toHaveTextContent("HK$100.00");
    const persistedTrip = JSON.parse(localStorage.getItem(tripStorageKey)!) as Trip;
    expect(
      persistedTrip.expenses.find((expense) => expense.title === "Late night taxi"),
    ).toMatchObject({
      tripPlanId: seedTrip.activePlanVariantId,
      itineraryItemId: null,
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

  it("resolveJoinPostAuthReturnTo only accepts safe trip-scoped return targets", () => {
    const tripId = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
    expect(resolveJoinPostAuthReturnTo("/trips", tripId)).toBeNull();
    expect(
      resolveJoinPostAuthReturnTo(`/trips/${tripId}/itinerary`, tripId),
    ).toBe(`/trips/${tripId}/itinerary`);
    expect(resolveJoinPostAuthReturnTo(`/trips/${tripId}?foo=1`, tripId)).toBe(
      `/trips/${tripId}?foo=1`,
    );
    expect(
      resolveJoinPostAuthReturnTo(
        `/trips/018fc9c4-9cf0-7384-93ee-9bdc9c8d8f99/members`,
        tripId,
      ),
    ).toBeNull();
    expect(resolveJoinPostAuthReturnTo("/settings", tripId)).toBe("/settings");
    expect(
      resolveJoinPostAuthReturnTo(
        "/trips/AY9OgFeIfeCkXIpVXRf8LQ/itinerary",
        tripId,
      ),
    ).toBe("/trips/AY9OgFeIfeCkXIpVXRf8LQ/itinerary");
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

  it("renders the trip cockpit without waiting for slow daily briefings", async () => {
    installLocalStorageStub();
    const deferredBriefings = createDeferred<TripDailyBriefing[]>();
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: seedTrip.members[0].id,
        sessionToken: "slow-briefings-session-token",
        createdAt: "2026-05-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );
    const apiClient = createApiClientForTrip(seedTrip, {
      listDailyBriefings: vi.fn().mockReturnValue(deferredBriefings.promise),
    });

    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={apiClient}
      />,
    );

    await waitFor(() =>
      expect(apiClient.loadTrip).toHaveBeenCalledWith(
        seedTrip.id,
        "slow-briefings-session-token",
      ),
    );
    expect(
      await screen.findByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }),
    ).toBeInTheDocument();
    expect(apiClient.listDailyBriefings).toHaveBeenCalledWith(
      seedTrip.id,
      "slow-briefings-session-token",
    );
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

  it("edits itinerary stops and resolves suggestions through the API client after backend login", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const selectedItem = seedTrip.itineraryItems.find(
      (item) => item.id === "item-dimdim",
    )!;
    const ownerTrip = {
      ...seedTrip,
      joinPasswordHash: "",
      members: seedTrip.members
        .slice(0, 2)
        .map((member) => ({ ...member, claimPasswordHash: null })),
    };
    const pendingSuggestion = {
      id: "suggestion-api-review",
      tripId: ownerTrip.id,
      proposerId: ownerTrip.members[1].id,
      type: "edit" as const,
      targetItemId: selectedItem.id,
      planVariantId: selectedItem.planVariantId,
      proposedPatch: { note: "Book ahead from API" },
      sourceVersion: selectedItem.version,
      status: "pending" as const,
      createdAt: "2026-05-29T00:00:00.000Z",
    };
    const patchedItem = {
      ...selectedItem,
      activity: "Dim Dim Sum API revised",
      updatedAt: "2026-05-29T00:00:00.000Z",
      version: selectedItem.version + 1,
    };
    const cockpit: TripCockpit = {
      trip: ownerTrip,
      suggestions: [pendingSuggestion],
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
        claimableMembers: ownerTrip.members.map((member) => ({
          id: member.id,
          tripId: ownerTrip.id,
          displayName: member.displayName,
          role: member.role,
          accessStatus: "active",
          presence: member.presence,
          color: member.color,
          userId: null,
          claimedAt: null,
          lastSeenAt: null,
        })),
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
      createTask: vi.fn(),
      patchTask: vi.fn(),
      patchItineraryItem: vi.fn().mockResolvedValue(patchedItem),
      createItineraryItem: vi.fn(),
      deleteItineraryItem: vi.fn(),
      reorderItineraryItems: vi.fn(),
      importItinerary: vi.fn(),
      createSuggestion: vi.fn(),
      approveSuggestion: vi
        .fn()
        .mockResolvedValue({ ...pendingSuggestion, status: "approved" }),
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
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={apiClient}
      />,
    );

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(
      screen.getByLabelText(/^Trip password$/i),
      "seed-trip-pass",
    );
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(
      await screen.findByRole("button", { name: /Demo Traveler/i }),
    );
    await user.type(
      screen.getByLabelText(/ตั้งรหัสสำหรับ Demo Traveler/i),
      "owner-pin",
    );
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    await openFirstStopDetails(user);
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));
    const dialog = screen.getByRole("dialog", { name: /แก้ไขรายละเอียด/i });
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(
      within(dialog).getByLabelText(/กิจกรรม/i),
      "Dim Dim Sum API revised",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกการแก้ไข/i }),
    );

    expect(apiClient.patchItineraryItem).toHaveBeenCalledWith(
      ownerTrip.id,
      selectedItem.id,
      "session-token",
      expect.objectContaining({
        expectedVersion: selectedItem.version,
        patch: expect.objectContaining({ activity: "Dim Dim Sum API revised" }),
      }),
    );
    expect(
      within(
        screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
      ).getByRole("heading", { name: /Dim Dim Sum API revised/i }),
    ).toBeInTheDocument();

    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    await user.click(within(context).getByRole("tab", { name: /ข้อเสนอ/i }));
    await user.click(
      within(context).getByRole("button", {
        name: /อนุมัติ Book ahead from API/i,
      }),
    );

    expect(apiClient.approveSuggestion).toHaveBeenCalledWith(
      ownerTrip.id,
      pendingSuggestion.id,
      "session-token",
    );
    expect(
      within(context).queryByText(/Book ahead from API/i),
    ).not.toBeInTheDocument();
  }, 45_000);

  it("edits itinerary time window inline through the API client after backend login", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const selectedItem = seedTrip.itineraryItems.find(
      (item) => item.id === "item-dimdim",
    )!;
    const ownerTrip = { ...seedTrip, joinPasswordHash: "" };
    const patchedItem = {
      ...selectedItem,
      endTime: "10:00",
      endOffsetDays: 0,
      durationMinutes: 90,
      version: selectedItem.version + 1,
    };
    const apiClient = createApiClientForTrip(ownerTrip, {
      patchItineraryItem: vi.fn().mockResolvedValue(patchedItem),
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
    const row = await screen.findByRole("row", { name: /Dim Dim Sum/i });
    const endTime = within(row).getByLabelText(/แก้ไขเวลาจบ Dim Dim Sum/i);
    fireEvent.change(endTime, { target: { value: "10:00" } });
    fireEvent.blur(endTime);

    await waitFor(() =>
      expect(apiClient.patchItineraryItem).toHaveBeenCalledWith(
        ownerTrip.id,
        selectedItem.id,
        "session-token",
        expect.objectContaining({
          expectedVersion: selectedItem.version,
          patch: expect.objectContaining({
            endTime: "10:00",
            endOffsetDays: 0,
            durationMinutes: 90,
          }),
        }),
      ),
    );
  }, 45_000);

  it("keeps API same-plan overlaps as warnings without auto resolution", async () => {
    const user = userEvent.setup();
    const day = "2026-06-18";
    const baseItem = seedTrip.itineraryItems.find((item) => item.day === day)!;
    const overlapMain = {
      ...baseItem,
      id: "item-overlap-main",
      day,
      startTime: "08:00",
      durationMinutes: 180,
      sortOrder: 100,
      activity: "API overlap main",
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: "main" as const,
      version: 4,
    };
    const overlapLater = {
      ...baseItem,
      id: "item-overlap-later",
      day,
      startTime: "08:30",
      durationMinutes: 60,
      sortOrder: 200,
      activity: "API overlap later",
      pathGroupId: undefined,
      pathId: undefined,
      pathName: undefined,
      pathRole: "main" as const,
      version: 4,
    };
    const overlapTrip = {
      ...seedTrip,
      joinPasswordHash: "",
      itineraryItems: [overlapMain, overlapLater],
    };
    const loadTrip = vi.fn().mockImplementation(() =>
      Promise.resolve({
        trip: overlapTrip,
        suggestions: [],
        tasks: [],
        stopNotes: [],
        expenseSummary: null,
      }),
    );
    const patchItineraryItem = vi.fn();
    const apiClient = createApiClientForTrip(overlapTrip, {
      loadTrip,
      patchItineraryItem,
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
      expect(screen.getByRole("row", { name: /API overlap main/i })).toHaveClass(
        "data-row--path-overlap",
      ),
    );
    expect(screen.getByRole("row", { name: /API overlap later/i })).toHaveClass(
      "data-row--path-overlap",
    );
    expect(
      screen.queryByRole("button", { name: /Auto fix overlaps for Day 1/i }),
    ).not.toBeInTheDocument();
    expect(patchItineraryItem).not.toHaveBeenCalled();
  }, 45_000);

  it("allows travelers to edit itinerary items after backend login", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const selectedItem = seedTrip.itineraryItems.find(
      (item) => item.id === "item-dimdim",
    )!;
    const traveler = {
      ...seedTrip.members.find((member) => member.id === "member-nam")!,
      claimPasswordHash: null,
    };
    const travelerTrip = {
      ...seedTrip,
      joinPasswordHash: "",
      members: [traveler],
    };
    const cockpit: TripCockpit = {
      trip: travelerTrip,
      suggestions: [],
      tasks: [],
      stopNotes: [],
      expenseSummary: null,
    };
    const apiSuggestion = {
      id: "suggestion-api-created",
      tripId: travelerTrip.id,
      proposerId: traveler.id,
      type: "edit" as const,
      targetItemId: selectedItem.id,
      planVariantId: selectedItem.planVariantId,
      proposedPatch: { activity: selectedItem.activity },
      sourceVersion: selectedItem.version,
      status: "pending" as const,
      createdAt: "2026-05-29T00:00:00.000Z",
    };
    const apiClient: TripApiClient = {
      joinTrip: vi.fn().mockResolvedValue({
        trip: {
          id: travelerTrip.id,
          name: travelerTrip.name,
          destinationLabel: travelerTrip.destinationLabel,
          startDate: travelerTrip.startDate,
          endDate: travelerTrip.endDate,
          joinId: travelerTrip.joinId,
          activePlanVariantId: travelerTrip.activePlanVariantId,
          ownerMemberId: traveler.id,
          version: 1,
        },
        claimableMembers: [
          {
            id: traveler.id,
            tripId: travelerTrip.id,
            displayName: traveler.displayName,
            role: traveler.role,
            accessStatus: "active",
            presence: traveler.presence,
            color: traveler.color,
            userId: null,
            claimedAt: null,
            lastSeenAt: null,
          },
        ],
        joinSessionToken: "join-session-token",
        expiresAt: "2026-05-29T00:20:00.000Z",
      }),
      claimMember: vi.fn().mockResolvedValue({
        tripId: travelerTrip.id,
        memberId: traveler.id,
        sessionToken: "traveler-session-token",
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
      createSuggestion: vi.fn().mockResolvedValue(apiSuggestion),
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
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={apiClient}
      />,
    );

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(
      screen.getByLabelText(/^Trip password$/i),
      "seed-trip-pass",
    );
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(
      await screen.findByRole("button", { name: /Explorer Friend/i }),
    );
    await user.type(
      screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i),
      "traveler-pin",
    );
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
    await openFirstStopDetails(user);

    expect(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i })).toBeEnabled();
    expect(apiClient.createSuggestion).not.toHaveBeenCalled();
  });

  it("deletes itinerary stops through the API client in API mode", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const selectedItem = seedTrip.itineraryItems.find(
      (item) => item.id === "item-dimdim",
    )!;
    const nextItem = seedTrip.itineraryItems.find(
      (item) => item.id !== selectedItem.id,
    )!;
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
    const apiClient = createApiClientForTrip(ownerTrip, {
      loadTrip: vi.fn().mockResolvedValue(cockpit),
      listDailyBriefings: vi.fn().mockResolvedValue([]),
      patchDailyBriefing: vi.fn(),
      deleteItineraryItem: vi
        .fn()
        .mockResolvedValue({
          ...selectedItem,
          version: selectedItem.version + 1,
        }),
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
    await user.click(
      await screen.findByRole("button", {
        name: new RegExp(`เลือกจุด ${selectedItem.activity}`, "i"),
      }),
    );
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));
    await user.click(screen.getByRole("button", { name: /ลบจุดนี้/i }));
    const dialog = screen.getByRole("dialog", {
      name: new RegExp(`ยืนยันการลบ ${selectedItem.activity}`, "i"),
    });
    await user.click(
      within(dialog).getByRole("button", { name: /ลบกิจกรรม/i }),
    );

    expect(apiClient.deleteItineraryItem).toHaveBeenCalledWith(
      ownerTrip.id,
      selectedItem.id,
      "session-token",
    );
    expect(screen.queryByText(selectedItem.activity)).not.toBeInTheDocument();
    expect(screen.getAllByText(nextItem.activity).length).toBeGreaterThan(0);
  });

  it("keeps an itinerary stop when delete confirmation is cancelled", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const selectedItem = seedTrip.itineraryItems.find(
      (item) => item.id === "item-dimdim",
    )!;
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
    const apiClient = createApiClientForTrip(ownerTrip, {
      loadTrip: vi.fn().mockResolvedValue(cockpit),
      listDailyBriefings: vi.fn().mockResolvedValue([]),
      patchDailyBriefing: vi.fn(),
      deleteItineraryItem: vi.fn(),
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
    await user.click(
      await screen.findByRole("button", {
        name: new RegExp(`เลือกจุด ${selectedItem.activity}`, "i"),
      }),
    );
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));
    await user.click(screen.getByRole("button", { name: /ลบจุดนี้/i }));
    const dialog = screen.getByRole("dialog", {
      name: new RegExp(`ยืนยันการลบ ${selectedItem.activity}`, "i"),
    });
    expect(dialog).toHaveClass(
      "delete-confirm-dialog",
      "shadow-[0_14px_34px_rgb(15_23_42_/_0.14)]",
    );
    expect(dialog.className).not.toContain("0_24px_70px");
    await user.click(within(dialog).getByRole("button", { name: /ไม่ลบ/i }));

    expect(apiClient.deleteItineraryItem).not.toHaveBeenCalled();
    expect(screen.getAllByText(selectedItem.activity).length).toBeGreaterThan(
      0,
    );
  });

  it("exposes production write surfaces in API mode when backend routes exist", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const ownerTrip = {
      ...seedTrip,
      joinPasswordHash: "",
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const itineraryClient = createApiClientForTrip(ownerTrip);
    const { unmount } = render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="itinerary"
        apiClient={itineraryClient}
      />,
    );

    await loginApiTrip(user);
    expect(
      screen.getAllByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })[0],
    ).toBeEnabled();
    await openFirstStopDetails(user);

    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    expect(
      within(context).getByLabelText(/เพิ่มโน้ตสำหรับจุดนี้/i),
    ).toBeEnabled();
    expect(
      within(context).getByRole("button", { name: /บันทึกโน้ต/i }),
    ).toBeDisabled();
    await user.type(within(context).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Taxi");
    await user.type(within(context).getByLabelText(/จำนวนเงิน/i), "120");
    expect(
      within(context).getByRole("button", { name: /เพิ่ม\/แก้ไขค่าใช้จ่าย/i }),
    ).toBeEnabled();
    await user.click(
      within(context).getByRole("button", { name: /เพิ่ม\/แก้ไขค่าใช้จ่าย/i }),
    );
    expect(
      within(context).getByRole("button", { name: /เพิ่ม\/แก้ไขค่าใช้จ่าย/i }),
    ).toBeDisabled();
    await user.type(within(context).getByLabelText(/ชื่อค่าใช้จ่าย/i), "Taxi");
    await user.type(within(context).getByLabelText(/จำนวนเงิน/i), "120");
    expect(
      within(context).getByRole("button", { name: /เพิ่ม\/แก้ไขค่าใช้จ่าย/i }),
    ).toBeEnabled();
    unmount();
    window.localStorage.clear();
    window.sessionStorage.clear();

    const membersClient = createApiClientForTrip(ownerTrip);
    render(
      <SagittariusApp
        requireJoin
        dataSource="api"
        initialView="members"
        apiClient={membersClient}
      />,
    );
    await loginApiTrip(user);

    expect(
      screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }),
    ).toBeEnabled();
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
    expect(planningMain).toContainElement(
      screen.getByRole("region", { name: /Trip overview/i }),
    );
    expect(
      screen.getByRole("region", { name: /Trip overview/i }),
    ).toBeInTheDocument();
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

  it("matches the dense planning cockpit skeleton from the reference", () => {
    render(<SagittariusApp initialView="itinerary" />);

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
      screen.queryByRole("tablist", { name: /Planning views/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: /Smart Itinerary Table/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /^เวลา$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /แผนที่ \/ ลิงก์/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: /ตั้งค่าตาราง/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Duplicate Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /More actions for Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Plan variant/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Selected day/i)).not.toBeInTheDocument();
  }, 10_000);

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

  it("keeps removed undo and redo controls out of the itinerary toolbar", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    expect(
      screen.queryByRole("button", { name: /เลิกทำ/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ทำซ้ำ/i }),
    ).not.toBeInTheDocument();
    await openFirstStopDetails(user);
    expect(
      screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
    ).toBeInTheDocument();
  });

  it("keeps read-only forced actions from mutating itinerary or suggestions", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.selectOptions(
      screen.getByLabelText(/Role preview/i),
      "member-viewer",
    );
    const addStopButton = screen.getAllByRole("button", {
      name: /เพิ่มสถานที่ \/ กิจกรรม/i,
    })[0];
    (addStopButton as HTMLButtonElement).disabled = false;
    fireEvent.click(addStopButton);
    expect(
      screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i }),
    ).not.toBeInTheDocument();

    const dataTransfer = createDataTransfer();
    dataTransfer.setData("text/plain", "missing-item");
    fireEvent.drop(
      screen
        .getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })
        .closest("tr")!,
      { dataTransfer },
    );
    expect(
      screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }),
    ).toBeInTheDocument();

    await openFirstStopDetails(user);
    const suggestButton = screen.getByRole("button", { name: /เสนอแก้ไข/i });
    (suggestButton as HTMLButtonElement).disabled = false;
    fireEvent.click(suggestButton);
    expect(
      screen.queryByText(/Viewer Guest suggested an update/i),
    ).not.toBeInTheDocument();
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

  it("uses timeline selections for details while map day filters stay local", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SagittariusApp initialView="timeline" />);

    await user.click(
      within(screen.getByRole("region", { name: /ไทม์ไลน์ทริป/i })).getByRole(
        "button",
        { name: /เลือกจุดในไทม์ไลน์ Victoria Peak/i },
      ),
    );
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

  it("toggles timeline details and closes the context rail from its own control", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SagittariusApp initialView="timeline" />);

    await user.click(screen.getByRole("button", { name: /เปิดรายละเอียด/i }));
    expect(
      screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ปิดรายละเอียด/i }));
    expect(
      screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
    ).not.toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="itinerary" />);
    await user.click(
      screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 2/i }),
    );
    await user.click(screen.getByRole("button", { name: /ยกเลิก/i }));
    expect(
      screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i }),
    ).not.toBeInTheDocument();
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

  it("starts with the right context drawer hidden so the table can expand", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(
      screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "closed",
    );
    expect(getFirstStopDetailsButton()).toBeInTheDocument();

    await openFirstStopDetails(user);

    expect(
      screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
    ).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "open",
    );
  });

  it("opens the right context drawer when selecting a row while details are hidden", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "closed",
    );

    await user.click(
      screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i }),
    );

    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "open",
    );
    expect(
      within(context).getByRole("heading", { name: /Victoria Peak/i }),
    ).toBeInTheDocument();
  });

  it("keeps trip member management out of the right context drawer", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await openFirstStopDetails(user);

    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    expect(
      within(context).queryByRole("region", { name: /People and presence/i }),
    ).not.toBeInTheDocument();
    expect(
      within(context).queryByRole("heading", { name: /สมาชิกและสถานะ/i }),
    ).not.toBeInTheDocument();
  });

  it("uses selected table row to drive the right context rail", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i }),
    );

    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    expect(
      within(context).getByRole("heading", { name: /Victoria Peak/i }),
    ).toBeInTheDocument();
    expect(
      within(context).getAllByText(/The Peak Tram/i).length,
    ).toBeGreaterThan(0);
  });

  it("opens details from the explicit itinerary row selection control", async () => {
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "closed",
    );

    fireEvent.click(
      screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i }),
    );

    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    expect(
      within(context).getByRole("heading", { name: /Victoria Peak/i }),
    ).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "open",
    );
  });

  it("opens context details for an alternative activity selected from the graph", async () => {
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
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      await screen.findByRole("button", {
        name: /Graph app alternative on Plan A/i,
      }),
    );

    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    expect(
      within(context).getByRole("heading", { name: /Graph app alternative/i }),
    ).toBeInTheDocument();
  });

  it("closes the right context drawer when clicking outside it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    await openFirstStopDetails(user);
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "open",
    );

    await user.click(
      screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i }),
    );

    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "closed",
    );
    expect(
      screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the context drawer mounted during the close animation and ignores non-element document events", async () => {
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    fireEvent.click(getFirstStopDetailsButton());
    expect(
      await screen.findByRole("complementary", {
        name: /ข้อมูลประกอบการวางแผน/i,
      }),
    ).toBeInTheDocument();

    document.dispatchEvent(new Event("click"));
    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "open",
    );

    vi.useFakeTimers();
    try {
      fireEvent.click(
        screen.getByRole("region", { name: /ตารางแผนการเดินทาง/i }),
      );
      expect(container.querySelector(".workspace-grid")).toHaveAttribute(
        "data-context-rail",
        "closed",
      );
      expect(container.querySelector(".context-rail")).toHaveAttribute(
        "data-state",
        "closed",
      );

      act(() => {
        vi.advanceTimersByTime(900);
      });
      expect(
        screen.queryByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
      ).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not close the context drawer for clicks that originate on itinerary rows", () => {
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    fireEvent.click(getFirstStopDetailsButton());
    fireEvent.click(
      screen.getByRole("row", { name: /เปิดรายละเอียดของ Victoria Peak/i }),
    );

    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "open",
    );
    expect(
      within(
        screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
      ).getByRole("heading", { name: /Dim Dim Sum/i }),
    ).toBeInTheDocument();
  });

  it("keeps the right context drawer open when clicking inside it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    await openFirstStopDetails(user);
    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });

    await user.click(context);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute(
      "data-context-rail",
      "open",
    );
    expect(
      screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
    ).toBeInTheDocument();
  });

  it("collapses and expands day groups", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /ย่อ วันที่ 2/i }));

    expect(
      screen.queryByRole("button", { name: /เลือกจุด Dim Dim Sum/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /เลือกจุด Victoria Peak/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ขยาย วันที่ 2/i }));

    expect(
      screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /เลือกจุด Victoria Peak/i }),
    ).toBeInTheDocument();
  });

  it("keeps scheduled rows sorted by time after drag and drop", () => {
    render(<SagittariusApp initialView="itinerary" />);

    const dataTransfer = createDataTransfer();
    const victoriaSelectBefore = screen.getByRole("button", {
      name: /เลือกจุด Victoria Peak/i,
    });
    const dimDimSelectBefore = screen.getByRole("button", {
      name: /เลือกจุด Dim Dim Sum/i,
    });
    expect(
      dimDimSelectBefore.compareDocumentPosition(victoriaSelectBefore) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.dragStart(
      screen.getByRole("button", { name: /ลาก Victoria Peak/i }),
      { dataTransfer },
    );
    fireEvent.dragOver(
      screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }),
      { dataTransfer },
    );
    fireEvent.drop(
      screen.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i }),
      { dataTransfer },
    );

    const victoriaSelectAfter = screen.getByRole("button", {
      name: /เลือกจุด Victoria Peak/i,
    });
    const dimDimSelectAfter = screen.getByRole("button", {
      name: /เลือกจุด Dim Dim Sum/i,
    });
    expect(
      dimDimSelectAfter.compareDocumentPosition(victoriaSelectAfter) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows a drop preview before placing a dragged itinerary row", () => {
    render(<SagittariusApp initialView="itinerary" />);

    const dataTransfer = createDataTransfer();
    const victoriaRow = screen
      .getByRole("button", { name: /เลือกจุด Victoria Peak/i })
      .closest("tr");
    const dimDimRow = screen
      .getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })
      .closest("tr");

    fireEvent.dragStart(
      screen.getByRole("button", { name: /ลาก Victoria Peak/i }),
      { dataTransfer },
    );
    fireEvent.dragOver(dimDimRow!, { dataTransfer });

    expect(victoriaRow).toHaveClass("data-row--dragging");
    expect(dimDimRow).toHaveClass("data-row--drop-target");

    fireEvent.drop(dimDimRow!, { dataTransfer });

    expect(dimDimRow).not.toHaveClass("data-row--drop-target");
  });

  it("changes edit affordances by role capability", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    expect(screen.getByRole("button", { name: /นำเข้า/i })).toBeEnabled();

    await user.selectOptions(
      screen.getByLabelText(/Role preview/i),
      "member-viewer",
    );

    expect(screen.getByRole("button", { name: /นำเข้า/i })).toBeDisabled();
    expect(
      screen.getByText(/ต้องมีสิทธิ์ผู้จัดทริปจึงจะแก้ไขได้/i),
    ).toBeInTheDocument();
  });

  it("imports itinerary files through an app dialog instead of native prompts", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const prompt = vi.spyOn(window, "prompt");
    const confirm = vi.spyOn(window, "confirm");
    const alert = vi.spyOn(window, "alert");
    storage.setItem(tripStorageKey, JSON.stringify(tripWithSheets()));
    render(<SagittariusApp initialView="itinerary" />);
    await screen.findByRole("option", { name: "Rain Sheet - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    const file = new File(
      [
        JSON.stringify({
          schema: "joii.itinerary.export",
          version: 1,
          exportedAt: "2026-06-06T00:00:00.000Z",
          items: [
            {
              id: "imported-lunch",
              day: "2026-06-19",
              sortOrder: 42,
              startTime: "13:15",
              activity: "Imported noodle lunch",
              activityType: "food",
              place: "Central Market",
              linkLabel: "Map",
              mapLink: "",
              durationMinutes: 55,
              transportation: "MTR",
              note: "Bring cash",
            },
          ],
          records: {
            expenses: [
              {
                id: "imported-expense",
                tripId: seedTrip.id,
                tripPlanId: seedTrip.activePlanVariantId,
                title: "Imported real receipt",
                amount: 120,
                paidBy: "member-aom",
                splits: { "member-aom": 120 },
                category: "food",
                itineraryItemId: "imported-lunch",
              },
            ],
            bookingDocs: [
              {
                id: "imported-booking",
                tripId: seedTrip.id,
                tripPlanId: seedTrip.activePlanVariantId,
                type: "activity_ticket",
                title: "Imported lunch reservation",
                status: "booked",
                visibility: "shared",
                ownerMemberId: "member-aom",
                providerName: "Central Market",
                confirmationCode: "NOODLE-1",
                startsAt: null,
                endsAt: null,
                timezone: "Asia/Hong_Kong",
                priceAmount: 120,
                currency: "HKD",
                travelerIds: ["member-aom"],
                externalLinks: [],
                relatedItineraryItemIds: ["imported-lunch"],
                relatedTaskIds: ["imported-task"],
                relatedExpenseIds: ["imported-expense"],
                noteIds: ["imported-note"],
                notes: "Imported booking context",
                createdBy: "member-aom",
                updatedAt: "2026-06-06T00:00:00.000Z",
                version: 7,
              },
            ],
            stopNotes: [
              {
                id: "imported-note",
                tripId: seedTrip.id,
                tripPlanId: seedTrip.activePlanVariantId,
                itemId: "imported-lunch",
                authorId: "member-aom",
                body: "Ask for the corner table.",
                createdAt: "2026-06-06T00:00:00.000Z",
                version: 3,
              },
            ],
            tasks: [
              {
                id: "imported-task",
                tripPlanId: seedTrip.activePlanVariantId,
                title: "Confirm imported lunch",
                status: "open",
                visibility: "shared",
                kind: "booking",
                createdBy: "member-aom",
                assigneeId: "member-aom",
                relatedItemId: "imported-lunch",
                version: 5,
              },
            ],
          },
        }),
      ],
      "itinerary.json",
      { type: "application/json" },
    );

    await user.upload(screen.getByLabelText(/นำเข้า itinerary JSON/i), file);
    const dialog = await screen.findByRole("dialog", {
      name: /ตั้งค่า import itinerary/i,
    });
    expect(dialog).toHaveClass(
      "import-options-dialog",
      "shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]",
    );
    expect(dialog.className).not.toContain("0_24px_70px");
    expect(dialog).toHaveTextContent("Imported noodle lunch");
    expect(dialog).toHaveTextContent(
      "Records detected: 1 expenses, 1 bookings, 1 notes, 1 tasks",
    );
    expect(dialog).toHaveTextContent(
      "Import applies them to the current Trip Plan",
    );
    await user.clear(within(dialog).getByLabelText(/ชื่อ path/i));
    await user.type(within(dialog).getByLabelText(/ชื่อ path/i), "Plan B");
    await user.click(
      within(dialog).getByRole("button", { name: /import itinerary/i }),
    );

    expect(
      screen.getByRole("row", { name: /Imported noodle lunch/i }),
    ).toBeInTheDocument();
    const persistedTrip = JSON.parse(localStorage.getItem(tripStorageKey)!) as Trip;
    const importedExpense = persistedTrip.expenses.find(
      (expense) => expense.title === "Imported real receipt",
    );
    const importedBooking = persistedTrip.bookingDocs?.find(
      (booking) => booking.title === "Imported lunch reservation",
    );
    const importedNote = persistedTrip.stopNotes?.find(
      (note) => note.body === "Ask for the corner table.",
    );
    const importedTask = persistedTrip.tasks?.find(
      (task) => task.title === "Confirm imported lunch",
    );
    expect(importedExpense).toMatchObject({
      tripId: seedTrip.id,
      tripPlanId: "plan-variant-backup",
      itineraryItemId: "imported-lunch",
      version: 1,
    });
    expect(importedExpense?.id).toMatch(/^expense-local-/);
    expect(importedBooking).toMatchObject({
      tripId: seedTrip.id,
      tripPlanId: "plan-variant-backup",
      relatedItineraryItemIds: ["imported-lunch"],
      relatedExpenseIds: [importedExpense?.id],
      noteIds: [importedNote?.id],
      version: 1,
    });
    expect(importedBooking?.id).toMatch(/^booking-local-/);
    expect(importedNote).toMatchObject({
      tripId: seedTrip.id,
      tripPlanId: "plan-variant-backup",
      itemId: "imported-lunch",
      version: 1,
    });
    expect(importedNote?.id).toMatch(/^note-local-/);
    expect(importedTask).toMatchObject({
      tripPlanId: "plan-variant-backup",
      relatedItemId: "imported-lunch",
      version: 1,
    });
    expect(importedTask?.id).toMatch(/^task-local-/);
    await user.click(screen.getByRole("link", { name: /ภาพรวม/i }));
    expect(
      await screen.findByText("Confirm imported lunch"),
    ).toBeInTheDocument();
    expect(prompt).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
  });

  it("applies API itinerary imports with hierarchy, time windows, and remapped records", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithSheets(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
      expenses: [],
      bookingDocs: [],
      stopNotes: [],
    };
    const importedDocument = {
      schema: "joii.itinerary.export" as const,
      version: 1 as const,
      exportedAt: "2026-06-06T00:00:00.000Z",
      trip: {
        id: apiTrip.id,
        name: apiTrip.name,
        destinationLabel: apiTrip.destinationLabel,
        startDate: apiTrip.startDate,
        endDate: apiTrip.endDate,
        activePlanVariantId: apiTrip.activePlanVariantId,
        mainTripPlanId: apiTrip.mainTripPlanId,
      },
      items: [
        {
          id: "import-flight-block",
          itemKind: "travel" as const,
          timeMode: "scheduled" as const,
          isPlanBlock: true,
          status: "confirmed" as const,
          priority: "must" as const,
          day: "2026-06-19",
          sortOrder: 100,
          startTime: "23:00",
          endTime: "02:00",
          endOffsetDays: 1,
          activity: "Imported API flight block",
          activityType: "travel" as const,
          place: "BKK",
          linkLabel: "Map",
          mapLink: "",
          durationMinutes: 180,
          transportation: "Flight",
          details: { bookingRef: "QR349" },
          note: "Keep airport buffer",
        },
        {
          id: "import-checkin",
          parentItemId: "import-flight-block",
          itemKind: "preparation" as const,
          timeMode: "flexible" as const,
          isPlanBlock: false,
          status: "planned" as const,
          priority: "high" as const,
          day: "2026-06-19",
          sortOrder: 110,
          startTime: "",
          endTime: null,
          endOffsetDays: 0,
          activity: "Imported API check-in",
          activityType: "travel" as const,
          place: "Hotel lobby",
          linkLabel: "Map",
          mapLink: "",
          durationMinutes: null,
          transportation: "",
          details: {},
          note: "Sub-activity",
        },
      ],
      records: {
        expenses: [
          {
            id: "import-expense",
            tripId: apiTrip.id,
            tripPlanId: apiTrip.activePlanVariantId,
            title: "Imported API receipt",
            amount: 120,
            paidBy: "member-aom",
            splits: { "member-aom": 120 },
            category: "tickets" as const,
            itineraryItemId: "import-flight-block",
            version: 7,
          },
        ],
        bookingDocs: [
          {
            id: "import-booking",
            tripId: apiTrip.id,
            tripPlanId: apiTrip.activePlanVariantId,
            type: "flight" as const,
            title: "Imported API ticket",
            status: "booked" as const,
            visibility: "shared" as const,
            ownerMemberId: "member-aom",
            providerName: "Cathay",
            confirmationCode: "CX-API",
            startsAt: null,
            endsAt: null,
            timezone: "Asia/Bangkok",
            priceAmount: 120,
            currency: "HKD",
            travelerIds: ["member-aom"],
            externalLinks: [],
            relatedItineraryItemIds: ["import-flight-block"],
            relatedTaskIds: ["import-task"],
            relatedExpenseIds: ["import-expense"],
            noteIds: ["import-note"],
            notes: "Imported booking context",
            createdBy: "member-aom",
            updatedAt: "2026-06-06T00:00:00.000Z",
            version: 3,
          },
        ],
        stopNotes: [
          {
            id: "import-note",
            tripId: apiTrip.id,
            tripPlanId: apiTrip.activePlanVariantId,
            itemId: "import-flight-block",
            authorId: "member-aom",
            body: "Imported API note",
            createdAt: "2026-06-06T00:00:00.000Z",
            version: 4,
          },
        ],
        tasks: [
          {
            id: "import-task",
            tripPlanId: apiTrip.activePlanVariantId,
            title: "Confirm imported API ticket",
            status: "open" as const,
            visibility: "shared" as const,
            kind: "booking" as const,
            createdBy: "member-aom",
            assigneeId: "member-aom",
            relatedItemId: "import-flight-block",
            version: 5,
          },
        ],
      },
    };
    const createItineraryItem = vi
      .fn()
      .mockImplementation(
        (
          _tripId: string,
          _sessionToken: string,
          request: CreateItineraryItemApiRequest,
        ) =>
          Promise.resolve({
            id:
              request.activity === "Imported API flight block"
                ? "api-flight-block"
                : "api-checkin",
            tripId: apiTrip.id,
            createdBy: "member-aom",
            updatedAt: "2026-06-06T00:00:00.000Z",
            version: 1,
            linkLabel: "Map",
            advisories: [],
            ...request,
            mapLink: request.mapLink ?? "",
            address: request.address ?? undefined,
            coordinates: request.coordinates ?? undefined,
            endTime: request.endTime ?? null,
            endOffsetDays: request.endOffsetDays ?? 0,
            durationMinutes: request.durationMinutes ?? null,
            transportation: request.transportation ?? "",
            details: request.details ?? {},
            note: request.note ?? "",
          }),
      );
    const createTask = vi
      .fn()
      .mockImplementation(
        (
          _tripId: string,
          _sessionToken: string,
          request: CreateTaskApiRequest,
        ) =>
          Promise.resolve({
            id: "api-task",
            status: "open",
            createdBy: "member-aom",
            version: 1,
            ...request,
          }),
      );
    const createStopNote = vi
      .fn()
      .mockImplementation(
        (
          _tripId: string,
          _sessionToken: string,
          request: CreateStopNoteApiRequest,
        ) =>
          Promise.resolve({
            id: "api-note",
            tripId: apiTrip.id,
            tripPlanId: request.tripPlanId,
            itemId: request.itineraryItemId,
            authorId: "member-aom",
            body: request.body,
            createdAt: "2026-06-06T00:00:00.000Z",
            updatedAt: "2026-06-06T00:00:00.000Z",
            version: 1,
          }),
      );
    const createExpense = vi
      .fn()
      .mockImplementation(
        (
          _tripId: string,
          _sessionToken: string,
          request: CreateExpenseApiRequest,
        ) =>
          Promise.resolve({
            id: "api-expense",
            tripId: apiTrip.id,
            amount: request.amountMinor / 100,
            version: 1,
            ...request,
            notes: request.notes ?? "",
            receiptUrl: request.receiptUrl ?? null,
            lineItems: request.lineItems ?? [],
            comments: request.comments ?? [],
            splits: normalizeExpenseSplitsFromMinor(request.splits),
          }),
      );
    const createBookingDoc = vi
      .fn()
      .mockImplementation(
        (
          _tripId: string,
          _sessionToken: string,
          request: CreateBookingDocApiRequest,
        ) =>
          Promise.resolve({
            id: "api-booking",
            tripId: apiTrip.id,
            createdBy: "member-aom",
            updatedAt: "2026-06-06T00:00:00.000Z",
            version: 1,
            ...request,
            externalLinks: request.externalLinks.map((link, index) => ({
              id: `api-link-${index + 1}`,
              ...link,
            })),
          }),
      );
    const apiClient = createApiClientForTrip(apiTrip, {
      importItinerary: vi.fn().mockResolvedValue(importedDocument),
      createItineraryItem,
      createTask,
      createStopNote,
      createExpense,
      createBookingDoc,
      getExpenseSummary: vi.fn().mockResolvedValue({
        groupSpend: 120,
        netByMember: {},
        currentUserNetLabel: "settled",
        settlementSuggestions: [],
      }),
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

    await user.selectOptions(await screen.findByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.upload(
      screen.getByLabelText(/นำเข้า itinerary JSON/i),
      new File(["raw itinerary"], "itinerary.json", {
        type: "application/json",
      }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: /ตั้งค่า import itinerary/i,
    });
    await user.click(
      within(dialog).getByRole("button", { name: /import itinerary/i }),
    );

    await waitFor(() => expect(createItineraryItem).toHaveBeenCalledTimes(2));
    expect(createItineraryItem).toHaveBeenNthCalledWith(
      1,
      apiTrip.id,
      "session-token",
      expect.objectContaining({
        planVariantId: "plan-variant-backup",
        activity: "Imported API flight block",
        itemKind: "travel",
        timeMode: "scheduled",
        isPlanBlock: true,
        status: "confirmed",
        priority: "must",
        endTime: "02:00",
        endOffsetDays: 1,
      }),
    );
    expect(createItineraryItem).toHaveBeenNthCalledWith(
      2,
      apiTrip.id,
      "session-token",
      expect.objectContaining({
        planVariantId: "plan-variant-backup",
        activity: "Imported API check-in",
        parentItemId: "api-flight-block",
        itemKind: "preparation",
        timeMode: "flexible",
      }),
    );
    expect(createTask).toHaveBeenCalledWith(
      apiTrip.id,
      "session-token",
      expect.objectContaining({
        tripPlanId: "plan-variant-backup",
        relatedItemId: "api-flight-block",
      }),
    );
    expect(createStopNote).toHaveBeenCalledWith(
      apiTrip.id,
      "session-token",
      expect.objectContaining({
        tripPlanId: "plan-variant-backup",
        itineraryItemId: "api-flight-block",
      }),
    );
    expect(createExpense).toHaveBeenCalledWith(
      apiTrip.id,
      "session-token",
      expect.objectContaining({
        tripPlanId: "plan-variant-backup",
        amountMinor: 12000,
        splits: { "member-aom": 12000 },
        itineraryItemId: "api-flight-block",
      }),
    );
    expect(createBookingDoc).toHaveBeenCalledWith(
      apiTrip.id,
      "session-token",
      expect.objectContaining({
        tripPlanId: "plan-variant-backup",
        relatedItineraryItemIds: ["api-flight-block"],
        relatedTaskIds: ["api-task"],
        relatedExpenseIds: ["api-expense"],
        noteIds: ["api-note"],
      }),
    );
    const importedRow = await screen.findByRole("row", {
      name: /Imported API flight block/i,
    });
    expect(importedRow).toBeInTheDocument();
    expect(within(importedRow).getByText("1 booking")).toBeInTheDocument();
    expect(within(importedRow).getByText("1 expense")).toBeInTheDocument();
    expect(within(importedRow).getByText("1 task")).toBeInTheDocument();
    expect(within(importedRow).getByText("1 note")).toBeInTheDocument();
  }, 45_000);

  it("creates a named local Trip Plan and selects it without copying itinerary rows", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    const selector = (await screen.findByLabelText(
      "Trip Plan",
    )) as HTMLSelectElement;
    await user.click(screen.getByRole("button", { name: "เพิ่มแผน" }));
    await user.type(screen.getByLabelText("ชื่อแผน"), "Museum Day");
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
    const draftTrip = tripWithSheets();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="itinerary" />);

    await screen.findByRole("option", { name: "Rain Sheet - ร่าง" });
    await screen.findByRole("row", { name: /Dim Dim Sum/i });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);

    expect(
      await screen.findByRole("row", { name: /Rain sheet gallery/i }),
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
  });

  it("sets the selected local Trip Plan as Main only from the explicit action", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithSheets();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="itinerary" />);

    await screen.findByRole("option", { name: "Rain Sheet - ร่าง" });
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
      JSON.stringify(tripWithSheetsAndPlanScopedRecords()),
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
    const trip = tripWithSheetsAndPlanScopedRecords();

    render(<SagittariusApp initialTrip={trip} initialView="overview" />);

    expect(await screen.findByText("Backup gallery task")).toBeInTheDocument();
    expect(screen.queryByText("Main plan brunch task")).not.toBeInTheDocument();
  });

  it("shows Plan Check findings only for the selected Trip Plan", async () => {
    const user = userEvent.setup();
    const trip = tripWithSheetsAndPlanCheckFindings();

    render(<SagittariusApp initialTrip={trip} initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /Run Plan Check/i }));

    expect(
      await screen.findByText(/Backup broken gallery ยังขาด duration/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Main broken brunch ยังขาด duration/i),
    ).not.toBeInTheDocument();
  });

  it("adds new local stops to the current Trip Plan after switching plans", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithSheets();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));

    render(<SagittariusApp initialView="itinerary" />);

    await screen.findByRole("option", { name: "Rain Sheet - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);
    await user.click(
      await screen.findByRole("button", {
        name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 1/i,
      }),
    );
    const dialog = await screen.findByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    fireEvent.change(within(dialog).getByLabelText("กิจกรรม"), {
      target: { value: "Sheet coffee" },
    });
    fireEvent.change(within(dialog).getByLabelText("สถานที่"), {
      target: { value: "Sheung Wan" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: "บันทึกกิจกรรม" }),
    );

    expect(
      await screen.findByRole("row", { name: /Sheet coffee/i }),
    ).toBeInTheDocument();
    const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
    expect(persistedTrip.itineraryItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          activity: "Sheet coffee",
          planVariantId: "plan-variant-backup",
        }),
      ]),
    );
  });

  it("quick-adds a sub-activity under an activity block from the itinerary row", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const blockItem = {
      ...seedTrip.itineraryItems[0],
      id: "block-flight",
      activity: "Flight to Hong Kong",
      place: "DMK",
      isPlanBlock: true,
      parentItemId: null,
      sortOrder: 100,
    };
    const existingChild = {
      ...seedTrip.itineraryItems[1],
      id: "block-flight-checkin",
      activity: "Airport shuttle",
      parentItemId: "block-flight",
      isPlanBlock: false,
      sortOrder: 110,
    };
    const laterActivity = {
      ...seedTrip.itineraryItems[2],
      id: "later-market",
      activity: "Later market walk",
      parentItemId: null,
      isPlanBlock: false,
      sortOrder: 300,
    };
    storage.setItem(
      tripStorageKey,
      JSON.stringify({
        ...seedTrip,
        itineraryItems: [blockItem, existingChild, laterActivity],
      }),
    );

    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      await screen.findByRole("button", {
        name: /Add sub-activity under Flight to Hong Kong/i,
      }),
    );
    const dialog = await screen.findByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    expect(within(dialog).getByLabelText("Plan block")).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("กิจกรรม"), {
      target: { value: "Airport check in" },
    });
    fireEvent.change(within(dialog).getByLabelText("สถานที่"), {
      target: { value: "DMK terminal" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: "บันทึกกิจกรรม" }),
    );

    expect(
      await screen.findByRole("row", { name: /Airport check in/i }),
    ).toHaveAttribute("data-hierarchy-level", "2");
    const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
    expect(persistedTrip.itineraryItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          activity: "Airport check in",
          parentItemId: "block-flight",
          isPlanBlock: false,
          sortOrder: 120,
        }),
      ]),
    );
  });

  it("quick-adds a sub-activity on the parent activity block path", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const blockItem = {
      ...seedTrip.itineraryItems[0],
      id: "block-rain-flight",
      activity: "Rain route flight",
      place: "DMK",
      pathGroupId: "path-group-rain",
      pathId: "path-rain",
      pathName: "Rain plan",
      pathRole: "alternative" as const,
      isPlanBlock: true,
      parentItemId: null,
      sortOrder: 100,
    };
    storage.setItem(
      tripStorageKey,
      JSON.stringify({
        ...seedTrip,
        itineraryItems: [blockItem],
      }),
    );

    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      await screen.findByRole("button", {
        name: /Add sub-activity under Rain route flight/i,
      }),
    );
    const dialog = await screen.findByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    fireEvent.change(within(dialog).getByLabelText("กิจกรรม"), {
      target: { value: "Rain route check in" },
    });
    fireEvent.change(within(dialog).getByLabelText("สถานที่"), {
      target: { value: "DMK terminal" },
    });
    await user.click(
      within(dialog).getByRole("button", { name: "บันทึกกิจกรรม" }),
    );

    const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
    expect(persistedTrip.itineraryItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          activity: "Rain route check in",
          parentItemId: "block-rain-flight",
          isPlanBlock: false,
          sortOrder: 110,
          pathGroupId: "path-group-rain",
          pathId: "path-rain",
          pathName: "Rain plan",
          pathRole: "alternative",
        }),
      ]),
    );
  });

  it("quick-adds a linked planning task from the itinerary row", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const taskItem = {
      ...seedTrip.itineraryItems[0],
      id: "item-flight",
      activity: "Flight to Hong Kong",
      place: "DMK",
      sortOrder: 100,
    };
    storage.setItem(
      tripStorageKey,
      JSON.stringify({
        ...seedTrip,
        itineraryItems: [taskItem],
        tasks: [],
      }),
    );

    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      await screen.findByRole("button", {
        name: /Add task for Flight to Hong Kong/i,
      }),
    );

    const structure = await screen.findByLabelText("Structure for Flight to Hong Kong");
    expect(within(structure).getByText("1 task")).toBeInTheDocument();
  });

  it("quick-adds a planning note from the itinerary row and opens details", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const noteItem = {
      ...seedTrip.itineraryItems[0],
      id: "item-flight",
      activity: "Flight to Hong Kong",
      place: "DMK",
      sortOrder: 100,
    };
    storage.setItem(
      tripStorageKey,
      JSON.stringify({
        ...seedTrip,
        itineraryItems: [noteItem],
      }),
    );

    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      await screen.findByRole("button", {
        name: /Add note for Flight to Hong Kong/i,
      }),
    );

    const structure = await screen.findByLabelText("Structure for Flight to Hong Kong");
    expect(within(structure).getByText("1 note")).toBeInTheDocument();
    const context = await screen.findByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    expect(within(context).getByText("Planning note for Flight to Hong Kong")).toBeInTheDocument();
  });

  it("quick-adds a booking draft from the itinerary row", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const bookingItem = {
      ...seedTrip.itineraryItems[0],
      id: "item-flight",
      activity: "Flight to Hong Kong",
      activityType: "travel" as const,
      transportation: "Plane",
      place: "DMK",
      sortOrder: 100,
    };
    storage.setItem(
      tripStorageKey,
      JSON.stringify({
        ...seedTrip,
        bookingDocs: [],
        itineraryItems: [bookingItem],
      }),
    );

    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      await screen.findByRole("button", {
        name: /Add booking draft for Flight to Hong Kong/i,
      }),
    );

    const structure = await screen.findByLabelText("Structure for Flight to Hong Kong");
    expect(within(structure).getByText("1 booking")).toBeInTheDocument();
    const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
    expect(persistedTrip.bookingDocs).toEqual([
      expect.objectContaining({
        status: "draft",
        type: "flight",
        title: "Flight to Hong Kong booking draft",
        tripPlanId: seedTrip.activePlanVariantId,
        priceAmount: null,
        relatedItineraryItemIds: ["item-flight"],
        relatedExpenseIds: [],
      }),
    ]);
  });

  it("imports itinerary rows into the current Trip Plan and keeps path fields", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
    const draftTrip = tripWithSheets();
    storage.setItem(tripStorageKey, JSON.stringify(draftTrip));
    render(<SagittariusApp initialView="itinerary" />);

    await screen.findByRole("option", { name: "Rain Sheet - ร่าง" });
    await user.selectOptions(screen.getByLabelText("Trip Plan"), [
      "plan-variant-backup",
    ]);

    const file = new File(
      [
        JSON.stringify({
          schema: "joii.itinerary.export",
          version: 1,
          exportedAt: "2026-06-06T00:00:00.000Z",
          items: [
            {
              id: "imported-current-sheet",
              pathGroupId: "imported-path-group",
              pathId: "path-rain-plan",
              pathName: "Rain plan",
              pathRole: "alternative",
              day: seedTrip.startDate,
              sortOrder: 15,
              startTime: "15:30",
              activity: "Imported current sheet stop",
              activityType: "attraction",
              place: "K11 Musea",
              linkLabel: "Map",
              mapLink: "",
              durationMinutes: 70,
              transportation: "Walk",
              note: "Preserve path context",
            },
          ],
        }),
      ],
      "itinerary.json",
      { type: "application/json" },
    );

    await user.upload(screen.getByLabelText(/นำเข้า itinerary JSON/i), file);
    const dialog = await screen.findByRole("dialog", {
      name: /ตั้งค่า import itinerary/i,
    });
    await user.clear(within(dialog).getByLabelText(/ชื่อ path/i));
    await user.type(within(dialog).getByLabelText(/ชื่อ path/i), "Rain import");
    await user.click(
      within(dialog).getByRole("button", { name: /import itinerary/i }),
    );

    expect(
      await screen.findByRole("row", { name: /Imported current sheet stop/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Imported current sheet stop on Rain import/i,
      }),
    ).toBeInTheDocument();
    const persistedTrip = JSON.parse(storage.getItem(tripStorageKey)!) as Trip;
    expect(persistedTrip.itineraryItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          activity: "Imported current sheet stop",
          planVariantId: "plan-variant-backup",
          pathGroupId: "imported-path-group",
          pathId: "path-rain-import",
          pathName: "Rain import",
          pathRole: "alternative",
        }),
      ]),
    );
  });

  it("creates a Trip Plan through the API, then selects it without publishing", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithSheets(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const createdSheet: PlanVariant = {
      id: "plan-variant-api-created",
      tripId: apiTrip.id,
      name: "API Sheet",
      kind: "draft",
      status: "draft",
      description: "",
      version: 1,
    };
    const apiClient = createApiClientForTrip(apiTrip, {
      createTripPlan: vi.fn().mockResolvedValue(createdSheet),
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

    await user.click(await screen.findByRole("button", { name: "เพิ่มแผน" }));
    await user.type(screen.getByLabelText("ชื่อแผน"), "API Sheet");
    await user.click(screen.getByRole("button", { name: "สร้างแผน" }));

    await waitFor(() =>
      expect(apiClient.createTripPlan!).toHaveBeenCalledWith(
        apiTrip.id,
        "session-token",
        expect.objectContaining({
          name: "API Sheet",
          kind: "draft",
          description: "",
        }),
      ),
    );
    expect(apiClient.setMainTripPlan!).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByLabelText("Trip Plan")).toHaveValue(createdSheet.id),
    );
  }, 45_000);

  it("reloads cockpit state when API Trip Plan publish hits a version conflict", async () => {
    const user = userEvent.setup();
    const apiTrip = {
      ...tripWithSheets(),
      members: [{ ...seedTrip.members[0], claimPasswordHash: null }],
    };
    const reloadedSheet: PlanVariant = {
      id: "plan-variant-reloaded",
      tripId: apiTrip.id,
      name: "Reloaded Sheet",
      kind: "draft",
      status: "draft",
      description: "",
      version: 3,
    };
    const reloadedTrip: Trip = {
      ...apiTrip,
      activePlanVariantId: reloadedSheet.id,
      mainTripPlanId: reloadedSheet.id,
      planVariants: [...apiTrip.planVariants, reloadedSheet],
      tripPlans: [...(apiTrip.tripPlans ?? apiTrip.planVariants), reloadedSheet],
      itineraryItems: [
        {
          ...apiTrip.itineraryItems[0],
          id: "item-reloaded-sheet",
          planVariantId: reloadedSheet.id,
          activity: "Reloaded sheet stop",
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
        reloadedSheet.id,
      ),
    );
    expect(
      screen.getByRole("row", { name: /Reloaded sheet stop/i }),
    ).toBeInTheDocument();
  }, 45_000);

  it("lets travelers directly edit a stop", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.selectOptions(
      screen.getByLabelText(/Role preview/i),
      "member-nam",
    );
    await openFirstStopDetails(user);

    expect(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i })).toBeEnabled();
  });

  it("uses the stop workspace for notes, booking prep, and suggestion review", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await openFirstStopDetails(user);

    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    expect(within(context).getByRole("tab", { name: /โน้ต/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      within(context).getByRole("tab", { name: /การจอง/i }),
    ).toBeInTheDocument();
    expect(
      within(context).getByRole("tab", { name: /ข้อเสนอ/i }),
    ).toBeInTheDocument();
    expect(
      within(context).getByRole("region", { name: /โน้ตของจุดนี้/i }),
    ).toBeInTheDocument();

    await user.type(
      within(context).getByLabelText(/เพิ่มโน้ตสำหรับจุดนี้/i),
      "ถามร้านว่ามีโต๊ะริมหน้าต่างไหม",
    );
    await user.click(
      within(context).getByRole("button", { name: /บันทึกโน้ต/i }),
    );
    expect(
      within(context).getByText(/ถามร้านว่ามีโต๊ะริมหน้าต่างไหม/i),
    ).toBeInTheDocument();

    await user.click(within(context).getByRole("tab", { name: /การจอง/i }));
    expect(
      within(context).getByRole("region", {
        name: /การจองและการเตรียมตัวของจุดนี้/i,
      }),
    ).toBeInTheDocument();
    expect(within(context).getByText(/จองล่วงหน้าแนะนำ/i)).toBeInTheDocument();

    await user.click(within(context).getByRole("tab", { name: /ข้อเสนอ/i }));
    expect(
      within(context).getByRole("region", { name: /ตรวจข้อเสนอ/i }),
    ).toBeInTheDocument();
    await user.click(
      within(context).getByRole("button", {
        name: /อนุมัติ ร้านนี้ได้รับคะแนนสูง/i,
      }),
    );
    expect(
      within(context).queryByText(
        /ร้านนี้ได้รับคะแนนสูง 4.3\/5 จาก 8,332 รีวิว/i,
      ),
    ).not.toBeInTheDocument();

    await user.click(
      within(context).getByRole("button", {
        name: /ปฏิเสธ แนะนำให้จองคิวล่วงหน้า/i,
      }),
    );
    expect(
      within(context).queryByText(
        /แนะนำให้จองคิวล่วงหน้า โดยเฉพาะช่วงสุดสัปดาห์/i,
      ),
    ).not.toBeInTheDocument();
  });

  it("renders fixture-backed suggestions and tasks in planning views", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await openFirstStopDetails(user);

    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    await user.click(within(context).getByRole("tab", { name: /ข้อเสนอ/i }));
    expect(
      within(context).getAllByText(/ร้านนี้ได้รับคะแนนสูง 4\.3\/5/i).length,
    ).toBeGreaterThan(0);

    await user.click(within(context).getByRole("tab", { name: /การจอง/i }));
    expect(
      within(context).getByText(/ยืนยันคิว Dim Dim Sum/i),
    ).toBeInTheDocument();
  });

  it("adds a new itinerary stop from a day action", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 2/i }),
    );

    const dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลาเริ่ม$/i));
    await user.type(within(dialog).getByLabelText(/^เวลาเริ่ม$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(
      within(dialog).getByLabelText(/กิจกรรม/i),
      "Coffee break at K11 Musea",
    );
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "K11 Musea");
    await user.clear(within(dialog).getByLabelText(/^เวลาจบ$/i));
    await user.type(within(dialog).getByLabelText(/^เวลาจบ$/i), "18:15");
    await user.clear(within(dialog).getByLabelText(/การเดินทาง/i));
    await user.type(within(dialog).getByLabelText(/การเดินทาง/i), "เดิน");
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }),
    );

    expect(
      screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i }),
    ).not.toBeInTheDocument();
    const newStopSelector = await screen.findByRole("button", {
        name: /เลือกจุด Coffee break at K11 Musea/i,
      });
    expect(newStopSelector).toBeInTheDocument();
    const persistedTrip = JSON.parse(localStorage.getItem(tripStorageKey)!) as Trip;
    expect(
      persistedTrip.itineraryItems.find(
        (item) => item.activity === "Coffee break at K11 Musea",
      ),
    ).toMatchObject({
      startTime: "16:45",
      endTime: "18:15",
      endOffsetDays: 0,
      durationMinutes: 90,
    });
    expect(
      screen.getByRole("button", {
        name: /Coffee break at K11 Musea on Main/i,
      }),
    ).toBeInTheDocument();
    await user.click(newStopSelector);
    expect(
      within(
        screen.getByRole("complementary", { name: /ข้อมูลประกอบการวางแผน/i }),
      ).getByRole("heading", { name: /Coffee break at K11 Musea/i }),
    ).toBeInTheDocument();
  });

  it("manually promotes an overlapping stop to the main plan from edit details", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 2/i }),
    );

    let dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลาเริ่ม$/i));
    await user.type(within(dialog).getByLabelText(/^เวลาเริ่ม$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(
      within(dialog).getByLabelText(/กิจกรรม/i),
      "Manual main coffee",
    );
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "K11 Musea");
    await user.clear(within(dialog).getByLabelText(/^เวลาจบ$/i));
    await user.type(within(dialog).getByLabelText(/^เวลาจบ$/i), "17:30");
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }),
    );

    await user.click(
      await screen.findByRole("button", {
        name: /เลือกจุด Manual main coffee/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));

    dialog = screen.getByRole("dialog", { name: /แก้ไขรายละเอียด/i });
    await user.selectOptions(within(dialog).getByLabelText("แผน"), "main");
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกการแก้ไข/i }),
    );

    expect(
      await screen.findByRole("button", {
        name: /เลือกจุด Manual main coffee/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Manual main coffee on Main/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /เดินเล่นย่าน Central.*on Plan A/i }),
    ).toBeInTheDocument();
  });

  it("promotes another stop when the current main stop is manually moved to a new plan", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 2/i }),
    );

    let dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลาเริ่ม$/i));
    await user.type(within(dialog).getByLabelText(/^เวลาเริ่ม$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(
      within(dialog).getByLabelText(/กิจกรรม/i),
      "Promoted after demote coffee",
    );
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "K11 Musea");
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }),
    );

    expect(
      await screen.findByRole("button", {
        name: /เลือกจุด Promoted after demote coffee/i,
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ปิดรายละเอียด/i }));
    await user.click(
      screen.getByRole("button", { name: /เลือกจุด เดินเล่นย่าน Central/i }),
    );
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));

    dialog = screen.getByRole("dialog", { name: /แก้ไขรายละเอียด/i });
    await user.selectOptions(
      within(dialog).getByLabelText("แผน"),
      "path-2026-06-19-sub-b",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกการแก้ไข/i }),
    );

    expect(
      screen.getByRole("button", {
        name: /เลือกจุด Promoted after demote coffee/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Promoted after demote coffee on Main/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /เดินเล่นย่าน Central.*on Plan B/i }),
    ).toBeInTheDocument();
  });

  it("keeps a newly added day item on main until an alternative path is chosen explicitly", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 2/i }),
    );

    const dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลาเริ่ม$/i));
    await user.type(within(dialog).getByLabelText(/^เวลาเริ่ม$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(
      within(dialog).getByLabelText(/กิจกรรม/i),
      "Day filter coffee",
    );
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "K11 Musea");
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }),
    );

    expect(
      await screen.findByRole("button", {
        name: /เลือกจุด Day filter coffee/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Day filter coffee on Main/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Day filter coffee on Plan A/i }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /กรองแผน|แสดงตัวกรอง/i }),
    );
    expect(screen.queryByLabelText("Plan A")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Path for Day 2/i }),
    ).not.toBeInTheDocument();
  });

  it("adds a new itinerary stop into the selected item's day", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(
      screen.getByRole("button", { name: /เลือกจุด เช็คเอาท์จากโรงแรม/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 3/i }),
    );

    const dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลาเริ่ม$/i));
    await user.type(within(dialog).getByLabelText(/^เวลาเริ่ม$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(
      within(dialog).getByLabelText(/กิจกรรม/i),
      "Shenzhen late tea",
    );
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(
      within(dialog).getByLabelText(/สถานที่/i),
      "Shenzhen Garden",
    );
    await user.clear(within(dialog).getByLabelText(/^เวลาจบ$/i));
    await user.type(within(dialog).getByLabelText(/^เวลาจบ$/i), "17:15");
    await user.clear(within(dialog).getByLabelText(/การเดินทาง/i));
    await user.type(within(dialog).getByLabelText(/การเดินทาง/i), "เดิน");
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }),
    );

    expect(
      screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i }),
    ).not.toBeInTheDocument();

    const stopButtons = screen.getAllByRole("button", { name: /^เลือกจุด / });
    const labels = stopButtons.map(
      (button) => button.getAttribute("aria-label") ?? "",
    );

    expect(
      labels.find((label) => label.includes("เช็คเอาท์จากโรงแรม")),
    ).not.toBeUndefined();
    expect(
      labels.find((label) => label.includes("เข้าพักโรงแรมที่ Shenzhen")),
    ).not.toBeUndefined();
    expect(
      labels.find((label) => label.includes("Shenzhen late tea")),
    ).not.toBeUndefined();

    const checkoutIndex = labels.findIndex((label) =>
      label.includes("เช็คเอาท์จากโรงแรม"),
    );
    const shenzhenHotelIndex = labels.findIndex((label) =>
      label.includes("เข้าพักโรงแรมที่ Shenzhen"),
    );
    const lateTeaIndex = labels.findIndex((label) =>
      label.includes("Shenzhen late tea"),
    );

    expect(lateTeaIndex).toBeGreaterThan(shenzhenHotelIndex);
    expect(lateTeaIndex).toBeGreaterThan(checkoutIndex);
    expect(checkoutIndex).toBeGreaterThan(-1);
    expect(shenzhenHotelIndex).toBeGreaterThan(-1);
  });

  it("uses trip first day when no selected item is available and keeps sort order increasing", async () => {
    const user = userEvent.setup();
    const storage = installLocalStorageStub();
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
    storage.setItem(tripStorageKey, JSON.stringify(emptyTrip));

    render(<SagittariusApp initialView="itinerary" />);

    expect(
      await screen.findByRole("button", {
        name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 1/i,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 1/i }),
    );

    let dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลาเริ่ม$/i));
    await user.type(within(dialog).getByLabelText(/^เวลาเริ่ม$/i), "16:30");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(
      within(dialog).getByLabelText(/กิจกรรม/i),
      "Evening check-in stop",
    );
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(
      within(dialog).getByLabelText(/สถานที่/i),
      "Harbourfront Lounge",
    );
    await user.clear(within(dialog).getByLabelText(/การเดินทาง/i));
    await user.type(within(dialog).getByLabelText(/การเดินทาง/i), "แท็กซี่");
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }),
    );
    expect(
      screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("วันที่ 1")).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม วันที่ 1/i }),
    );

    dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลาเริ่ม$/i));
    await user.type(within(dialog).getByLabelText(/^เวลาเริ่ม$/i), "08:00");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(
      within(dialog).getByLabelText(/กิจกรรม/i),
      "Morning market visit",
    );
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(
      within(dialog).getByLabelText(/สถานที่/i),
      "Mong Kok Market",
    );
    await user.clear(within(dialog).getByLabelText(/การเดินทาง/i));
    await user.type(within(dialog).getByLabelText(/การเดินทาง/i), "MTR");
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }),
    );
    expect(
      screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i }),
    ).not.toBeInTheDocument();

    const stopButtons = screen.getAllByRole("button", { name: /^เลือกจุด / });
    expect(stopButtons).toHaveLength(2);
    expect(stopButtons[0]).toHaveAccessibleName(
      /เลือกจุด Morning market visit/i,
    );
    expect(stopButtons[1]).toHaveAccessibleName(
      /เลือกจุด Evening check-in stop/i,
    );
  });

  it("edits the selected stop", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await openFirstStopDetails(user);
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));

    const dialog = screen.getByRole("dialog", { name: /แก้ไขรายละเอียด/i });
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(
      within(dialog).getByLabelText(/กิจกรรม/i),
      "Dim Dim Sum revised",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /บันทึกการแก้ไข/i }),
    );

    const context = screen.getByRole("complementary", {
      name: /ข้อมูลประกอบการวางแผน/i,
    });
    expect(
      within(context).getByRole("heading", { name: /Dim Dim Sum revised/i }),
    ).toBeInTheDocument();
  });
});

function createDataTransfer() {
  const values = new Map<string, string>();

  return {
    dropEffect: "move",
    effectAllowed: "move",
    getData: (type: string) => values.get(type) ?? "",
    setData: (type: string, value: string) => values.set(type, value),
  };
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
    getExpenseSummary: vi.fn(),
    recordExpenseReminder: vi.fn(),
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
