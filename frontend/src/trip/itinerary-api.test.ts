/**
 * itinerary-api — public create / patch / reorder / delete contract
 * (M80VKAX5 T4). Day workspace must reuse these helpers against existing
 * /api/v1/trips/{id}/itinerary-items (+ /order) — no parallel itinerary API.
 */
import { describe, expect, it, vi } from "vitest";
import {
  createItineraryItem,
  deleteItineraryItem,
  patchItineraryItem,
  reorderItineraryItems,
  type ItineraryItemPatchFields,
} from "./itinerary-api";

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const PLAN_ID = "018f4e82-3000-7c00-b111-000000000001";
const DAY = "2026-04-12";
const SESSION_TOKEN = "member-session-token-itinerary-api";
const ITEM_ID = "item-wat-chedi";
const CLIENT_MUTATION_ID = "client-mutation-day-crud-1";
const EXPECTED_VERSION = 3;
const ACTIVITY = "Wat Chedi Luang";
const ACTIVITY_TYPE = "attraction";
const PLACE = "Old City";
const REORDERED_IDS = ["item-khao-soi", "item-wat-chedi"] as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const ITEM_SUMMARY = {
  id: ITEM_ID,
  tripId: TRIP_ID,
  planVariantId: PLAN_ID,
  day: DAY,
  activity: ACTIVITY,
  activityType: ACTIVITY_TYPE,
  place: PLACE,
  startTime: "09:00",
  status: "idea",
  version: EXPECTED_VERSION,
};

describe("itinerary-api create/patch/reorder/delete wire contracts", () => {
  it("createItineraryItem POSTs /api/v1/trips/{tripId}/itinerary-items with clientMutationId, planVariantId, day, activity, activityType, place", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ ...ITEM_SUMMARY, version: 1 }),
    );

    const outcome = await createItineraryItem(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        planVariantId: PLAN_ID,
        day: DAY,
        activity: ACTIVITY,
        activityType: ACTIVITY_TYPE,
        place: PLACE,
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items`);
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);
    expect(JSON.parse(String(init?.body))).toEqual({
      clientMutationId: CLIENT_MUTATION_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      activity: ACTIVITY,
      activityType: ACTIVITY_TYPE,
      place: PLACE,
    });
  });

  it("createItineraryItem POSTs optional startTime and endTime when provided", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        ...ITEM_SUMMARY,
        startTime: "10:00",
        endTime: "11:30",
        version: 1,
      }),
    );

    const outcome = await createItineraryItem(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        planVariantId: PLAN_ID,
        day: DAY,
        activity: ACTIVITY,
        activityType: ACTIVITY_TYPE,
        place: PLACE,
        startTime: "10:00",
        endTime: "11:30",
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]?.body))).toEqual({
      clientMutationId: CLIENT_MUTATION_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      activity: ACTIVITY,
      activityType: ACTIVITY_TYPE,
      place: PLACE,
      startTime: "10:00",
      endTime: "11:30",
    });
  });

  it("patchItineraryItem PATCHes /api/v1/trips/{tripId}/itinerary-items/{itemId} with clientMutationId, expectedVersion, and patch", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ ...ITEM_SUMMARY, version: EXPECTED_VERSION + 1 }),
    );

    const outcome = await patchItineraryItem(
      {
        tripId: TRIP_ID,
        itemId: ITEM_ID,
        sessionToken: SESSION_TOKEN,
        expectedVersion: EXPECTED_VERSION,
        patch: { place: "Tha Phae Gate", activityType: "food" },
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${ITEM_ID}`,
    );
    expect(init?.method).toBe("PATCH");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(JSON.parse(String(init?.body))).toEqual({
      clientMutationId: CLIENT_MUTATION_ID,
      expectedVersion: EXPECTED_VERSION,
      patch: { place: "Tha Phae Gate", activityType: "food" },
    });
  });

  it("reorderItineraryItems PATCHes /api/v1/trips/{tripId}/itinerary-items/order with clientMutationId, planVariantId, day, and itemIds", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse([
        { ...ITEM_SUMMARY, id: REORDERED_IDS[0], version: EXPECTED_VERSION + 1 },
        { ...ITEM_SUMMARY, id: REORDERED_IDS[1], version: EXPECTED_VERSION + 1 },
      ]),
    );

    const outcome = await reorderItineraryItems(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        planVariantId: PLAN_ID,
        day: DAY,
        itemIds: [...REORDERED_IDS],
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/order`,
    );
    expect(init?.method).toBe("PATCH");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(JSON.parse(String(init?.body))).toEqual({
      clientMutationId: CLIENT_MUTATION_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      itemIds: [...REORDERED_IDS],
    });
  });

  it("deleteItineraryItem DELETEs /api/v1/trips/{tripId}/itinerary-items/{itemId} with Bearer auth and no body", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ ...ITEM_SUMMARY, version: EXPECTED_VERSION + 1 }),
    );

    const outcome = await deleteItineraryItem(
      {
        tripId: TRIP_ID,
        itemId: ITEM_ID,
        sessionToken: SESSION_TOKEN,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${ITEM_ID}`,
    );
    expect(init?.method).toBe("DELETE");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(init?.body).toBeUndefined();
  });

  /**
   * M81DDKSC T1 #1: create/patch must retain M1 write-path summary fields
   * (version, note, mapLink, endTime, activitySubtype, details, parentItemId,
   * isPlanBlock) on TripCockpitItineraryItem — parseCreatedItem currently drops them.
   */
  it("createItineraryItem and patchItineraryItem retain M1 write-path summary fields on the returned item", async () => {
    const PARENT_ID = "item-parent-stay";
    const writePathSummary = {
      ...ITEM_SUMMARY,
      version: 7,
      note: "ask for courtyard table",
      mapLink: "https://maps.example/wat-chedi",
      endTime: "10:30",
      activitySubtype: "temple",
      details: { ticket: "adult" },
      parentItemId: PARENT_ID,
      isPlanBlock: false,
    };

    const createFetch = vi.fn<typeof fetch>(async () => jsonResponse(writePathSummary));
    const createOutcome = await createItineraryItem(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        planVariantId: PLAN_ID,
        day: DAY,
        activity: ACTIVITY,
        activityType: ACTIVITY_TYPE,
        place: PLACE,
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: createFetch, apiBaseUrl: API_BASE },
    );

    expect(createOutcome.ok).toBe(true);
    if (!createOutcome.ok) return;
    expect(createOutcome.item).toMatchObject({
      version: 7,
      note: "ask for courtyard table",
      mapLink: "https://maps.example/wat-chedi",
      endTime: "10:30",
      activitySubtype: "temple",
      details: { ticket: "adult" },
      parentItemId: PARENT_ID,
      isPlanBlock: false,
    });

    const patchedSummary = {
      ...writePathSummary,
      version: 8,
      note: "moved to evening",
      endTime: "18:00",
    };
    const patchFetch = vi.fn<typeof fetch>(async () => jsonResponse(patchedSummary));
    const patchOutcome = await patchItineraryItem(
      {
        tripId: TRIP_ID,
        itemId: ITEM_ID,
        sessionToken: SESSION_TOKEN,
        expectedVersion: 7,
        patch: { note: "moved to evening", endTime: "18:00" },
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: patchFetch, apiBaseUrl: API_BASE },
    );

    expect(patchOutcome.ok).toBe(true);
    if (!patchOutcome.ok) return;
    expect(patchOutcome.item).toMatchObject({
      version: 8,
      note: "moved to evening",
      mapLink: "https://maps.example/wat-chedi",
      endTime: "18:00",
      activitySubtype: "temple",
      details: { ticket: "adult" },
      parentItemId: PARENT_ID,
      isPlanBlock: false,
    });
  });

  /**
   * M81DDKSC T2 #1: createItineraryItem must accept optional parentItemId on
   * the POST body. When the parent is not yet a plan block, the create path
   * promotes it (PATCH isPlanBlock: true) before POSTing the child — API
   * rejects children under non-block parents (decisions.md).
   */
  it("createItineraryItem accepts optional parentItemId, promotes non-block parent to isPlanBlock when required, and POSTs child on /api/v1/trips/{tripId}/itinerary-items", async () => {
    const PARENT_ID = "item-parent-plain-stay";
    const PARENT_VERSION = 2;
    const CHILD_ID = "item-child-lobby";
    const CHILD_ACTIVITY = "Lobby check-in";
    const CHILD_PLACE = "Harbour Hotel";

    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (
        method === "PATCH" &&
        url ===
          `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${PARENT_ID}`
      ) {
        return jsonResponse({
          ...ITEM_SUMMARY,
          id: PARENT_ID,
          activity: "Harbour Hotel stay",
          activityType: "stay",
          place: CHILD_PLACE,
          isPlanBlock: true,
          version: PARENT_VERSION + 1,
        });
      }
      if (
        method === "POST" &&
        url === `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items`
      ) {
        return jsonResponse({
          ...ITEM_SUMMARY,
          id: CHILD_ID,
          activity: CHILD_ACTIVITY,
          activityType: "stay",
          place: CHILD_PLACE,
          parentItemId: PARENT_ID,
          isPlanBlock: false,
          version: 1,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const outcome = await createItineraryItem(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        planVariantId: PLAN_ID,
        day: DAY,
        activity: CHILD_ACTIVITY,
        activityType: "stay",
        place: CHILD_PLACE,
        clientMutationId: CLIENT_MUTATION_ID,
        parentItemId: PARENT_ID,
        // Parent is not yet a plan block — promote before create.
        promoteParent: { expectedVersion: PARENT_VERSION },
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // 1) Promote parent → PATCH isPlanBlock: true (required by API).
    const [promoteUrl, promoteInit] = fetchMock.mock.calls[0]!;
    expect(promoteUrl).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${PARENT_ID}`,
    );
    expect(String(promoteInit?.method ?? "").toUpperCase()).toBe("PATCH");
    const promoteHeaders = new Headers(promoteInit?.headers);
    expect(promoteHeaders.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(JSON.parse(String(promoteInit?.body))).toEqual(
      expect.objectContaining({
        expectedVersion: PARENT_VERSION,
        patch: expect.objectContaining({ isPlanBlock: true }),
      }),
    );

    // 2) Create child → POST with parentItemId on the existing create route.
    const [createUrl, createInit] = fetchMock.mock.calls[1]!;
    expect(createUrl).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items`,
    );
    expect(String(createInit?.method ?? "").toUpperCase()).toBe("POST");
    const createHeaders = new Headers(createInit?.headers);
    expect(createHeaders.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(JSON.parse(String(createInit?.body))).toEqual({
      clientMutationId: CLIENT_MUTATION_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      activity: CHILD_ACTIVITY,
      activityType: "stay",
      place: CHILD_PLACE,
      parentItemId: PARENT_ID,
    });

    if (!outcome.ok) return;
    expect(outcome.item).toMatchObject({
      id: CHILD_ID,
      parentItemId: PARENT_ID,
      activity: CHILD_ACTIVITY,
    });
  });

  /**
   * M81HY2YR T1 #3: ItineraryItemPatchFields must accept latitude/longitude
   * (nullable clear) so place-resolve persist can PATCH coords; patchItineraryItem
   * must serialize them in the patch body on the existing item route.
   */
  it("patchItineraryItem serializes latitude/longitude (including null clear) in patch for place-resolve persist", async () => {
    const LAT = 18.7883;
    const LNG = 98.9853;
    const MAP_LINK =
      "https://www.openstreetmap.org/?mlat=18.7883&mlon=98.9853#map=17/18.7883/98.9853";

    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ ...ITEM_SUMMARY, version: EXPECTED_VERSION + 1 }),
    );

    const persistPatch: ItineraryItemPatchFields = {
      place: PLACE,
      mapLink: MAP_LINK,
      latitude: LAT,
      longitude: LNG,
    };

    const outcome = await patchItineraryItem(
      {
        tripId: TRIP_ID,
        itemId: ITEM_ID,
        sessionToken: SESSION_TOKEN,
        expectedVersion: EXPECTED_VERSION,
        patch: persistPatch,
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({
      clientMutationId: CLIENT_MUTATION_ID,
      expectedVersion: EXPECTED_VERSION,
      patch: {
        place: PLACE,
        mapLink: MAP_LINK,
        latitude: LAT,
        longitude: LNG,
      },
    });

    // Nullable clear — clear-coords path for place-resolve persist.
    fetchMock.mockClear();
    fetchMock.mockImplementation(async () =>
      jsonResponse({ ...ITEM_SUMMARY, version: EXPECTED_VERSION + 2 }),
    );

    const clearPatch: ItineraryItemPatchFields = {
      latitude: null,
      longitude: null,
    };

    const clearOutcome = await patchItineraryItem(
      {
        tripId: TRIP_ID,
        itemId: ITEM_ID,
        sessionToken: SESSION_TOKEN,
        expectedVersion: EXPECTED_VERSION + 1,
        patch: clearPatch,
        clientMutationId: `${CLIENT_MUTATION_ID}-clear`,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(clearOutcome.ok).toBe(true);
    const [, clearInit] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(String(clearInit?.body))).toEqual({
      clientMutationId: `${CLIENT_MUTATION_ID}-clear`,
      expectedVersion: EXPECTED_VERSION + 1,
      patch: {
        latitude: null,
        longitude: null,
      },
    });
  });
});

/**
 * M81LW2UJ T6 — createItineraryItem error honesty.
 * Backend ApiError serializes ErrorBody as top-level `{ code, message }`
 * (see backend/crates/api/src/api/error.rs). When fetch returns that 4xx body,
 * surface `message` — never false reachability. Network throw keeps reachability.
 */
const API_4XX_MESSAGE = "plan variant not found for this trip";
const REACHABILITY_MESSAGE =
  "Could not reach the server. Check your connection and try again.";

describe("createItineraryItem error honesty", () => {
  it("surfaces HTTP 4xx API message when fetch returned a response — not false reachability", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        { code: "invalid_request", message: API_4XX_MESSAGE },
        400,
      ),
    );

    const outcome = await createItineraryItem(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        planVariantId: PLAN_ID,
        day: DAY,
        activity: ACTIVITY,
        activityType: ACTIVITY_TYPE,
        place: PLACE,
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected failure");
    expect(outcome.error).toBe(API_4XX_MESSAGE);
    expect(outcome.error).not.toBe(REACHABILITY_MESSAGE);
    expect(outcome.error).not.toMatch(/Could not reach the server/i);
  });

  it("uses reachability copy when fetch throws (network failure)", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });

    const outcome = await createItineraryItem(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        planVariantId: PLAN_ID,
        day: DAY,
        activity: ACTIVITY,
        activityType: ACTIVITY_TYPE,
        place: PLACE,
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected failure");
    expect(outcome.error).toBe(REACHABILITY_MESSAGE);
  });
});
