import { parseTime } from "../itinerary";
import type { ItineraryItem } from "../types";

export function findOverlappingActivityBranch(
  items: ItineraryItem[],
  item: ItineraryItem,
): ItineraryItem[] {
  const branchItemsById = new Map<string, ItineraryItem>([[item.id, item]]);
  let added = true;
  while (added) {
    added = false;
    for (const candidate of items) {
      if (
        candidate.day !== item.day ||
        candidate.planVariantId !== item.planVariantId ||
        branchItemsById.has(candidate.id)
      )
        continue;
      const overlapsBranch = Array.from(branchItemsById.values()).some(
        (branchItem) => overlapsItem(branchItem, candidate),
      );
      if (overlapsBranch) {
        branchItemsById.set(candidate.id, candidate);
        added = true;
      }
    }
  }
  return Array.from(branchItemsById.values());
}

export function sortBranchItems(items: ItineraryItem[]): ItineraryItem[] {
  return [...items].sort((left, right) => {
    const leftStart = parseTime(left.startTime);
    const rightStart = parseTime(right.startTime);
    const timeCompare =
      (leftStart ?? Number.MAX_SAFE_INTEGER) -
      (rightStart ?? Number.MAX_SAFE_INTEGER);
    if (timeCompare !== 0) return timeCompare;
    return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id);
  });
}

function overlapsItem(
  left: Pick<ItineraryItem, "day" | "startTime" | "durationMinutes">,
  right: Pick<ItineraryItem, "day" | "startTime" | "durationMinutes">,
): boolean {
  if (left.day !== right.day) return false;
  const leftStart = parseTime(left.startTime);
  const rightStart = parseTime(right.startTime);
  if (leftStart === null || rightStart === null)
    return left.startTime === right.startTime;
  const leftEnd = leftStart + (left.durationMinutes ?? 45);
  const rightEnd = rightStart + (right.durationMinutes ?? 45);
  return rightStart < leftEnd && leftStart < rightEnd;
}
