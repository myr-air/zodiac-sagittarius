import type {
  ItineraryItem,
} from "@/src/trip/types";
import { buildItineraryItem } from "../fixtures/itinerary-items";

export function makeItineraryGraphItem(overrides: Partial<ItineraryItem> = {}): ItineraryItem {
  return buildItineraryItem(overrides);
}
