import { describe, expect, it } from "vitest";
import { buildExpenseSummary } from "./expenses";
import type { Expense } from "./types";

describe("expense summary reminder history", () => {
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
});
