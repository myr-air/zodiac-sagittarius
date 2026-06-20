import type { BookingDoc } from "@/src/trip/types";

export type BookingDocQuickFieldKey = "providerName" | "confirmationCode";

export type BookingDocQuickFieldPatch = Partial<
  Record<BookingDocQuickFieldKey, string | null>
>;

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
): BookingDocQuickFieldPatch | null {
  const value = draftValue.trim();
  if (value === getBookingDocQuickFieldValue(bookingDoc, key)) return null;
  return { [key]: value || null };
}
