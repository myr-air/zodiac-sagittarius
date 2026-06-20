import { describe, expect, it } from "vitest";
import {
  buildExpenseSplits,
  buildItemizedExpenseSplits,
} from "./expenses";
import { expenseSplitMemberIds } from "./expense-splits.test-support";

describe("expense split policies", () => {
  it("builds equal, exact, share, and percentage splits in major money units", () => {
    expect(buildExpenseSplits({ amount: 100, memberIds: expenseSplitMemberIds, mode: "equal" })).toEqual({
      "member-aom": 33.34,
      "member-beam": 33.33,
      "member-nam": 33.33,
    });

    expect(buildExpenseSplits({
      amount: 120,
      memberIds: expenseSplitMemberIds,
      mode: "exact",
      valuesByMember: { "member-aom": 60, "member-beam": 40, "member-nam": 20 },
    })).toEqual({ "member-aom": 60, "member-beam": 40, "member-nam": 20 });

    expect(buildExpenseSplits({
      amount: 90,
      memberIds: expenseSplitMemberIds,
      mode: "shares",
      valuesByMember: { "member-aom": 2, "member-beam": 1, "member-nam": 0 },
    })).toEqual({ "member-aom": 60, "member-beam": 30, "member-nam": 0 });

    expect(buildExpenseSplits({
      amount: 200,
      memberIds: expenseSplitMemberIds,
      mode: "percentage",
      valuesByMember: { "member-aom": 50, "member-beam": 25, "member-nam": 25 },
    })).toEqual({ "member-aom": 100, "member-beam": 50, "member-nam": 50 });

    expect(buildExpenseSplits({
      amount: 200,
      memberIds: expenseSplitMemberIds,
      mode: "percentage",
      valuesByMember: { "member-aom": 50, "member-beam": 0, "member-nam": 0 },
    })).toEqual({ "member-aom": 100, "member-beam": 0, "member-nam": 0 });
  });

  it("allocates percentage rounding remainders so a 100 percent split keeps every cent", () => {
    const splits = buildExpenseSplits({
      amount: 100,
      memberIds: expenseSplitMemberIds,
      mode: "percentage",
      valuesByMember: { "member-aom": 33.333, "member-beam": 33.333, "member-nam": 33.334 },
    });

    expect(splits).toEqual({
      "member-aom": 33.33,
      "member-beam": 33.33,
      "member-nam": 33.34,
    });
    expect(Object.values(splits).reduce((sum, split) => sum + split, 0)).toBe(100);
  });

  it("builds itemized receipt splits by assigning each line to the friends who shared it", () => {
    const splits = buildItemizedExpenseSplits({
      lineItems: [
        {
          id: "line-taxi",
          title: "Taxi van",
          amount: 120,
          participantIds: ["member-aom", "member-beam", "member-nam"],
        },
        {
          id: "line-pass",
          title: "Museum pass",
          amount: 99.99,
          participantIds: ["member-aom", "member-nam"],
        },
      ],
      memberIds: expenseSplitMemberIds,
    });

    expect(splits).toEqual({
      "member-aom": 90,
      "member-beam": 40,
      "member-nam": 89.99,
    });
  });
});
