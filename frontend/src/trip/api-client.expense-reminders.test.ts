import { describe, expect, it, vi } from "vitest";
import { createTripApiClient } from "./api-client";
import { cockpitResponse, jsonResponse } from "./api-client.test-support";

describe("Trip API client expense reminder routes", () => {
  it("records a payback reminder and receives refreshed settlement suggestions", async () => {
    const reminderSummary = {
      groupSpend: 240,
      netByMember: {
        [cockpitResponse.members[0].id]: 120,
        [cockpitResponse.members[1].id]: -120,
      },
      currentUserNetLabel: "You owe HK$120.00",
      settlementSuggestions: [
        {
          from: cockpitResponse.members[1].id,
          to: cockpitResponse.members[0].id,
          amount: 120,
          lastRemindedAt: "2026-06-05T12:00:00.000Z",
        },
      ],
    };
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(reminderSummary));
    const client = createTripApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl,
    });
    const request = {
      clientMutationId: "web-expense-reminder-1",
      from: cockpitResponse.members[1].id,
      to: cockpitResponse.members[0].id,
      amountMinor: 12000,
    };

    const summary = await client.recordExpenseReminder(
      cockpitResponse.trip.id,
      "session-token",
      request,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/expenses/reminders`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify(request),
      }),
    );
    expect(summary.settlementSuggestions[0]).toMatchObject({
      amount: 120,
      lastRemindedAt: "2026-06-05T12:00:00.000Z",
    });
  });

  it("scopes expense summaries and reminders to the selected Trip Plan", async () => {
    const selectedTripPlanId = "plan-rain";
    const scopedSummary = {
      groupSpend: 90,
      netByMember: {
        [cockpitResponse.members[0].id]: 45,
        [cockpitResponse.members[1].id]: -45,
      },
      currentUserNetLabel: "You owe HK$45.00",
      settlementSuggestions: [],
    };
    const reminderSummary = {
      ...scopedSummary,
      settlementSuggestions: [
        {
          from: cockpitResponse.members[1].id,
          to: cockpitResponse.members[0].id,
          amount: 45,
          lastRemindedAt: "2026-06-05T12:00:00.000Z",
        },
      ],
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(scopedSummary))
      .mockResolvedValueOnce(jsonResponse(reminderSummary));
    const client = createTripApiClient({
      baseUrl: "https://api.example.test",
      fetchImpl,
    });
    const request = {
      clientMutationId: "web-expense-reminder-scoped",
      from: cockpitResponse.members[1].id,
      to: cockpitResponse.members[0].id,
      amountMinor: 4500,
    };

    const summary = await client.getExpenseSummary(
      cockpitResponse.trip.id,
      "session-token",
      selectedTripPlanId,
    );
    const reminded = await client.recordExpenseReminder(
      cockpitResponse.trip.id,
      "session-token",
      request,
      selectedTripPlanId,
    );

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/expenses/summary?tripPlanId=${selectedTripPlanId}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/expenses/reminders?tripPlanId=${selectedTripPlanId}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify(request),
      }),
    );
    expect(summary.groupSpend).toBe(90);
    expect(reminded.settlementSuggestions[0]).toMatchObject({
      amount: 45,
      lastRemindedAt: "2026-06-05T12:00:00.000Z",
    });
  });
});
