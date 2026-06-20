import type { BookingDoc, Trip } from "./types";
import type { BookingDocInputLike } from "./booking-doc-inputs";

export interface LocalBookingDocOptions {
  title: string;
  tripPlanId: BookingDoc["tripPlanId"];
  createdBy: string;
  updatedAt: string;
  nextBookingDocId: (bookingDocs: BookingDoc[]) => string;
}

export interface LocalBookingDocUpdateOptions {
  title: string;
  updatedAt: string;
}

export interface ResolveBookingDocCreateTripPlanIdOptions<T> {
  selectedTripPlanId?: string | null;
  resolveTripPlanId: (
    trip: T,
    input: Pick<BookingDocInputLike, "relatedItineraryItemIds">,
    preferredTripPlanId?: string | null,
  ) => string | null | undefined;
}

export function normalizeBookingDocTitle(
  input: Pick<BookingDocInputLike, "title">,
): string {
  return input.title.trim();
}

export function resolveBookingDocCreateTripPlanId<T>(
  trip: T,
  input: Pick<BookingDocInputLike, "relatedItineraryItemIds" | "tripPlanId">,
  options: ResolveBookingDocCreateTripPlanIdOptions<T>,
): string | null | undefined {
  return options.resolveTripPlanId(
    trip,
    input,
    input.tripPlanId ?? options.selectedTripPlanId,
  );
}

export function createLocalBookingDoc(
  trip: Pick<Trip, "id" | "bookingDocs">,
  input: BookingDocInputLike,
  options: LocalBookingDocOptions,
): BookingDoc {
  const bookingDocs = trip.bookingDocs ?? [];

  return {
    ...input,
    id: options.nextBookingDocId(bookingDocs),
    tripId: trip.id,
    tripPlanId: options.tripPlanId,
    title: options.title,
    externalLinks: input.externalLinks.map((link, index) => ({
      ...link,
      id: link.id || `link-local-${index + 1}`,
    })),
    createdBy: options.createdBy,
    updatedAt: options.updatedAt,
    version: 1,
  };
}

export function replaceBookingDocInTrip<T extends Pick<Trip, "bookingDocs">>(
  trip: T,
  bookingDoc: BookingDoc,
): T {
  return {
    ...trip,
    bookingDocs: (trip.bookingDocs ?? []).map((candidate) =>
      candidate.id === bookingDoc.id ? bookingDoc : candidate,
    ),
  };
}

export function updateLocalBookingDocInTrip<T extends Pick<Trip, "bookingDocs">>(
  trip: T,
  bookingDocId: string,
  input: BookingDocInputLike,
  options: LocalBookingDocUpdateOptions,
): T {
  return {
    ...trip,
    bookingDocs: (trip.bookingDocs ?? []).map((bookingDoc) =>
      bookingDoc.id === bookingDocId
        ? {
            ...bookingDoc,
            ...input,
            title: options.title,
            externalLinks: input.externalLinks.map((link, index) => ({
              ...link,
              id:
                link.id ||
                bookingDoc.externalLinks[index]?.id ||
                `link-local-${index + 1}`,
            })),
            updatedAt: options.updatedAt,
            version: bookingDoc.version + 1,
          }
        : bookingDoc,
    ),
  };
}

export function removeBookingDocFromTrip<T extends Pick<Trip, "bookingDocs">>(
  trip: T,
  bookingDocId: string,
): T {
  return {
    ...trip,
    bookingDocs: (trip.bookingDocs ?? []).filter(
      (bookingDoc) => bookingDoc.id !== bookingDocId,
    ),
  };
}
