/**
 * Map AccountTripSummary rows into H passport booklet view-models.
 */

import type { AccountTripSummary } from "../account/account-api";

export type PortalTripStatus = "Upcoming" | "Planning" | "Past";

export type PortalTripFilter = PortalTripStatus | "All";

export type PortalTripRow = {
  title: string;
  country: string;
  destinationLabel: string;
  roleLabel: string;
  partySize: number;
  status: PortalTripStatus;
  startDate: string;
  endDate: string;
  /** Passport-style document number derived from trip id. */
  docNo: string;
  /** Decorative MRZ lines (not a real ICAO document). */
  mrzLines: [string, string];
  href: string;
};

function roleLabelFor(role: string): string {
  switch (role) {
    case "owner":
    case "organizer":
      return "Organizer";
    case "traveler":
      return "Traveler";
    case "viewer":
      return "Viewer";
    default:
      return role;
  }
}

/** Status from start/end calendar dates vs today (UTC date). */
function statusFromDates(
  startDate: string,
  endDate: string,
  todayIsoDate: string,
): PortalTripStatus {
  if (todayIsoDate > endDate) return "Past";
  if (todayIsoDate < startDate) return "Planning";
  return "Upcoming";
}

function alnumUpper(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Short Joii-style pass number from trip id (stable, display-only). */
export function passportDocNo(tripId: string): string {
  const compact = alnumUpper(tripId.replace(/-/g, ""));
  const a = (compact.slice(0, 4) || "JOII").padEnd(4, "X");
  const b = (compact.slice(-2) || "XX").padEnd(2, "X");
  return `J-${a.slice(0, 4)}-${b.slice(0, 2)}`;
}

function padMrz(value: string, width: number): string {
  const base = alnumUpper(value).slice(0, width);
  return `${base}${"<".repeat(Math.max(0, width - base.length))}`;
}

/** Decorative two-line MRZ for the biodata leaf. */
export function passportMrzLines(
  title: string,
  tripId: string,
): [string, string] {
  const nameLine = `P<JOII${padMrz(title, 36)}`;
  const idLine = `${padMrz(tripId.replace(/-/g, ""), 9)}<0JOI${padMrz(title, 20)}`;
  return [nameLine.slice(0, 44), idLine.slice(0, 44)];
}

export function toPortalTripRow(trip: AccountTripSummary): PortalTripRow {
  const todayIsoDate = new Date().toISOString().slice(0, 10);
  return {
    title: trip.name,
    country: trip.countries[0] ?? "",
    destinationLabel: trip.destinationLabel,
    roleLabel: roleLabelFor(trip.role),
    partySize: trip.partySize,
    status: statusFromDates(trip.startDate, trip.endDate, todayIsoDate),
    startDate: trip.startDate,
    endDate: trip.endDate,
    docNo: passportDocNo(trip.id),
    mrzLines: passportMrzLines(trip.name, trip.id),
    href: `/trips/${trip.id}`,
  };
}

export function toPortalTripRows(trips: AccountTripSummary[]): PortalTripRow[] {
  return trips.map(toPortalTripRow);
}

export type FilterPortalTripRowsInput = {
  filter: PortalTripFilter;
  query: string;
};

function rowMatchesQuery(row: PortalTripRow, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const haystack = [
    row.title,
    row.destinationLabel,
    row.country,
    row.roleLabel,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalizedQuery);
}

/**
 * Client-side status filter + search over loaded passport rows.
 * Status chips match `row.status`; All skips status. Search is AND with filter.
 */
export function filterPortalTripRows(
  rows: readonly PortalTripRow[],
  input: FilterPortalTripRowsInput,
): PortalTripRow[] {
  const normalizedQuery = input.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (input.filter !== "All" && row.status !== input.filter) return false;
    return rowMatchesQuery(row, normalizedQuery);
  });
}
