import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { BookingDoc } from "@/src/trip/types";
import {
  bookingDocTestDocs,
  bookingFlightTestDoc,
} from "../../testing/fixtures/bookings-docs-test-fixtures";
import {
  bookingDocLinkedContext,
  bookingDocMatchesQuery,
  compareBookingStartWithUndated,
} from "../booking-list";

describe("booking list helpers", () => {
  it("searches titles, linked itinerary, links, and traveler names", () => {
    expect(bookingDocMatchesQuery(bookingFlightTestDoc, seedTrip, "Cathay")).toBe(
      true,
    );
    expect(
      bookingDocMatchesQuery(
        bookingFlightTestDoc,
        seedTrip,
        "เดินทางออกจากกรุงเทพ",
      ),
    ).toBe(true);
    expect(
      bookingDocMatchesQuery(bookingFlightTestDoc, seedTrip, "Travel Mate"),
    ).toBe(true);
    expect(
      bookingDocMatchesQuery(
        bookingFlightTestDoc,
        seedTrip,
        "not in this booking",
      ),
    ).toBe(false);
    expect(bookingDocLinkedContext(bookingFlightTestDoc, seedTrip)).toContain(
      "เดินทางออกจากกรุงเทพฯ",
    );
  });

  it("sorts dated bookings first and keeps undated bookings stable by title", () => {
    const dated = {
      ...bookingDocTestDocs[0],
      startsAt: "2026-06-18T09:00:00.000Z",
    } as BookingDoc;
    const undatedA = {
      ...bookingDocTestDocs[0],
      id: "booking-undated-a",
      title: "Alpha",
      startsAt: null,
    } as BookingDoc;
    const undatedB = {
      ...bookingDocTestDocs[0],
      id: "booking-undated-b",
      title: "Beta",
      startsAt: null,
    } as BookingDoc;

    expect([undatedB, dated, undatedA].sort(compareBookingStartWithUndated).map((doc) => doc.title)).toEqual([
      dated.title,
      "Alpha",
      "Beta",
    ]);
  });
});
