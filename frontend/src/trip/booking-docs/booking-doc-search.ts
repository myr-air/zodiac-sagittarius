import {
  normalizeSearchQuery,
  valuesMatchSearchQuery,
} from "@/src/shared/text-search";
import { buildItineraryActivityResolver } from "../itinerary-items";
import type { BookingDoc, Trip } from "../types";

export function compareBookingStartWithUndated(left: BookingDoc, right: BookingDoc): number {
  return bookingDocStartTime(left) - bookingDocStartTime(right) ||
    left.title.localeCompare(right.title);
}

export function bookingDocMatchesQuery(doc: BookingDoc, trip: Trip, query: string): boolean {
  return valuesMatchSearchQuery(
    searchableBookingDocValues(doc, trip),
    normalizeSearchQuery(query),
  );
}

export function bookingDocLinkedContext(doc: BookingDoc, trip: Trip): string {
  const itineraryActivity = buildItineraryActivityResolver(trip.itineraryItems);
  return doc.relatedItineraryItemIds
    .map((itemId) => itineraryActivity(itemId))
    .filter(Boolean)
    .join(", ");
}

function searchableBookingDocValues(doc: BookingDoc, trip: Trip): string[] {
  const linkedItems = new Set(doc.relatedItineraryItemIds);
  const linkedActivities = trip.itineraryItems
    .filter((item) => linkedItems.has(item.id))
    .map((item) => `${item.activity} ${item.place}`)
    .join(" ");
  const travelerNames = trip.members
    .filter((member) => doc.travelerIds.includes(member.id))
    .map((member) => member.displayName)
    .join(" ");

  return [
    doc.title,
    doc.providerName,
    doc.confirmationCode,
    doc.notes,
    bookingDocLinkedContext(doc, trip),
    linkedActivities,
    travelerNames,
    ...doc.externalLinks.flatMap((link) => [
      link.label,
      link.url,
      link.provider,
      link.accessNote,
    ]),
  ]
    .filter((value): value is string => Boolean(value));
}

function bookingDocStartTime(doc: BookingDoc): number {
  const startsAt = Date.parse(doc.startsAt ?? "");
  return Number.isFinite(startsAt) ? startsAt : Number.POSITIVE_INFINITY;
}
