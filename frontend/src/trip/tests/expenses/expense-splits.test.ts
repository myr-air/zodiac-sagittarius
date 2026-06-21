import { describe, expect, it } from "vitest";
import {
  buildExpenseSplits,
  buildItemizedExpenseSplits,
  expenseSplitModeValues,
  expenseSplitsToMinor,
  normalizeExpenseSplitsFromMinor,
} from "../../expense-splits";

describe("expense splits", () => {
  it("keeps split modes in canonical display order", () => {
    expect(expenseSplitModeValues).toEqual([
      "equal",
      "exact",
      "shares",
      "percentage",
      "itemized",
    ]);
  });

  it("allocates equal, share, and percentage splits without losing cents", () => {
    expect(buildExpenseSplits({ amount: 100, memberIds: ["a", "b", "c"], mode: "equal" })).toEqual({
      a: 33.34,
      b: 33.33,
      c: 33.33,
    });
    expect(buildExpenseSplits({ amount: 90, memberIds: ["a", "b"], mode: "shares", valuesByMember: { a: 2, b: 1 } })).toEqual({
      a: 60,
      b: 30,
    });
    expect(buildExpenseSplits({ amount: 10, memberIds: ["a", "b"], mode: "percentage", valuesByMember: { a: 33.33, b: 66.67 } })).toEqual({
      a: 3.33,
      b: 6.67,
    });
  });

  it("builds itemized splits and converts major/minor money units", () => {
    expect(
      buildItemizedExpenseSplits({
        memberIds: ["a", "b"],
        lineItems: [
          { id: "tea", title: "Tea", amount: 9, participantIds: ["a", "b"] },
          { id: "cake", title: "Cake", amount: 6, participantIds: ["b"] },
        ],
      }),
    ).toEqual({ a: 4.5, b: 10.5 });
    expect(expenseSplitsToMinor({ a: 4.5, b: 10.5 })).toEqual({ a: 450, b: 1050 });
    expect(normalizeExpenseSplitsFromMinor({ a: 450, b: 1050 })).toEqual({ a: 4.5, b: 10.5 });
  });
});
