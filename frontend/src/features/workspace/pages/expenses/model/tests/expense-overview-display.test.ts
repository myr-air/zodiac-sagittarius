import { describe, expect, it } from "vitest";
import {
  type ExpenseBalanceCopy,
  expenseMemberBalanceDisplay,
  settlementSuggestionLabel,
} from "../expense-overview-display";

const balanceCopy: ExpenseBalanceCopy = {
  owed: ({ amount, name }) => `${name} is owed ${amount}`,
  owes: ({ amount, name }) => `${name} owes ${amount}`,
  payback: ({ amount, from, to }) => `${from} pays ${to} ${amount}`,
  settled: ({ name }) => `${name} is settled`,
};

describe("expense overview display", () => {
  it("builds member balance descriptions and amount tone", () => {
    expect(
      expenseMemberBalanceDisplay({
        balanceCopy,
        memberName: "Aom",
        net: 120,
        settlementCurrency: "HKD",
      }),
    ).toEqual({
      amountLabel: "HK$120.00",
      description: "Aom is owed HK$120.00",
      tone: "positive",
    });
    expect(
      expenseMemberBalanceDisplay({
        balanceCopy,
        memberName: "Beam",
        net: -45,
        settlementCurrency: "HKD",
      }),
    ).toEqual({
      amountLabel: "-HK$45.00",
      description: "Beam owes HK$45.00",
      tone: "negative",
    });
    expect(
      expenseMemberBalanceDisplay({
        balanceCopy,
        memberName: "Nam",
        net: 0,
        settlementCurrency: "HKD",
      }),
    ).toEqual({
      amountLabel: "HK$0.00",
      description: "Nam is settled",
      tone: "neutral",
    });
  });

  it("builds settlement labels with suggestion currency fallback", () => {
    expect(
      settlementSuggestionLabel({
        balanceCopy,
        fromName: "Beam",
        settlementCurrency: "HKD",
        suggestion: { amount: 20, currency: "CNY" },
        toName: "Aom",
      }),
    ).toBe("Beam pays Aom CN¥20.00");
    expect(
      settlementSuggestionLabel({
        balanceCopy,
        fromName: "Beam",
        settlementCurrency: "HKD",
        suggestion: { amount: 20 },
        toName: "Aom",
      }),
    ).toBe("Beam pays Aom HK$20.00");
  });
});
