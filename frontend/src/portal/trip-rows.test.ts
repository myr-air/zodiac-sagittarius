import { describe, expect, it } from "vitest";
import type { AccountTripSummary } from "../account/account-api";
import {
  filterPortalTripRows,
  passportDocNo,
  passportMrzLines,
  toPortalTripRow,
  toPortalTripRows,
  type PortalTripRow,
} from "./trip-rows";

/** UTC calendar date offset from real now (avoids vi.setSystemTime; works under bun test). */
function utcDateOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Independent fixture shaped like AccountTripSummary (camelCase API body). */
function seoulTrip(
  overrides: Partial<AccountTripSummary> = {},
): AccountTripSummary {
  return {
    id: "018f4e80-0000-7000-a000-0000000000bb",
    name: "Seoul Spring",
    destinationLabel: "Seoul",
    countries: ["South Korea"],
    partySize: 6,
    startDate: utcDateOffset(-2),
    endDate: utcDateOffset(5),
    role: "owner",
    ...overrides,
  };
}

describe("toPortalTripRow", () => {
  it("maps passport booklet fields: title, country, destination, role, party, status, dates, docNo, mrz, href", () => {
    const upcoming = seoulTrip();
    const row = toPortalTripRow(upcoming);

    expect(row.title).toBe("Seoul Spring");
    expect(row.country).toBe("South Korea");
    expect(row.destinationLabel).toBe("Seoul");
    expect(row.roleLabel).toBe("Organizer");
    expect(row.partySize).toBe(6);
    expect(row.status).toBe("Upcoming");
    expect(row.startDate).toBe(upcoming.startDate);
    expect(row.endDate).toBe(upcoming.endDate);
    expect(row.docNo).toBe(passportDocNo(upcoming.id));
    expect(row.mrzLines).toEqual(passportMrzLines(upcoming.name, upcoming.id));
    expect(row.href).toBe("/trips/018f4e80-0000-7000-a000-0000000000bb");

    expect(
      toPortalTripRow(
        seoulTrip({
          id: "018f4e80-0000-7000-a000-0000000000cc",
          startDate: utcDateOffset(10),
          endDate: utcDateOffset(17),
          role: "traveler",
        }),
      ).status,
    ).toBe("Planning");
    expect(
      toPortalTripRow(
        seoulTrip({
          id: "018f4e80-0000-7000-a000-0000000000dd",
          startDate: utcDateOffset(-40),
          endDate: utcDateOffset(-30),
          role: "viewer",
        }),
      ).status,
    ).toBe("Past");
  });
});

describe("passportDocNo / passportMrzLines", () => {
  it("builds stable display-only pass number and two MRZ lines", () => {
    const id = "018f4e80-0000-7000-a000-0000000000bb";
    expect(passportDocNo(id)).toMatch(/^J-[A-Z0-9]{4}-[A-Z0-9]{2}$/);
    const mrz = passportMrzLines("Seoul Spring", id);
    expect(mrz).toHaveLength(2);
    expect(mrz[0]).toMatch(/^P<JOII/);
    expect(mrz[0]!.length).toBeLessThanOrEqual(44);
    expect(mrz[1]!.length).toBeLessThanOrEqual(44);
  });
});

describe("toPortalTripRows", () => {
  it("yields zero passport rows for an empty trips array (no fabricated destinations)", async () => {
    const mod = await import("./trip-rows");
    const toPortalTripRowsFn = (
      mod as { toPortalTripRows?: (trips: AccountTripSummary[]) => unknown[] }
    ).toPortalTripRows;

    expect(typeof toPortalTripRowsFn).toBe("function");
    const rows = toPortalTripRowsFn!([]);

    expect(rows).toEqual([]);
    expect(rows).toHaveLength(0);
    expect(JSON.stringify(rows)).not.toMatch(/Paris|France|Seoul|Thailand/i);
  });
});

describe("filterPortalTripRows", () => {
  const rows: PortalTripRow[] = toPortalTripRows([
    seoulTrip({
      id: "018f4e80-0000-7000-a000-0000000000aa",
      name: "Seoul Spring",
      destinationLabel: "Seoul",
      countries: ["South Korea"],
      startDate: utcDateOffset(-2),
      endDate: utcDateOffset(5),
      role: "owner",
    }),
    seoulTrip({
      id: "018f4e80-0000-7000-a000-0000000000bb",
      name: "Chiang Mai Slow Week",
      destinationLabel: "Chiang Mai",
      countries: ["Thailand"],
      startDate: utcDateOffset(10),
      endDate: utcDateOffset(17),
      role: "traveler",
    }),
    seoulTrip({
      id: "018f4e80-0000-7000-a000-0000000000cc",
      name: "Tokyo Rail Loop",
      destinationLabel: "Tokyo",
      countries: ["Japan"],
      startDate: utcDateOffset(-40),
      endDate: utcDateOffset(-30),
      role: "viewer",
    }),
  ]);

  it("buckets by status; All returns every row", () => {
    expect(
      filterPortalTripRows(rows, { filter: "Upcoming", query: "" }).map(
        (r) => r.title,
      ),
    ).toEqual(["Seoul Spring"]);
    expect(
      filterPortalTripRows(rows, { filter: "Planning", query: "" }).map(
        (r) => r.title,
      ),
    ).toEqual(["Chiang Mai Slow Week"]);
    expect(
      filterPortalTripRows(rows, { filter: "Past", query: "" }).map(
        (r) => r.title,
      ),
    ).toEqual(["Tokyo Rail Loop"]);
    expect(
      filterPortalTripRows(rows, { filter: "All", query: "" }),
    ).toHaveLength(3);
  });

  it("searches title, destination, country, and role case-insensitively", () => {
    expect(
      filterPortalTripRows(rows, { filter: "All", query: "  thailand " }).map(
        (r) => r.title,
      ),
    ).toEqual(["Chiang Mai Slow Week"]);
    expect(
      filterPortalTripRows(rows, { filter: "All", query: "ORGANIZER" }).map(
        (r) => r.title,
      ),
    ).toEqual(["Seoul Spring"]);
    expect(
      filterPortalTripRows(rows, { filter: "All", query: "zzz-miss" }),
    ).toEqual([]);
  });

  it("composes status filter AND search; empty query does not narrow", () => {
    expect(
      filterPortalTripRows(rows, {
        filter: "Planning",
        query: "tokyo",
      }),
    ).toEqual([]);
    expect(
      filterPortalTripRows(rows, {
        filter: "Planning",
        query: "chiang",
      }).map((r) => r.title),
    ).toEqual(["Chiang Mai Slow Week"]);
    expect(
      filterPortalTripRows(rows, { filter: "Upcoming", query: "   " }),
    ).toHaveLength(1);
  });
});
