import { describe, expect, it } from "vitest";
import type { Expense } from "../../types";
import {
  refundAmount,
  refundSplits,
  sumShares,
} from "../../expenses/expense-refunds";

describe("expense refund helpers", () => {
  it("rounds split totals and builds refund-only splits", () => {
    const expense = {
      id: "expense-refund",
      title: "Refundable brunch",
      amount: 12.34,
      paidBy: "member-aom",
      category: "food",
      splits: {
        "member-aom": 12.34,
        "member-beam": 10.115,
        "member-nam": 0,
        "member-viewer": -5,
      },
    } satisfies Expense;

    expect(sumShares({ a: 1.005, b: 2.005 })).toBe(3.01);
    expect(refundSplits(expense)).toEqual({ "member-beam": 10.115 });
    expect(refundAmount(expense)).toBe(10.12);
  });
});
