import { describe, expect, it } from "vitest";
import { buildExpenseSummary } from "./expenses";
import { seedTrip } from "./seed";
import type { Expense } from "./types";

describe("expense summary", () => {
  it("summarizes owed, owing, and settled expense states", () => {
    expect(buildExpenseSummary([], "member-aom")).toMatchObject({
      groupSpend: 0,
      currentUserNetLabel: "You are settled",
      settlementSuggestions: [],
    });
    const summary = buildExpenseSummary(
      [
        {
          id: "expense-1",
          title: "Taxi",
          amount: 100.005,
          paidBy: "member-aom",
          splits: { "member-aom": 50.005, "member-beam": 50 },
          category: "transport",
        },
      ],
      "member-beam",
    );

    expect(summary.groupSpend).toBe(100.01);
    expect(summary.currentUserNetLabel).toBe("You owe HK$50.00");
    expect(summary.settlementSuggestions).toEqual([{ from: "member-beam", to: "member-aom", amount: 50, currency: "HKD" }]);

    expect(buildExpenseSummary([
      {
        id: "expense-mismatch",
        title: "Refunded deposit",
        amount: 100,
        paidBy: "member-aom",
        splits: { "member-aom": 90 },
        category: "settlement",
      },
    ], "member-aom").groupSpend).toBe(0);

    const currentMemberPaidOnly = buildExpenseSummary([
      {
        id: "expense-paid-only",
        title: "Deposit",
        amount: 25,
        paidBy: "member-aom",
        splits: {},
        category: "stay",
      },
    ], "member-aom");
    expect(currentMemberPaidOnly.currentUserNetLabel).toBe("You are owed HK$25.00");

    const zeroSettlement = buildExpenseSummary([
      {
        id: "expense-zero-share",
        title: "Zero adjustment",
        amount: 0,
        paidBy: "member-aom",
        splits: { "member-aom": 0 },
        category: "settlement",
      },
    ], "member-aom");
    expect(zeroSettlement.settlementSuggestions).toEqual([]);
  });

  it("summarizes shared expenses with current-user impact", () => {
    const summary = buildExpenseSummary(seedTrip.expenses, "member-aom");

    expect(summary.groupSpend).toBeGreaterThan(0);
    expect(summary.currentUserNetLabel).toMatch(/You/);
    expect(summary.settlementSuggestions.length).toBeGreaterThan(0);
  });

  it("records settle-up payments without inflating trip spend", () => {
    const dinner: Expense = {
      id: "expense-dinner",
      title: "Dinner",
      amount: 90,
      paidBy: "member-aom",
      splits: { "member-aom": 30, "member-beam": 30, "member-nam": 30 },
      category: "food",
    };
    const settlement: Expense = {
      id: "expense-settlement",
      title: "Beam paid Aom back",
      amount: 30,
      paidBy: "member-beam",
      splits: { "member-aom": 30 },
      category: "settlement",
    };

    const beforeSettlement = buildExpenseSummary([dinner], "member-beam");
    expect(beforeSettlement.groupSpend).toBe(90);
    expect(beforeSettlement.settlementSuggestions).toEqual([
      { from: "member-beam", to: "member-aom", amount: 30, currency: "HKD" },
      { from: "member-nam", to: "member-aom", amount: 30, currency: "HKD" },
    ]);

    const afterSettlement = buildExpenseSummary([dinner, settlement], "member-beam");
    expect(afterSettlement.groupSpend).toBe(90);
    expect(afterSettlement.currentUserNetLabel).toBe("You are settled");
    expect(afterSettlement.settlementSuggestions).toEqual([
      { from: "member-nam", to: "member-aom", amount: 30, currency: "HKD" },
    ]);
  });

  it("converts travel expenses into the trip settlement currency before balancing friends", () => {
    const expenses = [
      {
        id: "expense-hkd-meal",
        title: "Hong Kong dinner",
        amount: 120,
        currency: "HKD",
        paidBy: "member-aom",
        splits: { "member-aom": 60, "member-beam": 60 },
        category: "food",
      },
      {
        id: "expense-cny-taxi",
        title: "Shenzhen taxi",
        amount: 100,
        currency: "CNY",
        exchangeRateToSettlementCurrency: 1.1,
        paidBy: "member-beam",
        splits: { "member-aom": 50, "member-beam": 50 },
        category: "transport",
      },
    ] satisfies Expense[];

    const summary = buildExpenseSummary(expenses, "member-beam", [], { settlementCurrency: "HKD" });

    expect(summary.settlementCurrency).toBe("HKD");
    expect(summary.groupSpend).toBe(230);
    expect(summary.netByMember).toEqual({
      "member-aom": 5,
      "member-beam": -5,
    });
    expect(summary.currentUserNetLabel).toBe("You owe HK$5.00");
    expect(summary.settlementSuggestions).toEqual([
      { from: "member-beam", to: "member-aom", amount: 5, currency: "HKD" },
    ]);
  });
});
