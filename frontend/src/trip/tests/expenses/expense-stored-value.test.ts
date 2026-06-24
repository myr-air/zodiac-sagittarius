import { describe, expect, it } from "vitest";
import {
  buildStoredValueCardBalances,
  isStoredValueFundingExpense,
} from "../../expenses";
import type { Expense } from "../../types";

describe("stored-value card expense helpers", () => {
  it("builds balances from top-up and card-funded spend without mixing normal cash spend", () => {
    const expenses: Expense[] = [
      {
        id: "expense-octopus-topup",
        title: "Octopus top-up",
        amount: 800,
        currency: "HKD",
        paidBy: "member-aom",
        splits: { "member-aom": 800 },
        category: "transport",
        storedValueCardId: "octopus",
        storedValueCardName: "Octopus",
        storedValueTransactionType: "topup",
      },
      {
        id: "expense-tram",
        title: "Tram fare",
        amount: 12,
        currency: "HKD",
        paidBy: "member-aom",
        splits: { "member-aom": 12 },
        category: "transport",
        storedValueCardId: "octopus",
        storedValueCardName: "Octopus",
        storedValueTransactionType: "spend",
      },
      {
        id: "expense-cash",
        title: "Cash snack",
        amount: 30,
        currency: "HKD",
        paidBy: "member-aom",
        splits: { "member-aom": 30 },
        category: "food",
      },
    ];

    expect(isStoredValueFundingExpense(expenses[0])).toBe(true);
    expect(isStoredValueFundingExpense(expenses[1])).toBe(false);
    expect(buildStoredValueCardBalances(expenses)).toEqual([
      {
        balance: 788,
        cardId: "octopus",
        cardName: "Octopus",
        currency: "HKD",
        spend: 12,
        topUp: 800,
        transactionCount: 2,
      },
    ]);
  });

  it("keeps the same stored-value card in separate balances when currencies differ", () => {
    const expenses: Expense[] = [
      {
        id: "expense-octopus-topup-hkd",
        title: "Octopus top-up",
        amount: 100,
        currency: "HKD",
        paidBy: "member-aom",
        splits: { "member-aom": 100 },
        category: "transport",
        storedValueCardId: "octopus",
        storedValueCardName: "Octopus",
        storedValueTransactionType: "topup",
      },
      {
        id: "expense-octopus-topup-thb",
        title: "Octopus top-up via Thai wallet",
        amount: 500,
        currency: "THB",
        paidBy: "member-aom",
        splits: { "member-aom": 500 },
        category: "transport",
        storedValueCardId: "octopus",
        storedValueCardName: "Octopus",
        storedValueTransactionType: "topup",
      },
    ];

    expect(buildStoredValueCardBalances(expenses)).toEqual([
      {
        balance: 100,
        cardId: "octopus",
        cardName: "Octopus",
        currency: "HKD",
        spend: 0,
        topUp: 100,
        transactionCount: 1,
      },
      {
        balance: 500,
        cardId: "octopus",
        cardName: "Octopus",
        currency: "THB",
        spend: 0,
        topUp: 500,
        transactionCount: 1,
      },
    ]);
  });
});
