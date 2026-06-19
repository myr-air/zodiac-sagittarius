import { describe, expect, it } from "vitest";
import { findDuplicateBookingDoc } from "./booking-doc-matching";
import type { BookingDoc } from "./types";

describe("booking doc matching", () => {
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

function bookingDoc(overrides: Partial<BookingDoc> = {}): BookingDoc {
  return {
    confirmationCode: null,
    createdBy: "member-owner",
    currency: null,
    endsAt: null,
    externalLinks: [],
    id: "booking",
    noteIds: [],
    notes: null,
    ownerMemberId: null,
    priceAmount: null,
    providerName: null,
    relatedExpenseIds: [],
    relatedItineraryItemIds: [],
    relatedTaskIds: [],
    startsAt: null,
    status: "draft",
    timezone: "Asia/Hong_Kong",
    title: "Booking",
    travelerIds: ["member-owner"],
    tripId: "trip-hk",
    tripPlanId: "plan-main",
    type: "hotel",
    updatedAt: "2026-06-19T12:00:00.000Z",
    version: 1,
    visibility: "shared",
    ...overrides,
  };
}
