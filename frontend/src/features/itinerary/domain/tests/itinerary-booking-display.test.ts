import { describe, expect, it } from "vitest";
import type { BookingDoc } from "@/src/trip/types";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  bookingDocTypeForItemTemplate,
  bookingIconForItem,
  bookingTemplateForItem,
  bookingTemplateLabel,
  formatBookingDocTypeLabel,
  formatBookingSummary,
} from "../itinerary-booking-display";

describe("itinerary-booking-display", () => {
  it("derives booking template, type, icon, and label from itinerary activity", () => {
    const flight = buildItineraryItem({
      activity: "Flight to Hong Kong",
      activityType: "travel",
      activitySubtype: "flight",
      transportation: "Thai Airways",
      details: { subtype: "flight" },
    });

    expect(bookingTemplateForItem(flight)).toBe("flight");
    expect(bookingTemplateLabel(flight, "en")).toBe("Flight");
    expect(bookingTemplateLabel(flight, "th")).toBe("เครื่องบิน");
    expect(bookingDocTypeForItemTemplate(flight, "recommended")).toBe("flight");
    expect(bookingIconForItem(flight)).toBe("plane");
  });

  it("uses shared trip booking classification for recommended ticket types", () => {
    expect(
      bookingDocTypeForItemTemplate(
        buildItineraryItem({
          activity: "Harbour night cruise",
          activityType: "experience",
          itemKind: "activity",
        }),
        "recommended",
      ),
    ).toBe("activity_ticket");
  });

  it("summarizes existing booking links for candidate lists", () => {
    const booking: BookingDoc = {
      id: "booking-1",
      tripId: "trip-1",
      type: "train",
      title: "Airport train ticket",
      status: "booked",
      visibility: "shared",
      providerName: "MTR",
      travelerIds: [],
      externalLinks: [],
      relatedItineraryItemIds: ["item-1", "missing"],
      relatedTaskIds: [],
      relatedExpenseIds: [],
      noteIds: [],
      notes: null,
      createdBy: "member-1",
      updatedAt: "2026-06-01T00:00:00.000Z",
      version: 1,
    };

    expect(
      formatBookingSummary(booking, [
        buildItineraryItem({
          id: "item-1",
          activity: "Airport train",
        }),
      ]),
    ).toBe("MTR · Airport train");
  });

  it("formats booking document type labels", () => {
    expect(formatBookingDocTypeLabel("public_transport")).toBe("Public Transport");
    expect(formatBookingDocTypeLabel("activity_ticket")).toBe("Activity Ticket");
  });
});
