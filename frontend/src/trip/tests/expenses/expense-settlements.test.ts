import { describe, expect, it } from "vitest";
import {
  attachReminderHistory,
  buildSettlementSuggestions,
  filterExpenseRemindersForTripPlan,
  upsertExpenseReminder,
} from "../../expense-settlements";

describe("expense settlement helpers", () => {
  it("balances debtors and creditors with cent-safe settlement suggestions", () => {
    expect(
      buildSettlementSuggestions(
        {
          "member-aom": 40,
          "member-beam": -30,
          "member-nam": -10,
        },
        "HKD",
      ),
    ).toEqual([
      { from: "member-beam", to: "member-aom", amount: 30, currency: "HKD" },
      { from: "member-nam", to: "member-aom", amount: 10, currency: "HKD" },
    ]);
  });

  it("attaches reminder history to matching payer, receiver, plan, and amount", () => {
    expect(
      attachReminderHistory(
        [
          { from: "member-beam", to: "member-aom", amount: 30, currency: "HKD" },
          { from: "member-nam", to: "member-aom", amount: 10, currency: "HKD" },
        ],
        [
          {
            from: "member-beam",
            to: "member-aom",
            amount: 30,
            lastRemindedAt: "2026-06-05T12:00:00.000Z",
          },
        ],
      ),
    ).toEqual([
      {
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        currency: "HKD",
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
      { from: "member-nam", to: "member-aom", amount: 10, currency: "HKD" },
    ]);
  });

  it("upserts and filters reminders by trip plan scope", () => {
    const reminders = upsertExpenseReminder(
      [
        {
          tripPlanId: "plan-main",
          from: "member-beam",
          to: "member-aom",
          amount: 30,
          lastRemindedAt: "2026-06-05T11:00:00.000Z",
        },
      ],
      {
        tripPlanId: "plan-rain",
        from: "member-beam",
        to: "member-aom",
        amount: 30,
        lastRemindedAt: "2026-06-05T12:00:00.000Z",
      },
    );

    expect(reminders).toHaveLength(2);
    expect(filterExpenseRemindersForTripPlan(reminders, "plan-rain", "plan-main")).toEqual([
      reminders[1],
    ]);
  });
});
