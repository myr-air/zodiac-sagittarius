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

/** One calendar day in the trip spine (may have zero items). */
export type ItineraryTableDay = {
  day: string;
  items: TripCockpitItineraryItem[];
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
    items: planItems.filter((item) => item.day === day),
  }));

  return { planVariantId, days };
}
