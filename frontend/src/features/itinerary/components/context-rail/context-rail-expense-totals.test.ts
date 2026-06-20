import { describe, expect, it } from "vitest";
import type { ExpenseSummary } from "@/src/trip/types";
import { formatContextRailExpenseTotals } from "./context-rail-expense-totals";

function expenseSummary(
  groupSpend: number,
  settlementCurrency = "HKD",
): ExpenseSummary {
  return {
    groupSpend,
    settlementCurrency,
    netByMember: {},
    currentUserNetLabel: "Settled",
    settlementSuggestions: [],
  };
}

describe("formatContextRailExpenseTotals", () => {
  it("formats group spend and per-person spend for non-organizer members", () => {
    expect(
      formatContextRailExpenseTotals(expenseSummary(12345), 4),
    ).toEqual({
      groupSpend: "HK$12,345.00",
      perPerson: "HK$4,115.00",
    });
  });

  it("uses one paying member as the minimum divisor", () => {
    expect(
      formatContextRailExpenseTotals(expenseSummary(999), 1),
    ).toEqual({
      groupSpend: "HK$999.00",
      perPerson: "HK$999.00",
    });
  });

  it("uses the summary settlement currency for both labels", () => {
    expect(formatContextRailExpenseTotals(expenseSummary(900, "USD"), 4)).toEqual({
      groupSpend: "US$900.00",
      perPerson: "US$300.00",
    });
  });
});
