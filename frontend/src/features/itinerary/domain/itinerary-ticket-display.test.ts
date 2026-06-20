import { describe, expect, it } from "vitest";
import { buildItineraryItem } from "@/src/features/itinerary/testing";
import {
  bookingTitleForItem,
  ticketModalCopy,
  ticketNotesForItem,
} from "./itinerary-ticket-display";

describe("itinerary ticket display", () => {
  it("builds localized ticket modal copy", () => {
    expect(ticketModalCopy("en").title("Airport train")).toBe(
      "Ticket for Airport train",
    );
    expect(ticketModalCopy("th").title("Airport train")).toBe(
      "ตั๋วสำหรับ Airport train",
    );
  });

  it("builds fallback ticket titles and itinerary notes", () => {
    const item = buildItineraryItem({
      activity: "Airport train",
      activityType: "travel",
      activitySubtype: "train",
      place: "Central",
      transportation: "Airport Express",
      details: {
        from: "Airport",
        to: "Central",
      },
    });

    expect(bookingTitleForItem(item, "train")).toBe("Airport train train ticket");
    expect(ticketNotesForItem(item, "en")).toBe(
      "From itinerary\nFrom: Airport\nTo: Central\nAirport Express",
    );
    expect(ticketNotesForItem(item, "th")).toBe(
      "จาก itinerary\nจาก: Airport\nถึง: Central\nAirport Express",
    );
  });
});
