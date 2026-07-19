import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { loadPortalTrips } from "./portal-trips-load";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(HERE, "../..");

const SESSION_TOKEN = "account-session-token-xyz";
const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-0000-7000-a000-0000000000aa";

/** Independent AccountTripSummary[] body (GET /account/trips). */
const ACCOUNT_TRIPS_BODY = [
  {
    id: TRIP_ID,
    name: "Seoul Spring",
    destinationLabel: "Seoul",
    countries: ["South Korea"],
    partySize: 6,
    startDate: "2026-04-12",
    endDate: "2026-04-18",
    role: "owner",
  },
];

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

describe("loadPortalTrips", () => {
  it("GETs /account/trips with Bearer session and maps hybrid rows with /trips/{id} hrefs", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      expect(pathOf(input)).toBe("/api/v1/account/trips");
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
      return jsonResponse(ACCOUNT_TRIPS_BODY);
    });

    const loaded = await loadPortalTrips(
      { sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(loaded.trips).toHaveLength(1);
    expect(loaded.rows).toHaveLength(1);
    expect(loaded.rows[0]).toEqual(
      expect.objectContaining({
        title: "Seoul Spring",
        country: "South Korea",
        roleLabel: "Organizer",
        partySize: 6,
        href: `/trips/${TRIP_ID}`,
        startDate: "2026-04-12",
      }),
    );
  });

  it("returns empty rows when the trips request fails (no fabricated destinations)", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({ error: { message: "unauthorized" } }, 401),
    );

    const loaded = await loadPortalTrips(
      { sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(loaded.rows).toEqual([]);
    expect(loaded.trips).toEqual([]);
    expect(JSON.stringify(loaded)).not.toMatch(/Paris|France|Seoul|Thailand/i);
  });
});

describe("portal trips route", () => {
  it("mounts PortalTripsPage at /portal/trips", () => {
    const source = readFileSync(
      join(FRONTEND_ROOT, "app/portal/trips/page.tsx"),
      "utf8",
    );
    expect(source).toMatch(/PortalTripsPage/);
  });
});
