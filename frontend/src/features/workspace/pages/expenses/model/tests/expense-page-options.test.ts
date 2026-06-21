import { describe, expect, it } from "vitest";
import {
  categoryTone,
  expenseCategories,
  expenseCategoryFilterValues,
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
});
