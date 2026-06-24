import { describe, expect, it } from "vitest";
import {
  clearedExpensePageFilterState,
  expensePageFilterFieldState,
  initialExpensePageFilterState,
} from "../expense-page-filter-state";

describe("expense page filter state", () => {
  it("centralizes the default ledger filters", () => {
    expect(initialExpensePageFilterState()).toEqual({
      categoryFilter: "all",
      dayFilter: "all",
      payerFilter: "all",
      query: "",
    });
  });

  it("updates one filter field at a time and clears back to defaults", () => {
    const withQuery = expensePageFilterFieldState(
      initialExpensePageFilterState(),
      "query",
      "dinner",
    );
    const withPayer = expensePageFilterFieldState(
      withQuery,
      "payerFilter",
      "member-aom",
    );
    const withCategory = expensePageFilterFieldState(
      withPayer,
      "categoryFilter",
      "food",
    );
    const withDay = expensePageFilterFieldState(
      withCategory,
      "dayFilter",
      "2026-06-19",
    );

    expect(withDay).toEqual({
      categoryFilter: "food",
      dayFilter: "2026-06-19",
      payerFilter: "member-aom",
      query: "dinner",
    });
    expect(clearedExpensePageFilterState()).toEqual(
      initialExpensePageFilterState(),
    );
  });
});
