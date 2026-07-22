/**
 * Pure Smart Itinerary Table model: day spine + plan-scoped item groups.
 */

import type { TripCockpitItineraryItem } from "./trip-cockpit-load";

export type BuildItineraryTableModelInput = {
  startDate: string;
  endDate: string;
  planVariantId: string;
  itineraryItems: TripCockpitItineraryItem[];
};

/** Child stop under a parent (no further nesting). */
export type ItineraryTableChildStop = TripCockpitItineraryItem;

/** Top-level day row; optional children when parentItemId nesting applies. */
export type ItineraryTableStop = TripCockpitItineraryItem & {
  children?: ItineraryTableChildStop[];
};

/** One calendar day in the trip spine (may have zero items). */
export type ItineraryTableDay = {
  day: string;
  items: ItineraryTableStop[];
};

export type ItineraryTableModel = {
  /** Selected plan for create / filter scope (Quick add POST). */
  planVariantId: string;
  days: ItineraryTableDay[];
};

/** Inclusive YYYY-MM-DD dates from start through end (UTC calendar arithmetic). */
function eachCalendarDateInclusive(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Nest children under their parent stop for one level only.
 * Grandchildren (parent is itself a child) stay top-level.
 * When nothing nests, returns the flat list unchanged (no children key).
 */
export function nestOneLevel(items: TripCockpitItineraryItem[]): ItineraryTableStop[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const childrenByParent = new Map<string, TripCockpitItineraryItem[]>();
  const nestedChildIds = new Set<string>();

  for (const item of items) {
    const parentId = item.parentItemId;
    if (parentId == null) continue;
    const parent = byId.get(parentId);
    if (!parent) continue;
    // One level only: nest solely under roots (parent has no parent in this set).
    const grandparentId = parent.parentItemId;
    if (grandparentId != null && byId.has(grandparentId)) continue;

    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(item);
    childrenByParent.set(parentId, siblings);
    nestedChildIds.add(item.id);
  }

  if (nestedChildIds.size === 0) {
    return items;
  }

  return items
    .filter((item) => !nestedChildIds.has(item.id))
    .map((item) => ({
      ...item,
      children: childrenByParent.get(item.id) ?? [],
    }));
}

/**
 * Materializes one day header per inclusive trip calendar date and groups
 * itineraryItems belonging to the selected planVariantId under those days.
 */
export function buildItineraryTableModel(
  input: BuildItineraryTableModelInput,
): ItineraryTableModel {
  const { startDate, endDate, planVariantId, itineraryItems } = input;
  const planItems = itineraryItems.filter(
    (item) => item.planVariantId === planVariantId,
  );

  const days = eachCalendarDateInclusive(startDate, endDate).map((day) => ({
    day,
    items: nestOneLevel(planItems.filter((item) => item.day === day)),
  }));

  return { planVariantId, days };
}
