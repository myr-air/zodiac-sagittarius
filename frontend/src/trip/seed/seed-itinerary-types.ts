import type { ItineraryItem } from "../types";

export type SeedItineraryItemInput = Omit<
  ItineraryItem,
  "tripId" | "planVariantId" | "createdBy" | "updatedAt" | "version" | "details"
> &
  Partial<Pick<ItineraryItem, "planVariantId" | "version" | "details">>;
