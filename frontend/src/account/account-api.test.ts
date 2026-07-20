import { describe, expect, it, vi } from "vitest";
import {
  classifyAccountTripSeed,
  createAccountTrip,
  fetchAccountExplorer,
  fetchAccountSettings,
  fetchAccountTrips,
} from "./account-api";

const SESSION_TOKEN = "account-session-token-xyz";
const API_BASE = "http://127.0.0.1:5181";
const DISPLAY_NAME = "Aom";
const MEMBER_SESSION_TOKEN = "member-session-token-abc";
const CREATED_AT = "2026-07-19T00:00:00Z";
const EXPIRES_AT = "2026-07-26T00:00:00Z";

/** Independent fixture shaped like AccountSettings (camelCase API body). */
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

const TRIP_ID = "018f4e80-0000-7000-a000-0000000000aa";
const MEMBER_ID = "018f4e80-0000-7000-a000-0000000000bb";

/** Independent fixture shaped like AccountTripSummary[] (camelCase API body). */
const ACCOUNT_TRIPS_BODY = [
  {
    id: TRIP_ID,
    name: "Bangkok - Chiang Mai",
    originLabel: "Bangkok, Thailand",
    originCity: "Bangkok",
    originCountry: "Thailand",
    originCountryCode: "TH",
    destinationLabel: "Chiang Mai",
    destinationCities: [
      {
        city: "Chiang Mai",
        country: "Thailand",
        countryCode: "TH",
        timezone: "Asia/Bangkok",
        latitude: 18.7883,
        longitude: 98.9853,
      },
    ],
    countries: ["Thailand"],
    partySize: 4,
    defaultTimezone: "Asia/Bangkok",
    startDate: "2026-12-12",
    endDate: "2026-12-15",
    role: "owner",
    memberId: MEMBER_ID,
    ownerMemberId: MEMBER_ID,
    joinedAt: "2026-05-30T02:00:00Z",
    isOwner: true,
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchAccountSettings", () => {
  it("GETs {apiBase}/api/v1/account with Authorization Bearer {sessionToken}", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(ACCOUNT_SETTINGS_BODY),
    );

    await fetchAccountSettings(
      { sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/account`);
    expect(init?.method).toBe("GET");

    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
  });

  it("on 200 exposes profile.displayName from the AccountSettings body", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(ACCOUNT_SETTINGS_BODY),
    );

    const outcome = await fetchAccountSettings(
      { sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.profile.displayName).toBe(DISPLAY_NAME);
  });

  it("on 401 or network failure returns typed failure with a user-safe error (does not throw Response)", async () => {
    const unauthorized = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        {
          error: {
            code: "unauthorized",
            message: "Session is missing or invalid.",
          },
        },
        401,
      ),
    );

    const unauthorizedOutcome = await fetchAccountSettings(
      { sessionToken: SESSION_TOKEN },
      { fetch: unauthorized, apiBaseUrl: API_BASE },
    );

    expect(unauthorizedOutcome).not.toBeInstanceOf(Response);
    expect(unauthorizedOutcome.ok).toBe(false);
    if (unauthorizedOutcome.ok) return;
    expect(typeof unauthorizedOutcome.error).toBe("string");
    expect(unauthorizedOutcome.error.length).toBeGreaterThan(0);
    expect(unauthorizedOutcome.error).not.toMatch(/\[object |StatusText|stack/i);

    const network = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });

    const networkOutcome = await fetchAccountSettings(
      { sessionToken: SESSION_TOKEN },
      { fetch: network, apiBaseUrl: API_BASE },
    );

    expect(networkOutcome).not.toBeInstanceOf(Response);
    expect(networkOutcome.ok).toBe(false);
    if (networkOutcome.ok) return;
    expect(networkOutcome.error).toBe(
      "Could not reach the server. Check your connection and try again.",
    );
  });
});

describe("fetchAccountTrips", () => {
  it("GETs {apiBase}/api/v1/account/trips with Bearer sessionToken and parses AccountTripSummary array", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(ACCOUNT_TRIPS_BODY),
    );

    const outcome = await fetchAccountTrips(
      { sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/account/trips`);
    expect(init?.method).toBe("GET");

    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.trips).toHaveLength(1);
    expect(outcome.trips[0]).toMatchObject({
      id: TRIP_ID,
      name: "Bangkok - Chiang Mai",
      destinationLabel: "Chiang Mai",
      countries: ["Thailand"],
      partySize: 4,
      startDate: "2026-12-12",
      endDate: "2026-12-15",
    });
  });

  it("includes role from the AccountTripSummary API body alongside id/name/dates/party/countries", async () => {
    const ROLE = "traveler";
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse([
        {
          ...ACCOUNT_TRIPS_BODY[0],
          role: ROLE,
          isOwner: false,
        },
      ]),
    );

    const outcome = await fetchAccountTrips(
      { sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    // Independent literal: role must be copied from the JSON body, not dropped.
    expect(outcome.trips[0]).toEqual(
      expect.objectContaining({
        id: TRIP_ID,
        name: "Bangkok - Chiang Mai",
        countries: ["Thailand"],
        partySize: 4,
        startDate: "2026-12-12",
        endDate: "2026-12-15",
        role: ROLE,
      }),
    );
  });
});

/** Independent fixture shaped like AccountExplorerSummary (camelCase API body). */
const ACCOUNT_EXPLORER_BODY = {
  upcomingTrips: 1,
  ownedTrips: 1,
  destinationCount: 1,
  nextTrip: ACCOUNT_TRIPS_BODY[0],
};

describe("fetchAccountExplorer", () => {
  it("GETs {apiBase}/api/v1/account/explorer with Bearer sessionToken", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(ACCOUNT_EXPLORER_BODY),
    );

    const outcome = await fetchAccountExplorer(
      { sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/account/explorer`);
    expect(init?.method).toBe("GET");

    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.explorer.nextTrip).toMatchObject({
      id: TRIP_ID,
      name: "Bangkok - Chiang Mai",
      partySize: 4,
      startDate: "2026-12-12",
      endDate: "2026-12-15",
    });
  });
});

/** Independent fixture shaped like AccountTripCreateResponse (camelCase API body). */
const ACCOUNT_TRIP_CREATE_BODY = {
  trip: {
    id: TRIP_ID,
    name: "Chiang Mai Loop",
    destinationLabel: "Chiang Mai",
  },
  ownerMemberId: MEMBER_ID,
  memberSession: {
    tripId: TRIP_ID,
    memberId: MEMBER_ID,
    sessionToken: MEMBER_SESSION_TOKEN,
    createdAt: CREATED_AT,
    expiresAt: EXPIRES_AT,
  },
};

describe("createAccountTrip", () => {
  it("POSTs /api/v1/account/trips with Bearer sessionToken and slim seed; on 200 parses trip.id, ownerMemberId, memberSession", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(ACCOUNT_TRIP_CREATE_BODY),
    );

    const slimSeed = {
      name: "Chiang Mai Loop",
      destinationLabel: "Chiang Mai",
    };

    const outcome = await createAccountTrip(
      { sessionToken: SESSION_TOKEN, seed: slimSeed },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/account/trips`);
    expect(init?.method).toBe("POST");

    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);

    const posted = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(posted).toMatchObject(slimSeed);
    expect(posted).not.toHaveProperty("joinId");
    expect(posted).not.toHaveProperty("joinPassword");
    expect("joinId" in posted).toBe(false);
    expect("joinPassword" in posted).toBe(false);

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.trip.id).toBe(TRIP_ID);
    expect(outcome.ownerMemberId).toBe(MEMBER_ID);
    expect(outcome.memberSession).toEqual({
      tripId: TRIP_ID,
      memberId: MEMBER_ID,
      sessionToken: MEMBER_SESSION_TOKEN,
      createdAt: CREATED_AT,
      expiresAt: EXPIRES_AT,
    });
  });
});

const CLASSIFY_BODY = {
  name: "Kyoto",
  destinations: [
    { label: "Kyoto", role: "primary" },
    { label: "Osaka", role: "optional" },
  ],
  when: {
    mode: "months",
    startY: 2026,
    startM: 9,
    endY: 2026,
    endM: 10,
  },
  confidence: "high",
  recommendations: {
    styles: ["food"],
    relatedPlaces: ["Nara"],
    seasonHint: "autumn",
  },
};

describe("classifyAccountTripSeed", () => {
  it("POSTs /api/v1/account/classify-trip-seed and parses structure + recommendations", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(CLASSIFY_BODY),
    );

    const outcome = await classifyAccountTripSeed(
      { sessionToken: SESSION_TOKEN, text: "Japan food trip" },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/account/classify-trip-seed`);
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(JSON.parse(String(init?.body))).toEqual({ text: "Japan food trip" });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.seed.name).toBe("Kyoto");
    expect(outcome.seed.destinations).toEqual(CLASSIFY_BODY.destinations);
    expect(outcome.seed.when).toEqual(CLASSIFY_BODY.when);
    expect(outcome.seed.confidence).toBe("high");
    expect(outcome.seed.recommendations).toEqual(CLASSIFY_BODY.recommendations);
    expect(outcome.seed).not.toHaveProperty("joinId");
    expect(outcome.seed).not.toHaveProperty("joinPassword");
  });
});
