import { arrivalDay } from "./itinerary.test-support";
import { seedTrip } from "./seed";
import type { ItineraryItem } from "./types";

export function hierarchyItem(overrides: Partial<ItineraryItem>): ItineraryItem {
  return {
    ...seedTrip.itineraryItems[0],
    day: arrivalDay,
    ...overrides,
  };
}
