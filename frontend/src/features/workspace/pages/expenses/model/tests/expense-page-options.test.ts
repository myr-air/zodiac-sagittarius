import { describe, expect, it } from "vitest";
import {
  categoryTone,
  expenseCategoryFilterSelectOptions,
  expenseCategoryFilterValues,
  manualExpenseCategorySelectOptions,
  expenseSplitModeSelectOptions,
} from "../expense-page-options";
import { expenseCategoryValues } from "@/src/trip/expenses";

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
    expect(expenseCategoryFilterValues).toEqual(["all", ...expenseCategoryValues]);
  });

  it("keeps category tone values centralized for ledger badges", () => {
    expect(categoryTone("food")).toEqual({
      background: "#fff7ed",
      border: "#fed7aa",
      dot: "#f97316",
      text: "#9a3412",
    });
  });

  const labels = {
    food: "Food",
    transport: "Transport",
    tickets: "Tickets",
    stay: "Stay",
    shopping: "Shopping",
    settlement: "Payback",
  };

  it("builds human category options and hides system categories from manual entry", () => {
    expect(manualExpenseCategorySelectOptions(labels)).toEqual([
      { value: "food", label: "Food" },
      { value: "transport", label: "Transport" },
      { value: "tickets", label: "Tickets" },
      { value: "stay", label: "Stay" },
      { value: "shopping", label: "Shopping" },
    ]);
    expect(expenseCategoryFilterSelectOptions("All categories", labels)[0]).toEqual({
      value: "all",
      label: "All categories",
    });
    expect(expenseCategoryFilterSelectOptions("All categories", labels)).toContainEqual({
      value: "settlement",
      label: "Payback",
    });
  });

  it("builds split mode select options from page copy labels", () => {
    expect(expenseSplitModeSelectOptions({
      equal: "Equal",
      exact: "Exact",
      shares: "Shares",
      percentage: "Percentage",
      itemized: "Itemized",
      personal: "Personal",
    })).toEqual([
      { value: "equal", label: "Equal" },
      { value: "exact", label: "Exact" },
      { value: "shares", label: "Shares" },
      { value: "percentage", label: "Percentage" },
      { value: "itemized", label: "Itemized" },
      { value: "personal", label: "Personal" },
    ]);
  });
});
