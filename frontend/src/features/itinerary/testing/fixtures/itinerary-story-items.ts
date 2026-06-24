import type { ItineraryItem } from "@/src/trip/types";
import { buildItineraryItem } from "./itinerary-items";
import { itineraryFixtureDay } from "./path-options";

export type ItineraryStoryPathItemRow = readonly [
  id: string,
  startTime: string,
  durationMinutes: number,
  sortOrder: number,
  activity: string,
  pathName: string | undefined,
  pathId: string | undefined,
  pathRole: ItineraryItem["pathRole"],
];

export function buildItineraryStoryItem(
  _sourceIndex: number,
  patch: Partial<ItineraryItem>,
): ItineraryItem {
  return buildItineraryItem({
    startTime: "08:00",
    durationMinutes: 60,
    sortOrder: 100,
    activity: "",
    day: itineraryFixtureDay,
    ...patch,
  });
}

export function buildItineraryStoryPathItems(
  rows: readonly ItineraryStoryPathItemRow[],
  options: {
    pathGroupId?: (row: ItineraryStoryPathItemRow) => string | undefined;
    sourceIndex?: number;
  } = {},
): ItineraryItem[] {
  const sourceIndex = options.sourceIndex ?? 0;
  return rows.map((row) => {
    const [
      id,
      startTime,
      durationMinutes,
      sortOrder,
      activity,
      pathName,
      pathId,
      pathRole,
    ] = row;
    return buildItineraryStoryItem(sourceIndex, {
      id,
      startTime,
      durationMinutes,
      sortOrder,
      activity,
      activityType: "experience",
      place: `${pathName} checkpoint`,
      pathGroupId: options.pathGroupId?.(row),
      pathId,
      pathName: pathId ? pathName : undefined,
      pathRole,
    });
  });
}

export function withStoryPrefix<T extends { id: string; pathGroupId?: string }>(
  items: T[],
  prefix: string,
): T[] {
  return items.map((item) => ({
    ...item,
    id: `${prefix}-${item.id}`,
    pathGroupId: item.pathGroupId ? `${prefix}-${item.pathGroupId}` : item.pathGroupId,
  }));
}

export function buildOverflowStoryItems(
  items: ItineraryItem[],
  options: {
    activityDetail: string;
    idPrefix: string;
    placeDetail: string;
  },
): ItineraryItem[] {
  return items.map((item, index) => ({
    ...item,
    id: `${options.idPrefix}-${item.id}`,
    activity: `${item.activity} ${options.activityDetail} ${index + 1}`,
    place: `${item.place}${options.placeDetail}`,
    transport: "Airport Express transfer with luggage coordination",
  }));
}
