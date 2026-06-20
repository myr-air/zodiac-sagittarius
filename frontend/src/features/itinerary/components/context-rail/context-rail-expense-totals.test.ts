import { describe, expect, it } from "vitest";
import type { ExpenseSummary } from "@/src/trip/types";
import { formatContextRailExpenseTotals } from "./context-rail-expense-totals";

function expenseSummary(groupSpend: number): ExpenseSummary {
  return {
    groupSpend,
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
      groupSpend: "12,345",
      perPerson: "4,115",
    });
  });

  it("uses one paying member as the minimum divisor", () => {
    expect(
      formatContextRailExpenseTotals(expenseSummary(999), 1),
    ).toEqual({
      groupSpend: "999",
      perPerson: "999",
    });
  });
});
