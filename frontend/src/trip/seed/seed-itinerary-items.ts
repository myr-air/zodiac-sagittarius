import type { ItineraryItem } from "../types";
import { seedItineraryItemInputs } from "./seed-itinerary-data";

interface CreateSeedItineraryItemsInput {
  mainPlanId: string;
  tripId: string;
  updatedAt: string;
}

export function createSeedItineraryItems({
  mainPlanId,
  tripId,
  updatedAt,
}: CreateSeedItineraryItemsInput): ItineraryItem[] {
  return seedItineraryItemInputs.map((input) => ({
    tripId,
    planVariantId: input.planVariantId ?? mainPlanId,
    createdBy: "member-aom",
    updatedAt,
    version: input.version ?? 1,
    ...input,
    details: input.details ?? {},
  }));
}
