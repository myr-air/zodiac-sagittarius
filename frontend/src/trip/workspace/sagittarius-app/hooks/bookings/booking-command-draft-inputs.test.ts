import { describe, expect, it } from "vitest";
import { buildItineraryBookingDraftInput } from "./booking-command-draft-inputs";
import {
  bookingCommandMembers,
  itineraryItem,
} from "./booking-command-inputs.test-support";

describe("booking command draft inputs", () => {
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
});
