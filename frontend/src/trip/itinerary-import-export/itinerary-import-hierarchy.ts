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

  const childrenByParentId = new Map<string, ItineraryExportItem[]>();
  for (const item of items) {
    if (!item.parentItemId) continue;
    const siblings = childrenByParentId.get(item.parentItemId) ?? [];
    siblings.push(item);
    childrenByParentId.set(item.parentItemId, siblings);
  }

  const syntheticParents = new Map<string, ItineraryExportItem>();
  for (const parentId of parentIds) {
    const parent = itemsById.get(parentId);
    const children = childrenByParentId.get(parentId) ?? [];
    if (!parent) {
      if (children.length === 0) continue;
      const days = new Set(children.map((child) => child.day));
      if (days.size !== 1) throw unsupportedImportFileError();
      const minSortOrder = Math.min(
        ...children.map((child) => child.sortOrder),
      );
      syntheticParents.set(
        parentId,
        buildSyntheticPlanBlock(parentId, children[0]!.day, minSortOrder - 100),
      );
      continue;
    }
    if (parent.parentItemId || children.some((child) => child.day !== parent.day)) {
      throw unsupportedImportFileError();
    }
  }

  const insertedSyntheticIds = new Set<string>();
  return items.flatMap((item) => {
    const syntheticParent =
      item.parentItemId ? syntheticParents.get(item.parentItemId) : undefined;
    if (syntheticParent && !insertedSyntheticIds.has(syntheticParent.id)) {
      insertedSyntheticIds.add(syntheticParent.id);
      return [syntheticParent, normalizeItem(item, parentIds)];
    }
    return [normalizeItem(item, parentIds)];
  });
}

function normalizeItem(
  item: ItineraryExportItem,
  parentIds: Set<string>,
): ItineraryExportItem {
  if (!item.parentItemId) {
    return parentIds.has(item.id) ? { ...item, isPlanBlock: true } : item;
  }
  return { ...item, isPlanBlock: false };
}

function buildSyntheticPlanBlock(
  id: string,
  day: string,
  minChildSortOrder: number,
): ItineraryExportItem {
  return {
    id,
    day,
    sortOrder: minChildSortOrder - 1,
    activity: "Imported plan block",
    activityType: "default",
    itemKind: "activity",
    place: "",
    linkLabel: "",
    mapLink: "",
    transportation: "",
    note: "",
    details: { importSource: "synthetic-parent" },
    timeMode: "flexible",
    isPlanBlock: true,
    parentItemId: null,
    status: "planned",
    priority: "normal",
    startTime: "",
    endTime: null,
    durationMinutes: null,
    endOffsetDays: 0,
  };
}
