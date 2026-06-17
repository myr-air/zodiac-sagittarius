import type { ItineraryItem, ValidationWarning } from "./types";
import { parseTime } from "./itinerary-time";

export function buildOverlapWarnings(dayItems: ItineraryItem[]): Map<string, ValidationWarning[]> {
  const warningsByItemId = new Map<string, ValidationWarning[]>();
  const intervalsBySiblingScope = new Map<string, Array<{ item: ItineraryItem; start: number; end: number }>>();

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

    let group: Array<{ item: ItineraryItem; end: number }> = [];
    let groupMaxEnd = 0;

    const addOverlapWarningGroup = (groupItems: Array<{ item: ItineraryItem; end: number }>) => {
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
    };

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

      addOverlapWarningGroup(group);
      group = [entry];
      groupMaxEnd = entry.end;
    }

    addOverlapWarningGroup(group);
  }

  return warningsByItemId;
}

export function getTimeWindowInterval(
  item: ItineraryItem,
): { item: ItineraryItem; start: number; end: number } | null {
  if (item.timeMode === "flexible") return null;
  const start = parseTime(item.startTime);
  if (start === null) return null;

  const endTime = item.endTime?.trim();
  if (endTime) {
    const end = parseTime(endTime);
    if (end === null) return null;
    const endOffsetDays = item.endOffsetDays ?? 0;
    const endWithOffset = end + endOffsetDays * 24 * 60;
    if (endWithOffset <= start) return null;
    return { item, start, end: endWithOffset };
  }

  if (
    item.durationMinutes === null ||
    item.durationMinutes === undefined ||
    item.durationMinutes <= 0
  ) {
    return null;
  }

  return { item, start, end: start + item.durationMinutes };
}

export function validateItemFields(item: ItineraryItem): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const start = parseTime(item.startTime);
  const isFlexible = item.timeMode === "flexible";

  if (!isFlexible && !item.startTime.trim()) {
    warnings.push({ code: "missing-start-time", message: "Add a start time before this stop can appear in Now / Next.", itemId: item.id });
  } else if (!isFlexible && start === null) {
    warnings.push({ code: "invalid-start-time", message: "Use 24-hour time, for example 13:30.", itemId: item.id });
  }

  if (!isFlexible && !item.endTime && (item.durationMinutes === null || item.durationMinutes <= 0)) {
    warnings.push({ code: "missing-duration", message: "Add an end time or duration so route timing can be checked.", itemId: item.id });
  }

  if (!item.mapLink.trim()) {
    warnings.push({ code: "missing-map-link", message: "Add a map link or place fallback for this stop.", itemId: item.id });
  }

  if (!item.transportation.trim()) {
    warnings.push({ code: "missing-transportation", message: "Add transport notes so the group knows the next move.", itemId: item.id });
  }

  return warnings;
}

export function validateHierarchyFields(item: ItineraryItem, dayItems: ItineraryItem[]): ValidationWarning[] {
  if (!item.parentItemId) return [];
  const parent = dayItems.find((candidate) => candidate.id === item.parentItemId);
  if (!parent) {
    return [{
      code: "missing-parent-item",
      message: "This sub-activity is linked to a parent that is not in this day plan.",
      itemId: item.id,
    }];
  }

  const warnings: ValidationWarning[] = [];
  if (parent.parentItemId) {
    warnings.push({
      code: "nested-sub-activity",
      message: "Sub-activities can only sit under an activity block, not under another sub-activity.",
      itemId: item.id,
    });
  }

  if (!parent.isPlanBlock) {
    warnings.push({
      code: "invalid-parent-plan-block",
      message: "Move this sub-activity under an activity block or promote its parent to a block.",
      itemId: item.id,
    });
  }

  if (item.day !== parent.day || item.planVariantId !== parent.planVariantId) {
    warnings.push({
      code: "parent-scope-mismatch",
      message: "Sub-activities must stay in the same day and Trip Plan as their parent block.",
      itemId: item.id,
    });
  }

  if (warnings.length > 0 || item.timeMode === "flexible" || parent.timeMode === "flexible") {
    return warnings;
  }

  const parentInterval = getTimeWindowInterval(parent);
  const childInterval = getTimeWindowInterval(item);
  if (!parentInterval || !childInterval) return warnings;

  if (childInterval.start < parentInterval.start || childInterval.end > parentInterval.end) {
    warnings.push({
      code: "child-outside-plan-block",
      message: `This child item sits outside ${parent.activity}; adjust the time or move it out of the block.`,
      itemId: item.id,
    });
  }
  return warnings;
}
