/**
 * Accept-with-apply — Accept on a plan suggestion whose action_payload is the
 * safe item shape ({ itemId, patch }) PATCHes the itinerary item first via
 * patchItineraryItem, then PATCHes the suggestion to accepted. A
 * missing/non-item payload (e.g. { parentItemId }) skips the item PATCH and
 * does a status-only accepted PATCH (M82LQRZD T6).
 */

import { patchItineraryItem } from "./itinerary-api";
import type { ItineraryApiDeps } from "./itinerary-api";
import { patchPlanSuggestion } from "./plan-check-api";
import type { PlanCheckApiDeps, PlanSuggestionSummary } from "./plan-check-api";
import type { TripCockpitItineraryItem } from "./trip-cockpit-load";

export type PlanCheckApplyDeps = ItineraryApiDeps & PlanCheckApiDeps;

/** Safe action_payload shape that Accept may auto-apply to the itinerary item. */
export type SafeItemActionPayload = {
  itemId: string;
  patch: Record<string, unknown>;
};

/**
 * Narrow an unknown suggestion.actionPayload down to the safe
 * { itemId: string, patch: object } shape. Any other shape — missing itemId,
 * missing/non-object patch, or non-item payloads like { parentItemId } or
 * { itemIds: [...] } — is not safe to auto-apply.
 */
export function isSafeItemActionPayload(
  payload: unknown,
): payload is SafeItemActionPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }
  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.itemId !== "string" || candidate.itemId.length === 0) {
    return false;
  }
  if (
    !candidate.patch ||
    typeof candidate.patch !== "object" ||
    Array.isArray(candidate.patch)
  ) {
    return false;
  }
  return true;
}

export type AcceptPlanSuggestionInput = {
  tripId: string;
  sessionToken: string;
  suggestion: PlanSuggestionSummary;
  /**
   * expectedVersion for the itinerary item targeted by a safe action_payload
   * ({ itemId, patch }). Required by the caller when the payload is safe;
   * ignored for status-only accepts.
   */
  itemExpectedVersion?: number;
};

export type AcceptPlanSuggestionSuccess = {
  ok: true;
  suggestion: PlanSuggestionSummary;
  /** true when the safe item patch path ran before the status PATCH. */
  appliedItemPatch: boolean;
  /**
   * The itinerary item returned by the item PATCH — present only when
   * appliedItemPatch is true, so a caller can push the new version/fields
   * into its own state (e.g. ItineraryContextRail's onPatched).
   */
  item?: TripCockpitItineraryItem;
};

export type AcceptPlanSuggestionFailure = {
  ok: false;
  error: string;
  /**
   * "item" when the itinerary item PATCH failed (e.g. version_conflict) —
   * the suggestion PATCH is never sent in that case. "suggestion" when the
   * status PATCH itself failed.
   */
  stage: "item" | "suggestion";
  /** Present on version_conflict from either PATCH. */
  code?: string;
};

export type AcceptPlanSuggestionOutcome =
  | AcceptPlanSuggestionSuccess
  | AcceptPlanSuggestionFailure;

/**
 * Accept a plan suggestion. When suggestion.actionPayload is the safe
 * { itemId: string, patch: object } shape, PATCHes the itinerary item first
 * (patchItineraryItem) and only PATCHes the suggestion to accepted after that
 * succeeds — an item-side version_conflict reloads and leaves the suggestion
 * pending. Any other payload shape (missing itemId, e.g. { parentItemId })
 * skips the item PATCH and does a status-only accepted PATCH.
 */
export async function acceptPlanSuggestion(
  input: AcceptPlanSuggestionInput,
  deps: PlanCheckApplyDeps,
): Promise<AcceptPlanSuggestionOutcome> {
  const { suggestion } = input;
  const payload = suggestion.actionPayload;
  const appliedItemPatch = isSafeItemActionPayload(payload);
  let patchedItem: TripCockpitItineraryItem | undefined;

  if (appliedItemPatch) {
    const itemResult = await patchItineraryItem(
      {
        tripId: input.tripId,
        itemId: payload.itemId,
        sessionToken: input.sessionToken,
        expectedVersion: input.itemExpectedVersion ?? 0,
        patch: payload.patch,
      },
      deps,
    );
    if (!itemResult.ok) {
      return {
        ok: false,
        error: itemResult.error,
        stage: "item",
        code: itemResult.code,
      };
    }
    patchedItem = itemResult.item;
  }

  const suggestionResult = await patchPlanSuggestion(
    {
      tripId: input.tripId,
      suggestionId: suggestion.id,
      sessionToken: input.sessionToken,
      expectedVersion: suggestion.version,
      status: "accepted",
    },
    deps,
  );
  if (!suggestionResult.ok) {
    return {
      ok: false,
      error: suggestionResult.error,
      stage: "suggestion",
      code: suggestionResult.code,
    };
  }

  return {
    ok: true,
    suggestion: suggestionResult.suggestion,
    appliedItemPatch,
    ...(patchedItem ? { item: patchedItem } : {}),
  };
}
