import type {
  ItineraryItem,
} from "@/src/trip/types";
import { buildItineraryItem } from "@/src/features/itinerary/testing/fixtures/itinerary-items";

export function makeItineraryGraphItem(overrides: Partial<ItineraryItem> = {}): ItineraryItem {
  return buildItineraryItem(overrides);
}
