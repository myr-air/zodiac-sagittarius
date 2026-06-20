import { describe, expect, it } from "vitest";
import { findDuplicateBookingDoc } from "./booking-docs";
import { createBookingDocFixture as bookingDoc } from "./booking-docs.test-support";

describe("booking docs facade matching", () => {
  it("matches duplicate booking docs by normalized title, time, type, and itinerary item", () => {
    const duplicateTicket = bookingDoc({
      id: "booking-duplicate",
      type: "flight",
      title: "BKK to HKG flight",
      startsAt: "2026-06-18T09:00:00+07:00",
      relatedItineraryItemIds: ["item-flight"],
    });

    expect(
      findDuplicateBookingDoc([duplicateTicket], {
        type: "flight",
        title: " bkk to hkg flight ",
        status: "draft",
        visibility: "shared",
        startsAt: "2026-06-18T09:00+07:00",
        endsAt: null,
        travelerIds: [],
        externalLinks: [],
        relatedItineraryItemIds: ["item-flight"],
        relatedTaskIds: [],
        relatedExpenseIds: [],
        noteIds: [],
      }),
    ).toBe(duplicateTicket);
  });
});
