import type { ItineraryItem } from "../types";

export function findItineraryItemById<TItem extends Pick<ItineraryItem, "id">>(
  itineraryItems: readonly TItem[],
  itemId: string | null | undefined,
): TItem | null {
  if (!itemId) return null;
  return itineraryItems.find((item) => item.id === itemId) ?? null;
}
