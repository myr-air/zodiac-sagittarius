import { describe, expect, it } from "vitest";
import type { BookingDoc, ItineraryItem, ItineraryItemDetails } from "@/src/trip/types";
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
  readItineraryDetailString,
  ticketModalCopy,
  toDateTimeLocalValue,
  ticketNotesForItem,
  travelSubtypeForItem,
  travelSubtypeOptions,
  uniqueIds,
  fromDateTimeLocalValue,
} from "./smart-itinerary-table-helpers";

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
    const baseItem = {
      id: "1",
      tripId: "trip",
      planVariantId: "plan",
      day: "2026-06-10",
      sortOrder: 0,
      startTime: "09:00",
      endTime: "11:00",
      endOffsetDays: 0,
      activity: "Flight",
      activityType: "travel",
      activitySubtype: "flight",
      place: "BKK",
      linkLabel: "",
      mapLink: "",
      transportation: "Thai Airways",
      details: {
        subtype: "flight",
        provider: "Thai Airways",
      },
      durationMinutes: 120,
      note: "",
      createdBy: "user",
      updatedAt: "2026-06-01T00:00:00.000Z",
      version: 1,
    } as unknown as ItineraryItem;

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
    const baseItem = {
      id: "2",
      tripId: "trip",
      planVariantId: "plan",
      day: "2026-06-10",
      sortOrder: 0,
      startTime: "09:00",
      endTime: null,
      endOffsetDays: 0,
      activity: "Airport transfer",
      activityType: "travel",
      activitySubtype: null,
      place: "BKK",
      linkLabel: "",
      mapLink: "",
      transportation: "Uber",
      details: {
        notes: "quiet",
      },
      durationMinutes: null,
      note: "",
      createdBy: "user",
      updatedAt: "2026-06-01T00:00:00.000Z",
      version: 1,
    } as unknown as ItineraryItem;

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
        {
          id: "3",
          tripId: "trip",
          planVariantId: "plan",
          day: "2026-06-10",
          sortOrder: 0,
          startTime: "09:00",
          endTime: null,
          endOffsetDays: 0,
          activity: "Taxi",
          activityType: "travel",
          place: "Sukhumvit",
          linkLabel: "",
          mapLink: "",
          transportation: "Grab",
          details: { from: "Airport", to: "Hotel" },
          durationMinutes: null,
          note: "",
          createdBy: "user",
          updatedAt: "2026-06-01T00:00:00.000Z",
          version: 1,
        } as unknown as ItineraryItem,
        "en",
      ),
    ).toContain("From: Airport");

    const booking = {
      id: "b1",
      relatedItineraryItemIds: ["3", "missing"],
      providerName: "Airline",
      status: "booked",
    } as unknown as BookingDoc;
    expect(formatBookingSummary(booking, [{ id: "3", activity: "Taxi" } as ItineraryItem])).toBe(
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
