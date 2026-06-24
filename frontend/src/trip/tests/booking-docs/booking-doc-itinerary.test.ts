import { describe, expect, it } from "vitest";
import {
  clearItineraryBookingTicketDetails,
  syncItineraryDetailsWithBookingTicket,
} from "../../booking-docs";
import { createItineraryItemFixture as itineraryItem } from "./booking-docs.test-support";

describe("booking doc itinerary ticket helpers", () => {
  it("syncs and clears itinerary booking ticket details", () => {
    const item = itineraryItem("item-flight", "BKK to HKG flight", "2026-06-18");
    const details = syncItineraryDetailsWithBookingTicket(item, {
      itemId: item.id,
      template: "flight",
      type: "flight",
      title: "BKK to HKG flight ticket",
      status: "draft",
      visibility: "shared",
      providerName: "Cathay",
      confirmationCode: "CX123",
      startsAt: "2026-06-18T09:00:00+07:00",
      endsAt: "2026-06-18T12:55:00+08:00",
      travelerIds: ["member-owner"],
      relatedItineraryItemIds: [item.id],
      notes: null,
    });

    expect(details).toMatchObject({
      mode: "flight",
      provider: "Cathay",
      bookingRef: "CX123",
      ticketRef: "CX123",
      ticketStartsAt: "2026-06-18T09:00:00+07:00",
      ticketEndsAt: "2026-06-18T12:55:00+08:00",
    });
    expect(
      clearItineraryBookingTicketDetails({ ...item, details }),
    ).not.toHaveProperty("bookingRef");
  });
});
