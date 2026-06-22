import { describe, expect, it } from "vitest";
import { findBookingDocById, findDuplicateBookingDoc } from "../../booking-docs";
import { createBookingDocFixture as bookingDoc } from "./booking-docs.test-support";

describe("booking doc matching", () => {
  it("finds booking docs by id and falls back to null for empty or missing ids", () => {
    const target = bookingDoc({ id: "booking-target" });

    expect(findBookingDocById([target], "booking-target")).toBe(target);
    expect(findBookingDocById([target], "")).toBeNull();
    expect(findBookingDocById([target], null)).toBeNull();
    expect(findBookingDocById([target], undefined)).toBeNull();
    expect(findBookingDocById([target], "missing-booking")).toBeNull();
  });

  it("matches duplicate docs by normalized title, type, time, and linked item", () => {
    const duplicate = bookingDoc({
      endsAt: "2026-06-19T12:00:00+08:00",
      relatedItineraryItemIds: ["item-flight"],
      startsAt: "2026-06-19T09:00:00+08:00",
      title: "  Flight Ticket  ",
      type: "flight",
    });

    expect(
      findDuplicateBookingDoc([duplicate], {
        confirmationCode: null,
        currency: null,
        endsAt: "2026-06-19T12:00+08:00",
        externalLinks: [],
        noteIds: [],
        ownerMemberId: null,
        priceAmount: null,
        providerName: null,
        relatedExpenseIds: [],
        relatedItineraryItemIds: ["item-flight"],
        relatedTaskIds: [],
        startsAt: "2026-06-19T09:00+08:00",
        status: "draft",
        timezone: "Asia/Hong_Kong",
        title: "flight ticket",
        travelerIds: ["member-owner"],
        type: "flight",
        visibility: "shared",
      }),
    ).toBe(duplicate);

    expect(
      findDuplicateBookingDoc([duplicate], {
        confirmationCode: null,
        currency: null,
        endsAt: "2026-06-19T12:00+08:00",
        externalLinks: [],
        noteIds: [],
        ownerMemberId: null,
        priceAmount: null,
        providerName: null,
        relatedExpenseIds: [],
        relatedItineraryItemIds: ["item-flight"],
        relatedTaskIds: [],
        startsAt: "2026-06-19T09:00+08:00",
        status: "draft",
        timezone: "Asia/Hong_Kong",
        title: "later flight ticket",
        travelerIds: ["member-owner"],
        type: "flight",
        visibility: "shared",
      }),
    ).toBeNull();
  });
});
