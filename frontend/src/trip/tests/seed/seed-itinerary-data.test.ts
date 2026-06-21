import { describe, expect, it } from "vitest";
import { seedItineraryItemInputs } from "../../seed-itinerary-data";
import { arrivalDayItineraryItems } from "../../seed-itinerary-days/arrival-day";
import { hongKongDayItineraryItems } from "../../seed-itinerary-days/hong-kong-day";
import { shenzhenDayItineraryItems } from "../../seed-itinerary-days/shenzhen-day";

describe("seed itinerary data", () => {
  it("keeps day modules grouped in itinerary order", () => {
    expect(seedItineraryItemInputs).toEqual([
      ...arrivalDayItineraryItems,
      ...hongKongDayItineraryItems,
      ...shenzhenDayItineraryItems,
    ]);
    expect(new Set(arrivalDayItineraryItems.map((item) => item.day))).toEqual(new Set(["2026-06-18"]));
    expect(new Set(hongKongDayItineraryItems.map((item) => item.day))).toEqual(new Set(["2026-06-19"]));
    expect(new Set(shenzhenDayItineraryItems.map((item) => item.day))).toEqual(new Set(["2026-06-20"]));
    expect(seedItineraryItemInputs.map((item) => item.id)).toEqual([
      "item-flight-bkk-hkg",
      "item-arrive-hkg",
      "item-airport-express",
      "item-hotel-checkin",
      "item-avenue-stars",
      "item-symphony-lights",
      "item-temple-street",
      "item-dimdim",
      "item-victoria-peak",
      "item-pacific-place",
      "item-star-ferry",
      "item-central-soho",
      "item-luk-yu",
      "item-checkout",
      "item-shenzhen-transfer",
      "item-shenzhen-hotel",
    ]);
  });
});
