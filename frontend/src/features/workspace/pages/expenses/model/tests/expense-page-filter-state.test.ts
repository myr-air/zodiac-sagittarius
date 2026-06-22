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

    expect(withCategory).toEqual({
      categoryFilter: "food",
      payerFilter: "member-aom",
      query: "dinner",
    });
    expect(clearedExpensePageFilterState()).toEqual(
      initialExpensePageFilterState(),
    );
  });
});
