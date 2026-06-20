import { describe, expect, it } from "vitest";
import { createItineraryItemFixture as itineraryItem } from "./booking-docs.test-support";
import {
  bookingDraftTitleForItineraryItem,
  bookingTitleForItineraryItem,
} from "./booking-doc-display";

describe("booking doc display helpers", () => {
  it("builds booking titles from itinerary activity and booking type", () => {
    const item = itineraryItem("item-train", "Airport train", "2026-06-18");

    expect(bookingTitleForItineraryItem(item, "train")).toBe("Airport train train ticket");
    expect(bookingTitleForItineraryItem(item, "visa")).toBe("Airport train booking");
  });

  it("builds booking draft titles from itinerary activity and booking type", () => {
    const item = itineraryItem("item-ticket", "Peak Tram", "2026-06-18");

    expect(bookingDraftTitleForItineraryItem(item, "activity_ticket")).toBe("Peak Tram ticket draft");
    expect(bookingDraftTitleForItineraryItem(item, "visa")).toBe("Peak Tram booking draft");
  });
});
