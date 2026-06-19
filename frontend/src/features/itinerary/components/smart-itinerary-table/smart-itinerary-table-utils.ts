import type { Locale } from "@/src/i18n/types";
import type {
  ItineraryItem,
  PlanVariant,
  PlanStatus,
} from "@/src/trip/types";
import type { ItineraryDayGroup, ItineraryPathOption } from "@/src/trip/itinerary";
import {
  mainItineraryPathId,
  mainItineraryPathName,
} from "@/src/trip/itinerary-path-identifiers";

export function mergeTripDayGroups(
  groups: ItineraryDayGroup[],
  startDate: string,
  endDate: string,
  tripDates: string[],
): ItineraryDayGroup[] {
  const groupsByDay = new Map(groups.map((group) => [group.day, group]));
  const days = new Set<string>(tripDates);
  for (const group of groups) {
    if (group.items.length) days.add(group.day);
  }

  return Array.from(days)
    .sort()
    .map((day) => groupsByDay.get(day) ?? { day, items: [], warningCount: 0 });
}

export function groupTopLevelItems(items: ItineraryItem[]): ItineraryItem[] {
  const itemIds = new Set(items.map((item) => item.id));
  return items.filter(
    (item) => !item.parentItemId || !itemIds.has(item.parentItemId),
  );
}

export function groupChildItemsByParent(
  items: ItineraryItem[],
): Map<string, ItineraryItem[]> {
  const childrenByParent = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    if (!item.parentItemId) continue;
    childrenByParent.set(item.parentItemId, [
      ...(childrenByParent.get(item.parentItemId) ?? []),
      item,
    ]);
  }
  for (const [parentId, children] of childrenByParent) {
    childrenByParent.set(parentId, [...children].sort(compareItineraryItems));
  }
  return childrenByParent;
}

export function compareItineraryItems(a: ItineraryItem, b: ItineraryItem): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
  return a.activity.localeCompare(b.activity);
}

export function itemStatusLabel(
  status: NonNullable<ItineraryItem["status"]>,
  locale: Locale,
): string {
  const labels: Record<Locale, Record<NonNullable<ItineraryItem["status"]>, string>> = {
    en: {
      idea: "Idea",
      planned: "Planned",
      booked: "Booked",
      confirmed: "Confirmed",
      done: "Done",
      skipped: "Skipped",
    },
    th: {
      idea: "ไอเดีย",
      planned: "วางแผนแล้ว",
      booked: "จองแล้ว",
      confirmed: "ยืนยันแล้ว",
      done: "เสร็จแล้ว",
      skipped: "ข้าม",
    },
  };

  return labels[locale][status];
}

export function groupGraphItemsByDay(
  items: ItineraryItem[],
): Map<string, ItineraryItem[]> {
  const itemsByDay = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    itemsByDay.set(item.day, [...(itemsByDay.get(item.day) ?? []), item]);
  }
  return itemsByDay;
}

export function buildGraphColumnWidth(
  items: ItineraryItem[],
  graphColumnMinWidth: number,
  graphColumnSidePadding: number,
  graphColumnLaneGap: number,
): number {
  const pathCountsByDay = new Map<string, Set<string>>();
  const itemsByDay = groupGraphItemsByDay(items);
  for (const [day, dayItems] of itemsByDay) {
    const dayPaths =
      pathCountsByDay.get(day) ?? new Set<string>([mainItineraryPathId]);
    dayItems.forEach((item) => {
      const pathId =
        item.pathRole === "alternative"
          ? (item.pathId ?? item.id)
          : mainItineraryPathId;
      dayPaths.add(pathId);
    });
    pathCountsByDay.set(day, dayPaths);
  }
  const laneCount = Math.max(
    1,
    ...Array.from(pathCountsByDay.values(), (paths) => paths.size),
  );
  return Math.max(
    graphColumnMinWidth,
    graphColumnSidePadding * 2 + (laneCount - 1) * graphColumnLaneGap + 12,
  );
}

export function dedupePathOptions(
  pathOptions: ItineraryPathOption[],
  items: ItineraryItem[],
): { id: string; name: string }[] {
  const optionsById = new Map<string, { id: string; name: string }>();
  pathOptions.forEach((option) => {
    optionsById.set(option.id, { id: option.id, name: option.name });
  });
  items.forEach((item) => {
    const pathId = item.pathRole === "main"
      ? item.pathId ?? mainItineraryPathId
      : item.pathId ?? item.id;
    if (!optionsById.has(pathId)) {
      optionsById.set(pathId, {
        id: pathId,
        name: item.pathName ?? (pathId === mainItineraryPathId ? mainItineraryPathName : pathId),
      });
    }
  });
  if (!optionsById.has(mainItineraryPathId)) {
    optionsById.set(mainItineraryPathId, { id: mainItineraryPathId, name: mainItineraryPathName });
  }
  return Array.from(optionsById.values());
}

export function formatSelectedPlanLabel(
  filterOptions: { id: string; name: string }[],
  selectedPathIds: string[],
  countLabel: ({ count }: { count: number }) => string,
  namesLabel: ({ names }: { names: string }) => string,
): string {
  const selectedNames = filterOptions
    .filter((option) => selectedPathIds.includes(option.id))
    .map((option) => option.name);
  if (selectedNames.length === 0) return countLabel({ count: 0 });
  if (selectedNames.length <= 2)
    return namesLabel({ names: selectedNames.join(", ") });
  return namesLabel({
    names: `${selectedNames.slice(0, 2).join(", ")} +${selectedNames.length - 2}`,
  });
}

export function formatTripPlanOptionLabel(
  plan: PlanVariant,
  statusLabels: Readonly<Record<PlanStatus, string>>,
): string {
  const status = tripPlanStatus(plan);
  return `${plan.name} - ${statusLabels[status]}`;
}

export function tripPlanStatus(plan: PlanVariant): PlanStatus {
  return plan.status ?? (plan.kind === "split" ? "proposal" : plan.kind);
}
