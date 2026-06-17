import type {
  ItineraryItem,
} from "@/src/trip/types";
import { buildItineraryItem } from "@/src/features/itinerary/testing";

export function makeItineraryGraphItem(overrides: Partial<ItineraryItem> = {}): ItineraryItem {
  return buildItineraryItem(overrides);
}
