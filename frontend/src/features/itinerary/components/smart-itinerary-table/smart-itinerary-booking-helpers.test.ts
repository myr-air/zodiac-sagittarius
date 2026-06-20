import { describe, expect, it } from "vitest";
import type { BookingDoc, ItineraryItemDetails } from "@/src/trip/types";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  bookingDocTypeForItemTemplate,
  bookingIconForItem,
  bookingTemplateForItem,
  bookingTemplateLabel,
  formatBookingSummary,
  ticketModalCopy,
  toDateTimeLocalValue,
  ticketNotesForItem,
  travelSubtypeForItem,
  fromDateTimeLocalValue,
} from "../../domain";
import { readItineraryDetailString, toggleId, uniqueIds } from "../../lib";

describe("smart itinerary booking helpers", () => {
  it("builds booking type helpers from itinerary data", () => {
    const baseItem = buildItineraryItem({
      id: "1",
      day: "2026-06-10",
      startTime: "09:00",
      endTime: "11:00",
      endOffsetDays: 0,
      activity: "Flight",
      activityType: "travel",
      activitySubtype: "flight",
      place: "BKK",
      transportation: "Thai Airways",
      details: {
        subtype: "flight",
        provider: "Thai Airways",
      },
      durationMinutes: 120,
    });

    expect(travelSubtypeForItem(baseItem)).toBe("flight");
    expect(bookingTemplateForItem(baseItem)).toBe("flight");
    expect(bookingTemplateLabel(baseItem, "en")).toBe("Flight");
    expect(bookingDocTypeForItemTemplate(baseItem, "recommended")).toBe("flight");
    expect(bookingIconForItem(baseItem)).toBe("plane");
  });

  it("builds booking modal helpers and summary strings", () => {
    const copy = ticketModalCopy("en");
    expect(copy.newTicket).toBe("New ticket");
    expect(copy.title("Dinner")).toBe("Ticket for Dinner");

    expect(readItineraryDetailString(
      { activity: "Dinner", from: "Bangkok", to: "Chiang Mai" } as ItineraryItemDetails,
      "from",
    )).toBe(
      "Bangkok",
    );
    expect(
      ticketNotesForItem(
        buildItineraryItem({
          id: "3",
          day: "2026-06-10",
          startTime: "09:00",
          endTime: null,
          endOffsetDays: 0,
          activity: "Taxi",
          activityType: "travel",
          place: "Sukhumvit",
          transportation: "Grab",
          details: { from: "Airport", to: "Hotel" },
          durationMinutes: null,
        }),
        "en",
      ),
    ).toContain("From: Airport");

    const booking: BookingDoc = {
      id: "b1",
      tripId: "trip-id",
      type: "other",
      title: "Airline ticket",
      status: "booked",
      visibility: "shared",
      travelerIds: [],
      externalLinks: [],
      relatedItineraryItemIds: ["3", "missing"],
      providerName: "Airline",
      relatedTaskIds: [],
      relatedExpenseIds: [],
      noteIds: [],
      notes: null,
      createdBy: "test-user",
      updatedAt: "2026-06-10T00:00:00.000Z",
      version: 1,
    };
    expect(formatBookingSummary(booking, [buildItineraryItem({
      id: "3",
      day: "2026-06-10",
      activity: "Taxi",
      activityType: "travel",
      place: "Sukhumvit",
      transportation: "Grab",
      details: {
        from: "Airport",
        to: "Hotel",
      },
    })])).toBe(
      "Airline · Taxi",
    );

    expect(toDateTimeLocalValue("2026-06-10")).toBe("2026-06-10");
    expect(fromDateTimeLocalValue("2026-06-10T09:45:30.000Z")).toBe("2026-06-10T09:45:30.000Z");
    expect(uniqueIds(["a", "b", "a", "", "c"])).toEqual(["a", "b", "c"]);
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });
});
