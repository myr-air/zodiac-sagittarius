import type { ItineraryItem } from "@/src/trip/types";
import {
  buildItineraryStoryItem as buildTestingItineraryStoryItem,
  buildItineraryStoryPathItems as buildTestingItineraryStoryPathItems,
  buildOverflowStoryItems as buildTestingOverflowStoryItems,
  withStoryPrefix as withTestingStoryPrefix,
  type ItineraryStoryPathItemRow,
} from "@/src/features/itinerary/testing";

export type { ItineraryStoryPathItemRow };

export function buildItineraryStoryItem(
  sourceIndex: number,
  patch: Partial<ItineraryItem>,
): ItineraryItem {
  return buildTestingItineraryStoryItem(sourceIndex, patch);
}

export function buildItineraryStoryPathItems(
  rows: readonly ItineraryStoryPathItemRow[],
  options: {
    pathGroupId?: (row: ItineraryStoryPathItemRow) => string | undefined;
    sourceIndex?: number;
  } = {},
): ItineraryItem[] {
  return buildTestingItineraryStoryPathItems(rows, options);
}

export function withStoryPrefix<T extends { id: string; pathGroupId?: string }>(
  items: T[],
  prefix: string,
): T[] {
  return withTestingStoryPrefix(items, prefix);
}

export function buildOverflowStoryItems(
  items: ItineraryItem[],
  options: {
    activityDetail: string;
    idPrefix: string;
    placeDetail: string;
  },
): ItineraryItem[] {
  return buildTestingOverflowStoryItems(items, options);
}
