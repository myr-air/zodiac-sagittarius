import type { SeedItineraryItemInput } from "./seed-itinerary-types";
import { arrivalDayItineraryItems } from "./seed-itinerary-days/arrival-day";
import { hongKongDayItineraryItems } from "./seed-itinerary-days/hong-kong-day";
import { shenzhenDayItineraryItems } from "./seed-itinerary-days/shenzhen-day";

export const seedItineraryItemInputs: SeedItineraryItemInput[] = [
  ...arrivalDayItineraryItems,
  ...hongKongDayItineraryItems,
  ...shenzhenDayItineraryItems,
];
