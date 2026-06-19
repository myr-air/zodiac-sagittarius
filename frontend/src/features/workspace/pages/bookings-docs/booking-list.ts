import type { BookingDoc, Trip } from "@/src/trip/types";

export function compareBookingStartWithUndated(left: BookingDoc, right: BookingDoc): number {
  const leftTime = Number.isFinite(Date.parse(left.startsAt ?? "")) ? Date.parse(left.startsAt ?? "") : Number.POSITIVE_INFINITY;
  const rightTime = Number.isFinite(Date.parse(right.startsAt ?? "")) ? Date.parse(right.startsAt ?? "") : Number.POSITIVE_INFINITY;
  return leftTime - rightTime || left.title.localeCompare(right.title);
}

export function bookingDocMatchesQuery(doc: BookingDoc, trip: Trip, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return [
    doc.title,
    doc.providerName,
    doc.confirmationCode,
    doc.notes,
    bookingDocLinkedContext(doc, trip),
    ...doc.externalLinks.flatMap((link) => [link.label, link.url, link.provider, link.accessNote]),
    ...trip.members.filter((member) => doc.travelerIds.includes(member.id)).map((member) => member.displayName),
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedQuery));
}

export function bookingDocLinkedContext(doc: BookingDoc, trip: Trip): string {
  return doc.relatedItineraryItemIds
    .map((itemId) => trip.itineraryItems.find((item) => item.id === itemId)?.activity)
    .filter(Boolean)
    .join(", ");
}
