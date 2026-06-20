import { describe, expect, it } from "vitest";
import { buildItineraryBookingTicketDocInput } from "./booking-command-inputs";
import {
  bookingCommandMembers,
  bookingDoc,
} from "./booking-command-inputs.test-support";

describe("booking command ticket doc inputs", () => {
  it("builds ticket booking input while preserving explicit booking metadata", () => {
    const existingBookingDoc = bookingDoc({
      currency: "HKD",
      externalLinks: [
        {
          id: "link-1",
          label: "Voucher",
          provider: "Airline",
          url: "https://example.com",
        },
      ],
      noteIds: ["note-1"],
      priceAmount: 1200,
      relatedExpenseIds: ["expense-1"],
      relatedTaskIds: ["task-1"],
      status: "confirmed",
      timezone: "Asia/Bangkok",
      travelerIds: ["member-existing"],
      tripPlanId: "plan-a",
      type: "flight",
      visibility: "sensitive",
    });

    expect(
      buildItineraryBookingTicketDocInput(
        {
          bookingDocId: existingBookingDoc.id,
          confirmationCode: "CX123",
          itemId: "item-flight",
          notes: "Check in online",
          providerName: "Cathay",
          relatedItineraryItemIds: ["item-flight", "item-hotel"],
          startsAt: "2026-06-18T09:00:00+07:00",
          endsAt: "2026-06-18T12:55:00+08:00",
          status: "draft",
          template: "flight",
          title: "BKK to HKG flight ticket",
          travelerIds: [],
          type: "public_transport",
          visibility: "shared",
        },
        {
          currentMemberId: "member-owner",
          defaultTimezone: "Asia/Hong_Kong",
          existingBookingDoc,
          members: bookingCommandMembers,
        },
      ),
    ).toMatchObject({
      tripPlanId: "plan-a",
      type: "flight",
      status: "confirmed",
      visibility: "sensitive",
      timezone: "Asia/Bangkok",
      priceAmount: 1200,
      currency: "HKD",
      travelerIds: ["member-existing"],
      externalLinks: existingBookingDoc.externalLinks,
      relatedItineraryItemIds: ["item-flight", "item-hotel"],
      relatedTaskIds: ["task-1"],
      relatedExpenseIds: ["expense-1"],
      noteIds: ["note-1"],
      providerName: "Cathay",
      confirmationCode: "CX123",
    });
  });

  it("falls back to trip travelers and timezone for a new ticket booking", () => {
    expect(
      buildItineraryBookingTicketDocInput(
        {
          confirmationCode: null,
          itemId: "item-train",
          notes: null,
          providerName: null,
          relatedItineraryItemIds: [],
          startsAt: null,
          endsAt: null,
          status: "draft",
          template: "train",
          title: "Airport train ticket",
          travelerIds: [],
          type: "train",
          visibility: "shared",
        },
        {
          currentMemberId: "member-owner",
          defaultTimezone: "Asia/Hong_Kong",
          members: bookingCommandMembers,
        },
      ),
    ).toMatchObject({
      ownerMemberId: "member-owner",
      timezone: "Asia/Hong_Kong",
      travelerIds: ["member-owner", "member-traveler"],
      relatedItineraryItemIds: ["item-train"],
    });
  });
});
