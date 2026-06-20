import { describe, expect, it } from "vitest";
import {
  buildItineraryBookingDraftInput,
  buildItineraryBookingTicketDocInput,
  resolveItineraryBookingTicketCommandInput,
} from "./booking-command-inputs";
import {
  bookingCommandMembers,
  bookingDoc,
  itineraryItem,
} from "./booking-command-inputs.test-support";

describe("booking command inputs", () => {
  it("builds itinerary booking draft input from an itinerary item", () => {
    const input = buildItineraryBookingDraftInput({
      currentMemberId: "member-owner",
      defaultTimezone: "Asia/Hong_Kong",
      item: itineraryItem({
        activity: "Sky Terrace",
        activityType: "attraction",
        day: "2026-06-18",
        details: {
          bookingRef: "PK-123",
          costNote: "Group ticket",
          entryWindow: "Enter before noon",
          provider: "Peak Pass",
        },
        endTime: "12:00",
        place: "The Peak",
        startTime: "10:30",
      }),
      members: bookingCommandMembers,
      template: "recommended",
    });

    expect(input).toEqual({
      type: "activity_ticket",
      title: "Sky Terrace ticket draft",
      status: "draft",
      visibility: "shared",
      ownerMemberId: "member-owner",
      providerName: "Peak Pass",
      confirmationCode: "PK-123",
      startsAt: "2026-06-18T10:30:00",
      endsAt: "2026-06-18T12:00:00",
      timezone: "Asia/Hong_Kong",
      priceAmount: null,
      currency: null,
      travelerIds: ["member-owner", "member-traveler"],
      externalLinks: [],
      relatedItineraryItemIds: ["item-1"],
      relatedTaskIds: [],
      relatedExpenseIds: [],
      noteIds: [],
      notes: "Draft from itinerary: The Peak\nEnter before noon\nGroup ticket",
    });
  });

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
