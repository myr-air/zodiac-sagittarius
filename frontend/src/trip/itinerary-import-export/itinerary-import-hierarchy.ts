import { mapById } from "@/src/shared/collection";
import type { ItineraryExportItem } from "./itinerary-import-export-types";
import { unsupportedImportFileError } from "./itinerary-import-readers";

export function normalizeImportedHierarchy(
  items: ItineraryExportItem[],
): ItineraryExportItem[] {
  const itemsById = mapById(items);
  const parentIds = new Set<string>();
  for (const item of items) {
    if (item.parentItemId) parentIds.add(item.parentItemId);
  }

  return items.map((item) => {
    if (!item.parentItemId) {
      return parentIds.has(item.id) ? { ...item, isPlanBlock: true } : item;
    }
    const parent = itemsById.get(item.parentItemId);
    if (!parent) throw unsupportedImportFileError();
    if (parent.parentItemId || item.day !== parent.day) {
      throw unsupportedImportFileError();
    }
    return { ...item, isPlanBlock: false };
  });
}
