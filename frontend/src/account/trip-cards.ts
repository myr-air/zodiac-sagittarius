/**
 * Map AccountTripSummary rows into draft-v3 upcoming trip card view-models.
 */

import type { AccountTripSummary } from "./account-api";

/** Draft-v3 trip row fields (title, country, dates, party). */
export type UpcomingTripCard = {
  id: string;
  /** Draft `.trip h3` — from trip name. */
  title: string;
  destinationLabel: string;
  /** Draft `.trip .country` — from countries. */
  country: string;
  partySize: number;
  startDate: string;
  endDate: string;
};

export function toUpcomingTripCard(trip: AccountTripSummary): UpcomingTripCard {
  return {
    id: trip.id,
    title: trip.name,
    destinationLabel: trip.destinationLabel,
    country: trip.countries[0] ?? "",
    partySize: trip.partySize,
    startDate: trip.startDate,
    endDate: trip.endDate,
  };
}

export function toUpcomingTripCards(
  trips: AccountTripSummary[],
): UpcomingTripCard[] {
  return trips.map(toUpcomingTripCard);
}
