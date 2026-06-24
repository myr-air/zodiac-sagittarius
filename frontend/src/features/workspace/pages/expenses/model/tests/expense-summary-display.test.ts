import { describe, expect, it } from "vitest";
import { expenseSummaryDisplay } from "../expense-summary-display";

describe("expense summary display", () => {
  it("formats summary money values and positive current balance tone", () => {
    expect(
      expenseSummaryDisplay({
        currentNet: 25,
        expenseSummary: { groupSpend: 120 },
        owedToYou: 25,
        settlementCurrency: "HKD",
        youOwe: 0,
      }),
    ).toEqual({
      currentNetLabel: "+HK$25.00",
      currentNetTone: "positive",
      groupSpendLabel: "HK$120.00",
      owedToYouLabel: "HK$25.00",
      youOweLabel: "HK$0.00",
    });
  });

  it("maps negative and settled current balances to tone values", () => {
    expect(
      expenseSummaryDisplay({
        currentNet: -10,
        expenseSummary: { groupSpend: 120 },
        owedToYou: 0,
        settlementCurrency: "HKD",
        youOwe: 10,
      }).currentNetTone,
    ).toBe("negative");
    expect(
      expenseSummaryDisplay({
        currentNet: 0,
        expenseSummary: { groupSpend: 120 },
        owedToYou: 0,
        settlementCurrency: "HKD",
        youOwe: 0,
      }).currentNetTone,
    ).toBe("neutral");
  });
});
