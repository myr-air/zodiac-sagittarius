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
    const fetchMock = vi.fn(async () =>
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

  it("patchItineraryItem PATCHes /api/v1/trips/{tripId}/itinerary-items/{itemId} with clientMutationId, expectedVersion, and patch", async () => {
    const fetchMock = vi.fn(async () =>
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
    const fetchMock = vi.fn(async () =>
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
    const fetchMock = vi.fn(async () =>
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
});
