import type { ItineraryItem, ValidationWarning } from "../types";
import { getTimeWindowInterval, type TimeWindowInterval } from "./itinerary-time-window-interval";

type OverlapGroupEntry = Pick<TimeWindowInterval, "item" | "end">;

export function buildOverlapWarnings(dayItems: ItineraryItem[]): Map<string, ValidationWarning[]> {
  const warningsByItemId = new Map<string, ValidationWarning[]>();
  const intervalsBySiblingScope = new Map<string, TimeWindowInterval[]>();

  for (const item of dayItems) {
    const interval = getTimeWindowInterval(item);
    if (!interval) continue;
    const siblingScope = item.parentItemId ? `parent:${item.parentItemId}` : "top-level";
    intervalsBySiblingScope.set(
      siblingScope,
      [...(intervalsBySiblingScope.get(siblingScope) ?? []), interval],
    );
  }

  for (const validIntervals of intervalsBySiblingScope.values()) {
    validIntervals.sort((a, b) => a.start - b.start || a.end - b.end || a.item.sortOrder - b.item.sortOrder);
    if (validIntervals.length < 2) continue;

    let group: OverlapGroupEntry[] = [];
    let groupMaxEnd = 0;

    for (const entry of validIntervals) {
      if (!group.length) {
        group = [entry];
        groupMaxEnd = entry.end;
        continue;
      }

      if (entry.start < groupMaxEnd) {
        group.push(entry);
        groupMaxEnd = Math.max(groupMaxEnd, entry.end);
        continue;
      }

      addOverlapWarningGroup(warningsByItemId, group);
      group = [entry];
      groupMaxEnd = entry.end;
    }

    addOverlapWarningGroup(warningsByItemId, group);
  }

  return warningsByItemId;
}

function addOverlapWarningGroup(
  warningsByItemId: Map<string, ValidationWarning[]>,
  groupItems: OverlapGroupEntry[],
) {
  if (groupItems.length < 2) return;
  const primary = groupItems[0]?.item;
  const secondary = groupItems[1]?.item;
  if (!primary || !secondary) return;

  for (const entry of groupItems) {
    const overlapTarget = entry.item.id === primary.id ? secondary : primary;
    warningsByItemId.set(entry.item.id, [{
      code: "overlap",
      message: `This stop overlaps ${overlapTarget.activity}; ตรวจเวลาอีกครั้งก่อน publish.`,
      itemId: entry.item.id,
    }]);
  }
}
