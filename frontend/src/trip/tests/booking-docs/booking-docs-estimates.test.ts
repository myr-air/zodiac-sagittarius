import { describe, expect, it } from "vitest";
import {
  bookingDraftDetailsForItineraryItem,
  bookingDraftTimeWindowForItineraryItem,
  bookingDraftTitleForItineraryItem,
  bookingDocInputForExpenseEstimate,
  bookingTypeForItemClassification,
  bookingTypeForBookingTemplate,
  bookingTypeForExpenseEstimate,
  bookingTypeForItineraryItem,
  formatBookingDocTypeLabel,
} from "../../booking-docs";
import {
  bookingDocTestDocs as docs,
  bookingDocTestMembers as members,
  createBookingDocTripFixture as tripFixture,
  createItineraryItemFixture as itineraryItem,
} from "./booking-docs.test-support";
import type { Expense, ItineraryItem } from "../../types";

describe("booking doc estimates", () => {
  it("classifies itinerary rows and expense estimates into booking types", () => {
    const baseItem = itineraryItem("item-transfer", "รถรับส่งไปสนามบิน", "2026-06-18");

    expect(
      bookingTypeForItineraryItem({
        ...baseItem,
        activity: "บินไปฮ่องกง",
        transportation: "เครื่องบิน",
      }),
    ).toBe("flight");
    expect(
      bookingTypeForItineraryItem({
        ...baseItem,
        activity: "นั่งรถไฟเข้าเมือง",
        transportation: "รถไฟ",
      }),
    ).toBe("train");
    expect(
      bookingTypeForItineraryItem({
        ...baseItem,
        activity: "เช็คอินโรงแรม",
        activityType: "experience",
        itemKind: "activity",
        transportation: "",
      }),
    ).toBe("hotel");
    expect(bookingTypeForBookingTemplate("activity_ticket")).toBe("activity_ticket");
    expect(bookingTypeForExpenseEstimate({ category: "stay" } as Expense)).toBe("hotel");
    expect(bookingTypeForExpenseEstimate({ category: "transport" } as Expense)).toBe("public_transport");
  });

  it("classifies item category fields through one shared booking type helper", () => {
    expect(bookingTypeForItemClassification({ activitySubtype: "flight" })).toBe("flight");
    expect(bookingTypeForItemClassification({ activitySubtype: "train" })).toBe("train");
    expect(bookingTypeForItemClassification({ activityType: "travel" })).toBe("public_transport");
    expect(bookingTypeForItemClassification({ itemKind: "lodging" })).toBe("hotel");
    expect(bookingTypeForItemClassification({ activityType: "experience" })).toBe("activity_ticket");
    expect(bookingTypeForItemClassification({ activityType: "food" })).toBe("other");
  });

  it("formats booking document type fallback labels from the booking domain", () => {
    expect(formatBookingDocTypeLabel("public_transport")).toBe("Public Transport");
    expect(formatBookingDocTypeLabel("activity_ticket")).toBe("Activity Ticket");
  });

  it("builds booking estimate inputs from actual expenses", () => {
    const trip = tripFixture(docs);

    expect(
      bookingDocInputForExpenseEstimate(
        {
          id: "expense-hotel",
          title: "Hotel balance",
          amount: 4400,
          currency: "HKD",
          paidBy: "member-owner",
          category: "stay",
          splits: { "member-owner": 2200, "member-traveler": 2200 },
          itineraryItemId: "item-hotel",
          tripPlanId: null,
        },
        {
          currentMemberId: "member-owner",
          defaultTimezone: "Asia/Hong_Kong",
          members,
          itineraryItems: trip.itineraryItems,
          selectedTripPlanId: "plan-selected",
          mainTripPlanId: "plan-main",
          activePlanVariantId: "plan-active",
        },
      ),
    ).toEqual({
      tripPlanId: "plan-selected",
      type: "hotel",
      title: "Estimate: Hotel balance",
      status: "draft",
      visibility: "shared",
      ownerMemberId: "member-owner",
      providerName: null,
      confirmationCode: null,
      startsAt: null,
      endsAt: null,
      timezone: "Asia/Hong_Kong",
      priceAmount: 4400,
      currency: "HKD",
      travelerIds: members.map((member) => member.id),
      externalLinks: [],
      relatedItineraryItemIds: ["item-hotel"],
      relatedTaskIds: [],
      relatedExpenseIds: [],
      noteIds: [],
      notes: [
        "Plan estimate copied from an Actual Expense. This does not create or move real money.",
        "Source actual expense: Hotel balance",
      ].join("\n"),
    });
  });

  it("falls back to trip-level plan and HKD for expense booking estimates", () => {
    expect(
      bookingDocInputForExpenseEstimate(
        {
          id: "expense-snacks",
          title: "Snacks",
          amount: 120,
          paidBy: "member-owner",
          category: "food",
          splits: { "member-owner": 120 },
          itineraryItemId: "missing-item",
        },
        {
          currentMemberId: "member-owner",
          members,
          itineraryItems: [],
          mainTripPlanId: "plan-main",
          activePlanVariantId: "plan-active",
        },
      ),
    ).toMatchObject({
      tripPlanId: "plan-main",
      type: "other",
      currency: "HKD",
      timezone: null,
      relatedItineraryItemIds: [],
    });
  });

  it("builds booking drafts from itinerary details", () => {
    const item = {
      ...itineraryItem("item-ticket", "Peak Tram", "2026-06-18"),
      activityType: "attraction",
      place: "The Peak",
      startTime: "10:30",
      endTime: "12:00",
      details: {
        provider: "Peak Tram",
        bookingRef: "PK-123",
        entryWindow: "Enter before noon",
        costNote: "Group ticket",
      },
    } as ItineraryItem;

    expect(bookingDraftTitleForItineraryItem(item, "activity_ticket")).toBe(
      "Peak Tram ticket draft",
    );
    expect(bookingDraftDetailsForItineraryItem(item)).toEqual({
      providerName: "Peak Tram",
      confirmationCode: "PK-123",
      notes: "Draft from itinerary: The Peak\nEnter before noon\nGroup ticket",
    });
    expect(bookingDraftTimeWindowForItineraryItem(item)).toEqual({
      startsAt: "2026-06-18T10:30:00",
      endsAt: "2026-06-18T12:00:00",
    });
  });
});
