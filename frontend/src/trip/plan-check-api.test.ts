/**
 * plan-check-api — runPlanCheck (M82LQRZD T1 #1). Client must POST
 * /api/v1/trips/{tripId}/plan-checks (optional ?tripPlanId=) with Bearer
 * session and parse PlanCheckSummary (id, stale, itineraryFingerprint,
 * suggestions[]).
 */
import { describe, expect, it, vi } from "vitest";
import {
  loadLatestPlanCheck,
  patchPlanSuggestion,
  runPlanCheck,
} from "./plan-check-api";

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const TRIP_PLAN_ID = "018f4e82-3000-7c00-b111-000000000001";
const SESSION_TOKEN = "member-session-token-plan-check";
const CHECK_ID = "018f4e90-0000-7000-8000-0000000000aa";
const SUGGESTION_ID = "018f4e90-0000-7000-8000-0000000000a1";
const ITEM_ID = "018f4e83-4000-7d00-c222-000000000001";
const CREATED_BY = "018f4e80-1111-7000-9000-000000000001";
const FINGERPRINT = "sha256:abc123";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function planCheckSummaryBody() {
  return {
    id: CHECK_ID,
    tripId: TRIP_ID,
    tripPlanId: TRIP_PLAN_ID,
    createdBy: CREATED_BY,
    itineraryFingerprint: FINGERPRINT,
    stale: false,
    status: "completed",
    languageMetadata: { locale: "en" },
    createdAt: "2026-07-23T10:00:00Z",
    completedAt: "2026-07-23T10:00:05Z",
    version: 1,
    suggestions: [
      {
        id: SUGGESTION_ID,
        tripId: TRIP_ID,
        planCheckId: CHECK_ID,
        severity: "warning",
        scope: "item",
        targetItemIds: [ITEM_ID],
        explanation: { en: "Overlapping stops", th: "จุดจอดที่ซ้อนกัน" },
        recommendedAction: {
          en: "Move one stop later",
          th: "เลื่อนจุดจอดหนึ่ง",
        },
        actionKind: "shift_time",
        actionPayload: { minutes: 30 },
        status: "open",
        snoozedUntil: null,
        createdAt: "2026-07-23T10:00:05Z",
        updatedAt: "2026-07-23T10:00:05Z",
        version: 1,
      },
    ],
  };
}

describe("plan-check-api runPlanCheck", () => {
  it("POSTs /api/v1/trips/{tripId}/plan-checks with Bearer session and parses PlanCheckSummary (id, stale, itineraryFingerprint, suggestions[])", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(planCheckSummaryBody()),
    );

    const outcome = await runPlanCheck(
      { tripId: TRIP_ID, sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/trips/${TRIP_ID}/plan-checks`);
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);

    expect(outcome.planCheck.id).toBe(CHECK_ID);
    expect(outcome.planCheck.stale).toBe(false);
    expect(outcome.planCheck.itineraryFingerprint).toBe(FINGERPRINT);
    expect(outcome.planCheck.suggestions.length).toBe(1);
    expect(outcome.planCheck.suggestions[0]?.id).toBe(SUGGESTION_ID);
  });

  it("appends ?tripPlanId= to the POST url when tripPlanId is provided", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(planCheckSummaryBody()),
    );

    const outcome = await runPlanCheck(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        tripPlanId: TRIP_PLAN_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/plan-checks?tripPlanId=${TRIP_PLAN_ID}`,
    );
  });
});

describe("plan-check-api loadLatestPlanCheck", () => {
  it("GETs /api/v1/trips/{tripId}/plan-checks/latest with Bearer session and parses PlanCheckSummary", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(planCheckSummaryBody()),
    );

    const outcome = await loadLatestPlanCheck(
      { tripId: TRIP_ID, sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/plan-checks/latest`,
    );
    expect(init?.method).toBe("GET");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);

    expect(outcome.planCheck?.id).toBe(CHECK_ID);
    expect(outcome.planCheck?.stale).toBe(false);
    expect(outcome.planCheck?.itineraryFingerprint).toBe(FINGERPRINT);
    expect(outcome.planCheck?.suggestions.length).toBe(1);
  });

  it("appends ?tripPlanId= to the GET latest url when tripPlanId is provided", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(planCheckSummaryBody()),
    );

    const outcome = await loadLatestPlanCheck(
      {
        tripId: TRIP_ID,
        sessionToken: SESSION_TOKEN,
        tripPlanId: TRIP_PLAN_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/plan-checks/latest?tripPlanId=${TRIP_PLAN_ID}`,
    );
  });

  it("returns { ok: true, planCheck: null } when the trip has never been checked (200 with a null body)", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => jsonResponse(null));

    const outcome = await loadLatestPlanCheck(
      { tripId: TRIP_ID, sessionToken: SESSION_TOKEN },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome).toEqual({ ok: true, planCheck: null });
  });
});

function updatedSuggestionBody(overrides: Record<string, unknown> = {}) {
  return {
    id: SUGGESTION_ID,
    tripId: TRIP_ID,
    planCheckId: CHECK_ID,
    severity: "warning",
    scope: "item",
    targetItemIds: [ITEM_ID],
    explanation: { en: "Overlapping stops", th: "จุดจอดที่ซ้อนกัน" },
    recommendedAction: {
      en: "Move one stop later",
      th: "เลื่อนจุดจอดหนึ่ง",
    },
    actionKind: "shift_time",
    actionPayload: { minutes: 30 },
    status: "dismissed",
    snoozedUntil: null,
    createdAt: "2026-07-23T10:00:05Z",
    updatedAt: "2026-07-23T10:05:00Z",
    version: 2,
    ...overrides,
  };
}

describe("plan-check-api patchPlanSuggestion", () => {
  it("PATCHes /api/v1/trips/{tripId}/plan-suggestions/{id} with Bearer session and { expectedVersion, status }, parsing the updated PlanSuggestionSummary", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(updatedSuggestionBody()),
    );

    const outcome = await patchPlanSuggestion(
      {
        tripId: TRIP_ID,
        suggestionId: SUGGESTION_ID,
        sessionToken: SESSION_TOKEN,
        expectedVersion: 1,
        status: "dismissed",
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/plan-suggestions/${SUGGESTION_ID}`,
    );
    expect(init?.method).toBe("PATCH");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(JSON.parse(init?.body as string)).toEqual({
      expectedVersion: 1,
      status: "dismissed",
    });

    expect(outcome.suggestion.id).toBe(SUGGESTION_ID);
    expect(outcome.suggestion.status).toBe("dismissed");
    expect(outcome.suggestion.version).toBe(2);
  });

  it("includes snoozedUntil in the PATCH body when provided", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        updatedSuggestionBody({
          status: "snoozed",
          snoozedUntil: "2026-08-01T00:00:00Z",
        }),
      ),
    );

    const outcome = await patchPlanSuggestion(
      {
        tripId: TRIP_ID,
        suggestionId: SUGGESTION_ID,
        sessionToken: SESSION_TOKEN,
        expectedVersion: 1,
        status: "snoozed",
        snoozedUntil: "2026-08-01T00:00:00Z",
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init?.body as string)).toEqual({
      expectedVersion: 1,
      status: "snoozed",
      snoozedUntil: "2026-08-01T00:00:00Z",
    });
  });

  it('returns { ok: false, code: "version_conflict" } without throwing on a 409 conflict response', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        {
          code: "version_conflict",
          message: "version conflict",
          latest: updatedSuggestionBody({ version: 3 }),
        },
        409,
      ),
    );

    let outcome: Awaited<ReturnType<typeof patchPlanSuggestion>> | undefined;
    let threw = false;
    try {
      outcome = await patchPlanSuggestion(
        {
          tripId: TRIP_ID,
          suggestionId: SUGGESTION_ID,
          sessionToken: SESSION_TOKEN,
          expectedVersion: 1,
          status: "dismissed",
        },
        { fetch: fetchMock, apiBaseUrl: API_BASE },
      );
    } catch {
      threw = true;
    }

    expect(threw).toBe(false);
    expect(outcome?.ok).toBe(false);
    if (!outcome || outcome.ok) return;
    expect(outcome.code).toBe("version_conflict");
    expect(typeof outcome.error).toBe("string");
    expect(outcome.error.length).toBeGreaterThan(0);
  });
});
