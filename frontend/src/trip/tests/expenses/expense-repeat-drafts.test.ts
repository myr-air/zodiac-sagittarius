import { describe, expect, it } from "vitest";
import {
  buildExpenseCreateDrafts,
  normalizeExpenseRepeatCount,
  repeatExpenseLineItems,
} from "../../expenses";

describe("expense repeat drafts", () => {
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
