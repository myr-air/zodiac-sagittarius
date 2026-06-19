import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { BookingDoc } from "@/src/trip/types";
import {
  bookingDocLinkedContext,
  bookingDocMatchesQuery,
  compareBookingStartWithUndated,
} from "./booking-list";

const bookingDocs = seedTrip.bookingDocs ?? [];

describe("booking list helpers", () => {
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
});
