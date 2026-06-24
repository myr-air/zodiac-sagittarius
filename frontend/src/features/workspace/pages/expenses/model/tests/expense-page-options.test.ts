import { describe, expect, it } from "vitest";
import {
  categoryTone,
  expenseCategories,
  expenseCategoryFilterSelectOptions,
  expenseCategoryFilterValues,
  expenseCategorySelectOptions,
  expenseSplitModeSelectOptions,
} from "../expense-page-options";

describe("expense page options", () => {
  it("keeps category filters aligned with expense categories", () => {
    expect(expenseCategoryFilterValues).toEqual([
      "all",
      "food",
      "transport",
      "tickets",
      "stay",
      "shopping",
      "settlement",
    ]);
    expect(expenseCategoryFilterValues).toEqual(["all", ...expenseCategories]);
  });

  it("keeps category tone values centralized for ledger badges", () => {
    expect(categoryTone("food")).toEqual({
      background: "#fff7ed",
      border: "#fed7aa",
      dot: "#f97316",
      text: "#9a3412",
    });
  });

  it("builds category select options from the shared category values", () => {
    expect(expenseCategorySelectOptions()).toEqual(
      expenseCategories.map((value) => ({ value, label: value })),
    );
    expect(expenseCategoryFilterSelectOptions("All categories")[0]).toEqual({
      value: "all",
      label: "All categories",
    });
  });

  it("builds split mode select options from page copy labels", () => {
    expect(expenseSplitModeSelectOptions({
      equal: "Equal",
      exact: "Exact",
      shares: "Shares",
      percentage: "Percentage",
      itemized: "Itemized",
    })).toEqual([
      { value: "equal", label: "Equal" },
      { value: "exact", label: "Exact" },
      { value: "shares", label: "Shares" },
      { value: "percentage", label: "Percentage" },
      { value: "itemized", label: "Itemized" },
    ]);
  });
});
