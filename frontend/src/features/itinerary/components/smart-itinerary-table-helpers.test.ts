import { describe, expect, it } from "vitest";
import type { BookingDoc, ItineraryItemDetails } from "@/src/trip/types";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  activityTypeOptions,
  bookingDocTypeForItemTemplate,
  bookingIconForItem,
  bookingTemplateForItem,
  bookingTemplateLabel,
  buildActivitySubtypePatch,
  buildActivityTypePatch,
  endOffsetDaysBetweenTimes,
  formatBookingSummary,
  formatTimeRangeLabel,
  formatTimeTooltip,
  parseTimeToMinutes,
  ticketModalCopy,
  toDateTimeLocalValue,
  ticketNotesForItem,
  travelSubtypeForItem,
  travelSubtypeOptions,
  fromDateTimeLocalValue,
} from "../domain";
import { readItineraryDetailString, uniqueIds } from "../lib";

describe("smart-itinerary-table-helpers", () => {
  it("normalizes time ranges and midnight-overflow offsets", () => {
    expect(parseTimeToMinutes("09:30")).toBe(570);
    expect(parseTimeToMinutes("24:00")).toBeNull();
    expect(endOffsetDaysBetweenTimes("09:00", "10:00")).toBe(0);
    expect(endOffsetDaysBetweenTimes("18:00", "07:30")).toBe(1);
    expect(formatTimeRangeLabel("09:00", "10:00", 0)).toBe("09:00 - 10:00");
    expect(formatTimeRangeLabel("09:00", "07:30", 1)).toBe("09:00 - 07:30 +1");
  });

  it("builds inline picker options from localized activity and travel subtypes", () => {
    expect(activityTypeOptions("en")).toHaveLength(7);
    expect(activityTypeOptions("en")[0]).toMatchObject({ value: "travel", label: "Travel" });
    const th = travelSubtypeOptions("th");
    expect(th.map((item) => item.value)).toEqual([
      "flight",
      "train",
      "bus",
      "taxi",
      "ferry",
      "walk",
      "car",
      "shuttle",
    ]);
    expect(th.find((item) => item.value === "flight")?.label).toBe("เครื่องบิน");
  });

  it("builds booking type and summary helpers from itinerary data", () => {
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
    expect(buildActivityTypePatch(baseItem, "food")).toEqual({
      activityType: "food",
      activitySubtype: null,
      details: {
        provider: "Thai Airways",
      },
    });
  });

  it("builds activity subtype patch without losing unrelated details", () => {
    const baseItem = buildItineraryItem({
      id: "2",
      day: "2026-06-10",
      startTime: "09:00",
      endTime: null,
      endOffsetDays: 0,
      activity: "Airport transfer",
      activityType: "travel",
      activitySubtype: null,
      place: "BKK",
      transportation: "Uber",
      details: {
        notes: "quiet",
      },
      durationMinutes: null,
    });

    expect(buildActivitySubtypePatch(baseItem, "travel", "taxi")).toEqual({
      activityType: "travel",
      activitySubtype: "taxi",
      details: {
        notes: "quiet",
        subtype: "taxi",
      },
    });
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
  });

  it("builds concise time tooltips for row inline UI", () => {
    expect(formatTimeTooltip(
      {
        startTime: "09:00",
        endTime: "10:30",
        endOffsetDays: 0,
        durationMinutes: 90,
      },
      "en",
    )).toBe("09:00 - 10:30\n1 h 30 m");
    expect(formatTimeTooltip(
      {
        startTime: "09:00",
        endTime: null,
        endOffsetDays: 0,
        durationMinutes: null,
      },
      "en",
    )).toBe("09:00");
  });
});
