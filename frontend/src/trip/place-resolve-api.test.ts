/**
 * place-resolve-api — POST /places/resolve wire contract (M81HY2YR T1 #1).
 * Client must hit /api/v1/trips/{tripId}/places/resolve and return status +
 * candidates (or ok:false with a calm product error on non-OK).
 */
import { describe, expect, it, vi } from "vitest";
import { resolvePlace } from "./place-resolve-api";

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const DAY = "2026-06-19";
const SESSION_TOKEN = "member-session-token-place-resolve";
const CLIENT_MUTATION_ID = "place-resolve-client-1";
const ACTIVITY = "Dim Dim Sum";
const PLACE_HINT = "ติ่มซำ แถว Elements";
const DESTINATION_LABEL = "Hong Kong + Shenzhen";
const COUNTRIES = ["HK"] as const;

const CANDIDATE = {
  name: "Dim Dim Sum",
  address: "The Elements, Hong Kong",
  coordinates: { lat: 22.3049, lng: 114.1617 },
  mapLink:
    "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617",
  confidence: 0.92,
  source: "nominatim",
  evidence: ["brave: Dim Dim Sum Elements"],
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("place-resolve-api resolvePlace", () => {
  it("POSTs /api/v1/trips/{tripId}/places/resolve with clientMutationId, activity, placeHint, destinationLabel, countries, day and returns status + candidates (or ok:false with calm error on non-OK)", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        status: "resolved",
        candidates: [CANDIDATE],
      }),
    );

    const outcome = await resolvePlace(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        clientMutationId: CLIENT_MUTATION_ID,
        activity: ACTIVITY,
        placeHint: PLACE_HINT,
        destinationLabel: DESTINATION_LABEL,
        countries: [...COUNTRIES],
        day: DAY,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/trips/${TRIP_ID}/places/resolve`);
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);
    expect(JSON.parse(String(init?.body))).toEqual({
      clientMutationId: CLIENT_MUTATION_ID,
      activity: ACTIVITY,
      placeHint: PLACE_HINT,
      destinationLabel: DESTINATION_LABEL,
      countries: [...COUNTRIES],
      day: DAY,
    });

    expect(outcome.status).toBe("resolved");
    expect(outcome.candidates).toEqual([CANDIDATE]);

    const API_ERROR =
      "You need edit access to resolve places for this trip.";
    const failFetch = vi.fn<typeof fetch>(async () =>
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

    const failOutcome = await resolvePlace(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        clientMutationId: CLIENT_MUTATION_ID,
        activity: ACTIVITY,
        placeHint: PLACE_HINT,
        destinationLabel: DESTINATION_LABEL,
        countries: [...COUNTRIES],
        day: DAY,
      },
      { fetch: failFetch, apiBaseUrl: API_BASE },
    );

    expect(failOutcome.ok).toBe(false);
    if (failOutcome.ok) return;
    expect(failOutcome.error).toBe(API_ERROR);
  });
});
