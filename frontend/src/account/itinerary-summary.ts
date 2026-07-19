/**
 * Map explorer nextTrip / upcoming cards into draft-v3 itinerary summary.
 */

import type { AccountTripSummary } from "./account-api";
import type { UpcomingTripCard } from "./trip-cards";

/** Explicit budget placeholder — no rollup API exists yet. */
export type ItinerarySummaryBudget = {
  isPlaceholder: boolean;
  label: string;
};

export type ItinerarySummary = {
  name: string;
  partySize: number;
  startDate: string;
  endDate: string;
  budget: ItinerarySummaryBudget;
};

export type ToItinerarySummaryInput = {
  nextTrip: AccountTripSummary | null;
  upcomingCards: UpcomingTripCard[];
};

const PLACEHOLDER_BUDGET: ItinerarySummaryBudget = {
  isPlaceholder: true,
  label: "Budget TBD",
};

/**
 * Prefer explorer.nextTrip; fall back to the first upcoming trip card.
 * Budget is always an explicit placeholder (no rollup API).
 */
export function toItinerarySummary(
  input: ToItinerarySummaryInput,
): ItinerarySummary | null {
  if (input.nextTrip) {
    return {
      name: input.nextTrip.name,
      partySize: input.nextTrip.partySize,
      startDate: input.nextTrip.startDate,
      endDate: input.nextTrip.endDate,
      budget: PLACEHOLDER_BUDGET,
    };
  }

  const card = input.upcomingCards[0];
  if (!card) return null;

  return {
    name: card.title,
    partySize: card.partySize,
    startDate: card.startDate,
    endDate: card.endDate,
    budget: PLACEHOLDER_BUDGET,
  };
}
