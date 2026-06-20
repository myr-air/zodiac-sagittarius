import { describe, expect, it } from "vitest";
import {
  expenseSplitsToMinor,
  formatMoney,
  normalizeExpenseSplitsFromMinor,
} from "./expenses";

describe("expense money helpers", () => {
  it("formats common trip currencies with stable prefixes", () => {
    expect(formatMoney(1234.5, "JPY")).toBe("¥1,234.50");
    expect(formatMoney(12, "EUR")).toBe("€12.00");
    expect(formatMoney(-12, "USD")).toBe("-US$12.00");
    expect(formatMoney(12, "bad")).toBe("BAD 12.00");
    expect(formatMoney(12, "$")).toBe("HK$12.00");
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
});
