import { arrivalDay } from "@/src/trip/testing/fixtures/itinerary-test-days";
import { seedTrip } from "../../../seed";
import type { ItineraryItem } from "../../../types";

export function hierarchyItem(overrides: Partial<ItineraryItem>): ItineraryItem {
  return {
    ...seedTrip.itineraryItems[0],
    day: arrivalDay,
    ...overrides,
  };
}
