/**
 * itinerary-import-api — POST /itinerary-imports wire contract (M81HY2YR T1 #2).
 * Client must hit /api/v1/trips/{tripId}/itinerary-imports with content
 * (+ optional mode/fileName/contentType) and return ItineraryImportDocument
 * (or ok:false with API/error message on non-OK — no fake success).
 */
import { describe, expect, it, vi } from "vitest";
import { normalizeItineraryImport } from "./itinerary-import-api";

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const PLAN_ID = "018f4e82-3000-7c00-b111-000000000001";
const SESSION_TOKEN = "member-session-token-itinerary-import";
const FILE_NAME = "itinerary.json";
const CONTENT_TYPE = "application/json";
const MODE = "json";

const SOURCE_CONTENT = JSON.stringify({
  schema: "joii.itinerary.export",
  version: 1,
  exportedAt: "2026-06-04T12:00:00.000Z",
  trip: {
    id: TRIP_ID,
    name: "Hong Kong + Shenzhen Trip",
    destinationLabel: "Hong Kong + Shenzhen",
    startDate: "2026-06-18",
    endDate: "2026-06-23",
  },
  items: [
    {
      id: "import-flight-block",
      day: "2026-06-19",
      sortOrder: 100,
      startTime: "23:00",
      activity: "Flight to Hong Kong",
      activityType: "travel",
      place: "BKK",
      mapLink: "https://maps.example.test",
      transportation: "Flight",
      note: "Keep airport buffer",
    },
  ],
});

const IMPORT_DOCUMENT = {
  schema: "joii.itinerary.export",
  version: 1,
  source: "json",
  exportedAt: "2026-06-04T12:00:00.000Z",
  trip: {
    id: TRIP_ID,
    name: "Hong Kong + Shenzhen Trip",
    destinationLabel: "Hong Kong + Shenzhen",
    startDate: "2026-06-18",
    endDate: "2026-06-23",
    activePlanVariantId: PLAN_ID,
    mainTripPlanId: PLAN_ID,
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
  },
  items: [
    {
      id: "import-flight-block",
      pathGroupId: "group-hkg-arrival",
      pathId: "path-main",
      pathName: "Main arrival",
      pathRole: "main",
      itemKind: "travel",
      timeMode: "scheduled",
      isPlanBlock: true,
      status: "confirmed",
      priority: "must",
      day: "2026-06-19",
      sortOrder: 100,
      startTime: "23:00",
      endTime: "02:00",
      endOffsetDays: 1,
      activity: "Flight to Hong Kong",
      activityType: "travel",
      place: "BKK",
      linkLabel: "Map",
      mapLink: "https://maps.example.test",
      durationMinutes: 180,
      transportation: "Flight",
      details: { bookingRef: "QR349" },
      advisories: [],
      note: "Keep airport buffer",
    },
  ],
  records: {
    expenses: [],
    bookingDocs: [],
    stopNotes: [],
    tasks: [],
  },
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("itinerary-import-api normalizeItineraryImport", () => {
  it("POSTs /api/v1/trips/{tripId}/itinerary-imports with content (+ optional mode/fileName/contentType) and returns ItineraryImportDocument on success", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(IMPORT_DOCUMENT),
    );

    const outcome = await normalizeItineraryImport(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        content: SOURCE_CONTENT,
        mode: MODE,
        fileName: FILE_NAME,
        contentType: CONTENT_TYPE,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-imports`,
    );
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);
    expect(JSON.parse(String(init?.body))).toEqual({
      content: SOURCE_CONTENT,
      mode: MODE,
      fileName: FILE_NAME,
      contentType: CONTENT_TYPE,
    });

    expect(outcome.document).toEqual(IMPORT_DOCUMENT);
  });

  it("returns ok:false with API/error message on non-OK (no fake success)", async () => {
    const API_ERROR =
      "You need organizer access to import itinerary for this trip.";
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        {
          error: {
            code: "forbidden",
            message: API_ERROR,
          },
        },
        403,
      ),
    );

    const outcome = await normalizeItineraryImport(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        content: SOURCE_CONTENT,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.error).toBe(API_ERROR);
    expect(outcome).not.toHaveProperty("document");
  });
});
