import { describe, expect, it, vi } from "vitest";
import {
  MEMBER_SESSION_STORAGE_KEY,
  type StorageLike,
} from "../landing/create-trip";
import { loadTripCockpit } from "./trip-cockpit-load";

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const PLAN_ID = "018f4e82-3000-7c00-b111-000000000001";
const ITEM_ID = "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f";
const OWNER_MEMBER_ID = "018f4e81-1000-7000-a000-000000000001";
const SESSION_TOKEN = "member-session-token-cockpit";

/**
 * Independent TripCockpit-shaped body (camelCase), aligned with
 * backend TripCockpit / trip_load_contract (trip + tripPlans + itineraryItems).
 */
const TRIP_COCKPIT_BODY = {
  trip: {
    id: TRIP_ID,
    name: "Hong Kong + Shenzhen Trip",
    originLabel: "Bangkok, Thailand",
    originCity: "Bangkok",
    originCountry: "Thailand",
    originCountryCode: "TH",
    destinationLabel: "Hong Kong + Shenzhen",
    destinationCities: [
      {
        city: "Hong Kong",
        country: "Hong Kong",
        countryCode: "HK",
        timezone: "Asia/Hong_Kong",
        latitude: 22.3193,
        longitude: 114.1694,
      },
    ],
    countries: ["HK", "CN"],
    partySize: 4,
    defaultTimezone: "Asia/Hong_Kong",
    startDate: "2026-06-18",
    endDate: "2026-06-23",
    joinId: "HK-SZ-2025",
    activePlanVariantId: PLAN_ID,
    mainTripPlanId: PLAN_ID,
    ownerMemberId: OWNER_MEMBER_ID,
    version: 1,
  },
  members: [],
  planVariants: [
    {
      id: PLAN_ID,
      tripId: TRIP_ID,
      name: "Main",
      kind: "main",
      status: "main",
      description: "Primary plan",
      version: 1,
    },
  ],
  tripPlans: [
    {
      id: PLAN_ID,
      tripId: TRIP_ID,
      name: "Main",
      kind: "main",
      status: "main",
      description: "Primary plan",
      version: 1,
    },
  ],
  itineraryItems: [
    {
      id: ITEM_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      pathGroupId: null,
      pathId: null,
      pathName: null,
      pathRole: null,
      parentItemId: null,
      itemKind: "activity",
      timeMode: "scheduled",
      isPlanBlock: true,
      status: "idea",
      priority: "normal",
      day: "2026-06-19",
      sortOrder: 100,
      startTime: "08:30",
      endTime: "09:30",
      endOffsetDays: 0,
      activity: "Dim Dim Sum",
      activityType: "food",
      activitySubtype: null,
      place: "The Elements",
      linkLabel: "",
      mapLink: "https://maps.google.com",
      coordinates: null,
      address: null,
      durationMinutes: 60,
      transportation: "walk",
      details: {},
      advisories: [],
      note: "breakfast",
      createdBy: OWNER_MEMBER_ID,
      updatedAt: "2026-06-01T00:00:00Z",
      version: 4,
    },
  ],
  suggestions: [],
  latestPlanCheck: null,
  tasks: [],
  stopNotes: [],
  expenses: [],
  expenseSummary: null,
  bookingDocs: [],
  photoAlbumLinks: [],
};

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem(key: string) {
      return key in data ? data[key]! : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("loadTripCockpit", () => {
  it("with joii.member.session present, GETs /api/v1/trips/{id} with Authorization Bearer and maps trip + tripPlans + itineraryItems from TripCockpit", async () => {
    const storage = memoryStorage({
      [MEMBER_SESSION_STORAGE_KEY]: JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    });

    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(TRIP_COCKPIT_BODY),
    );

    const outcome = await loadTripCockpit(
      { tripId: TRIP_ID },
      { fetch: fetchMock, apiBaseUrl: API_BASE, storage },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/trips/${TRIP_ID}`);
    expect(init?.method ?? "GET").toBe("GET");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.trip).toEqual(
      expect.objectContaining({
        id: TRIP_ID,
        name: "Hong Kong + Shenzhen Trip",
        destinationLabel: "Hong Kong + Shenzhen",
        startDate: "2026-06-18",
        endDate: "2026-06-23",
        mainTripPlanId: PLAN_ID,
        activePlanVariantId: PLAN_ID,
      }),
    );
    expect(outcome.tripPlans).toEqual([
      expect.objectContaining({
        id: PLAN_ID,
        tripId: TRIP_ID,
        name: "Main",
        status: "main",
      }),
    ]);
    expect(outcome.itineraryItems).toEqual([
      expect.objectContaining({
        id: ITEM_ID,
        tripId: TRIP_ID,
        planVariantId: PLAN_ID,
        day: "2026-06-19",
        activity: "Dim Dim Sum",
        activityType: "food",
        place: "The Elements",
        startTime: "08:30",
      }),
    ]);
  });
});
