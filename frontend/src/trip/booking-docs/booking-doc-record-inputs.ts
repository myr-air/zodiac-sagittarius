import type { BookingDoc } from "../types";
import type { BookingDocInputLike } from "./booking-doc-inputs";

export interface BookingDocQuickFieldsPatch {
  confirmationCode?: string | null;
  providerName?: string | null;
}

export function bookingDocInputFromRecord(
  bookingDoc: BookingDoc,
  overrides: Partial<BookingDocInputLike> = {},
): BookingDocInputLike {
  return {
    type: overrides.type ?? bookingDoc.type,
    title: overrides.title ?? bookingDoc.title,
    status: overrides.status ?? bookingDoc.status,
    visibility: overrides.visibility ?? bookingDoc.visibility,
    ownerMemberId: overrides.ownerMemberId !== undefined ? overrides.ownerMemberId : bookingDoc.ownerMemberId,
    providerName: overrides.providerName !== undefined ? overrides.providerName : bookingDoc.providerName,
    confirmationCode: overrides.confirmationCode !== undefined ? overrides.confirmationCode : bookingDoc.confirmationCode,
    startsAt: overrides.startsAt !== undefined ? overrides.startsAt : bookingDoc.startsAt,
    endsAt: overrides.endsAt !== undefined ? overrides.endsAt : bookingDoc.endsAt,
    timezone: overrides.timezone !== undefined ? overrides.timezone : bookingDoc.timezone,
    priceAmount: overrides.priceAmount !== undefined ? overrides.priceAmount : bookingDoc.priceAmount,
    currency: overrides.currency !== undefined ? overrides.currency : bookingDoc.currency,
    travelerIds: overrides.travelerIds ?? bookingDoc.travelerIds,
    externalLinks: overrides.externalLinks ?? bookingDoc.externalLinks,
    relatedItineraryItemIds: overrides.relatedItineraryItemIds ?? bookingDoc.relatedItineraryItemIds,
    relatedTaskIds: overrides.relatedTaskIds ?? bookingDoc.relatedTaskIds,
    relatedExpenseIds: overrides.relatedExpenseIds ?? bookingDoc.relatedExpenseIds,
    noteIds: overrides.noteIds ?? bookingDoc.noteIds,
    notes: overrides.notes !== undefined ? overrides.notes : bookingDoc.notes,
    tripPlanId: overrides.tripPlanId !== undefined ? overrides.tripPlanId : bookingDoc.tripPlanId,
  };
}

export function bookingDocQuickFieldsInputFromRecord(
  bookingDoc: BookingDoc,
  patch: BookingDocQuickFieldsPatch,
): BookingDocInputLike | null {
  const providerName =
    patch.providerName !== undefined
      ? patch.providerName
      : bookingDoc.providerName;
  const confirmationCode =
    patch.confirmationCode !== undefined
      ? patch.confirmationCode
      : bookingDoc.confirmationCode;

  if (
    providerName === bookingDoc.providerName &&
    confirmationCode === bookingDoc.confirmationCode
  ) {
    return null;
  }

  return bookingDocInputFromRecord(bookingDoc, {
    confirmationCode,
    providerName,
  });
}
