import { describe, expect, it } from "vitest";
import {
  buildExpenseReminderRequest,
  buildExpenseSummary,
  expenseReminderRequestForSuggestion,
  recordLocalExpenseReminderInTrip,
} from "./expenses";
import * as expenseHelpers from "./expenses";
import type { Expense, Trip } from "./types";

describe("expense reminders", () => {
  it("carries reminder history onto matching settle-up suggestions", () => {
    const dinner: Expense = {
      id: "expense-dinner",
      title: "Dinner",
      amount: 90,
      paidBy: "member-aom",
      splits: { "member-aom": 30, "member-beam": 30, "member-nam": 30 },
      category: "food",
    };

    const summary = buildExpenseSummary([dinner], "member-beam", [
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
    ]);

    expect(summary.settlementSuggestions).toEqual([
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        currency: "HKD",
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
      { from: "member-nam", to: "member-aom", amount: 30, currency: "HKD" },
    ]);
  });

  it("upserts payback reminder history by payer, receiver, and amount", () => {
    expect(expenseHelpers.upsertExpenseReminder([
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T11:00:00.000Z",
      },
    ], {
      from: "member-beam",
      to: "member-aom",
      amount: 30,
      lastRemindedAt: "2026-06-05T12:00:00.000Z",
    })).toEqual([
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
    ]);
  });

  it("keeps payback reminder history separate by Trip Plan", () => {
    expect(expenseHelpers.upsertExpenseReminder([
      {
        tripPlanId: "plan-main",
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T11:00:00.000Z",
      },
    ], {
      tripPlanId: "plan-rain",
      from: "member-beam",
      to: "member-aom",
      amount: 30,
      lastRemindedAt: "2026-06-05T12:00:00.000Z",
    })).toEqual([
      {
        tripPlanId: "plan-main",
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T11:00:00.000Z",
      },
      {
        tripPlanId: "plan-rain",
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
    ]);
  });

  it("filters reminder history to the selected Trip Plan and treats legacy reminders as Main Plan", () => {
    const reminders = [
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T10:00:00.000Z",
      },
      {
        tripPlanId: "plan-rain",
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
    ];

    expect(
      expenseHelpers.filterExpenseRemindersForTripPlan(
        reminders,
        "plan-main",
        "plan-main",
      ),
    ).toEqual([reminders[0]]);
    expect(
      expenseHelpers.filterExpenseRemindersForTripPlan(
        reminders,
        "plan-rain",
        "plan-main",
      ),
    ).toEqual([reminders[1]]);
  });

  it("builds a direct payback reminder that can be pasted into chat", () => {
    const trip = {
      name: "Weekend food crawl",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [],
      expenses: [],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;

    expect(expenseHelpers.buildPaybackReminder({
      trip,
      suggestion: { from: "member-beam", to: "member-aom", amount: 42.5 },
    })).toBe("Beam, please pay Aom HK$42.50 for Weekend food crawl. Mark it as paid in Joii after you send it.");
  });

  it("builds API reminder requests from settlement suggestions", () => {
    expect(
      expenseReminderRequestForSuggestion({
        from: "member-beam",
        to: "member-aom",
        amount: 42.56,
      }),
    ).toEqual({
      from: "member-beam",
      to: "member-aom",
      amountMinor: 4256,
    });
  });

  it("builds expense reminder API requests with mutation ids", () => {
    expect(
      buildExpenseReminderRequest(
        {
          from: "member-beam",
          to: "member-aom",
          amount: 42.56,
        },
        {
          clientMutationId: "expense-reminder-mutation",
        },
      ),
    ).toEqual({
      clientMutationId: "expense-reminder-mutation",
      from: "member-beam",
      to: "member-aom",
      amountMinor: 4256,
    });
  });

  it("records local expense reminders with deterministic timestamps", () => {
    const trip = {
      expenseReminders: [
        {
          tripPlanId: "plan-main",
          from: "member-beam",
          to: "member-aom",
          amount: 42.5,
          lastRemindedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    } as Pick<Trip, "expenseReminders">;

    const nextTrip = recordLocalExpenseReminderInTrip(
      trip,
      { from: "member-beam", to: "member-aom", amount: 42.5 },
      {
        tripPlanId: "plan-main",
        remindedAt: "2026-06-02T00:00:00.000Z",
      },
    );

    expect(nextTrip).not.toBe(trip);
    expect(nextTrip.expenseReminders).toEqual([
      {
        tripPlanId: "plan-main",
        from: "member-beam",
        to: "member-aom",
        amount: 42.5,
        lastRemindedAt: "2026-06-02T00:00:00.000Z",
      },
    ]);
  });
});
