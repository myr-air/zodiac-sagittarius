import { describe, expect, it } from "vitest";
import {
  bookingDocInputFromRecord,
  createLocalBookingDoc,
  removeBookingDocFromTrip,
  replaceBookingDocInTrip,
  updateLocalBookingDocInTrip,
} from "./booking-doc-local";
import type { BookingDoc } from "./types";

describe("booking doc local trip mutations", () => {
  it("creates and updates local booking docs without mutating the trip", () => {
    const trip = { id: "trip-hk", bookingDocs: [bookingDoc({ id: "booking-1" })] };
    const input = bookingDocInputFromRecord(trip.bookingDocs[0], {
      externalLinks: [{ id: "", label: "Voucher", url: "https://example.com", provider: null, accessNote: null }],
      title: "Updated voucher",
    });

    const created = createLocalBookingDoc(trip, input, {
      createdBy: "member-owner",
      nextBookingDocId: () => "booking-2",
      title: "Local voucher",
      tripPlanId: "plan-main",
      updatedAt: "2026-06-19T12:00:00.000Z",
    });
    const updatedTrip = updateLocalBookingDocInTrip(
      { ...trip, bookingDocs: [...trip.bookingDocs, created] },
      "booking-2",
      input,
      { title: "Updated voucher", updatedAt: "2026-06-20T12:00:00.000Z" },
    );

    expect(created).toMatchObject({
      id: "booking-2",
      title: "Local voucher",
      tripId: "trip-hk",
      tripPlanId: "plan-main",
      version: 1,
    });
    expect(created.externalLinks[0]?.id).toBe("link-local-1");
    expect(trip.bookingDocs).toHaveLength(1);
    expect(updatedTrip.bookingDocs.find((doc) => doc.id === "booking-2")).toMatchObject({
      title: "Updated voucher",
      updatedAt: "2026-06-20T12:00:00.000Z",
      version: 2,
    });
  });

  it("replaces and removes booking docs immutably", () => {
    const original = bookingDoc({ id: "booking-1", title: "Original" });
    const replacement = bookingDoc({ id: "booking-1", title: "Replacement" });
    const trip = { bookingDocs: [original, bookingDoc({ id: "booking-2" })] };

    const replaced = replaceBookingDocInTrip(trip, replacement);
    const removed = removeBookingDocFromTrip(replaced, "booking-2");

    expect(replaced.bookingDocs[0]).toBe(replacement);
    expect(trip.bookingDocs[0]).toBe(original);
    expect(removed.bookingDocs.map((doc) => doc.id)).toEqual(["booking-1"]);
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
    ownerMemberId: "member-owner",
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
