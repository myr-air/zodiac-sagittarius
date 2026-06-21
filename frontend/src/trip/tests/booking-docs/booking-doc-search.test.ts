import { describe, expect, it } from "vitest";
import {
  bookingDocLinkedContext,
  bookingDocMatchesQuery,
  compareBookingStartWithUndated,
} from "../../booking-doc-search";
import {
  bookingDocTestDocs as docs,
  createBookingDocFixture as bookingDoc,
  createBookingDocTripFixture as tripFixture,
} from "./booking-docs.test-support";

describe("booking doc search helpers", () => {
  it("matches booking text, linked itinerary context, external links, and traveler names", () => {
    const trip = tripFixture(docs);
    const flight = {
      ...docs[0],
      externalLinks: [
        { id: "link-flight", label: "Airline portal", url: "https://flight.example", provider: "Airline", accessNote: "Use group code" },
      ],
    };

    expect(bookingDocMatchesQuery(flight, trip, "BKK")).toBe(true);
    expect(bookingDocMatchesQuery(flight, trip, "flight.example")).toBe(true);
    expect(bookingDocMatchesQuery(flight, trip, "Hong Kong")).toBe(true);
    expect(bookingDocMatchesQuery(flight, trip, "Owner")).toBe(true);
    expect(bookingDocMatchesQuery(flight, trip, "not in this booking")).toBe(false);
    expect(bookingDocLinkedContext(flight, trip)).toContain("BKK to HKG flight");
  });

  it("sorts dated bookings before undated bookings and then by title", () => {
    const dated = bookingDoc({
      id: "booking-dated",
      title: "Zoo dated",
      startsAt: "2026-06-18T09:00:00.000Z",
    });
    const undatedA = bookingDoc({ id: "booking-undated-a", title: "Alpha", startsAt: null });
    const undatedB = bookingDoc({ id: "booking-undated-b", title: "Beta", startsAt: null });

    expect([undatedB, dated, undatedA].sort(compareBookingStartWithUndated).map((doc) => doc.title)).toEqual([
      "Zoo dated",
      "Alpha",
      "Beta",
    ]);
  });
});
