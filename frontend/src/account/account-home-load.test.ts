import { describe, expect, it, vi } from "vitest";
import { loadAccountHomeData } from "./account-home-load";

const SESSION_TOKEN = "account-session-token-xyz";
const API_BASE = "http://127.0.0.1:5181";
const DISPLAY_NAME = "Aom";
const NOW = new Date(2026, 6, 19, 9, 0, 0);

const TRIP_ID = "018f4e80-0000-7000-a000-0000000000aa";
const MEMBER_ID = "018f4e80-0000-7000-a000-0000000000bb";

/** Independent AccountSettings-shaped body (GET /account). */
const ACCOUNT_SETTINGS_BODY = {
  profile: {
    id: "018f4e80-0000-7000-a000-000000000001",
    displayName: DISPLAY_NAME,
    avatarColor: "#0f766e",
    locale: "th-TH",
    timezone: "Asia/Bangkok",
    homeCity: "Bangkok",
    homeCountry: "Thailand",
    primaryEmail: "aom@example.com",
  },
  passkeys: [],
  trustedDevices: [],
};

/** Independent AccountTripSummary[] body (GET /account/trips). */
const ACCOUNT_TRIPS_BODY = [
  {
    id: TRIP_ID,
    name: "Bangkok - Chiang Mai",
    originLabel: "Bangkok, Thailand",
    destinationLabel: "Chiang Mai",
    countries: ["Thailand"],
    partySize: 4,
    startDate: "2026-12-12",
    endDate: "2026-12-15",
    role: "owner",
    memberId: MEMBER_ID,
    ownerMemberId: MEMBER_ID,
    joinedAt: "2026-05-30T02:00:00Z",
    isOwner: true,
  },
];

/** Independent AccountExplorerSummary body (GET /account/explorer). */
const ACCOUNT_EXPLORER_BODY = {
  upcomingTrips: 1,
  ownedTrips: 1,
  destinationCount: 1,
  nextTrip: ACCOUNT_TRIPS_BODY[0],
};

const ALLOWED_PATH_PREFIXES = [
  "/api/v1/account",
  "/api/v1/account/trips",
  "/api/v1/account/explorer",
] as const;

/** Paths that must never be fetched for account home (placeholders only). */
const FORBIDDEN_PATH_MARKERS = [
  "/social",
  "/friends",
  "/geo",
  "/poi",
  "/places",
  "/stories",
] as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pathOf(url: RequestInfo | URL): string {
  const raw = typeof url === "string" ? url : url.toString();
  return new URL(raw, API_BASE).pathname;
}

function accountHomeFetchMock() {
  return vi.fn<typeof fetch>(async (input) => {
    const path = pathOf(input);
    if (path === "/api/v1/account") {
      return jsonResponse(ACCOUNT_SETTINGS_BODY);
    }
    if (path === "/api/v1/account/trips") {
      return jsonResponse(ACCOUNT_TRIPS_BODY);
    }
    if (path === "/api/v1/account/explorer") {
      return jsonResponse(ACCOUNT_EXPLORER_BODY);
    }
    return jsonResponse({ error: { message: "unexpected endpoint" } }, 404);
  });
}

describe("loadAccountHomeData", () => {
  it("calls only /account, /account/trips, and optionally /account/explorer (never social/geo/POI)", async () => {
    const fetchMock = accountHomeFetchMock();

    await loadAccountHomeData(
      { sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE, now: NOW },
    );

    const paths = fetchMock.mock.calls.map(([url]) => pathOf(url!));
    expect(paths.length).toBeGreaterThan(0);

    for (const path of paths) {
      for (const marker of FORBIDDEN_PATH_MARKERS) {
        expect(path).not.toContain(marker);
      }
      const allowed = ALLOWED_PATH_PREFIXES.some((p) => path === p);
      expect(allowed).toBe(true);
    }

    expect(paths).toContain("/api/v1/account");
    expect(paths).toContain("/api/v1/account/trips");
  });

  it("maps upcoming trip cards and itinerary from live mappers; stories/friends/places stay placeholders without fetch", async () => {
    const fetchMock = accountHomeFetchMock();

    const data = await loadAccountHomeData(
      { sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE, now: NOW },
    );

    // Independent draft-v3 card fields (same literals as trip-cards.test.ts).
    expect(data.upcomingTrips).toEqual([
      {
        id: TRIP_ID,
        title: "Bangkok - Chiang Mai",
        destinationLabel: "Chiang Mai",
        country: "Thailand",
        partySize: 4,
        startDate: "2026-12-12",
        endDate: "2026-12-15",
      },
    ]);

    // Explorer nextTrip preferred; budget always placeholder (no rollup API).
    expect(data.itinerary).toEqual({
      name: "Bangkok - Chiang Mai",
      partySize: 4,
      startDate: "2026-12-12",
      endDate: "2026-12-15",
      budget: { isPlaceholder: true, label: "Budget TBD" },
    });

    expect(data.stories.dataSource).toBe("placeholder");
    expect(data.friends.dataSource).toBe("placeholder");
    expect(data.places.dataSource).toBe("placeholder");

    const paths = fetchMock.mock.calls.map(([url]) => pathOf(url!));
    for (const marker of FORBIDDEN_PATH_MARKERS) {
      expect(paths.some((p) => p.includes(marker))).toBe(false);
    }

    // Live greeting uses displayName from GET /account (draft morning).
    expect(data.greeting).toBe("Good Morning, Aom");
  });
});
