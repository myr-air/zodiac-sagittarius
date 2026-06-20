import { describe, expect, it } from "vitest";
import {
  buildExpenseCreateDrafts,
  buildExpenseSplits,
  buildItemizedExpenseSplits,
  expenseSplitsToMinor,
  formatMoney,
  normalizeExpenseRepeatCount,
  normalizeExpenseSplitsFromMinor,
  repeatExpenseLineItems,
} from "./expenses";

const members = ["member-aom", "member-beam", "member-nam"];

describe("expense split and money helpers", () => {
  it("formats common trip currencies with stable prefixes", () => {
    expect(formatMoney(1234.5, "JPY")).toBe("¥1,234.50");
    expect(formatMoney(12, "EUR")).toBe("€12.00");
    expect(formatMoney(-12, "USD")).toBe("-US$12.00");
    expect(formatMoney(12, "bad")).toBe("BAD 12.00");
    expect(formatMoney(12, "$")).toBe("HK$12.00");
  });

  it("builds equal, exact, share, and percentage splits in major money units", () => {
    expect(buildExpenseSplits({ amount: 100, memberIds: members, mode: "equal" })).toEqual({
      "member-aom": 33.34,
      "member-beam": 33.33,
      "member-nam": 33.33,
    });

    expect(buildExpenseSplits({
      amount: 120,
      memberIds: members,
      mode: "exact",
      valuesByMember: { "member-aom": 60, "member-beam": 40, "member-nam": 20 },
    })).toEqual({ "member-aom": 60, "member-beam": 40, "member-nam": 20 });

    expect(buildExpenseSplits({
      amount: 90,
      memberIds: members,
      mode: "shares",
      valuesByMember: { "member-aom": 2, "member-beam": 1, "member-nam": 0 },
    })).toEqual({ "member-aom": 60, "member-beam": 30, "member-nam": 0 });

    expect(buildExpenseSplits({
      amount: 200,
      memberIds: members,
      mode: "percentage",
      valuesByMember: { "member-aom": 50, "member-beam": 25, "member-nam": 25 },
    })).toEqual({ "member-aom": 100, "member-beam": 50, "member-nam": 50 });

    expect(buildExpenseSplits({
      amount: 200,
      memberIds: members,
      mode: "percentage",
      valuesByMember: { "member-aom": 50, "member-beam": 0, "member-nam": 0 },
    })).toEqual({ "member-aom": 100, "member-beam": 0, "member-nam": 0 });
  });

  it("allocates percentage rounding remainders so a 100 percent split keeps every cent", () => {
    const splits = buildExpenseSplits({
      amount: 100,
      memberIds: members,
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
      memberIds: members,
    });

    expect(splits).toEqual({
      "member-aom": 90,
      "member-beam": 40,
      "member-nam": 89.99,
    });
  });

  it("keeps frontend splits as major money and converts API minor cents only at the boundary", () => {
    const majorSplits = { "member-aom": 33.34, "member-beam": 33.33, "member-nam": 33.33 };

    expect(expenseSplitsToMinor(majorSplits)).toEqual({
      "member-aom": 3334,
      "member-beam": 3333,
      "member-nam": 3333,
    });
    expect(normalizeExpenseSplitsFromMinor({
      "member-aom": 3334,
      "member-beam": 3333,
      "member-nam": 3333,
    })).toEqual(majorSplits);
  });

  it("normalizes repeated expense counts to the supported daily range", () => {
    expect(normalizeExpenseRepeatCount(undefined)).toBe(1);
    expect(normalizeExpenseRepeatCount(0)).toBe(1);
    expect(normalizeExpenseRepeatCount(Number.NaN)).toBe(1);
    expect(normalizeExpenseRepeatCount(2.9)).toBe(2);
    expect(normalizeExpenseRepeatCount(99)).toBe(31);
  });

  it("keeps single expense line item ids and suffixes repeated copies", () => {
    const lineItems = [
      {
        id: "line-taxi",
        title: "Taxi van",
        amount: 120,
        participantIds: ["member-aom", "member-beam"],
      },
    ];

    expect(repeatExpenseLineItems(undefined, 0, 3)).toBeUndefined();
    expect(repeatExpenseLineItems(lineItems, 0, 1)).toBe(lineItems);
    expect(repeatExpenseLineItems(lineItems, 1, 3)).toEqual([
      {
        ...lineItems[0],
        id: "line-taxi-repeat-2",
      },
    ]);
  });

  it("builds repeated expense create drafts with shared split policy", () => {
    const drafts = buildExpenseCreateDrafts(
      {
        itemId: "item-lunch",
        title: "Dim sum lunch",
        amount: 120,
        currency: "HKD",
        paidBy: "member-aom",
        category: "food",
        repeatCount: 2,
        lineItems: [
          {
            id: "line-table",
            title: "Table set",
            amount: 120,
            participantIds: ["member-aom", "member-beam"],
          },
        ],
      },
      ["member-aom", "member-beam"],
    );

    expect(drafts).toEqual([
      expect.objectContaining({
        title: "Dim sum lunch (1/2)",
        splits: { "member-aom": 60, "member-beam": 60 },
        lineItems: [
          {
            id: "line-table-repeat-1",
            title: "Table set",
            amount: 120,
            participantIds: ["member-aom", "member-beam"],
          },
        ],
      }),
      expect.objectContaining({
        title: "Dim sum lunch (2/2)",
        splits: { "member-aom": 60, "member-beam": 60 },
        lineItems: [
          {
            id: "line-table-repeat-2",
            title: "Table set",
            amount: 120,
            participantIds: ["member-aom", "member-beam"],
          },
        ],
      }),
    ]);
    expect(drafts[0].splits).toBe(drafts[1].splits);
  });

});
