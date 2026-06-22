import type { BookingDoc } from "../types";
import type { BookingDocInputLike } from "./booking-doc-inputs";

export function findBookingDocById<TDoc extends Pick<BookingDoc, "id">>(
  bookingDocs: readonly TDoc[],
  bookingDocId: string | null | undefined,
): TDoc | null {
  if (!bookingDocId) return null;
  return bookingDocs.find((bookingDoc) => bookingDoc.id === bookingDocId) ?? null;
}

export function findDuplicateBookingDoc(
  bookingDocs: BookingDoc[],
  input: BookingDocInputLike,
): BookingDoc | null {
  const title = normalizeBookingMatchValue(input.title);
  const startsAt = normalizeBookingDateTimeMatchValue(input.startsAt);
  const endsAt = normalizeBookingDateTimeMatchValue(input.endsAt);
  const relatedItemIds = new Set(input.relatedItineraryItemIds);
  return (
    bookingDocs.find((bookingDoc) => {
      if (bookingDoc.type !== input.type) return false;
      if (normalizeBookingMatchValue(bookingDoc.title) !== title) return false;
      if (normalizeBookingDateTimeMatchValue(bookingDoc.startsAt) !== startsAt) return false;
      if (normalizeBookingDateTimeMatchValue(bookingDoc.endsAt) !== endsAt) return false;
      return bookingDoc.relatedItineraryItemIds.some((itemId) =>
        relatedItemIds.has(itemId),
      );
    }) ?? null
  );
}

function normalizeBookingMatchValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeBookingDateTimeMatchValue(
  value: string | null | undefined,
): string {
  return normalizeBookingMatchValue(value).replace(
    /(\d{2}:\d{2}):00(?=(?:[+-]\d\d:?\d\d|z)?$)/,
    "$1",
  );
}
