import { displayNameOrFallback } from "@/src/shared/text-parts";
import { bookingDocTypeValues } from "@/src/trip/booking-docs";
import type { Member, Suggestion } from "@/src/trip/types";
import { taskKindLabel } from "./overview";

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
  return displayNameOrFallback(member, fallback);
}

export { taskKindLabel };
