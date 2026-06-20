import { describe, expect, it, vi } from "vitest";
import { createTripApiClient } from "./api-client";
import { cockpitResponse, jsonResponse } from "./api-client.test-support";

describe("Trip API client expense routes", () => {
  it("creates, patches, and deletes expenses through authenticated backend routes", async () => {
    const createdExpense = {
      ...cockpitResponse.expenses[0],
      id: "018f4e86-1111-7000-8000-000000000002",
      title: "Taxi",
      amountMinor: 12000,
      notes: "Airport pickup.",
      receiptUrl: "https://receipts.example/taxi.jpg",
      comments: [
        {
          id: "comment-created",
          authorId: cockpitResponse.members[1].id,
          body: "Paid from my cash wallet.",
          createdAt: "2026-06-05T12:00:00.000Z",
        },
      ],
      lineItems: [
        {
          id: "line-taxi",
          title: "Taxi van",
          amount: 120,
          participantIds: [cockpitResponse.members[0].id],
        },
      ],
      version: 1,
    };
    const patchedExpense = {
      ...createdExpense,
      title: "Taxi edited",
      amountMinor: 15000,
      notes: "Airport pickup edited.",
      receiptUrl: "https://receipts.example/taxi-edited.jpg",
      comments: [
        {
          id: "comment-created",
          authorId: cockpitResponse.members[1].id,
          body: "Paid from my cash wallet.",
          createdAt: "2026-06-05T12:00:00.000Z",
        },
        {
          id: "comment-edited",
          authorId: cockpitResponse.members[0].id,
          body: "Adjusted for toll.",
          createdAt: "2026-06-05T12:10:00.000Z",
        },
      ],
      lineItems: [
        {
          id: "line-taxi-edited",
          title: "Taxi van edited",
          amount: 150,
          participantIds: [cockpitResponse.members[0].id],
        },
      ],
      version: 2,
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(createdExpense, 201))
      .mockResolvedValueOnce(jsonResponse(patchedExpense))
      .mockResolvedValueOnce(jsonResponse(patchedExpense));
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });
    const createRequest = {
      clientMutationId: "web-expense-1",
      title: "Taxi",
      amountMinor: 12000,
      currency: "CNY",
      exchangeRateToSettlementCurrency: 1.1,
      notes: "Airport pickup.",
      receiptUrl: "https://receipts.example/taxi.jpg",
      comments: [
        {
          id: "comment-created",
          authorId: cockpitResponse.members[1].id,
          body: "Paid from my cash wallet.",
          createdAt: "2026-06-05T12:00:00.000Z",
        },
      ],
      lineItems: [
        {
          id: "line-taxi",
          title: "Taxi van",
          amount: 120,
          participantIds: [cockpitResponse.members[0].id],
        },
      ],
      paidBy: cockpitResponse.members[0].id,
      category: "transport" as const,
      splits: { [cockpitResponse.members[0].id]: 12000 },
      itineraryItemId: cockpitResponse.itineraryItems[0].id,
    };
    const patchRequest = {
      clientMutationId: "web-expense-2",
      expectedVersion: 1,
      tripPlanId: cockpitResponse.trip.activePlanVariantId,
      title: "Taxi edited",
      amountMinor: 15000,
      currency: "CNY",
      exchangeRateToSettlementCurrency: 1.1,
      notes: "Airport pickup edited.",
      receiptUrl: "https://receipts.example/taxi-edited.jpg",
      comments: [
        {
          id: "comment-created",
          authorId: cockpitResponse.members[1].id,
          body: "Paid from my cash wallet.",
          createdAt: "2026-06-05T12:00:00.000Z",
        },
        {
          id: "comment-edited",
          authorId: cockpitResponse.members[0].id,
          body: "Adjusted for toll.",
          createdAt: "2026-06-05T12:10:00.000Z",
        },
      ],
      lineItems: [
        {
          id: "line-taxi-edited",
          title: "Taxi van edited",
          amount: 150,
          participantIds: [cockpitResponse.members[0].id],
        },
      ],
      paidBy: cockpitResponse.members[0].id,
      category: "transport" as const,
      splits: { [cockpitResponse.members[0].id]: 15000 },
      itineraryItemId: cockpitResponse.itineraryItems[0].id,
    };

    const created = await client.createExpense(cockpitResponse.trip.id, "session-token", createRequest);
    const patched = await client.patchExpense(cockpitResponse.trip.id, created.id, "session-token", patchRequest);
    const deleted = await client.deleteExpense(cockpitResponse.trip.id, patched.id, "session-token");

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/expenses`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify(createRequest),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/expenses/${createdExpense.id}`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify(patchRequest),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `https://api.example.test/api/v1/trips/${cockpitResponse.trip.id}/expenses/${patchedExpense.id}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
      }),
    );
    expect(created).toMatchObject({ id: createdExpense.id, title: "Taxi", amount: 120, notes: "Airport pickup.", comments: createdExpense.comments, version: 1 });
    expect(patched).toMatchObject({ id: createdExpense.id, title: "Taxi edited", amount: 150, version: 2 });
    expect(deleted).toMatchObject({ id: createdExpense.id, title: "Taxi edited", amount: 150, version: 2 });
  });

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
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });
    const request = {
      clientMutationId: "web-expense-reminder-1",
      from: cockpitResponse.members[1].id,
      to: cockpitResponse.members[0].id,
      amountMinor: 12000,
    };

    const summary = await client.recordExpenseReminder(cockpitResponse.trip.id, "session-token", request);

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
    const client = createTripApiClient({ baseUrl: "https://api.example.test", fetchImpl });
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
