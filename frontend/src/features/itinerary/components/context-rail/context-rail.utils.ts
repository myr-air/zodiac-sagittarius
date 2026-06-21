import { bookingDocTypeValues } from "@/src/trip/booking-docs";
import type { BookingDocType, Member, Suggestion } from "@/src/trip/types";
import { taskKindLabel } from "@/src/features/itinerary/domain/overview";

export const contextRailTabValues = ["notes", "booking", "suggestions"] as const;
export type ContextRailTab = (typeof contextRailTabValues)[number];

export const bookingDocTypeOptions = bookingDocTypeValues;

export function suggestionLabel(suggestion: Suggestion, fallback: string): string {
  /* v8 ignore next */
  return (
    suggestion.proposedPatch.activity ??
    suggestion.proposedPatch.note ??
    suggestion.proposedPatch.place ??
    suggestion.proposedPatch.transportation ??
    fallback
  );
}

export function memberDisplayName(
  member: Member | undefined,
  fallback: string,
): string {
  /* v8 ignore next */
  return member?.displayName ?? fallback;
}

export { taskKindLabel };

export function formatBookingDocTypeLabel(type: BookingDocType): string {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
