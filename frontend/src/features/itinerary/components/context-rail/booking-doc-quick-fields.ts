import type { BookingDoc } from "@/src/trip/types";
import type { ContextRailBookingDocQuickFieldsPatch } from "./context-rail.types";

export type BookingDocQuickFieldKey = "providerName" | "confirmationCode";

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
): ContextRailBookingDocQuickFieldsPatch | null {
  const value = draftValue.trim();
  if (value === getBookingDocQuickFieldValue(bookingDoc, key)) return null;
  return { [key]: value || null };
}
