import { findById } from "@/src/shared/collection/find-by-id";
import type { ItineraryItem } from "../types";

type ItineraryActivitySource = Pick<ItineraryItem, "activity" | "id">;

export function findItineraryItemById<TItem extends Pick<ItineraryItem, "id">>(
  itineraryItems: readonly TItem[],
  itemId: string | null | undefined,
): TItem | null {
  return findById(itineraryItems, itemId);
}

export function buildItineraryActivityResolver(
  itineraryItems: readonly ItineraryActivitySource[],
): (itemId: string) => string | null {
  const itineraryActivities = new Map(
    itineraryItems.map((item) => [item.id, item.activity]),
  );

  return (itemId) => itineraryActivities.get(itemId) ?? null;
}
