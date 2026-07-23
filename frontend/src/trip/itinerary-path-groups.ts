import type { TripCockpitItineraryItem } from "./trip-cockpit-load";

/**
 * One fork group: same-day siblings sharing a pathGroupId, collapsed into a
 * single entry. `activeItemId` is the sibling with pathRole === "main", or
 * null when no sibling is main.
 */
export type PathForkGroup = {
  kind: "fork";
  pathGroupId: string;
  day: string;
  activeItemId: string | null;
  items: TripCockpitItineraryItem[];
};

/** An item with no pathGroupId, passed through unchanged/ungrouped. */
export type PathUngroupedItem = {
  kind: "single";
  item: TripCockpitItineraryItem;
};

export type PathGroupEntry = PathForkGroup | PathUngroupedItem;

/**
 * Groups itinerary items into fork groups by same-day pathGroupId, preserving
 * first-occurrence order. Items without a pathGroupId pass through as
 * ungrouped singles.
 */
export function groupPathAlternatives(
  items: TripCockpitItineraryItem[],
): PathGroupEntry[] {
  const entries: PathGroupEntry[] = [];
  const forksByKey = new Map<string, PathForkGroup>();

  for (const item of items) {
    if (!item.pathGroupId) {
      entries.push({ kind: "single", item });
      continue;
    }

    const key = `${item.day}\u0000${item.pathGroupId}`;
    const existing = forksByKey.get(key);
    if (existing) {
      existing.items.push(item);
      if (item.pathRole === "main") {
        existing.activeItemId = item.id;
      }
      continue;
    }

    const fork: PathForkGroup = {
      kind: "fork",
      pathGroupId: item.pathGroupId,
      day: item.day,
      activeItemId: item.pathRole === "main" ? item.id : null,
      items: [item],
    };
    forksByKey.set(key, fork);
    entries.push(fork);
  }

  return entries;
}
