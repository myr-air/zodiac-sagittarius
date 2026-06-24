import { arrivalDay } from "@/src/trip/testing/fixtures/itinerary-test-days";
import { buildTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { ItineraryItem } from "../../../types";

export function hierarchyItem(overrides: Partial<ItineraryItem>): ItineraryItem {
  return buildTripFixtureItineraryItem({
    day: arrivalDay,
    ...overrides,
  });
}
