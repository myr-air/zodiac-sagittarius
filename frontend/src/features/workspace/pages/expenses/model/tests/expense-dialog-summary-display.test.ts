import { describe, expect, it } from "vitest";
import { expenseDialogSummaryDisplay } from "../expense-dialog-summary-display";
import type { ExpenseDialogCalculatedState } from "../expense-dialog-calculation";

const baseCalculation: ExpenseDialogCalculatedState = {
  amountNumber: 30,
  exchangeRateNumber: 1,
  hasValidExchangeRate: true,
  hasValidRepeatCount: true,
  invalidItemizedLines: false,
  needsExchangeRate: false,
  normalizedCurrency: "HKD",
  repeatCountNumber: 1,
  splitMismatch: false,
  splitTotal: 30,
  splits: {},
  validLineItems: [],
};

const copy = {
  exchangeRateRequired: "Exchange rate required.",
  itemizedRequired: "Add valid itemized lines.",
  mismatch: "Mismatch.",
  settleValue: ({ amount }: { amount: string }) => `Settles as ${amount}.`,
  splitTotal: ({ amount, total }: { amount: string; total: string }) => `${total} of ${amount} split.`,
};

describe("expenseDialogSummaryDisplay", () => {
  it("formats the base split total summary", () => {
    expect(expenseDialogSummaryDisplay({
      calculation: baseCalculation,
      copy,
      settlementCurrency: "HKD",
    })).toBe("HK$30.00 of HK$30.00 split.");
  });

  it("adds validation messages for split mismatches and invalid itemized lines", () => {
    expect(expenseDialogSummaryDisplay({
      calculation: {
        ...baseCalculation,
        invalidItemizedLines: true,
        splitMismatch: true,
        splitTotal: 25,
      },
      copy,
      settlementCurrency: "HKD",
    })).toBe("HK$25.00 of HK$30.00 split. Mismatch. Add valid itemized lines.");
  });

  it("adds converted settlement value only when a valid exchange rate is present", () => {
    expect(expenseDialogSummaryDisplay({
      calculation: {
        ...baseCalculation,
        amountNumber: 100,
        exchangeRateNumber: 4.5,
        needsExchangeRate: true,
        normalizedCurrency: "CNY",
        splitTotal: 100,
      },
      copy,
      settlementCurrency: "HKD",
    })).toBe("CN¥100.00 of CN¥100.00 split. Settles as HK$450.00.");

    expect(expenseDialogSummaryDisplay({
      calculation: {
        ...baseCalculation,
        hasValidExchangeRate: false,
        needsExchangeRate: true,
        normalizedCurrency: "CNY",
      },
      copy,
      settlementCurrency: "HKD",
    })).toBe("CN¥30.00 of CN¥30.00 split. Exchange rate required.");
  });
});
