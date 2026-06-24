import type { BookingDoc } from "../types";
import type { BookingDocQuickFieldsPatch } from "./booking-doc-record-inputs";

export const bookingDocQuickFieldKeys = [
  "providerName",
  "confirmationCode",
] as const satisfies readonly (keyof BookingDocQuickFieldsPatch)[];
export type BookingDocQuickFieldKey = (typeof bookingDocQuickFieldKeys)[number];

export function getBookingDocQuickFieldValue(
  bookingDoc: BookingDoc,
  key: BookingDocQuickFieldKey,
): string {
  return bookingDoc[key] ?? "";
}

export function buildBookingDocQuickFieldPatch(
  bookingDoc: BookingDoc,
  key: BookingDocQuickFieldKey,
  draftValue: string,
): BookingDocQuickFieldsPatch | null {
  const value = draftValue.trim();
  if (value === getBookingDocQuickFieldValue(bookingDoc, key)) return null;
  return { [key]: value || null };
}
