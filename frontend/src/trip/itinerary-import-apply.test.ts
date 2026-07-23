/**
 * itinerary-import-apply — Confirm append via sequential CRUD (M81HY2YR T5 #1).
 * Appends into the currently visible planVariantId with createItineraryItem
 * then follow-up patchItineraryItem for times/details/mapLink/coords — no
 * bulk-write API; existing items are not deleted or replaced.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createItineraryItem,
  deleteItineraryItem,
  patchItineraryItem,
  reorderItineraryItems,
} from "./itinerary-api";
import type { ItineraryImportItem } from "./itinerary-import-api";
import type { TripCockpitItineraryItem } from "./trip-cockpit-load";
import { applyItineraryImport } from "./itinerary-import-apply";

vi.mock("./itinerary-api", () => ({
  createItineraryItem: vi.fn(),
  patchItineraryItem: vi.fn(),
  deleteItineraryItem: vi.fn(),
  reorderItineraryItems: vi.fn(),
}));

const createItineraryItemMock = vi.mocked(createItineraryItem);
const patchItineraryItemMock = vi.mocked(patchItineraryItem);
const deleteItineraryItemMock = vi.mocked(deleteItineraryItem);
const reorderItineraryItemsMock = vi.mocked(reorderItineraryItems);

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
/** Currently visible plan — must receive every create (not source trip plan). */
const VISIBLE_PLAN_VARIANT_ID = "018f4e82-3000-7c00-b111-visible-plan";
const SESSION_TOKEN = "member-session-token-itinerary-import-apply";

const IMPORT_FLIGHT: ItineraryImportItem = {
  id: "import-flight-block",
  day: "2026-06-19",
  sortOrder: 100,
  startTime: "23:00",
  endTime: "02:00",
  activity: "Flight to Hong Kong",
  activityType: "travel",
  place: "BKK",
  mapLink: "https://maps.example.test/flight",
  coordinates: { lat: 13.69, lng: 100.75 },
  transportation: "Flight",
  details: { bookingRef: "QR349" },
  note: "Keep airport buffer",
};

const IMPORT_HOTEL: ItineraryImportItem = {
  id: "import-hotel-checkin",
  day: "2026-06-20",
  sortOrder: 200,
  startTime: "15:00",
  endTime: "16:00",
  activity: "Hotel check-in",
  activityType: "lodging",
  place: "Tsim Sha Tsui",
  mapLink: "https://maps.example.test/hotel",
  coordinates: { lat: 22.297, lng: 114.172 },
  transportation: "",
  details: { confirmation: "HTL-8821" },
  note: "Early check-in requested",
};

const CREATED_FLIGHT: TripCockpitItineraryItem = {
  id: "018f4e90-aaaa-7c00-b111-000000000001",
  tripId: TRIP_ID,
  planVariantId: VISIBLE_PLAN_VARIANT_ID,
  day: IMPORT_FLIGHT.day,
  activity: IMPORT_FLIGHT.activity,
  activityType: IMPORT_FLIGHT.activityType,
  place: IMPORT_FLIGHT.place,
  startTime: "00:00",
  status: "idea",
  version: 1,
};

const CREATED_HOTEL: TripCockpitItineraryItem = {
  id: "018f4e90-bbbb-7c00-b111-000000000002",
  tripId: TRIP_ID,
  planVariantId: VISIBLE_PLAN_VARIANT_ID,
  day: IMPORT_HOTEL.day,
  activity: IMPORT_HOTEL.activity,
  activityType: IMPORT_HOTEL.activityType,
  place: IMPORT_HOTEL.place,
  startTime: "00:00",
  status: "idea",
  version: 1,
};

const PATCHED_FLIGHT: TripCockpitItineraryItem = {
  ...CREATED_FLIGHT,
  startTime: IMPORT_FLIGHT.startTime,
  endTime: IMPORT_FLIGHT.endTime ?? null,
  mapLink: IMPORT_FLIGHT.mapLink,
  details: IMPORT_FLIGHT.details as Record<string, unknown>,
  coordinates: IMPORT_FLIGHT.coordinates ?? null,
  version: 2,
};

const PATCHED_HOTEL: TripCockpitItineraryItem = {
  ...CREATED_HOTEL,
  startTime: IMPORT_HOTEL.startTime,
  endTime: IMPORT_HOTEL.endTime ?? null,
  mapLink: IMPORT_HOTEL.mapLink,
  details: IMPORT_HOTEL.details as Record<string, unknown>,
  coordinates: IMPORT_HOTEL.coordinates ?? null,
  version: 2,
};

beforeEach(() => {
  createItineraryItemMock.mockReset();
  patchItineraryItemMock.mockReset();
  deleteItineraryItemMock.mockReset();
  reorderItineraryItemsMock.mockReset();
});

describe("applyItineraryImport", () => {
  it("appends into the visible planVariantId via sequential createItineraryItem + follow-up patchItineraryItem for times/details/mapLink/coords — no delete/replace/bulk", async () => {
    createItineraryItemMock
      .mockResolvedValueOnce({ ok: true, item: CREATED_FLIGHT })
      .mockResolvedValueOnce({ ok: true, item: CREATED_HOTEL });
    patchItineraryItemMock
      .mockResolvedValueOnce({ ok: true, item: PATCHED_FLIGHT })
      .mockResolvedValueOnce({ ok: true, item: PATCHED_HOTEL });

    const outcome = await applyItineraryImport(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        planVariantId: VISIBLE_PLAN_VARIANT_ID,
        items: [IMPORT_FLIGHT, IMPORT_HOTEL],
      },
      { fetch: vi.fn<typeof fetch>(), apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);

    expect(createItineraryItemMock).toHaveBeenCalledTimes(2);
    expect(createItineraryItemMock.mock.calls[0]![0]).toMatchObject({
      tripId: TRIP_ID,
      sessionToken: SESSION_TOKEN,
      planVariantId: VISIBLE_PLAN_VARIANT_ID,
      day: IMPORT_FLIGHT.day,
      activity: IMPORT_FLIGHT.activity,
      activityType: IMPORT_FLIGHT.activityType,
      place: IMPORT_FLIGHT.place,
    });
    expect(createItineraryItemMock.mock.calls[1]![0]).toMatchObject({
      tripId: TRIP_ID,
      sessionToken: SESSION_TOKEN,
      planVariantId: VISIBLE_PLAN_VARIANT_ID,
      day: IMPORT_HOTEL.day,
      activity: IMPORT_HOTEL.activity,
      activityType: IMPORT_HOTEL.activityType,
      place: IMPORT_HOTEL.place,
    });

    expect(patchItineraryItemMock).toHaveBeenCalledTimes(2);
    expect(patchItineraryItemMock.mock.calls[0]![0]).toMatchObject({
      tripId: TRIP_ID,
      itemId: CREATED_FLIGHT.id,
      sessionToken: SESSION_TOKEN,
      expectedVersion: CREATED_FLIGHT.version,
      patch: {
        startTime: IMPORT_FLIGHT.startTime,
        endTime: IMPORT_FLIGHT.endTime,
        mapLink: IMPORT_FLIGHT.mapLink,
        details: IMPORT_FLIGHT.details,
        latitude: IMPORT_FLIGHT.coordinates!.lat,
        longitude: IMPORT_FLIGHT.coordinates!.lng,
      },
    });
    expect(patchItineraryItemMock.mock.calls[1]![0]).toMatchObject({
      tripId: TRIP_ID,
      itemId: CREATED_HOTEL.id,
      sessionToken: SESSION_TOKEN,
      expectedVersion: CREATED_HOTEL.version,
      patch: {
        startTime: IMPORT_HOTEL.startTime,
        endTime: IMPORT_HOTEL.endTime,
        mapLink: IMPORT_HOTEL.mapLink,
        details: IMPORT_HOTEL.details,
        latitude: IMPORT_HOTEL.coordinates!.lat,
        longitude: IMPORT_HOTEL.coordinates!.lng,
      },
    });

    // Per item: create then enriching patch, then next item (sequential, not bulk).
    const createOrder0 = createItineraryItemMock.mock.invocationCallOrder[0]!;
    const patchOrder0 = patchItineraryItemMock.mock.invocationCallOrder[0]!;
    const createOrder1 = createItineraryItemMock.mock.invocationCallOrder[1]!;
    const patchOrder1 = patchItineraryItemMock.mock.invocationCallOrder[1]!;
    expect(createOrder0).toBeLessThan(patchOrder0);
    expect(patchOrder0).toBeLessThan(createOrder1);
    expect(createOrder1).toBeLessThan(patchOrder1);

    // Append-only: do not delete or reorder-replace existing stops.
    expect(deleteItineraryItemMock).not.toHaveBeenCalled();
    expect(reorderItineraryItemsMock).not.toHaveBeenCalled();
  });

  /**
   * T5 #2: Import document ids are strings; create returns UUIDs. Children that
   * reference a parent via import parentItemId must create under the remapped
   * UUID — never the raw import string id.
   */
  it("remaps import string ids to create UUIDs when nesting via parentItemId", async () => {
    const IMPORT_PARENT_ID = "import-hotel-block";
    const IMPORT_CHILD_ID = "import-hotel-checkin-child";

    const parentItem: ItineraryImportItem = {
      ...IMPORT_HOTEL,
      id: IMPORT_PARENT_ID,
      parentItemId: null,
    };
    const childItem: ItineraryImportItem = {
      id: IMPORT_CHILD_ID,
      parentItemId: IMPORT_PARENT_ID,
      day: "2026-06-20",
      sortOrder: 210,
      startTime: "15:30",
      endTime: "15:45",
      activity: "Lobby key pickup",
      activityType: "other",
      place: "Tsim Sha Tsui",
      mapLink: "",
      transportation: "",
      details: {},
      note: "",
    };

    const createdParent: TripCockpitItineraryItem = {
      ...CREATED_HOTEL,
      id: "018f4e90-cccc-7c00-b111-000000000010",
      activity: parentItem.activity,
    };
    const createdChild: TripCockpitItineraryItem = {
      id: "018f4e90-dddd-7c00-b111-000000000011",
      tripId: TRIP_ID,
      planVariantId: VISIBLE_PLAN_VARIANT_ID,
      day: childItem.day,
      activity: childItem.activity,
      activityType: childItem.activityType,
      place: childItem.place,
      startTime: "00:00",
      status: "idea",
      version: 1,
      parentItemId: createdParent.id,
    };
    const patchedParent: TripCockpitItineraryItem = {
      ...createdParent,
      version: 2,
    };
    const patchedChild: TripCockpitItineraryItem = {
      ...createdChild,
      startTime: childItem.startTime,
      endTime: childItem.endTime ?? null,
      version: 2,
    };

    createItineraryItemMock
      .mockResolvedValueOnce({ ok: true, item: createdParent })
      .mockResolvedValueOnce({ ok: true, item: createdChild });
    patchItineraryItemMock
      .mockResolvedValueOnce({ ok: true, item: patchedParent })
      .mockResolvedValueOnce({ ok: true, item: patchedChild });

    const outcome = await applyItineraryImport(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        planVariantId: VISIBLE_PLAN_VARIANT_ID,
        items: [parentItem, childItem],
      },
      { fetch: vi.fn<typeof fetch>(), apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(createItineraryItemMock).toHaveBeenCalledTimes(2);
    // Child create must nest under the API UUID, not the import string id.
    expect(createItineraryItemMock.mock.calls[1]![0]).toMatchObject({
      parentItemId: createdParent.id,
    });
    expect(createItineraryItemMock.mock.calls[1]![0].parentItemId).not.toBe(
      IMPORT_PARENT_ID,
    );
    // Remap map: import id → new UUID for callers / further nesting.
    expect(outcome).toMatchObject({
      ok: true,
      idMap: {
        [IMPORT_PARENT_ID]: createdParent.id,
        [IMPORT_CHILD_ID]: createdChild.id,
      },
    });
  });

  /**
   * T5 #2: A create or PATCH failure on one item must be recorded and the
   * remaining items still applied — no silent full-batch abort that drops
   * later successes without surfacing the failure.
   */
  it("collects per-item create/PATCH failures and continues the rest of the batch", async () => {
    const CREATE_FAIL_MSG = "create rejected: activity required";
    const PATCH_FAIL_MSG = "patch rejected: version conflict";

    createItineraryItemMock
      .mockResolvedValueOnce({ ok: true, item: CREATED_FLIGHT })
      .mockResolvedValueOnce({ ok: false, error: CREATE_FAIL_MSG })
      .mockResolvedValueOnce({ ok: true, item: CREATED_HOTEL });
    patchItineraryItemMock
      .mockResolvedValueOnce({ ok: false, error: PATCH_FAIL_MSG })
      .mockResolvedValueOnce({ ok: true, item: PATCHED_HOTEL });

    const midFailItem: ItineraryImportItem = {
      id: "import-mid-fail",
      day: "2026-06-19",
      sortOrder: 150,
      startTime: "12:00",
      activity: "",
      activityType: "other",
      place: "Somewhere",
      mapLink: "",
      transportation: "",
      note: "",
    };

    const outcome = await applyItineraryImport(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        planVariantId: VISIBLE_PLAN_VARIANT_ID,
        items: [IMPORT_FLIGHT, midFailItem, IMPORT_HOTEL],
      },
      { fetch: vi.fn<typeof fetch>(), apiBaseUrl: API_BASE },
    );

    // Batch continues: flight create+patch attempted, mid create fails, hotel still created+patched.
    expect(createItineraryItemMock).toHaveBeenCalledTimes(3);
    expect(patchItineraryItemMock).toHaveBeenCalledTimes(2);
    expect(patchItineraryItemMock.mock.calls[1]![0]).toMatchObject({
      itemId: CREATED_HOTEL.id,
    });

    // Failures surface structurally — not a silent abort / bare ok:true.
    expect(outcome.ok).toBe(false);
    expect(outcome).toMatchObject({
      ok: false,
      failures: [
        {
          importId: IMPORT_FLIGHT.id,
          phase: "patch",
          error: PATCH_FAIL_MSG,
        },
        {
          importId: midFailItem.id,
          phase: "create",
          error: CREATE_FAIL_MSG,
        },
      ],
      idMap: {
        [IMPORT_FLIGHT.id]: CREATED_FLIGHT.id,
        [IMPORT_HOTEL.id]: CREATED_HOTEL.id,
      },
    });
  });
});
