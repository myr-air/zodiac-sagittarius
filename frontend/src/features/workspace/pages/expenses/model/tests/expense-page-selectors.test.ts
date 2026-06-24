import { describe, expect, it } from "vitest";

import {
  currentMemberExpenseBalance,
  expensePageSettlementCurrency,
} from "../expense-page-selectors";

describe("expense page selectors", () => {
  it("resolves the settlement currency with the page default", () => {
    expect(expensePageSettlementCurrency({ settlementCurrency: "THB" })).toBe("THB");
    expect(expensePageSettlementCurrency({ settlementCurrency: undefined })).toBe("HKD");
  });

  it("derives current member balance from the expense summary", () => {
    expect(
      currentMemberExpenseBalance({ netByMember: { "member-aom": 42 } }, "member-aom"),
    ).toEqual({
      currentNet: 42,
      owedToYou: 42,
      youOwe: 0,
    });
    expect(
      currentMemberExpenseBalance({ netByMember: { "member-aom": -12 } }, "member-aom"),
    ).toEqual({
      currentNet: -12,
      owedToYou: 0,
      youOwe: 12,
    });
    expect(currentMemberExpenseBalance({ netByMember: {} }, "missing-member")).toEqual({
      currentNet: 0,
      owedToYou: 0,
      youOwe: 0,
    });
  });
});
