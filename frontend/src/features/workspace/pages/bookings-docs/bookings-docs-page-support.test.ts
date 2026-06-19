import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { BookingDoc } from "@/src/trip/types";
import {
  bookingDocLinkedContext,
  bookingDocMatchesQuery,
  bookingTypeIcon,
  compareBookingStartWithUndated,
  formatDateTime,
  statusBadgeClassName,
  typeIconClassName,
} from "./bookings-docs-page-support";

const bookingDocs = seedTrip.bookingDocs ?? [];

describe("bookings docs page support", () => {
  it("searches titles, linked itinerary, links, and traveler names", () => {
    const flight = bookingDocs.find((doc) => doc.id === "booking-flight-bkk-hkg")!;

    expect(bookingDocMatchesQuery(flight, seedTrip, "Cathay")).toBe(true);
    expect(bookingDocMatchesQuery(flight, seedTrip, "เดินทางออกจากกรุงเทพ")).toBe(true);
    expect(bookingDocMatchesQuery(flight, seedTrip, "Travel Mate")).toBe(true);
    expect(bookingDocMatchesQuery(flight, seedTrip, "not in this booking")).toBe(false);
    expect(bookingDocLinkedContext(flight, seedTrip)).toContain("เดินทางออกจากกรุงเทพฯ");
  });

  it("sorts dated bookings first and keeps undated bookings stable by title", () => {
    const dated = { ...bookingDocs[0], startsAt: "2026-06-18T09:00:00.000Z" } as BookingDoc;
    const undatedA = { ...bookingDocs[0], id: "booking-undated-a", title: "Alpha", startsAt: null } as BookingDoc;
    const undatedB = { ...bookingDocs[0], id: "booking-undated-b", title: "Beta", startsAt: null } as BookingDoc;

    expect([undatedB, dated, undatedA].sort(compareBookingStartWithUndated).map((doc) => doc.title)).toEqual([
      dated.title,
      "Alpha",
      "Beta",
    ]);
  });

  it("formats booking date input values without changing stored semantics", () => {
    expect(formatDateTime(null)).toBe("-");
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
    expect(formatDateTime("2026-06-18T12:30:00.000Z")).toContain("Jun");
  });

  it("keeps selection and visual token helpers centralized", () => {
    expect(bookingTypeIcon("hotel")).toBe("home");
    expect(typeIconClassName("passport")).toContain("text-(--color-primary-strong)");
    expect(statusBadgeClassName("needs_action")).toContain("text-(--color-warning-strong)");
    expect(statusBadgeClassName("expired")).toContain("text-(--color-danger)");
  });
});
