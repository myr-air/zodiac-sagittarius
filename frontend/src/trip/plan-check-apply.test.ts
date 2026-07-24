/**
 * plan-check-apply — acceptPlanSuggestion (M82LQRZD T6 #1). Accept on a safe
 * item action_payload ({ itemId, patch }) must PATCH the itinerary item first
 * via patchItineraryItem, then PATCH the suggestion to accepted. A
 * missing/non-item payload (e.g. { parentItemId }) must do a status-only
 * accepted PATCH — no itinerary item PATCH.
 */
import { describe, expect, it, vi } from "vitest";
import { acceptPlanSuggestion } from "./plan-check-apply";
import type { PlanSuggestionSummary } from "./plan-check-api";

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const SESSION_TOKEN = "member-session-token-plan-check-apply";
const SUGGESTION_ID = "018f4e90-0000-7000-8000-0000000000a1";
const ITEM_ID = "018f4e83-4000-7d00-c222-000000000001";
const PARENT_ITEM_ID = "018f4e83-4000-7d00-c222-000000000002";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function baseSuggestion(
  overrides: Partial<PlanSuggestionSummary> = {},
): PlanSuggestionSummary {
  return {
    id: SUGGESTION_ID,
    tripId: TRIP_ID,
    planCheckId: "018f4e90-0000-7000-8000-0000000000aa",
    severity: "warning",
    scope: "item",
    targetItemIds: [ITEM_ID],
    explanation: { en: "Stop runs past midnight", th: "จุดจอดเลยเที่ยงคืน" },
    recommendedAction: { en: "Trim the duration", th: "ลดระยะเวลา" },
    actionKind: "editItem",
    actionPayload: { itemId: ITEM_ID, patch: { durationMinutes: 60 } },
    status: "pending",
    snoozedUntil: null,
    createdAt: "2026-07-23T10:00:00Z",
    updatedAt: "2026-07-23T10:00:00Z",
    version: 2,
    ...overrides,
  };
}

const ITEM_PATCH_RESPONSE = {
  id: ITEM_ID,
  tripId: TRIP_ID,
  planVariantId: "018f4e82-3000-7c00-b111-000000000001",
  day: "2026-04-12",
  activity: "Night market",
  activityType: "food",
  place: "Old City",
  startTime: "20:00",
  status: "confirmed",
  version: 6,
};

function acceptedSuggestionResponse(
  overrides: Record<string, unknown> = {},
) {
  return {
    ...baseSuggestion(),
    status: "accepted",
    version: 3,
    ...overrides,
  };
}

describe("plan-check-apply acceptPlanSuggestion", () => {
  it("PATCHes the itinerary item first via patchItineraryItem then PATCHes the suggestion to accepted for a safe { itemId, patch } action_payload", async () => {
    const suggestion = baseSuggestion({
      actionPayload: { itemId: ITEM_ID, patch: { durationMinutes: 60 } },
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(ITEM_PATCH_RESPONSE))
      .mockResolvedValueOnce(jsonResponse(acceptedSuggestionResponse()));

    const outcome = await acceptPlanSuggestion(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        suggestion,
        itemExpectedVersion: 5,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("expected success");
    expect(outcome.appliedItemPatch).toBe(true);
    expect(outcome.suggestion.status).toBe("accepted");

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [itemUrl, itemInit] = fetchMock.mock.calls[0]!;
    expect(itemUrl).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${ITEM_ID}`,
    );
    expect(itemInit?.method).toBe("PATCH");
    const itemBody = JSON.parse(String(itemInit?.body));
    expect(itemBody.expectedVersion).toBe(5);
    expect(itemBody.patch).toEqual({ durationMinutes: 60 });

    const [suggestionUrl, suggestionInit] = fetchMock.mock.calls[1]!;
    expect(suggestionUrl).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/plan-suggestions/${SUGGESTION_ID}`,
    );
    expect(suggestionInit?.method).toBe("PATCH");
    expect(JSON.parse(String(suggestionInit?.body))).toEqual({
      expectedVersion: suggestion.version,
      status: "accepted",
    });
  });

  it("does a status-only accepted PATCH (no patchItineraryItem call) when action_payload is missing itemId, e.g. { parentItemId }", async () => {
    const suggestion = baseSuggestion({
      actionKind: "editItem",
      actionPayload: { parentItemId: PARENT_ITEM_ID },
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(acceptedSuggestionResponse()));

    const outcome = await acceptPlanSuggestion(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        suggestion,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) throw new Error("expected success");
    expect(outcome.appliedItemPatch).toBe(false);
    expect(outcome.suggestion.status).toBe("accepted");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/plan-suggestions/${SUGGESTION_ID}`,
    );
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(String(init?.body))).toEqual({
      expectedVersion: suggestion.version,
      status: "accepted",
    });

    const calledUrls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(
      calledUrls.some((calledUrl) => calledUrl.includes("/itinerary-items/")),
    ).toBe(false);
  });

  it("returns a pending item-stage version_conflict and never PATCHes the suggestion when patchItineraryItem 409s (M82LQRZD T6 #2)", async () => {
    const suggestion = baseSuggestion({
      actionPayload: { itemId: ITEM_ID, patch: { durationMinutes: 60 } },
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          { code: "version_conflict", message: "Stop changed since you loaded it." },
          409,
        ),
      );

    const outcome = await acceptPlanSuggestion(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        suggestion,
        itemExpectedVersion: 5,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected failure");
    expect(outcome.stage).toBe("item");
    expect(outcome.code).toBe("version_conflict");

    // Suggestion left pending: exactly one fetch (the item PATCH) — the
    // suggestion PATCH must never fire on an item-stage conflict.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [itemUrl, itemInit] = fetchMock.mock.calls[0]!;
    expect(itemUrl).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${ITEM_ID}`,
    );
    expect(itemInit?.method).toBe("PATCH");

    const calledUrls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(
      calledUrls.some((calledUrl) =>
        calledUrl.includes("/plan-suggestions/"),
      ),
    ).toBe(false);
  });

  it("only ever PATCHes the suggestion status to \"accepted\" — Dismiss/Snooze are not part of acceptPlanSuggestion's apply path (M82LQRZD T6 #2)", async () => {
    // acceptPlanSuggestion has no status parameter — it hardcodes the
    // suggestion PATCH to status: "accepted". Dismiss/Snooze PATCH
    // "dismissed"/"snoozed" directly via patchPlanSuggestion and never call
    // acceptPlanSuggestion, so they never run the item-patch apply path.
    const suggestion = baseSuggestion({
      actionPayload: { parentItemId: PARENT_ITEM_ID },
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(acceptedSuggestionResponse()));

    const outcome = await acceptPlanSuggestion(
      { tripId: TRIP_ID, sessionToken: SESSION_TOKEN, suggestion },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(String(init?.body));
    expect(body.status).toBe("accepted");
    expect(body.status).not.toBe("dismissed");
    expect(body.status).not.toBe("snoozed");
  });
});
