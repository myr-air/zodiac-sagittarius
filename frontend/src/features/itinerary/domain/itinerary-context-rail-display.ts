import {
  displayNameOrFallback,
  firstNullableTextOrFallback,
} from "@/src/shared/text-parts";
import type { Member, Suggestion } from "@/src/trip/types";
import { taskKindLabel } from "./overview";

export function suggestionLabel(suggestion: Suggestion, fallback: string): string {
  /* v8 ignore next */
  return firstNullableTextOrFallback(
    [
      suggestion.proposedPatch.activity,
      suggestion.proposedPatch.note,
      suggestion.proposedPatch.place,
      suggestion.proposedPatch.transportation,
    ],
    fallback,
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
