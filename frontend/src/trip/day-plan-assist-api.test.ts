/**
 * day-plan-assist-api — Suggest / Auto-route & fill + Accept / Reject
 * (M80VKAX5 T9). Client must hit /api/v1 day-plan-assist only; Accept applies
 * via the assist resolution route (backend reuses itinerary mutations) — no
 * parallel itinerary write path from this client.
 */
import { describe, expect, it, vi } from "vitest";
import {
  acceptDayPlanAssistOption,
  rejectDayPlanAssistOption,
  requestDayPlanAssist,
} from "./day-plan-assist-api";

const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const PLAN_ID = "018f4e82-3000-7c00-b111-000000000001";
const DAY = "2026-06-19";
const SESSION_TOKEN = "member-session-token-day-plan-assist";
const CLIENT_MUTATION_ID = "day-plan-assist-client-1";
const BATCH_ID = "018f4e90-0000-7000-8000-0000000000aa";
const OPTION_A_ID = "018f4e90-0000-7000-8000-0000000000a1";
const OPTION_B_ID = "018f4e90-0000-7000-8000-0000000000a2";
const OPTION_C_ID = "018f4e90-0000-7000-8000-0000000000a3";
const ITEM_ID = "018f4e83-4000-7d00-c222-000000000001";

const WHY_A = "Keeps morning free for transfers";
const WHY_B = "Shortens walking legs between stops";
const WHY_C = "Balances meal timing with museum hours";

const MAP_PINS = [
  {
    itemId: ITEM_ID,
    lat: 22.3049,
    lng: 114.1617,
    label: "The Elements",
  },
] as const;

const CONTEXT = {
  direct: {
    day: DAY,
    stops: [{ id: ITEM_ID, activity: "Dim Dim Sum" }],
    mapPins: [...MAP_PINS],
  },
  indirect: {
    trip: { id: TRIP_ID, name: "Hong Kong + Shenzhen Trip" },
    mainPlanId: PLAN_ID,
    selectedPlanId: PLAN_ID,
    otherDays: [],
    members: [],
    constraints: [],
    linkedBookings: [],
    linkedEstimates: [],
    linkedCommitments: [],
    priorOutcomes: [],
  },
} as const;

const SELECTED_FIELDS = [
  "activity",
  "activityType",
  "place",
  "startTime",
  "endTime",
  "durationMinutes",
] as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function assistOptionsBody(mode: "suggest" | "autoRoute", optionCount: 1 | 2 | 3) {
  const options = [
    {
      id: OPTION_A_ID,
      label: "A",
      title: "Calm morning",
      summary: "Shift breakfast later",
      why: WHY_A,
      affectsItemIds: [ITEM_ID],
      proposedMutations: [{ op: "patch", itemId: ITEM_ID }],
    },
    {
      id: OPTION_B_ID,
      label: "B",
      title: "Compact walk",
      summary: "Reorder nearby stops",
      why: WHY_B,
      affectsItemIds: [ITEM_ID],
      proposedMutations: [{ op: "reorder", itemIds: [ITEM_ID] }],
    },
    {
      id: OPTION_C_ID,
      label: "C",
      title: "Museum-first",
      summary: "Front-load cultural stops",
      why: WHY_C,
      affectsItemIds: [ITEM_ID],
      proposedMutations: [],
    },
  ].slice(0, optionCount);

  return {
    batchId: BATCH_ID,
    tripId: TRIP_ID,
    day: DAY,
    planVariantId: PLAN_ID,
    mode,
    options,
  };
}

function baseAssistInput(mode: "suggest" | "autoRoute") {
  return {
    tripId: TRIP_ID,
    sessionToken: SESSION_TOKEN,
    clientMutationId: CLIENT_MUTATION_ID,
    mode,
    day: DAY,
    planVariantId: PLAN_ID,
    selectedItemIds: [ITEM_ID],
    selectedFields: [...SELECTED_FIELDS],
    mapPins: [...MAP_PINS],
    context: CONTEXT,
  };
}

describe("day-plan-assist-api Suggest / Auto-route & fill", () => {
  it("requestDayPlanAssist POSTs suggest mode to /api/v1/trips/{tripId}/day-plan-assist and parses ≤3 options each with Why", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(assistOptionsBody("suggest", 3)),
    );

    const outcome = await requestDayPlanAssist(baseAssistInput("suggest"), {
      fetch: fetchMock,
      apiBaseUrl: API_BASE,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/trips/${TRIP_ID}/day-plan-assist`);
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);
    expect(JSON.parse(String(init?.body))).toEqual({
      clientMutationId: CLIENT_MUTATION_ID,
      mode: "suggest",
      day: DAY,
      planVariantId: PLAN_ID,
      selectedItemIds: [ITEM_ID],
      selectedFields: [...SELECTED_FIELDS],
      mapPins: [...MAP_PINS],
      context: CONTEXT,
    });

    expect(outcome.batchId).toBe(BATCH_ID);
    expect(outcome.mode).toBe("suggest");
    expect(outcome.options.length).toBeGreaterThan(0);
    expect(outcome.options.length).toBeLessThanOrEqual(3);
    expect(outcome.options.map((o) => o.why)).toEqual([WHY_A, WHY_B, WHY_C]);
    for (const option of outcome.options) {
      expect(option.id.length).toBeGreaterThan(0);
      expect(option.why.trim().length).toBeGreaterThan(0);
    }
  });

  it("requestDayPlanAssist POSTs autoRoute mode (Auto-route & fill) and parses ≤3 options each with Why", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(assistOptionsBody("autoRoute", 2)),
    );

    const outcome = await requestDayPlanAssist(baseAssistInput("autoRoute"), {
      fetch: fetchMock,
      apiBaseUrl: API_BASE,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_BASE}/api/v1/trips/${TRIP_ID}/day-plan-assist`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body)).mode).toBe("autoRoute");

    expect(outcome.mode).toBe("autoRoute");
    expect(outcome.options.length).toBeLessThanOrEqual(3);
    expect(outcome.options.map((o) => ({ id: o.id, why: o.why }))).toEqual([
      { id: OPTION_A_ID, why: WHY_A },
      { id: OPTION_B_ID, why: WHY_B },
    ]);
  });
});

describe("day-plan-assist-api Accept / Reject", () => {
  it("acceptDayPlanAssistOption POSTs .../batches/{batchId}/options/{optionId}/accept with clientMutationId only (no itinerary write path)", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        batchId: BATCH_ID,
        tripId: TRIP_ID,
        optionId: OPTION_A_ID,
        status: "accepted",
        options: [
          { id: OPTION_A_ID, status: "accepted" },
          { id: OPTION_B_ID, status: "rejected" },
        ],
        appliedMutations: [{ op: "patch", itemId: ITEM_ID }],
      }),
    );

    const outcome = await acceptDayPlanAssistOption(
      {
        tripId: TRIP_ID,
        batchId: BATCH_ID,
        optionId: OPTION_A_ID,
        sessionToken: SESSION_TOKEN,
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/day-plan-assist/batches/${BATCH_ID}/options/${OPTION_A_ID}/accept`,
    );
    expect(String(url)).not.toContain("/itinerary-items");
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(JSON.parse(String(init?.body))).toEqual({
      clientMutationId: CLIENT_MUTATION_ID,
    });
    expect(outcome.status).toBe("accepted");
    expect(outcome.optionId).toBe(OPTION_A_ID);
  });

  it("rejectDayPlanAssistOption POSTs .../reject and surfaces API error.message without inventing an itinerary write", async () => {
    const API_ERROR =
      "Option is no longer open; refresh suggestions and try again.";
    const fetchMock = vi.fn<typeof fetch>(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).not.toContain("/itinerary-items");
      return jsonResponse(
        {
          error: {
            code: "option_not_open",
            message: API_ERROR,
          },
        },
        409,
      );
    });

    const outcome = await rejectDayPlanAssistOption(
      {
        tripId: TRIP_ID,
        batchId: BATCH_ID,
        optionId: OPTION_B_ID,
        sessionToken: SESSION_TOKEN,
        clientMutationId: CLIENT_MUTATION_ID,
      },
      { fetch: fetchMock, apiBaseUrl: API_BASE },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/day-plan-assist/batches/${BATCH_ID}/options/${OPTION_B_ID}/reject`,
    );
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      clientMutationId: CLIENT_MUTATION_ID,
    });
    expect(outcome.error).toBe(API_ERROR);
  });
});
