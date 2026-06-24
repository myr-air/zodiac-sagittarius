import { describe, expect, it } from "vitest";

import {
  expenseDialogCurrencyChangeFields,
  expenseDialogManualExchangeRateFields,
} from "../expense-dialog-currency";

describe("expense dialog currency helpers", () => {
  it("normalizes currency changes and resets exchange rate edits", () => {
    expect(expenseDialogCurrencyChangeFields(" usd ")).toEqual({
      currency: "USD",
      exchangeRate: "1",
      exchangeRateTouched: false,
    });
  });

  it("marks manual exchange rate edits as touched", () => {
    expect(expenseDialogManualExchangeRateFields("1.08")).toEqual({
      exchangeRate: "1.08",
      exchangeRateTouched: true,
    });
  });
});
