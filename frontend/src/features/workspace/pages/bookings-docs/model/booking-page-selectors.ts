import {
  canViewBookingDoc,
  findBookingDocById,
} from "@/src/trip/booking-docs";
import type { BookingDoc, Member, Trip } from "@/src/trip/types";
import {
  bookingDocMatchesFolder,
  type BookingFolderId,
} from "./booking-folders";
import { bookingDocMatchesQuery, compareBookingStartWithUndated } from "./booking-list";
import type { BookingStatusFilter } from "./booking-options";

export function visibleBookingDocsForMember(
  bookingDocs: readonly BookingDoc[],
  currentMember: Member,
): BookingDoc[] {
  return bookingDocs.filter((doc) => canViewBookingDoc(doc, currentMember));
}

export function lockedBookingDocsForMember(
  bookingDocs: readonly BookingDoc[],
  currentMember: Member,
): BookingDoc[] {
  return bookingDocs.filter((doc) => !canViewBookingDoc(doc, currentMember));
}

export function filterBookingPageDocs({
  activeFolderId,
  docs,
  query,
  statusFilter,
  trip,
}: {
  activeFolderId: BookingFolderId;
  docs: readonly BookingDoc[];
  query: string;
  statusFilter: BookingStatusFilter;
  trip: Trip;
}): BookingDoc[] {
  return docs
    .filter((doc) => bookingDocMatchesFolder(doc, activeFolderId))
    .filter((doc) => statusFilter === "all" || doc.status === statusFilter)
    .filter((doc) => bookingDocMatchesQuery(doc, trip, query))
    .sort(compareBookingStartWithUndated);
}

export function selectedBookingPageDoc(
  docs: readonly BookingDoc[],
  selectedBookingId: string,
): BookingDoc | null {
  return findBookingDocById(docs, selectedBookingId) ?? docs[0] ?? null;
}
