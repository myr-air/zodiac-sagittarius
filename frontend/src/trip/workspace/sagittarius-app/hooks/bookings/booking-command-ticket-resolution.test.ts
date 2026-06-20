import { describe, expect, it } from "vitest";
import { resolveItineraryBookingTicketCommandInput } from "./booking-command-inputs";
import {
  bookingCommandMembers,
  bookingDoc,
} from "./booking-command-inputs.test-support";

describe("booking command ticket resolution", () => {
  it("resolves an explicit ticket booking target and preserves its metadata", () => {
    const existingBookingDoc = bookingDoc({
      id: "booking-explicit",
      status: "confirmed",
      travelerIds: ["member-existing"],
      type: "flight",
    });

    const result = resolveItineraryBookingTicketCommandInput(
      {
        bookingDocId: existingBookingDoc.id,
        confirmationCode: "CX123",
        itemId: "item-flight",
        notes: null,
        providerName: "Cathay",
        relatedItineraryItemIds: [],
        startsAt: null,
        endsAt: null,
        status: "draft",
        template: "flight",
        title: "BKK to HKG flight ticket",
        travelerIds: [],
        type: "public_transport",
        visibility: "shared",
      },
      {
        bookingDocs: [existingBookingDoc],
        currentMemberId: "member-owner",
        defaultTimezone: "Asia/Hong_Kong",
        members: bookingCommandMembers,
      },
    );

    expect(result.existingBookingDoc).toBe(existingBookingDoc);
    expect(result.bookingDocInput).toMatchObject({
      status: "confirmed",
      travelerIds: ["member-existing"],
      type: "flight",
    });
  });

  it("resolves a duplicate ticket booking target when no explicit target exists", () => {
    const duplicateBookingDoc = bookingDoc({
      id: "booking-duplicate",
      relatedItineraryItemIds: ["item-flight"],
      startsAt: "2026-06-18T09:00",
      title: "BKK to HKG flight ticket",
      type: "flight",
    });

    const result = resolveItineraryBookingTicketCommandInput(
      {
        confirmationCode: "CX123",
        itemId: "item-flight",
        notes: null,
        providerName: "Cathay",
        relatedItineraryItemIds: [],
        startsAt: "2026-06-18T09:00:00",
        endsAt: null,
        status: "draft",
        template: "flight",
        title: "BKK to HKG flight ticket",
        travelerIds: [],
        type: "flight",
        visibility: "shared",
      },
      {
        bookingDocs: [duplicateBookingDoc],
        currentMemberId: "member-owner",
        defaultTimezone: "Asia/Hong_Kong",
        members: bookingCommandMembers,
      },
    );

    expect(result.existingBookingDoc).toBe(duplicateBookingDoc);
    expect(result.bookingDocInput.relatedItineraryItemIds).toEqual([
      "item-flight",
    ]);
  });
});
